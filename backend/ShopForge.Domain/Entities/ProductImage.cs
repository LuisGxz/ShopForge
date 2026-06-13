namespace ShopForge.Domain.Entities;

public class ProductImage
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProductId { get; init; }
    public required string Url { get; set; }
    public required string AltText { get; set; }

    /// <summary>CSS gradient class used as a blur-up placeholder before the photo loads.</summary>
    public string? Tone { get; set; }
    public int SortOrder { get; set; }

    public Product? Product { get; init; }
}
