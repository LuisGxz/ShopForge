using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Common.Models;
using ShopForge.Application.Features.Orders;
using ShopForge.Domain.Enums;

namespace ShopForge.Application.Features.Admin;

public record AdminOrderListItemDto(
    string OrderNumber, string ContactEmail, string Status, decimal Total, int ItemCount, DateTime PlacedAtUtc);

public record GetAdminOrdersQuery(OrderStatus? Status = null, int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<AdminOrderListItemDto>>;

public class GetAdminOrdersValidator : AbstractValidator<GetAdminOrdersQuery>
{
    public GetAdminOrdersValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
    }
}

public class GetAdminOrdersHandler(IAppDbContext db) : IRequestHandler<GetAdminOrdersQuery, PagedResult<AdminOrderListItemDto>>
{
    public async Task<PagedResult<AdminOrderListItemDto>> Handle(GetAdminOrdersQuery request, CancellationToken ct)
    {
        var query = db.Orders.AsQueryable();
        if (request.Status.HasValue)
            query = query.Where(o => o.Status == request.Status);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(o => o.PlacedAtUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new AdminOrderListItemDto(
                o.OrderNumber, o.ContactEmail, o.Status.ToString(), o.Total, o.Items.Sum(i => i.Quantity), o.PlacedAtUtc))
            .ToListAsync(ct);

        return new PagedResult<AdminOrderListItemDto>(items, request.Page, request.PageSize, total);
    }
}

public record AdvanceOrderCommand(string OrderNumber) : IRequest<OrderDetailDto>;

public class AdvanceOrderHandler(IAppDbContext db) : IRequestHandler<AdvanceOrderCommand, OrderDetailDto>
{
    public async Task<OrderDetailDto> Handle(AdvanceOrderCommand request, CancellationToken ct)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber, ct)
            ?? throw new NotFoundException("Order", request.OrderNumber);

        var next = order.Status switch
        {
            OrderStatus.Paid => OrderStatus.Processing,
            OrderStatus.Processing => OrderStatus.Shipped,
            OrderStatus.Shipped => OrderStatus.Delivered,
            _ => throw new ShopForge.Domain.Exceptions.DomainException($"A {order.Status} order has no next fulfilment step.")
        };

        order.AdvanceTo(next);
        await db.SaveChangesAsync(ct);
        return OrderDetailDto.From(order);
    }
}

public record CancelOrderCommand(string OrderNumber) : IRequest<OrderDetailDto>;

public class CancelOrderHandler(IAppDbContext db, IClock clock) : IRequestHandler<CancelOrderCommand, OrderDetailDto>
{
    public async Task<OrderDetailDto> Handle(CancelOrderCommand request, CancellationToken ct)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber, ct)
            ?? throw new NotFoundException("Order", request.OrderNumber);

        var wasPaid = order.Status == OrderStatus.Paid;

        await db.ExecuteInTransactionAsync(async innerCt =>
        {
            order.Cancel(clock.UtcNow);

            // A paid order already decremented stock — give it back on cancellation.
            if (wasPaid)
            {
                var variantIds = order.Items.Select(i => i.ProductVariantId).ToList();
                var variants = await db.ProductVariants.Where(v => variantIds.Contains(v.Id)).ToDictionaryAsync(v => v.Id, innerCt);
                foreach (var item in order.Items)
                    if (variants.TryGetValue(item.ProductVariantId, out var variant))
                        variant.RestoreStock(item.Quantity);
            }

            await db.SaveChangesAsync(innerCt);
        }, ct);

        return OrderDetailDto.From(order);
    }
}
