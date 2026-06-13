namespace ShopForge.Domain.Entities;

/// <summary>A line in an order. All product fields are snapshots taken at purchase time,
/// so historical orders stay accurate even if the catalog changes later.</summary>
public class OrderItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid OrderId { get; init; }
    public Guid ProductId { get; init; }
    public Guid ProductVariantId { get; init; }

    public required string ProductName { get; init; }
    public required string ProductSlug { get; init; }
    public string? ImageUrl { get; init; }
    public required string VariantSize { get; init; }
    public required string Grind { get; init; }

    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
    public decimal LineTotal => Math.Round(UnitPrice * Quantity, 2, MidpointRounding.AwayFromZero);
}
