namespace ShopForge.Application.Features.Catalog;

public record CategoryDto(
    int Id, string Slug, string Name, string? NameEs,
    string Description, string? DescriptionEs, int SortOrder, int ProductCount);

public record ProductVariantDto(
    Guid Id, string Size, string? SizeEs, string Sku,
    decimal Price, int StockQuantity, bool InStock, int SortOrder);

public record ProductImageDto(Guid Id, string Url, string AltText, string? Tone, int SortOrder);

/// <summary>Compact shape for catalog cards / grids.</summary>
public record ProductListItemDto(
    Guid Id, string Slug, string Name, string CategorySlug,
    string? Origin, string? OriginEs, string RoastLevel, string Process,
    string FlavorNotes, string? FlavorNotesEs,
    string? HeroLabel, string? HeroLabelEs,
    decimal AverageRating, int ReviewCount,
    decimal FromPrice, string? ImageUrl, string? ImageTone,
    bool IsFeatured, bool InStock);

/// <summary>Full product detail with variants and gallery.</summary>
public record ProductDetailDto(
    Guid Id, string Slug, string Name, int CategoryId, string CategorySlug, string CategoryName, string? CategoryNameEs,
    string? Origin, string? OriginEs, string? Region, int? AltitudeMeters,
    string RoastLevel, string Process,
    string FlavorNotes, string? FlavorNotesEs,
    string Description, string? DescriptionEs,
    string? HeroLabel, string? HeroLabelEs,
    decimal AverageRating, int ReviewCount,
    IReadOnlyList<ProductVariantDto> Variants,
    IReadOnlyList<ProductImageDto> Images);
