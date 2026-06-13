using ShopForge.Domain.Entities;
using ShopForge.Domain.Exceptions;

namespace ShopForge.UnitTests.Domain;

public class ProductVariantTests
{
    private static ProductVariant Variant(int stock)
    {
        var v = new ProductVariant { Size = "12 oz", Sku = "x-12oz", Price = 21m };
        v.SetStock(stock);
        return v;
    }

    [Fact]
    public void DecrementStock_reduces_quantity()
    {
        var v = Variant(10);
        v.DecrementStock(3);
        Assert.Equal(7, v.StockQuantity);
        Assert.True(v.InStock);
    }

    [Fact]
    public void DecrementStock_beyond_available_throws()
    {
        var v = Variant(2);
        var ex = Assert.Throws<DomainException>(() => v.DecrementStock(5));
        Assert.Contains("2 unit", ex.Message);
        Assert.Equal(2, v.StockQuantity);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void DecrementStock_non_positive_throws(int qty)
    {
        Assert.Throws<DomainException>(() => Variant(5).DecrementStock(qty));
    }

    [Fact]
    public void RestoreStock_adds_back()
    {
        var v = Variant(4);
        v.DecrementStock(4);
        Assert.False(v.InStock);
        v.RestoreStock(2);
        Assert.Equal(2, v.StockQuantity);
    }

    [Fact]
    public void SetStock_negative_throws() =>
        Assert.Throws<DomainException>(() => Variant(0).SetStock(-1));
}
