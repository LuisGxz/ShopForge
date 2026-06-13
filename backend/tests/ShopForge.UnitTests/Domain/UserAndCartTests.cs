using ShopForge.Domain.Entities;
using ShopForge.Domain.Exceptions;

namespace ShopForge.UnitTests.Domain;

public class UserAndCartTests
{
    private static readonly DateTime Now = new(2026, 6, 13, 12, 0, 0, DateTimeKind.Utc);

    private static User NewUser() => new() { Email = "luis@test.dev", FullName = "Luis", PasswordHash = "x" };

    [Fact]
    public void Lockout_triggers_after_five_failed_logins()
    {
        var user = NewUser();
        for (var i = 0; i < User.MaxFailedLoginAttempts; i++)
            user.RegisterFailedLogin(Now);

        Assert.True(user.IsLockedOut(Now));
        Assert.False(user.IsLockedOut(Now.Add(User.LockoutDuration).AddMinutes(1)));
    }

    [Fact]
    public void Successful_login_clears_failures()
    {
        var user = NewUser();
        user.RegisterFailedLogin(Now);
        user.RegisterSuccessfulLogin();
        Assert.False(user.IsLockedOut(Now));
    }

    [Fact]
    public void Cart_merges_same_variant_and_grind()
    {
        var cart = new Cart { UserId = Guid.NewGuid() };
        var variantId = Guid.NewGuid();
        cart.AddOrIncrement(variantId, "Whole bean", 1, Now);
        cart.AddOrIncrement(variantId, "Whole bean", 2, Now);

        Assert.Single(cart.Items);
        Assert.Equal(3, cart.Items.First().Quantity);
    }

    [Fact]
    public void Cart_keeps_different_grinds_separate()
    {
        var cart = new Cart { UserId = Guid.NewGuid() };
        var variantId = Guid.NewGuid();
        cart.AddOrIncrement(variantId, "Whole bean", 1, Now);
        cart.AddOrIncrement(variantId, "Filter", 1, Now);
        Assert.Equal(2, cart.Items.Count);
    }

    [Fact]
    public void Cart_rejects_quantity_above_maximum()
    {
        var cart = new Cart { UserId = Guid.NewGuid() };
        Assert.Throws<DomainException>(() =>
            cart.AddOrIncrement(Guid.NewGuid(), "Whole bean", Cart.MaxQuantityPerItem + 1, Now));
    }
}
