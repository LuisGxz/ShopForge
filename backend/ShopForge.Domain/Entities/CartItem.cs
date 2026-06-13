using ShopForge.Domain.Exceptions;

namespace ShopForge.Domain.Entities;

public class CartItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CartId { get; init; }
    public required Guid ProductVariantId { get; init; }
    public required string Grind { get; init; }       // "Whole bean" | "Filter" | "Espresso"
    public int Quantity { get; private set; }

    public Cart? Cart { get; init; }
    public ProductVariant? ProductVariant { get; init; }

    public void SetQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be positive.");
        if (quantity > Cart.MaxQuantityPerItem)
            throw new DomainException($"Maximum {Cart.MaxQuantityPerItem} units per item.");
        Quantity = quantity;
    }
}
