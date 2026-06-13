namespace ShopForge.Infrastructure.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public required string Secret { get; init; }
    public string Issuer { get; init; } = "ShopForge";
    public string Audience { get; init; } = "ShopForge";
    public int AccessTokenMinutes { get; init; } = 15;
    public int RefreshTokenDays { get; init; } = 7;
}
