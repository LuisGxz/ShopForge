using ShopForge.Domain.Exceptions;

namespace ShopForge.Domain.Entities;

/// <summary>A purchasable size of a product (12 oz / 2 lb / 5 lb), each with its own price and stock.</summary>
public class ProductVariant
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProductId { get; init; }
    public required string Size { get; set; }        // "12 oz"
    public string? SizeEs { get; set; }
    public required string Sku { get; init; }
    public decimal Price { get; set; }
    public int StockQuantity { get; private set; }
    public int SortOrder { get; set; }

    public byte[] RowVersion { get; init; } = [];    // SQL Server rowversion — optimistic concurrency on stock

    public Product? Product { get; init; }

    public bool InStock => StockQuantity > 0;

    public void SetStock(int quantity) =>
        StockQuantity = quantity < 0 ? throw new DomainException("Stock cannot be negative.") : quantity;

    public void DecrementStock(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be positive.");
        if (quantity > StockQuantity)
            throw new DomainException($"Only {StockQuantity} unit(s) left in stock.");
        StockQuantity -= quantity;
    }

    public void RestoreStock(int quantity)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be positive.");
        StockQuantity += quantity;
    }
}
