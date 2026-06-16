import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { CategoryDto, PagedResult, ProductFilters, ProductListItem } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { ProductCardComponent } from '../../shared/product-card.component';

const ROASTS = ['Light', 'MediumLight', 'Medium', 'MediumDark', 'Dark'];
const PROCESSES = ['Washed', 'Natural', 'Honey', 'Anaerobic'];
const PAGE_SIZE = 9;

@Component({
  selector: 'sf-catalog',
  imports: [FormsModule, IconComponent, ProductCardComponent],
  template: `
    <div class="container shop">
      <header class="shop-head">
        <h1 class="serif">{{ headTitle() }}</h1>
        <p class="muted count" aria-live="polite">
          @if (!loading()) { {{ total() }} {{ total() === 1 ? t().shop.resultsOne : t().shop.resultsMany }} }
        </p>
      </header>

      <div class="search-bar">
        <div class="search">
          <sf-icon name="search" [size]="18" />
          <input type="text" [(ngModel)]="searchText" (keyup.enter)="applySearch()"
            [placeholder]="t().shop.searchPlaceholder" [attr.aria-label]="t().common.search" />
          @if (searchText) { <button class="clear-s" (click)="searchText=''; applySearch()" [attr.aria-label]="t().common.clear"><sf-icon name="x" [size]="16" /></button> }
        </div>
        <div class="sort">
          <label for="sort" class="sr-label">{{ t().shop.sortBy }}</label>
          <select id="sort" [ngModel]="sort()" (ngModelChange)="patch({ sort: $event, page: null })">
            <option value="featured">{{ t().shop.sortFeatured }}</option>
            <option value="price-asc">{{ t().shop.sortPriceAsc }}</option>
            <option value="price-desc">{{ t().shop.sortPriceDesc }}</option>
            <option value="rating">{{ t().shop.sortRating }}</option>
            <option value="newest">{{ t().shop.sortNewest }}</option>
          </select>
        </div>
        <button class="btn btn-ghost btn-sm filt-toggle" (click)="filtersOpen.set(!filtersOpen())">
          <sf-icon name="sliders" [size]="16" /> {{ t().shop.filters }}
        </button>
      </div>

      <div class="layout">
        <aside class="filters" [class.open]="filtersOpen()">
          <div class="fgroup">
            <h3>{{ t().shop.category }}</h3>
            <button class="fopt" [class.on]="!category()" (click)="patch({ category: null, page: null })">{{ t().shop.allCategories }}</button>
            @for (c of categories(); track c.id) {
              <button class="fopt" [class.on]="category() === c.slug" (click)="patch({ category: c.slug, page: null })">
                {{ lang.pick(c.name, c.nameEs) }} <span class="muted n">{{ c.productCount }}</span>
              </button>
            }
          </div>

          <div class="fgroup">
            <h3>{{ t().shop.roast }}</h3>
            <button class="fopt" [class.on]="!roast()" (click)="patch({ roast: null, page: null })">—</button>
            @for (r of roasts; track r) {
              <button class="fopt" [class.on]="roast() === r" (click)="patch({ roast: r, page: null })">{{ lang.roast(r) }}</button>
            }
          </div>

          <div class="fgroup">
            <h3>{{ t().shop.process }}</h3>
            <button class="fopt" [class.on]="!process()" (click)="patch({ process: null, page: null })">—</button>
            @for (pr of processes; track pr) {
              <button class="fopt" [class.on]="process() === pr" (click)="patch({ process: pr, page: null })">{{ lang.process(pr) }}</button>
            }
          </div>

          <div class="fgroup">
            <h3>{{ t().shop.price }}</h3>
            <div class="price-row">
              <input type="number" min="0" [(ngModel)]="minPrice" [placeholder]="t().shop.minPrice" [attr.aria-label]="t().shop.minPrice" />
              <span class="dash">–</span>
              <input type="number" min="0" [(ngModel)]="maxPrice" [placeholder]="t().shop.maxPrice" [attr.aria-label]="t().shop.maxPrice" />
            </div>
            <button class="btn btn-ghost btn-sm apply-price" (click)="applyPrice()">{{ t().shop.apply }}</button>
          </div>

          @if (hasActiveFilters()) {
            <button class="clear-all" (click)="clearAll()"><sf-icon name="x" [size]="14" /> {{ t().shop.clearAll }}</button>
          }
        </aside>

        <section class="results">
          @if (loading()) {
            <div class="grid">@for (i of skeletons; track i) { <div class="sk"><div class="sk-art skeleton"></div><div class="sk-line skeleton"></div><div class="sk-line short skeleton"></div></div> }</div>
          } @else if (error()) {
            <div class="state card"><sf-icon name="alert-triangle" [size]="28" /><p class="muted">{{ t().common.error }}</p><button class="btn btn-ghost btn-sm" (click)="fetch()">{{ t().common.retry }}</button></div>
          } @else if (products().length === 0) {
            <div class="state card">
              <span class="mark"><sf-icon name="coffee" [size]="26" /></span>
              <h3 class="serif">{{ t().shop.emptyTitle }}</h3>
              <p class="muted">{{ t().shop.emptyBody }}</p>
              <button class="btn btn-ghost btn-sm" (click)="clearAll()">{{ t().shop.clearAll }}</button>
            </div>
          } @else {
            <div class="grid">@for (p of products(); track p.id) { <sf-product-card [p]="p" /> }</div>

            @if (totalPages() > 1) {
              <nav class="pager" [attr.aria-label]="t().common.page">
                <button class="pg" [disabled]="page() <= 1" (click)="patch({ page: page() - 1 })"><sf-icon name="chevron-left" [size]="16" /> {{ t().common.prev }}</button>
                <span class="pg-info num">{{ t().common.page }} {{ page() }} {{ t().common.of }} {{ totalPages() }}</span>
                <button class="pg" [disabled]="page() >= totalPages()" (click)="patch({ page: page() + 1 })">{{ t().common.next }} <sf-icon name="chevron-right" [size]="16" /></button>
              </nav>
            }
          }
        </section>
      </div>
    </div>
  `,
  styles: `
    .shop { padding-block: 2rem 3.5rem; }
    .shop-head { margin-bottom: 1.25rem; }
    .shop-head h1 { font-size: clamp(2rem, 4vw, 2.6rem); }
    .count { margin: 0.25rem 0 0; font-size: 0.9rem; }
    .search-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; margin-bottom: 1.5rem; }
    .search { position: relative; flex: 1; min-width: 14rem; display: flex; align-items: center; }
    .search sf-icon { position: absolute; left: 0.85rem; color: var(--bean-400); pointer-events: none; }
    .search input { padding-left: 2.6rem; padding-right: 2.4rem; border-radius: var(--radius-pill); }
    .clear-s { position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--bean-400); display: grid; place-items: center; padding: 0.25rem; }
    .clear-s:hover { color: var(--bean-900); }
    .sort { display: flex; align-items: center; gap: 0.5rem; }
    .sr-label { font-size: 0.82rem; font-weight: 600; color: var(--bean-500); white-space: nowrap; }
    .sort select { width: auto; border-radius: var(--radius-pill); padding-block: 0.5rem; }
    .filt-toggle { display: none; }
    .layout { display: grid; grid-template-columns: 15rem 1fr; gap: 2rem; align-items: start; }
    .filters { position: sticky; top: 5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .fgroup h3 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--bean-500); margin-bottom: 0.6rem; }
    .fopt { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: 100%; text-align: left;
      background: none; border: none; cursor: pointer; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.9rem;
      color: var(--bean-700); font-weight: 500; transition: background 140ms ease, color 140ms ease; }
    .fopt:hover { background: var(--cream-100); }
    .fopt.on { background: var(--bean-900); color: var(--cream-50); }
    .fopt.on .n { color: var(--cream-200); }
    .fopt .n { font-size: 0.78rem; }
    .price-row { display: flex; align-items: center; gap: 0.5rem; }
    .price-row input { width: 100%; }
    .dash { color: var(--bean-400); }
    .apply-price { margin-top: 0.6rem; width: 100%; }
    .clear-all { display: inline-flex; align-items: center; gap: 0.4rem; background: none; border: none; cursor: pointer;
      color: var(--copper-600); font-weight: 600; font-size: 0.85rem; padding: 0.3rem 0; }
    .grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
    @media (min-width: 560px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 980px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    .sk-art { aspect-ratio: 4/5; border-radius: var(--radius-card); }
    .sk-line { height: 0.8rem; margin-top: 0.6rem; border-radius: 4px; }
    .sk-line.short { width: 55%; }
    .state { display: grid; place-items: center; gap: 0.75rem; padding: 3rem 1.5rem; text-align: center; }
    .state .mark { width: 3rem; height: 3rem; border-radius: var(--radius-pill); background: var(--cream-100); color: var(--copper-600); display: grid; place-items: center; }
    .state h3 { font-size: 1.4rem; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2.5rem; }
    .pg { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--surface); border: 1px solid var(--border-strong);
      border-radius: var(--radius-pill); padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.88rem; color: var(--bean-900); transition: border-color 150ms ease; }
    .pg:hover:not(:disabled) { border-color: var(--bean-900); }
    .pg:disabled { opacity: 0.4; cursor: not-allowed; }
    .pg-info { font-size: 0.88rem; color: var(--bean-500); }
    .sr-label { }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .filt-toggle { display: inline-flex; }
      .filters { position: static; display: none; padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface); }
      .filters.open { display: flex; }
    }
  `
})
export class CatalogComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;

  protected readonly roasts = ROASTS;
  protected readonly processes = PROCESSES;
  protected readonly skeletons = Array.from({ length: 6 }, (_, i) => i);

  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly filtersOpen = signal(false);

  // URL-derived current filter values.
  protected readonly category = signal<string | null>(null);
  protected readonly roast = signal<string | null>(null);
  protected readonly process = signal<string | null>(null);
  protected readonly sort = signal<string>('featured');
  protected readonly page = signal(1);

  // Local form inputs (committed on Enter / Apply).
  protected searchText = '';
  protected minPrice: number | null = null;
  protected maxPrice: number | null = null;

  protected readonly headTitle = computed(() => {
    const slug = this.category();
    const cat = this.categories().find(c => c.slug === slug);
    return cat ? this.lang.pick(cat.name, cat.nameEs) : this.t().shop.title;
  });
  protected readonly hasActiveFilters = computed(() =>
    !!(this.category() || this.roast() || this.process() || this.searchText || this.minPrice != null || this.maxPrice != null));

  constructor() {
    void this.loadCategories();
    this.route.queryParamMap.subscribe(pm => {
      this.category.set(pm.get('category'));
      this.roast.set(pm.get('roast'));
      this.process.set(pm.get('process'));
      this.sort.set(pm.get('sort') ?? 'featured');
      this.page.set(Number(pm.get('page')) || 1);
      this.searchText = pm.get('search') ?? '';
      this.minPrice = pm.has('minPrice') ? Number(pm.get('minPrice')) : null;
      this.maxPrice = pm.has('maxPrice') ? Number(pm.get('maxPrice')) : null;
      void this.fetch();
    });
  }

  private async loadCategories() {
    try { this.categories.set(await firstValueFrom(this.api.getCategories())); } catch { /* non-critical */ }
  }

  protected async fetch() {
    this.loading.set(true); this.error.set(false);
    const filters: ProductFilters = {
      category: this.category() ?? undefined, roast: this.roast() ?? undefined,
      process: this.process() ?? undefined, sort: this.sort(), page: this.page(), pageSize: PAGE_SIZE,
      search: this.searchText || undefined,
      minPrice: this.minPrice ?? undefined, maxPrice: this.maxPrice ?? undefined
    };
    try {
      const res: PagedResult<ProductListItem> = await firstValueFrom(this.api.getProducts(filters));
      this.products.set(res.items);
      this.total.set(res.totalCount);
      this.totalPages.set(res.totalPages);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /** Merge filter changes into the URL; a null value removes the param. */
  protected patch(changes: Record<string, string | number | null>) {
    const queryParams: Params = { ...changes };
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
    this.filtersOpen.set(false);
  }

  protected applySearch() { this.patch({ search: this.searchText || null, page: null }); }
  protected applyPrice() {
    this.patch({ minPrice: this.minPrice ?? null, maxPrice: this.maxPrice ?? null, page: null });
  }
  protected clearAll() {
    this.searchText = ''; this.minPrice = null; this.maxPrice = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.filtersOpen.set(false);
  }
}
