using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShopForge.Domain.Entities;

namespace ShopForge.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.FullName).HasMaxLength(120).IsRequired();
        builder.Property(u => u.PasswordHash).HasMaxLength(512).IsRequired();
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);

        builder.HasMany(u => u.RefreshTokens).WithOne(t => t.User).HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(u => u.Orders).WithOne().HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(u => u.Reviews).WithOne(r => r.User).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.NoAction);
        builder.HasMany(u => u.WishlistItems).WithOne(w => w.User).HasForeignKey(w => w.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.TokenHash).HasMaxLength(128).IsRequired();
        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.Property(t => t.ReplacedByTokenHash).HasMaxLength(128);
    }
}
