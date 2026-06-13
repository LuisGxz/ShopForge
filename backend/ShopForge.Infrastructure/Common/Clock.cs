using ShopForge.Application.Common.Interfaces;

namespace ShopForge.Infrastructure.Common;

public class Clock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
