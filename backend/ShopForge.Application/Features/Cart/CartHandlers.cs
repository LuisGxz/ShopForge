using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Exceptions;

namespace ShopForge.Application.Features.Cart;

/// <summary>Shared cart loading + DTO projection used by every cart handler.</summary>
internal static class CartReader
{
    public static async Task<Domain.Entities.Cart> GetOrCreateAsync(IAppDbContext db, Guid userId, CancellationToken ct)
    {
        var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId, ct);
        if (cart is null)
        {
            cart = new Domain.Entities.Cart { UserId = userId };
            db.Carts.Add(cart);
        }
        return cart;
    }

    public static async Task<CartDto> ToDtoAsync(IAppDbContext db, Guid cartId, CancellationToken ct)
    {
        var items = await db.CartItems
            .Where(i => i.CartId == cartId)
            .OrderBy(i => i.ProductVariant!.Product!.Name)
            .Select(i => new CartItemDto(
                i.Id, i.ProductVariantId, i.ProductVariant!.ProductId,
                i.ProductVariant.Product!.Slug, i.ProductVariant.Product.Name,
                i.ProductVariant.Size, i.Grind, i.ProductVariant.Price, i.Quantity,
                i.ProductVariant.Price * i.Quantity,
                i.ProductVariant.Product.Images.OrderBy(im => im.SortOrder).Select(im => im.Url).FirstOrDefault(),
                i.ProductVariant.Product.Images.OrderBy(im => im.SortOrder).Select(im => im.Tone).FirstOrDefault(),
                i.ProductVariant.StockQuantity))
            .ToListAsync(ct);

        return new CartDto(cartId, items, items.Sum(x => x.LineTotal), items.Sum(x => x.Quantity));
    }
}

public record GetCartQuery(Guid UserId) : IRequest<CartDto>;

public class GetCartHandler(IAppDbContext db) : IRequestHandler<GetCartQuery, CartDto>
{
    public async Task<CartDto> Handle(GetCartQuery request, CancellationToken ct)
    {
        var cart = await CartReader.GetOrCreateAsync(db, request.UserId, ct);
        await db.SaveChangesAsync(ct);
        return await CartReader.ToDtoAsync(db, cart.Id, ct);
    }
}

public record AddCartItemCommand(Guid UserId, Guid ProductVariantId, string Grind, int Quantity) : IRequest<CartDto>;

public class AddCartItemValidator : AbstractValidator<AddCartItemCommand>
{
    private static readonly string[] Grinds = ["Whole bean", "Filter", "Espresso", "Each"];

    public AddCartItemValidator()
    {
        RuleFor(x => x.Quantity).InclusiveBetween(1, 20);
        RuleFor(x => x.Grind).NotEmpty().Must(g => Grinds.Contains(g)).WithMessage("Unknown grind option.");
    }
}

public class AddCartItemHandler(IAppDbContext db, IClock clock) : IRequestHandler<AddCartItemCommand, CartDto>
{
    public async Task<CartDto> Handle(AddCartItemCommand request, CancellationToken ct)
    {
        var variant = await db.ProductVariants
            .FirstOrDefaultAsync(v => v.Id == request.ProductVariantId && v.Product!.IsActive, ct)
            ?? throw new NotFoundException("Product variant", request.ProductVariantId);

        var cart = await CartReader.GetOrCreateAsync(db, request.UserId, ct);
        var item = cart.AddOrIncrement(variant.Id, request.Grind, request.Quantity, clock.UtcNow);

        if (item.Quantity > variant.StockQuantity)
            throw new DomainException($"Only {variant.StockQuantity} unit(s) of this size are in stock.");

        await db.SaveChangesAsync(ct);
        return await CartReader.ToDtoAsync(db, cart.Id, ct);
    }
}

public record UpdateCartItemCommand(Guid UserId, Guid ItemId, int Quantity) : IRequest<CartDto>;

public class UpdateCartItemValidator : AbstractValidator<UpdateCartItemCommand>
{
    public UpdateCartItemValidator() => RuleFor(x => x.Quantity).InclusiveBetween(1, 20);
}

public class UpdateCartItemHandler(IAppDbContext db, IClock clock) : IRequestHandler<UpdateCartItemCommand, CartDto>
{
    public async Task<CartDto> Handle(UpdateCartItemCommand request, CancellationToken ct)
    {
        var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == request.UserId, ct)
            ?? throw new NotFoundException("Cart", request.UserId);
        var item = cart.Items.FirstOrDefault(i => i.Id == request.ItemId)
            ?? throw new NotFoundException("Cart item", request.ItemId);

        var variant = await db.ProductVariants.FirstAsync(v => v.Id == item.ProductVariantId, ct);
        if (request.Quantity > variant.StockQuantity)
            throw new DomainException($"Only {variant.StockQuantity} unit(s) of this size are in stock.");

        item.SetQuantity(request.Quantity);
        cart.Touch(clock.UtcNow);
        await db.SaveChangesAsync(ct);
        return await CartReader.ToDtoAsync(db, cart.Id, ct);
    }
}

public record RemoveCartItemCommand(Guid UserId, Guid ItemId) : IRequest<CartDto>;

public class RemoveCartItemHandler(IAppDbContext db, IClock clock) : IRequestHandler<RemoveCartItemCommand, CartDto>
{
    public async Task<CartDto> Handle(RemoveCartItemCommand request, CancellationToken ct)
    {
        var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == request.UserId, ct)
            ?? throw new NotFoundException("Cart", request.UserId);
        var item = cart.Items.FirstOrDefault(i => i.Id == request.ItemId);
        if (item is not null)
        {
            db.CartItems.Remove(item);
            cart.Touch(clock.UtcNow);
            await db.SaveChangesAsync(ct);
        }
        return await CartReader.ToDtoAsync(db, cart.Id, ct);
    }
}
