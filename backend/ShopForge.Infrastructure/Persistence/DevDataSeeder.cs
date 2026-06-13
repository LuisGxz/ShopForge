using Microsoft.EntityFrameworkCore;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;

namespace ShopForge.Infrastructure.Persistence;

/// <summary>
/// Seeds the Emberline Roasters storefront with a realistic specialty-coffee catalog.
/// Idempotent: catalog is only written when the Products table is empty.
/// (Demo users and product reviews are seeded in a later phase, once auth exists.)
/// </summary>
public class DevDataSeeder(ShopForgeDbContext db)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        await SeedCatalogAsync(ct);
        await SeedCouponsAsync(ct);
    }

    private async Task SeedCouponsAsync(CancellationToken ct)
    {
        if (await db.Coupons.AnyAsync(ct)) return;

        db.Coupons.AddRange(
            new Coupon { Code = "FRESHLOT", Description = "$5 off your first fresh lot", Type = CouponType.FixedAmount, Value = 5m, MinSubtotal = 30m },
            new Coupon { Code = "WELCOME10", Description = "10% off — welcome to Emberline", Type = CouponType.Percentage, Value = 10m, MinSubtotal = 25m },
            new Coupon { Code = "BREWMORE", Description = "15% off orders over $80", Type = CouponType.Percentage, Value = 15m, MinSubtotal = 80m });

        await db.SaveChangesAsync(ct);
    }

    private async Task SeedCatalogAsync(CancellationToken ct)
    {
        if (await db.Products.AnyAsync(ct)) return;

        var coffee = new Category { Slug = "coffee", Name = "Coffee", NameEs = "Cafés", SortOrder = 1, Description = "Single-origin lots and blends, roasted fresh every Monday.", DescriptionEs = "Lotes de origen único y mezclas, tostados frescos cada lunes." };
        var subscription = new Category { Slug = "subscription", Name = "Subscription", NameEs = "Suscripción", SortOrder = 2, Description = "Let our roasters pick for you — a rotating lot on your schedule.", DescriptionEs = "Deja que nuestros tostadores elijan por ti — un lote rotativo a tu ritmo." };
        var gear = new Category { Slug = "brew-gear", Name = "Brew gear", NameEs = "Equipos", SortOrder = 3, Description = "The tools we reach for to brew these coffees at their best.", DescriptionEs = "Las herramientas que usamos para sacar lo mejor de estos cafés." };
        db.Categories.AddRange(coffee, subscription, gear);

        var products = new List<Product>();

        void AddCoffee(string slug, string name, string origin, string originEs, RoastLevel roast, ProcessMethod process,
            int altitude, string notes, string notesEs, string desc, string descEs, decimal price12oz, string tone,
            decimal rating, int reviews, int stock12, bool featured = false, string? hero = null, string? heroEs = null)
        {
            var p = new Product
            {
                Slug = slug, Name = name, CategoryId = coffee.Id, Category = coffee,
                Origin = origin, OriginEs = originEs, Region = origin.Split(',')[0].Trim(), AltitudeMeters = altitude,
                RoastLevel = roast, Process = process, FlavorNotes = notes, FlavorNotesEs = notesEs,
                Description = desc, DescriptionEs = descEs, IsFeatured = featured, HeroLabel = hero, HeroLabelEs = heroEs
            };
            p.SetRatingAggregate(rating, reviews);
            p.Variants.Add(new ProductVariant { ProductId = p.Id, Size = "12 oz", SizeEs = "12 oz", Sku = $"{slug}-12oz", Price = price12oz, SortOrder = 1 }.WithStock(stock12));
            p.Variants.Add(new ProductVariant { ProductId = p.Id, Size = "2 lb", SizeEs = "2 lb", Sku = $"{slug}-2lb", Price = Math.Round(price12oz * 2.3m, 0), SortOrder = 2 }.WithStock(stock12 / 2));
            p.Variants.Add(new ProductVariant { ProductId = p.Id, Size = "5 lb", SizeEs = "5 lb", Sku = $"{slug}-5lb", Price = Math.Round(price12oz * 5m, 0), SortOrder = 3 }.WithStock(Math.Max(4, stock12 / 4)));
            for (var i = 1; i <= 4; i++)
                p.Images.Add(new ProductImage { ProductId = p.Id, Url = $"assets/products/{slug}-{i}.svg", AltText = $"{name} — view {i}", Tone = tone, SortOrder = i });
            products.Add(p);
        }

        AddCoffee("la-esperanza", "La Esperanza — Washed Caturra", "Huila, Colombia", "Huila, Colombia", RoastLevel.Light, ProcessMethod.Washed, 1750,
            "Panela · red plum · cocoa", "Panela · ciruela roja · cacao",
            "Panela sweetness, red plum, and a cocoa finish. Sweet and round — our favorite for filter brewing.",
            "Dulzor a panela, ciruela roja y un final a cacao. Dulce y redondo — nuestro favorito para métodos de filtro.",
            21m, "copper", 4.8m, 214, 60, featured: true, hero: "Staff pick", heroEs: "Favorito del equipo");

        AddCoffee("kiamabara-aa", "Kiamabara AA", "Nyeri, Kenya", "Nyeri, Kenia", RoastLevel.MediumLight, ProcessMethod.Washed, 1800,
            "Blackcurrant · grapefruit · cane sugar", "Grosella · pomelo · azúcar de caña",
            "A classic Kenyan AA — juicy blackcurrant up front, bright grapefruit acidity and a clean, sugary close.",
            "Un clásico AA keniano — grosella jugosa al frente, acidez brillante a pomelo y un cierre limpio y azucarado.",
            24m, "leaf", 4.7m, 156, 48, featured: true);

        AddCoffee("daterra-sunrise", "Daterra Sunrise", "Cerrado, Brazil", "Cerrado, Brasil", RoastLevel.Medium, ProcessMethod.Natural, 1100,
            "Hazelnut · milk chocolate · brown sugar", "Avellana · chocolate con leche · azúcar moreno",
            "Comforting and nutty, with milk chocolate body and brown-sugar sweetness. Pulls beautifully as espresso.",
            "Reconfortante y a frutos secos, con cuerpo a chocolate con leche y dulzor de azúcar moreno. Espectacular como espresso.",
            19m, "beans", 4.6m, 318, 90, featured: true, hero: "Best for espresso", heroEs: "Ideal espresso");

        AddCoffee("gesha-cloud-lot", "Gesha Cloud Lot", "Chiriquí, Panama", "Chiriquí, Panamá", RoastLevel.Light, ProcessMethod.Washed, 1900,
            "Jasmine · bergamot · honey", "Jazmín · bergamota · miel",
            "A microlot Gesha with soaring jasmine aromatics, bergamot tea and a long honeyed finish. A special-occasion cup.",
            "Un microlote Gesha con aromática elevada a jazmín, té de bergamota y un largo final amielado. Una taza para ocasiones especiales.",
            42m, "amber", 4.9m, 47, 18, featured: true, hero: "Limited — 80 bags", heroEs: "Limitado — 80 bolsas");

        AddCoffee("yirgacheffe-konga", "Yirgacheffe Konga", "Gedeo, Ethiopia", "Gedeo, Etiopía", RoastLevel.Light, ProcessMethod.Washed, 1950,
            "Floral · lemon · black tea", "Floral · limón · té negro",
            "Delicate and tea-like, with lemon-blossom florals and a silky body. Pure washed Yirgacheffe character.",
            "Delicado y como un té, con flores de limón y un cuerpo sedoso. Carácter puro del Yirgacheffe lavado.",
            23m, "leaf", 4.8m, 132, 40);

        AddCoffee("el-injerto", "Finca El Injerto", "Huehuetenango, Guatemala", "Huehuetenango, Guatemala", RoastLevel.Medium, ProcessMethod.Washed, 1650,
            "Caramel · orange · almond", "Caramelo · naranja · almendra",
            "From one of Guatemala's most celebrated estates — caramel sweetness, bright orange and a toasted-almond finish.",
            "De una de las fincas más reconocidas de Guatemala — dulzor a caramelo, naranja brillante y final a almendra tostada.",
            22m, "copper", 4.5m, 98, 36);

        AddCoffee("sidama-natural", "Sidama Natural", "Sidama, Ethiopia", "Sidama, Etiopía", RoastLevel.MediumLight, ProcessMethod.Natural, 2000,
            "Blueberry · strawberry · cocoa", "Arándano · fresa · cacao",
            "An exuberant natural — ripe blueberry and strawberry jam with a cocoa base. Loud, fruity and fun.",
            "Un natural exuberante — arándano maduro y mermelada de fresa sobre una base de cacao. Intenso, frutal y divertido.",
            25m, "amber", 4.7m, 110, 33);

        AddCoffee("antigua-volcan", "Antigua Volcán", "Antigua, Guatemala", "Antigua, Guatemala", RoastLevel.MediumDark, ProcessMethod.Washed, 1550,
            "Dark chocolate · spice · toffee", "Chocolate amargo · especias · toffee",
            "A fuller roast for those who like it rich — dark chocolate, warm spice and toffee. Great with milk.",
            "Un tueste más oscuro para quien lo prefiere intenso — chocolate amargo, especias cálidas y toffee. Genial con leche.",
            20m, "beans", 4.4m, 76, 52);

        AddCoffee("tarrazu-reserva", "Tarrazú Reserva", "Tarrazú, Costa Rica", "Tarrazú, Costa Rica", RoastLevel.Medium, ProcessMethod.Honey, 1700,
            "Red apple · honey · walnut", "Manzana roja · miel · nuez",
            "A honey-process Costa Rican with crisp red apple, gentle honey sweetness and a walnut finish.",
            "Un costarricense de proceso honey con manzana roja crujiente, suave dulzor de miel y un final a nuez.",
            23m, "copper", 4.6m, 89, 30);

        AddCoffee("sumatra-lintong", "Sumatra Lintong", "Lintong, Indonesia", "Lintong, Indonesia", RoastLevel.Dark, ProcessMethod.Natural, 1400,
            "Cedar · dark cocoa · earth", "Cedro · cacao oscuro · tierra",
            "Low-toned and syrupy in the Sumatran tradition — cedar, dark cocoa and an earthy, savory depth.",
            "Grave y siroposo en la tradición de Sumatra — cedro, cacao oscuro y una profundidad terrosa y sabrosa.",
            18m, "beans", 4.3m, 64, 44);

        AddCoffee("oaxaca-pluma", "Oaxaca Pluma", "Oaxaca, Mexico", "Oaxaca, México", RoastLevel.Medium, ProcessMethod.Washed, 1600,
            "Cocoa · almond · cane", "Cacao · almendra · caña",
            "An easygoing daily driver — smooth cocoa, almond and cane sugar. Forgiving across any brew method.",
            "Un café diario y amable — cacao suave, almendra y azúcar de caña. Indulgente en cualquier método.",
            19m, "copper", 4.5m, 52, 70);

        AddCoffee("anaerobic-geisha", "Anaerobic Geisha", "Volcán, Panama", "Volcán, Panamá", RoastLevel.Light, ProcessMethod.Anaerobic, 1850,
            "Tropical · lychee · rose", "Tropical · lichi · rosa",
            "72-hour anaerobic fermentation pushes this Geisha into wild tropical territory — lychee, rose and mango.",
            "72 horas de fermentación anaeróbica llevan este Geisha a un territorio tropical salvaje — lichi, rosa y mango.",
            48m, "amber", 4.9m, 38, 14, hero: "Limited — 60 bags", heroEs: "Limitado — 60 bolsas");

        // Espresso blend
        AddCoffee("forge-espresso", "Forge Espresso Blend", "Seasonal blend", "Mezcla de temporada", RoastLevel.MediumDark, ProcessMethod.Natural, 0,
            "Cocoa · toasted nut · caramel", "Cacao · fruto seco tostado · caramelo",
            "Our house espresso — a Brazil/Colombia blend tuned for a thick crema, cocoa body and caramel sweetness.",
            "Nuestro espresso de la casa — una mezcla Brasil/Colombia afinada para una crema densa, cuerpo a cacao y dulzor de caramelo.",
            18m, "beans", 4.7m, 420, 120, featured: true, hero: "Best for espresso", heroEs: "Ideal espresso");

        // Subscription (single variant, treated as a one-time demo purchase)
        var sub = new Product
        {
            Slug = "roasters-choice", Name = "Roaster's Choice Subscription", CategoryId = subscription.Id, Category = subscription,
            Origin = "Rotating origins", OriginEs = "Orígenes rotativos", RoastLevel = RoastLevel.Medium, Process = ProcessMethod.Washed,
            FlavorNotes = "A new lot every delivery", FlavorNotesEs = "Un lote nuevo en cada entrega",
            Description = "Tell us how you brew and we'll send a freshly roasted 12 oz lot chosen by our roasters. Skip or cancel anytime.",
            DescriptionEs = "Cuéntanos cómo preparas tu café y te enviaremos un lote de 12 oz recién tostado elegido por nuestros tostadores. Pausa o cancela cuando quieras.",
            IsFeatured = false, HeroLabel = "Most flexible", HeroLabelEs = "Lo más flexible"
        };
        sub.SetRatingAggregate(4.8m, 95);
        sub.Variants.Add(new ProductVariant { ProductId = sub.Id, Size = "12 oz / month", SizeEs = "12 oz / mes", Sku = "roasters-choice-12oz", Price = 20m, SortOrder = 1 }.WithStock(999));
        sub.Images.Add(new ProductImage { ProductId = sub.Id, Url = "assets/products/roasters-choice-1.svg", AltText = "Roaster's Choice Subscription", Tone = "leaf", SortOrder = 1 });
        products.Add(sub);

        // Brew gear (single variant each)
        void AddGear(string slug, string name, string spec, string specEs, string desc, string descEs, decimal price, string tone, decimal rating, int reviews, int stock)
        {
            var g = new Product
            {
                Slug = slug, Name = name, CategoryId = gear.Id, Category = gear,
                Origin = null, RoastLevel = RoastLevel.Medium, Process = ProcessMethod.Washed,
                FlavorNotes = spec, FlavorNotesEs = specEs, Description = desc, DescriptionEs = descEs
            };
            g.SetRatingAggregate(rating, reviews);
            g.Variants.Add(new ProductVariant { ProductId = g.Id, Size = "Each", SizeEs = "Unidad", Sku = $"{slug}-each", Price = price, SortOrder = 1 }.WithStock(stock));
            g.Images.Add(new ProductImage { ProductId = g.Id, Url = $"assets/products/{slug}-1.svg", AltText = name, Tone = tone, SortOrder = 1 });
            products.Add(g);
        }

        AddGear("comandante-c40", "Comandante C40 Hand Grinder", "Conical burr · 40 mm steel · 30 g", "Molino cónico · acero 40 mm · 30 g",
            "The reference hand grinder. High-nitrogen steel burrs give a consistent grind from espresso to French press.",
            "El molino manual de referencia. Sus fresas de acero al alto nitrógeno dan una molienda consistente del espresso a la prensa francesa.",
            285m, "beans", 4.9m, 142, 22);

        AddGear("stagg-kettle", "Fellow Stagg Pour-Over Kettle", "0.9 L · gooseneck · ±1°F", "0.9 L · cuello de cisne · ±1°F",
            "A precision gooseneck kettle with variable temperature control and a satisfying counterbalanced handle.",
            "Una tetera de cuello de cisne de precisión con control de temperatura variable y un mango contrapesado muy logrado.",
            165m, "copper", 4.8m, 208, 31);

        db.Products.AddRange(products);
        await db.SaveChangesAsync(ct);
    }
}

internal static class SeedExtensions
{
    /// <summary>Fluent helper so variants can be built and stocked inline in the seeder.</summary>
    public static ProductVariant WithStock(this ProductVariant variant, int quantity)
    {
        variant.SetStock(quantity);
        return variant;
    }
}

