using ShopForge.Domain.Enums;

namespace ShopForge.Domain.Entities;

public class User
{
    public const int MaxFailedLoginAttempts = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Email { get; init; }
    public required string FullName { get; set; }
    public required string PasswordHash { get; set; }
    public UserRole Role { get; init; } = UserRole.Customer;
    public int FailedLoginCount { get; private set; }
    public DateTime? LockoutEndUtc { get; private set; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; init; } = [];
    public ICollection<Order> Orders { get; init; } = [];
    public ICollection<Review> Reviews { get; init; } = [];
    public ICollection<WishlistItem> WishlistItems { get; init; } = [];

    public bool IsLockedOut(DateTime nowUtc) => LockoutEndUtc.HasValue && LockoutEndUtc.Value > nowUtc;

    public void RegisterFailedLogin(DateTime nowUtc)
    {
        FailedLoginCount++;
        if (FailedLoginCount >= MaxFailedLoginAttempts)
        {
            LockoutEndUtc = nowUtc.Add(LockoutDuration);
            FailedLoginCount = 0;
        }
    }

    public void RegisterSuccessfulLogin()
    {
        FailedLoginCount = 0;
        LockoutEndUtc = null;
    }
}
