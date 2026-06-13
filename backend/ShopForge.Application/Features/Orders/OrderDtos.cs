using ShopForge.Domain.Entities;

namespace ShopForge.Application.Features.Orders;

public record OrderItemDto(
    string ProductName, string ProductSlug, string? ImageUrl,
    string VariantSize, string Grind, decimal UnitPrice, int Quantity, decimal LineTotal);

public record ShippingAddressDto(
    string FullName, string Line1, string? Line2, string City, string State, string PostalCode, string Country, string? Phone)
{
    public static ShippingAddressDto From(ShippingAddress a) =>
        new(a.FullName, a.Line1, a.Line2, a.City, a.State, a.PostalCode, a.Country, a.Phone);
}

public record OrderListItemDto(
    string OrderNumber, string Status, decimal Total, int ItemCount, DateTime PlacedAtUtc);

public record OrderDetailDto(
    string OrderNumber, string Status, string ContactEmail, ShippingAddressDto ShippingAddress,
    decimal Subtotal, decimal ShippingCost, decimal DiscountAmount, decimal Total, string? CouponCode,
    DateTime PlacedAtUtc, DateTime? PaidAtUtc, IReadOnlyList<OrderItemDto> Items)
{
    public static OrderDetailDto From(Order o) => new(
        o.OrderNumber, o.Status.ToString(), o.ContactEmail, ShippingAddressDto.From(o.ShippingAddress),
        o.Subtotal, o.ShippingCost, o.DiscountAmount, o.Total, o.CouponCode,
        o.PlacedAtUtc, o.PaidAtUtc,
        o.Items.Select(i => new OrderItemDto(
            i.ProductName, i.ProductSlug, i.ImageUrl, i.VariantSize, i.Grind, i.UnitPrice, i.Quantity, i.LineTotal)).ToList());
}
