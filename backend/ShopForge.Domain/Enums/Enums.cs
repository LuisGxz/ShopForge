namespace ShopForge.Domain.Enums;

public enum UserRole
{
    Customer = 0,
    Admin = 1
}

/// <summary>Lifecycle of an order. Transitions are enforced by <c>Order</c>.</summary>
public enum OrderStatus
{
    PendingPayment = 0,
    Paid = 1,
    Processing = 2,
    Shipped = 3,
    Delivered = 4,
    Cancelled = 5
}

public enum RoastLevel
{
    Light = 0,
    MediumLight = 1,
    Medium = 2,
    MediumDark = 3,
    Dark = 4
}

public enum ProcessMethod
{
    Washed = 0,
    Natural = 1,
    Honey = 2,
    Anaerobic = 3
}

public enum CouponType
{
    Percentage = 0,
    FixedAmount = 1
}
