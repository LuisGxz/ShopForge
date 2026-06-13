using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Enums;

namespace ShopForge.Application.Features.Admin;

public record StatusCountDto(string Status, int Count);
public record TopProductDto(string ProductName, int UnitsSold, decimal Revenue);
public record SalesByDayDto(DateOnly Date, decimal Revenue, int Orders);
public record LowStockDto(string ProductName, string VariantSize, int StockQuantity);

public record DashboardDto(
    decimal TotalRevenue, int PaidOrders, decimal AverageOrderValue, int PendingOrders,
    IReadOnlyList<StatusCountDto> OrdersByStatus,
    IReadOnlyList<TopProductDto> TopProducts,
    IReadOnlyList<SalesByDayDto> SalesByDay,
    IReadOnlyList<LowStockDto> LowStock);

public record GetDashboardQuery : IRequest<DashboardDto>;

public class GetDashboardHandler(IAppDbContext db, IClock clock) : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    private const int LowStockThreshold = 10;
    private const int SalesWindowDays = 14;

    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken ct)
    {
        // "Paid" = money was taken: anything past PendingPayment that wasn't cancelled.
        var paidOrdersQuery = db.Orders.Where(o => o.Status != OrderStatus.PendingPayment && o.Status != OrderStatus.Cancelled);

        var paidOrders = await paidOrdersQuery
            .Select(o => new { o.Total, o.PaidAtUtc })
            .ToListAsync(ct);

        var totalRevenue = paidOrders.Sum(o => o.Total);
        var paidCount = paidOrders.Count;
        var aov = paidCount == 0 ? 0m : Math.Round(totalRevenue / paidCount, 2);

        var pending = await db.Orders.CountAsync(o => o.Status == OrderStatus.PendingPayment, ct);

        var byStatus = await db.Orders
            .GroupBy(o => o.Status)
            .Select(g => new StatusCountDto(g.Key.ToString(), g.Count()))
            .ToListAsync(ct);

        var paidOrderIds = await paidOrdersQuery.Select(o => o.Id).ToListAsync(ct);
        var paidItems = await db.OrderItems
            .Where(i => paidOrderIds.Contains(i.OrderId))
            .Select(i => new { i.ProductName, i.UnitPrice, i.Quantity })
            .ToListAsync(ct);
        var topProducts = paidItems
            .GroupBy(i => i.ProductName)
            .Select(g => new TopProductDto(g.Key, g.Sum(i => i.Quantity), g.Sum(i => i.UnitPrice * i.Quantity)))
            .OrderByDescending(t => t.UnitsSold)
            .Take(5)
            .ToList();

        var since = clock.UtcNow.Date.AddDays(-(SalesWindowDays - 1));
        var salesByDay = paidOrders
            .Where(o => o.PaidAtUtc.HasValue && o.PaidAtUtc.Value.Date >= since)
            .GroupBy(o => DateOnly.FromDateTime(o.PaidAtUtc!.Value.Date))
            .Select(g => new SalesByDayDto(g.Key, g.Sum(o => o.Total), g.Count()))
            .OrderBy(s => s.Date)
            .ToList();

        var lowStock = await db.ProductVariants
            .Where(v => v.StockQuantity < LowStockThreshold && v.Product!.IsActive)
            .OrderBy(v => v.StockQuantity)
            .Select(v => new LowStockDto(v.Product!.Name, v.Size, v.StockQuantity))
            .Take(10)
            .ToListAsync(ct);

        return new DashboardDto(totalRevenue, paidCount, aov, pending, byStatus, topProducts, salesByDay, lowStock);
    }
}
