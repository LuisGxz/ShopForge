namespace ShopForge.Application.Features.Cart;

public record CartItemDto(
    Guid Id, Guid ProductVariantId, Guid ProductId, string ProductSlug, string ProductName,
    string VariantSize, string Grind, decimal UnitPrice, int Quantity, decimal LineTotal,
    string? ImageUrl, string? ImageTone, int AvailableStock);

public record CartDto(
    Guid Id, IReadOnlyList<CartItemDto> Items, decimal Subtotal, int ItemCount)
{
    public static CartDto Empty(Guid id) => new(id, [], 0m, 0);
}
