using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Entities;

namespace ShopForge.Infrastructure.Persistence;

public class ShopForgeDbContext(DbContextOptions<ShopForgeDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();

    /// <summary>
    /// Runs the operation inside an explicit DB transaction, wrapped in the SQL Server
    /// retrying execution strategy (required when EnableRetryOnFailure is on).
    /// </summary>
    public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default)
    {
        var strategy = Database.CreateExecutionStrategy();
        return strategy.ExecuteAsync(async ct =>
        {
            await using var transaction = await Database.BeginTransactionAsync(ct);
            await operation(ct);
            await transaction.CommitAsync(ct);
        }, cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ShopForgeDbContext).Assembly);
    }
}
