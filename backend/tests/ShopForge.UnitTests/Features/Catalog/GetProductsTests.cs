using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Features.Catalog;
using ShopForge.Domain.Enums;

namespace ShopForge.UnitTests.Features.Catalog;

public class GetProductsTests
{
    [Fact]
    public async Task Lists_only_active_products()
    {
        var db = await CatalogTestData.SeededAsync();
        var result = await new GetProductsHandler(db).Handle(new GetProductsQuery(PageSize: 50), default);

        Assert.Equal(4, result.TotalCount);                       // 5 seeded, 1 inactive
        Assert.DoesNotContain(result.Items, p => p.Slug == "hidden");
    }

    [Fact]
    public async Task Filters_by_category()
    {
        var db = await CatalogTestData.SeededAsync();
        var result = await new GetProductsHandler(db).Handle(new GetProductsQuery(Category: "brew-gear"), default);

        Assert.Single(result.Items);
        Assert.Equal("kettle", result.Items[0].Slug);
    }

    [Fact]
    public async Task Filters_by_roast_and_process()
    {
        var db = await CatalogTestData.SeededAsync();
        var result = await new GetProductsHandler(db).Handle(
            new GetProductsQuery(Roast: RoastLevel.Light, Process: ProcessMethod.Washed), default);

        Assert.Equal(2, result.TotalCount);                       // la-esperanza + gesha
        Assert.All(result.Items, p => Assert.Equal("Light", p.RoastLevel));
    }

    [Fact]
    public async Task Search_matches_name_notes_or_origin()
    {
        var db = await CatalogTestData.SeededAsync();
        var result = await new GetProductsHandler(db).Handle(new GetProductsQuery(Search: "jasmine"), default);
        Assert.Single(result.Items);
        Assert.Equal("gesha", result.Items[0].Slug);
    }

    [Fact]
    public async Task Filters_by_price_range_on_cheapest_variant()
    {
        var db = await CatalogTestData.SeededAsync();
        var result = await new GetProductsHandler(db).Handle(new GetProductsQuery(MaxPrice: 25m), default);
        // la-esperanza (21) and daterra (19); gesha (42) and kettle (165) excluded
        Assert.Equal(2, result.TotalCount);
    }

    [Fact]
    public async Task Sorts_by_price_ascending_and_descending()
    {
        var db = await CatalogTestData.SeededAsync();
        var asc = await new GetProductsHandler(db).Handle(new GetProductsQuery(Sort: "price-asc"), default);
        var desc = await new GetProductsHandler(db).Handle(new GetProductsQuery(Sort: "price-desc"), default);

        Assert.Equal("daterra", asc.Items.First().Slug);          // 19
        Assert.Equal("kettle", desc.Items.First().Slug);          // 165
    }

    [Fact]
    public async Task FromPrice_and_stock_flag_are_projected()
    {
        var db = await CatalogTestData.SeededAsync();
        var result = await new GetProductsHandler(db).Handle(new GetProductsQuery(Category: "coffee", Sort: "price-asc"), default);

        var daterra = result.Items.First(p => p.Slug == "daterra");
        Assert.Equal(19m, daterra.FromPrice);
        Assert.False(daterra.InStock);                            // seeded with 0 stock
    }

    [Fact]
    public async Task Paginates()
    {
        var db = await CatalogTestData.SeededAsync();
        var page1 = await new GetProductsHandler(db).Handle(new GetProductsQuery(PageSize: 2, Page: 1), default);
        var page2 = await new GetProductsHandler(db).Handle(new GetProductsQuery(PageSize: 2, Page: 2), default);

        Assert.Equal(2, page1.Items.Count);
        Assert.Equal(2, page1.TotalPages);
        Assert.NotEqual(page1.Items[0].Slug, page2.Items[0].Slug);
    }

    [Fact]
    public async Task Detail_returns_variants_and_images()
    {
        var db = await CatalogTestData.SeededAsync();
        var dto = await new GetProductDetailHandler(db).Handle(new GetProductDetailQuery("la-esperanza"), default);

        Assert.Equal("La Esperanza", dto.Name);
        Assert.Equal(2, dto.Variants.Count);
        Assert.Equal("12 oz", dto.Variants[0].Size);              // ordered by SortOrder
        Assert.Single(dto.Images);
    }

    [Fact]
    public async Task Detail_of_unknown_or_inactive_throws_not_found()
    {
        var db = await CatalogTestData.SeededAsync();
        await Assert.ThrowsAsync<NotFoundException>(() => new GetProductDetailHandler(db).Handle(new GetProductDetailQuery("nope"), default));
        await Assert.ThrowsAsync<NotFoundException>(() => new GetProductDetailHandler(db).Handle(new GetProductDetailQuery("hidden"), default));
    }
}
