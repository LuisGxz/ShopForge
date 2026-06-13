using ShopForge.Domain.Enums;

namespace ShopForge.Domain.Entities;

/// <summary>A coffee (or brew-gear) product. Price lives on its <see cref="ProductVariant"/>s.</summary>
public class Product
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Slug { get; init; }
    public required string Name { get; set; }
    public int CategoryId { get; set; }

    // Coffee provenance / tasting metadata
    public string? Origin { get; set; }          // "Huila, Colombia"
    public string? OriginEs { get; set; }
    public string? Region { get; set; }
    public int? AltitudeMeters { get; set; }
    public RoastLevel RoastLevel { get; set; } = RoastLevel.Medium;
    public ProcessMethod Process { get; set; } = ProcessMethod.Washed;
    public required string FlavorNotes { get; set; }   // "Panela · red plum · cocoa"
    public string? FlavorNotesEs { get; set; }
    public required string Description { get; set; }
    public string? DescriptionEs { get; set; }

    /// <summary>Optional merchandising badge, e.g. "Staff pick", "Limited — 80 bags".</summary>
    public string? HeroLabel { get; set; }
    public string? HeroLabelEs { get; set; }

    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;

    // Denormalised rating, recomputed whenever a review is added.
    public decimal AverageRating { get; private set; }
    public int ReviewCount { get; private set; }

    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public Category? Category { get; init; }
    public ICollection<ProductVariant> Variants { get; init; } = [];
    public ICollection<ProductImage> Images { get; init; } = [];
    public ICollection<Review> Reviews { get; init; } = [];

    public void RecomputeRating()
    {
        ReviewCount = Reviews.Count;
        AverageRating = ReviewCount == 0
            ? 0m
            : Math.Round((decimal)Reviews.Average(r => r.Rating), 1, MidpointRounding.AwayFromZero);
    }

    /// <summary>Used by the seeder to set the aggregate directly without loading the review graph.</summary>
    public void SetRatingAggregate(decimal average, int count)
    {
        AverageRating = average;
        ReviewCount = count;
    }
}
