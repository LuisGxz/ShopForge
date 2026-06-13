namespace ShopForge.Domain.Entities;

/// <summary>Owned value object embedded in <see cref="Order"/>. Captured at checkout.</summary>
public class ShippingAddress
{
    public required string FullName { get; init; }
    public required string Line1 { get; init; }
    public string? Line2 { get; init; }
    public required string City { get; init; }
    public required string State { get; init; }
    public required string PostalCode { get; init; }
    public required string Country { get; init; }
    public string? Phone { get; init; }
}
