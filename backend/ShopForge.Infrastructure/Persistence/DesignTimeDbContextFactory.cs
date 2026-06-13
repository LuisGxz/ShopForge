using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ShopForge.Infrastructure.Persistence;

/// <summary>Used only by `dotnet ef` at design time; never at runtime.</summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ShopForgeDbContext>
{
    public ShopForgeDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ShopForgeDbContext>()
            .UseSqlServer("Server=localhost,14333;Database=ShopForge;TrustServerCertificate=True;")
            .Options;

        return new ShopForgeDbContext(options);
    }
}
