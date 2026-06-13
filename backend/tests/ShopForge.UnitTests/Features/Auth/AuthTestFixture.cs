using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Features.Auth;
using ShopForge.Domain.Entities;
using ShopForge.Infrastructure.Persistence;

namespace ShopForge.UnitTests.Features.Auth;

/// <summary>In-memory DbContext + deterministic test doubles shared by auth handler tests.</summary>
public class AuthTestFixture
{
    public ShopForgeDbContext Db { get; }
    public FakeClock Clock { get; } = new();
    public FakeHasher Hasher { get; } = new();
    public FakeJwt Jwt { get; } = new();
    public AuthTokenIssuer TokenIssuer { get; }

    public AuthTestFixture()
    {
        var options = new DbContextOptionsBuilder<ShopForgeDbContext>()
            .UseInMemoryDatabase($"shopforge-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        Db = new ShopForgeDbContext(options);
        TokenIssuer = new AuthTokenIssuer(Db, Jwt, Clock);
    }

    public async Task<User> SeedUserAsync(string email = "luis@test.dev", string password = "Passw0rd!")
    {
        var user = new User { Email = email, FullName = "Luis Test", PasswordHash = Hasher.Hash(password) };
        Db.Users.Add(user);
        await Db.SaveChangesAsync();
        return user;
    }

    public class FakeClock : IClock
    {
        public DateTime UtcNow { get; set; } = new(2026, 6, 13, 12, 0, 0, DateTimeKind.Utc);
    }

    public class FakeHasher : IPasswordHasherService
    {
        public string Hash(string password) => $"H:{password}";
        public bool Verify(string hash, string password) => hash == $"H:{password}";
    }

    public class FakeJwt : IJwtTokenService
    {
        public TimeSpan RefreshTokenLifetime => TimeSpan.FromDays(7);

        public (string AccessToken, int ExpiresInSeconds) CreateAccessToken(User user) => ($"access-{user.Id}", 900);

        public (string RawToken, string TokenHash) CreateRefreshToken()
        {
            var raw = Guid.NewGuid().ToString("N");
            return (raw, HashRefreshToken(raw));
        }

        public string HashRefreshToken(string rawToken) => $"hash:{rawToken}";
    }
}
