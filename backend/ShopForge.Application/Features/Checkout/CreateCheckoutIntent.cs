using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Common.Services;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Exceptions;

namespace ShopForge.Application.Features.Checkout;

public record ShippingAddressInput(
    string FullName, string Line1, string? Line2, string City, string State, string PostalCode, string Country, string? Phone);

public record CreateCheckoutIntentCommand(
    Guid UserId, string Email, ShippingAddressInput Shipping, string? CouponCode) : IRequest<CheckoutIntentResult>;

public record CheckoutIntentResult(
    string OrderNumber, string ClientSecret, decimal Total, string PublishableKey, bool LivePayments);

public class CreateCheckoutIntentValidator : AbstractValidator<CreateCheckoutIntentCommand>
{
    public CreateCheckoutIntentValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Shipping.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Shipping.Line1).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Shipping.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Shipping.State).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Shipping.PostalCode).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Shipping.Country).NotEmpty().MaximumLength(80);
    }
}

public class CreateCheckoutIntentHandler(IAppDbContext db, IClock clock, IPaymentGateway gateway)
    : IRequestHandler<CreateCheckoutIntentCommand, CheckoutIntentResult>
{
    public async Task<CheckoutIntentResult> Handle(CreateCheckoutIntentCommand request, CancellationToken ct)
    {
        var cart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.ProductVariant!).ThenInclude(v => v.Product!).ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.UserId == request.UserId, ct);

        if (cart is null || cart.Items.Count == 0)
            throw new DomainException("Your cart is empty.");

        var order = new Order
        {
            OrderNumber = OrderNumber.New(),
            UserId = request.UserId,
            ContactEmail = request.Email.Trim().ToLowerInvariant(),
            ShippingAddress = new ShippingAddress
            {
                FullName = request.Shipping.FullName.Trim(),
                Line1 = request.Shipping.Line1.Trim(),
                Line2 = request.Shipping.Line2?.Trim(),
                City = request.Shipping.City.Trim(),
                State = request.Shipping.State.Trim(),
                PostalCode = request.Shipping.PostalCode.Trim(),
                Country = request.Shipping.Country.Trim(),
                Phone = request.Shipping.Phone?.Trim()
            }
        };

        foreach (var item in cart.Items)
        {
            var variant = item.ProductVariant!;
            var product = variant.Product!;
            if (!product.IsActive)
                throw new DomainException($"{product.Name} is no longer available.");
            if (item.Quantity > variant.StockQuantity)
                throw new DomainException($"Only {variant.StockQuantity} unit(s) of {product.Name} ({variant.Size}) are in stock.");

            order.Items.Add(new OrderItem
            {
                OrderId = order.Id,
                ProductId = product.Id,
                ProductVariantId = variant.Id,
                ProductName = product.Name,
                ProductSlug = product.Slug,
                ImageUrl = product.Images.OrderBy(im => im.SortOrder).Select(im => im.Url).FirstOrDefault(),
                VariantSize = variant.Size,
                Grind = item.Grind,
                UnitPrice = variant.Price,
                Quantity = item.Quantity
            });
        }

        var subtotal = order.Items.Sum(i => i.LineTotal);
        var (discount, couponCode) = await ResolveCouponAsync(request.CouponCode, subtotal, ct);
        var shipping = ShippingCalculator.For(subtotal - discount);
        order.SetTotals(shipping, discount, couponCode);

        var intent = await gateway.CreatePaymentIntentAsync(order.Total, "usd", order.OrderNumber, order.ContactEmail, ct);
        order.StripePaymentIntentId = intent.PaymentIntentId;

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        return new CheckoutIntentResult(order.OrderNumber, intent.ClientSecret, order.Total, gateway.PublishableKey, gateway.IsLive);
    }

    private async Task<(decimal Discount, string? Code)> ResolveCouponAsync(string? rawCode, decimal subtotal, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawCode))
            return (0m, null);

        var code = rawCode.Trim().ToUpperInvariant();
        var coupon = await db.Coupons.FirstOrDefaultAsync(c => c.Code == code, ct);
        if (coupon is null || !coupon.CanBeApplied(subtotal, clock.UtcNow, out _))
            throw new DomainException("That coupon can't be applied to this order.");

        return (coupon.ComputeDiscount(subtotal), code);
    }
}
