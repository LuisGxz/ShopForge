using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopForge.Domain.Entities;

namespace ShopForge.Infrastructure.Persistence.Configurations;

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.HasKey(c => c.Id);
        builder.HasIndex(c => c.UserId).IsUnique();
        builder.HasMany(c => c.Items).WithOne(i => i.Cart).HasForeignKey(i => i.CartId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Grind).HasMaxLength(40).IsRequired();
        builder.HasOne(i => i.ProductVariant).WithMany().HasForeignKey(i => i.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(i => new { i.CartId, i.ProductVariantId, i.Grind });
    }
}

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Code).HasMaxLength(40).IsRequired();
        builder.HasIndex(c => c.Code).IsUnique();
        builder.Property(c => c.Description).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Value).HasPrecision(18, 2);
        builder.Property(c => c.MinSubtotal).HasPrecision(18, 2);
    }
}

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.HasKey(w => w.Id);
        builder.HasIndex(w => new { w.UserId, w.ProductId }).IsUnique();
        builder.HasOne(w => w.Product).WithMany().HasForeignKey(w => w.ProductId).OnDelete(DeleteBehavior.NoAction);
    }
}
