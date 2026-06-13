namespace ShopForge.Domain.Entities;

public class Review
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProductId { get; init; }
    public Guid UserId { get; init; }
    public required string AuthorName { get; init; }   // snapshot of the user's display name
    public int Rating { get; init; }                    // 1..5
    public string? Title { get; init; }
    public required string Body { get; init; }
    public bool IsVerifiedPurchase { get; init; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public Product? Product { get; init; }
    public User? User { get; init; }
}
