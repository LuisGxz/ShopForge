using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;
using ShopForge.Infrastructure.Persistence;

namespace ShopForge.UnitTests.Features.Catalog;

/// <summary>Builds an in-memory DbContext with a small, deterministic catalog for query tests.</summary>
public static class CatalogTestData
{
    public static ShopForgeDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<ShopForgeDbContext>()
            .UseInMemoryDatabase($"catalog-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new ShopForgeDbContext(options);
    }

    public static async Task<ShopForgeDbContext> SeededAsync()
    {
        var db = NewDb();
        var coffee = new Category { Id = 1, Slug = "coffee", Name = "Coffee", Description = "Beans" };
        var gear = new Category { Id = 2, Slug = "brew-gear", Name = "Brew gear", Description = "Tools" };
        db.Categories.AddRange(coffee, gear);

        db.Products.Add(Product("la-esperanza", "La Esperanza", coffee.Id, RoastLevel.Light, ProcessMethod.Washed, 21m, featured: true, rating: 4.8m, reviews: 7, stock: 10, notes: "plum cocoa"));
        db.Products.Add(Product("daterra", "Daterra Sunrise", coffee.Id, RoastLevel.Medium, ProcessMethod.Natural, 19m, featured: false, rating: 4.6m, reviews: 3, stock: 0, notes: "hazelnut chocolate"));
        db.Products.Add(Product("gesha", "Gesha Cloud", coffee.Id, RoastLevel.Light, ProcessMethod.Washed, 42m, featured: true, rating: 4.9m, reviews: 2, stock: 5, notes: "jasmine honey"));
        db.Products.Add(Product("kettle", "Stagg Kettle", gear.Id, RoastLevel.Medium, ProcessMethod.Washed, 165m, featured: false, rating: 4.7m, reviews: 0, stock: 4, notes: "gooseneck"));

        var inactive = Product("hidden", "Hidden Lot", coffee.Id, RoastLevel.Dark, ProcessMethod.Natural, 30m, false, 4.0m, 1, 5, "secret");
        inactive.IsActive = false;
        db.Products.Add(inactive);

        await db.SaveChangesAsync();
        return db;
    }

    private static Product Product(string slug, string name, int categoryId, RoastLevel roast, ProcessMethod process,
        decimal price, bool featured, decimal rating, int reviews, int stock, string notes)
    {
        var p = new Product
        {
            Slug = slug, Name = name, CategoryId = categoryId, RoastLevel = roast, Process = process,
            FlavorNotes = notes, Description = $"{name} description", IsFeatured = featured, Origin = "Origin Land"
        };
        p.SetRatingAggregate(rating, reviews);
        var v1 = new ProductVariant { ProductId = p.Id, Size = "12 oz", Sku = $"{slug}-12oz", Price = price, SortOrder = 1 };
        v1.SetStock(stock);
        var v2 = new ProductVariant { ProductId = p.Id, Size = "2 lb", Sku = $"{slug}-2lb", Price = price * 2, SortOrder = 2 };
        v2.SetStock(stock);
        p.Variants.Add(v1);
        p.Variants.Add(v2);
        p.Images.Add(new ProductImage { ProductId = p.Id, Url = $"assets/{slug}.svg", AltText = name, Tone = "copper", SortOrder = 1 });
        return p;
    }
}
