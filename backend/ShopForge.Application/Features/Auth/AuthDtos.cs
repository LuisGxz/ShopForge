using ShopForge.Domain.Entities;

namespace ShopForge.Application.Features.Auth;

public record UserDto(Guid Id, string Email, string FullName, string Role)
{
    public static UserDto From(User user) =>
        new(user.Id, user.Email, user.FullName, user.Role.ToString());
}

public record AuthResponse(string AccessToken, string RefreshToken, int ExpiresInSeconds, UserDto User);
