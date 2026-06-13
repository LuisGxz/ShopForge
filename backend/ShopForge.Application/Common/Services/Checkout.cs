namespace ShopForge.Application.Common.Services;

public static class ShippingCalculator
{
    public const decimal FreeShippingThreshold = 60m;
    public const decimal FlatRate = 6.50m;

    /// <summary>Flat-rate shipping that becomes free once the (post-discount) subtotal clears the threshold.</summary>
    public static decimal For(decimal subtotalAfterDiscount) =>
        subtotalAfterDiscount >= FreeShippingThreshold ? 0m : FlatRate;
}

public static class OrderNumber
{
    /// <summary>Human-friendly order number, e.g. "EMB-2A4F9C".</summary>
    public static string New() => $"EMB-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
}
