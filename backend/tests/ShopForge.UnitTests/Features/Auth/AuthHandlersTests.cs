using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Features.Auth;
using ShopForge.Domain.Entities;

namespace ShopForge.UnitTests.Features.Auth;

public class AuthHandlersTests
{
    private readonly AuthTestFixture _f = new();

    [Fact]
    public async Task Register_creates_user_and_issues_tokens()
    {
        var handler = new RegisterHandler(_f.Db, _f.Hasher, _f.TokenIssuer);
        var response = await handler.Handle(new RegisterCommand("New@User.Dev", "Passw0rd!", "New User"), default);

        Assert.Equal("new@user.dev", response.User.Email);  // normalised
        Assert.NotEmpty(response.AccessToken);
        Assert.NotEmpty(response.RefreshToken);
        Assert.Equal("Customer", response.User.Role);
        Assert.Equal(1, await _f.Db.RefreshTokens.CountAsync());
    }

    [Fact]
    public async Task Register_duplicate_email_throws_conflict()
    {
        await _f.SeedUserAsync("taken@user.dev");
        var handler = new RegisterHandler(_f.Db, _f.Hasher, _f.TokenIssuer);

        await Assert.ThrowsAsync<ConflictException>(() =>
            handler.Handle(new RegisterCommand("taken@user.dev", "Passw0rd!", "Dup"), default));
    }

    [Fact]
    public async Task Login_with_valid_credentials_issues_tokens()
    {
        await _f.SeedUserAsync("luis@test.dev", "Passw0rd!");
        var handler = new LoginHandler(_f.Db, _f.Hasher, _f.TokenIssuer, _f.Clock);

        var response = await handler.Handle(new LoginCommand("luis@test.dev", "Passw0rd!"), default);
        Assert.NotEmpty(response.AccessToken);
        Assert.NotEmpty(response.RefreshToken);
    }

    [Fact]
    public async Task Login_with_wrong_password_throws_and_counts_failure()
    {
        var user = await _f.SeedUserAsync("luis@test.dev", "Passw0rd!");
        var handler = new LoginHandler(_f.Db, _f.Hasher, _f.TokenIssuer, _f.Clock);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            handler.Handle(new LoginCommand("luis@test.dev", "wrong"), default));

        var reloaded = await _f.Db.Users.FirstAsync(u => u.Id == user.Id);
        Assert.Equal(1, reloaded.FailedLoginCount);
    }

    [Fact]
    public async Task Login_locks_account_after_five_failures()
    {
        await _f.SeedUserAsync("luis@test.dev", "Passw0rd!");
        var handler = new LoginHandler(_f.Db, _f.Hasher, _f.TokenIssuer, _f.Clock);

        for (var i = 0; i < User.MaxFailedLoginAttempts; i++)
            await Assert.ThrowsAsync<UnauthorizedException>(() =>
                handler.Handle(new LoginCommand("luis@test.dev", "wrong"), default));

        // Even the correct password is now refused while locked out.
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            handler.Handle(new LoginCommand("luis@test.dev", "Passw0rd!"), default));
        Assert.Contains("locked", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Unknown_email_and_wrong_password_return_same_message()
    {
        await _f.SeedUserAsync("luis@test.dev", "Passw0rd!");
        var handler = new LoginHandler(_f.Db, _f.Hasher, _f.TokenIssuer, _f.Clock);

        var unknown = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            handler.Handle(new LoginCommand("nobody@test.dev", "whatever"), default));
        var wrong = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            handler.Handle(new LoginCommand("luis@test.dev", "wrong"), default));

        Assert.Equal(unknown.Message, wrong.Message);
    }

    [Fact]
    public async Task Refresh_rotates_token_and_revokes_the_old_one()
    {
        var user = await _f.SeedUserAsync();
        var first = _f.TokenIssuer.Issue(user);
        await _f.Db.SaveChangesAsync();

        var refreshHandler = new RefreshTokenHandler(_f.Db, _f.Jwt, _f.TokenIssuer, _f.Clock);
        var second = await refreshHandler.Handle(new RefreshTokenCommand(first.RefreshToken), default);

        Assert.NotEqual(first.RefreshToken, second.RefreshToken);

        // The original token is now revoked and can't be reused.
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            refreshHandler.Handle(new RefreshTokenCommand(first.RefreshToken), default));
    }

    [Fact]
    public async Task Refresh_with_unknown_token_throws()
    {
        var handler = new RefreshTokenHandler(_f.Db, _f.Jwt, _f.TokenIssuer, _f.Clock);
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            handler.Handle(new RefreshTokenCommand("does-not-exist"), default));
    }

    [Fact]
    public async Task Logout_revokes_token_and_is_idempotent()
    {
        var user = await _f.SeedUserAsync();
        var issued = _f.TokenIssuer.Issue(user);
        await _f.Db.SaveChangesAsync();

        var handler = new LogoutHandler(_f.Db, _f.Jwt, _f.Clock);
        await handler.Handle(new LogoutCommand(issued.RefreshToken), default);
        await handler.Handle(new LogoutCommand(issued.RefreshToken), default);  // second call is a no-op

        var stored = await _f.Db.RefreshTokens.FirstAsync();
        Assert.False(stored.IsActive(_f.Clock.UtcNow));
    }
}
