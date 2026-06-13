using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopForge.Domain.Entities;

namespace ShopForge.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Slug).HasMaxLength(60).IsRequired();
        builder.HasIndex(c => c.Slug).IsUnique();
        builder.Property(c => c.Name).HasMaxLength(80).IsRequired();
        builder.Property(c => c.NameEs).HasMaxLength(80);
        builder.Property(c => c.Description).HasMaxLength(400).IsRequired();
        builder.Property(c => c.DescriptionEs).HasMaxLength(400);

        builder.HasMany(c => c.Products).WithOne(p => p.Category).HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Slug).HasMaxLength(120).IsRequired();
        builder.HasIndex(p => p.Slug).IsUnique();
        builder.Property(p => p.Name).HasMaxLength(120).IsRequired();
        builder.Property(p => p.Origin).HasMaxLength(120);
        builder.Property(p => p.OriginEs).HasMaxLength(120);
        builder.Property(p => p.Region).HasMaxLength(120);
        builder.Property(p => p.RoastLevel).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.Process).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.FlavorNotes).HasMaxLength(200).IsRequired();
        builder.Property(p => p.FlavorNotesEs).HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(2000).IsRequired();
        builder.Property(p => p.DescriptionEs).HasMaxLength(2000);
        builder.Property(p => p.HeroLabel).HasMaxLength(60);
        builder.Property(p => p.HeroLabelEs).HasMaxLength(60);
        builder.Property(p => p.AverageRating).HasPrecision(3, 1);

        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => new { p.IsActive, p.IsFeatured });

        builder.HasMany(p => p.Variants).WithOne(v => v.Product).HasForeignKey(v => v.ProductId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(p => p.Images).WithOne(i => i.Product).HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(p => p.Reviews).WithOne(r => r.Product).HasForeignKey(r => r.ProductId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Size).HasMaxLength(40).IsRequired();
        builder.Property(v => v.SizeEs).HasMaxLength(40);
        builder.Property(v => v.Sku).HasMaxLength(40).IsRequired();
        builder.HasIndex(v => v.Sku).IsUnique();
        builder.Property(v => v.Price).HasPrecision(18, 2);
        builder.Property(v => v.RowVersion).IsRowVersion();
    }
}

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Url).HasMaxLength(500).IsRequired();
        builder.Property(i => i.AltText).HasMaxLength(200).IsRequired();
        builder.Property(i => i.Tone).HasMaxLength(20);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.AuthorName).HasMaxLength(120).IsRequired();
        builder.Property(r => r.Title).HasMaxLength(120);
        builder.Property(r => r.Body).HasMaxLength(2000).IsRequired();
        builder.HasIndex(r => r.ProductId);
        builder.HasIndex(r => new { r.ProductId, r.UserId });
    }
}
