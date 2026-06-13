namespace ShopForge.Domain.Entities;

public class WishlistItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public Guid ProductId { get; init; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public User? User { get; init; }
    public Product? Product { get; init; }
}
