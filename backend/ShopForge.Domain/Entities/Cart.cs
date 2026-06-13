using ShopForge.Domain.Exceptions;

namespace ShopForge.Domain.Entities;

/// <summary>A persistent, per-user shopping cart. One cart per user.</summary>
public class Cart
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid UserId { get; init; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; private set; } = DateTime.UtcNow;

    public ICollection<CartItem> Items { get; init; } = [];

    public const int MaxQuantityPerItem = 20;

    public void Touch(DateTime nowUtc) => UpdatedAtUtc = nowUtc;

    /// <summary>Adds a variant+grind line, merging quantity if the same line already exists.</summary>
    public CartItem AddOrIncrement(Guid variantId, string grind, int quantity, DateTime nowUtc)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be positive.");

        var existing = Items.FirstOrDefault(i => i.ProductVariantId == variantId && i.Grind == grind);
        if (existing is not null)
        {
            existing.SetQuantity(existing.Quantity + quantity);
        }
        else
        {
            existing = new CartItem { CartId = Id, ProductVariantId = variantId, Grind = grind };
            existing.SetQuantity(quantity);
            Items.Add(existing);
        }
        Touch(nowUtc);
        return existing;
    }
}
