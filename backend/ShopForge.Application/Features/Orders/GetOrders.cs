using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Common.Models;

namespace ShopForge.Application.Features.Orders;

public record GetMyOrdersQuery(Guid UserId, int Page = 1, int PageSize = 10) : IRequest<PagedResult<OrderListItemDto>>;

public class GetMyOrdersValidator : AbstractValidator<GetMyOrdersQuery>
{
    public GetMyOrdersValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
    }
}

public class GetMyOrdersHandler(IAppDbContext db) : IRequestHandler<GetMyOrdersQuery, PagedResult<OrderListItemDto>>
{
    public async Task<PagedResult<OrderListItemDto>> Handle(GetMyOrdersQuery request, CancellationToken ct)
    {
        var query = db.Orders.Where(o => o.UserId == request.UserId);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(o => o.PlacedAtUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderListItemDto(
                o.OrderNumber, o.Status.ToString(), o.Total, o.Items.Sum(i => i.Quantity), o.PlacedAtUtc))
            .ToListAsync(ct);

        return new PagedResult<OrderListItemDto>(items, request.Page, request.PageSize, total);
    }
}

public record GetMyOrderQuery(Guid UserId, string OrderNumber) : IRequest<OrderDetailDto>;

public class GetMyOrderHandler(IAppDbContext db) : IRequestHandler<GetMyOrderQuery, OrderDetailDto>
{
    public async Task<OrderDetailDto> Handle(GetMyOrderQuery request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber && o.UserId == request.UserId, ct)
            ?? throw new NotFoundException("Order", request.OrderNumber);

        return OrderDetailDto.From(order);
    }
}
