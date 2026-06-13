using Microsoft.AspNetCore.Identity;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Entities;

namespace ShopForge.Infrastructure.Auth;

/// <summary>Wraps ASP.NET Identity's PasswordHasher (PBKDF2, versioned format, auto-rehash support).</summary>
public class PasswordHasherService : IPasswordHasherService
{
    private static readonly PasswordHasher<User> Hasher = new();
    private static readonly User Dummy = new() { Email = "_", FullName = "_", PasswordHash = "_" };

    public string Hash(string password) => Hasher.HashPassword(Dummy, password);

    public bool Verify(string hash, string password) =>
        Hasher.VerifyHashedPassword(Dummy, hash, password) is not PasswordVerificationResult.Failed;
}
