namespace ShopForge.Domain.Entities;

/// <summary>A top-level storefront department (Coffee, Subscription, Brew gear).</summary>
public class Category
{
    public int Id { get; init; }
    public required string Slug { get; init; }
    public required string Name { get; init; }
    public string? NameEs { get; init; }
    public required string Description { get; init; }
    public string? DescriptionEs { get; init; }
    public int SortOrder { get; init; }

    public ICollection<Product> Products { get; init; } = [];
}
