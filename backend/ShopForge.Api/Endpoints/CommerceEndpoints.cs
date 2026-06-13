using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShopForge.Api.Infrastructure;
using ShopForge.Application.Features.Cart;
using ShopForge.Application.Features.Checkout;
using ShopForge.Application.Features.Coupons;
using ShopForge.Application.Features.Orders;
using ShopForge.Application.Features.Wishlist;

namespace ShopForge.Api.Endpoints;

public static class CommerceEndpoints
{
    public record AddItemRequest(Guid ProductVariantId, string Grind, int Quantity);
    public record UpdateItemRequest(int Quantity);
    public record ValidateCouponRequest(string Code, decimal Subtotal);
    public record CheckoutIntentRequest(string Email, ShippingAddressInput Shipping, string? CouponCode);
    public record ConfirmRequest(string OrderNumber);
    public record ToggleWishlistRequest(Guid ProductId);

    public static IEndpointRouteBuilder MapCommerceEndpoints(this IEndpointRouteBuilder app)
    {
        // ---- Cart (auth) ----
        var cart = app.MapGroup("/api/v1/cart").WithTags("Cart").RequireAuthorization();

        cart.MapGet("", async (HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetCartQuery(http.User.GetUserId()), ct)));

        cart.MapPost("/items", async ([FromBody] AddItemRequest r, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new AddCartItemCommand(http.User.GetUserId(), r.ProductVariantId, r.Grind, r.Quantity), ct)));

        cart.MapPut("/items/{id:guid}", async (Guid id, [FromBody] UpdateItemRequest r, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new UpdateCartItemCommand(http.User.GetUserId(), id, r.Quantity), ct)));

        cart.MapDelete("/items/{id:guid}", async (Guid id, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new RemoveCartItemCommand(http.User.GetUserId(), id), ct)));

        // ---- Coupons (public preview) ----
        app.MapPost("/api/v1/coupons/validate", async ([FromBody] ValidateCouponRequest r, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new ValidateCouponQuery(r.Code, r.Subtotal), ct))).WithTags("Coupons");

        // ---- Checkout (auth, except the Stripe webhook) ----
        var checkout = app.MapGroup("/api/v1/checkout").WithTags("Checkout");

        checkout.MapPost("/intent", async ([FromBody] CheckoutIntentRequest r, HttpContext http, ISender sender, CancellationToken ct) =>
                Results.Ok(await sender.Send(new CreateCheckoutIntentCommand(http.User.GetUserId(), r.Email, r.Shipping, r.CouponCode), ct)))
            .RequireAuthorization();

        checkout.MapPost("/confirm", async ([FromBody] ConfirmRequest r, HttpContext http, ISender sender, CancellationToken ct) =>
                Results.Ok(await sender.Send(new ConfirmCheckoutCommand(http.User.GetUserId(), r.OrderNumber), ct)))
            .RequireAuthorization();

        checkout.MapPost("/webhook", async (HttpContext http, ISender sender, CancellationToken ct) =>
        {
            using var reader = new StreamReader(http.Request.Body);
            var payload = await reader.ReadToEndAsync(ct);
            var signature = http.Request.Headers["Stripe-Signature"].ToString();
            await sender.Send(new HandleStripeWebhookCommand(payload, signature), ct);
            return Results.Ok();
        });

        // ---- Orders (auth) ----
        var orders = app.MapGroup("/api/v1/orders").WithTags("Orders").RequireAuthorization();

        orders.MapGet("", async ([FromQuery] int? page, [FromQuery] int? pageSize, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetMyOrdersQuery(http.User.GetUserId(), page ?? 1, pageSize ?? 10), ct)));

        orders.MapGet("/{orderNumber}", async (string orderNumber, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetMyOrderQuery(http.User.GetUserId(), orderNumber), ct)));

        // ---- Wishlist (auth) ----
        var wishlist = app.MapGroup("/api/v1/wishlist").WithTags("Wishlist").RequireAuthorization();

        wishlist.MapGet("", async (HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetWishlistQuery(http.User.GetUserId()), ct)));

        wishlist.MapPost("/toggle", async ([FromBody] ToggleWishlistRequest r, HttpContext http, ISender sender, CancellationToken ct) =>
            Results.Ok(new { inWishlist = await sender.Send(new ToggleWishlistCommand(http.User.GetUserId(), r.ProductId), ct) }));

        return app;
    }
}
