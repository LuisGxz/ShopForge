using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Entities;

namespace ShopForge.Application.Features.Wishlist;

public record WishlistItemDto(
    Guid ProductId, string Slug, string Name, string? Origin, string? OriginEs,
    decimal FromPrice, string? ImageUrl, string? ImageTone, decimal AverageRating, int ReviewCount, bool InStock);

public record GetWishlistQuery(Guid UserId) : IRequest<IReadOnlyList<WishlistItemDto>>;

public class GetWishlistHandler(IAppDbContext db) : IRequestHandler<GetWishlistQuery, IReadOnlyList<WishlistItemDto>>
{
    public async Task<IReadOnlyList<WishlistItemDto>> Handle(GetWishlistQuery request, CancellationToken ct) =>
        await db.WishlistItems
            .Where(w => w.UserId == request.UserId && w.Product!.IsActive)
            .OrderByDescending(w => w.CreatedAtUtc)
            .Select(w => new WishlistItemDto(
                w.ProductId, w.Product!.Slug, w.Product.Name, w.Product.Origin, w.Product.OriginEs,
                w.Product.Variants.Min(v => v.Price),
                w.Product.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                w.Product.Images.OrderBy(i => i.SortOrder).Select(i => i.Tone).FirstOrDefault(),
                w.Product.AverageRating, w.Product.ReviewCount,
                w.Product.Variants.Any(v => v.StockQuantity > 0)))
            .ToListAsync(ct);
}

/// <summary>Adds the product to the wishlist, or removes it if already there. Returns the new state.</summary>
public record ToggleWishlistCommand(Guid UserId, Guid ProductId) : IRequest<bool>;

public class ToggleWishlistHandler(IAppDbContext db, IClock clock) : IRequestHandler<ToggleWishlistCommand, bool>
{
    public async Task<bool> Handle(ToggleWishlistCommand request, CancellationToken ct)
    {
        var existing = await db.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == request.UserId && w.ProductId == request.ProductId, ct);

        if (existing is not null)
        {
            db.WishlistItems.Remove(existing);
            await db.SaveChangesAsync(ct);
            return false;
        }

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive, ct)
            ?? throw new NotFoundException("Product", request.ProductId);

        db.WishlistItems.Add(new WishlistItem { UserId = request.UserId, ProductId = product.Id, CreatedAtUtc = clock.UtcNow });
        await db.SaveChangesAsync(ct);
        return true;
    }
}
