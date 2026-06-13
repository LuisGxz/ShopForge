using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopForge.Domain.Entities;

namespace ShopForge.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.OrderNumber).HasMaxLength(20).IsRequired();
        builder.HasIndex(o => o.OrderNumber).IsUnique();
        builder.Property(o => o.ContactEmail).HasMaxLength(256).IsRequired();
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Subtotal).HasPrecision(18, 2);
        builder.Property(o => o.ShippingCost).HasPrecision(18, 2);
        builder.Property(o => o.DiscountAmount).HasPrecision(18, 2);
        builder.Property(o => o.Total).HasPrecision(18, 2);
        builder.Property(o => o.CouponCode).HasMaxLength(40);
        builder.Property(o => o.StripePaymentIntentId).HasMaxLength(120);
        builder.Property(o => o.RowVersion).IsRowVersion();

        builder.HasIndex(o => o.UserId);
        builder.HasIndex(o => o.Status);
        builder.HasIndex(o => o.PlacedAtUtc);

        builder.OwnsOne(o => o.ShippingAddress, addr =>
        {
            addr.Property(a => a.FullName).HasColumnName("Ship_FullName").HasMaxLength(120).IsRequired();
            addr.Property(a => a.Line1).HasColumnName("Ship_Line1").HasMaxLength(200).IsRequired();
            addr.Property(a => a.Line2).HasColumnName("Ship_Line2").HasMaxLength(200);
            addr.Property(a => a.City).HasColumnName("Ship_City").HasMaxLength(100).IsRequired();
            addr.Property(a => a.State).HasColumnName("Ship_State").HasMaxLength(100).IsRequired();
            addr.Property(a => a.PostalCode).HasColumnName("Ship_PostalCode").HasMaxLength(20).IsRequired();
            addr.Property(a => a.Country).HasColumnName("Ship_Country").HasMaxLength(80).IsRequired();
            addr.Property(a => a.Phone).HasColumnName("Ship_Phone").HasMaxLength(40);
        });

        builder.HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.ProductName).HasMaxLength(120).IsRequired();
        builder.Property(i => i.ProductSlug).HasMaxLength(120).IsRequired();
        builder.Property(i => i.ImageUrl).HasMaxLength(500);
        builder.Property(i => i.VariantSize).HasMaxLength(40).IsRequired();
        builder.Property(i => i.Grind).HasMaxLength(40).IsRequired();
        builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
        builder.Ignore(i => i.LineTotal);
    }
}
