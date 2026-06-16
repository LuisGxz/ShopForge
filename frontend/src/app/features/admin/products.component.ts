import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { AdminProductListItem, ProductDetail, ProductVariantDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-admin-products',
  imports: [FormsModule, CurrencyPipe, IconComponent],
  template: `
    <div class="bar">
      <div class="search">
        <sf-icon name="search" [size]="16" />
        <input type="text" [(ngModel)]="search" (keyup.enter)="load(1)" [placeholder]="t().common.search" />
      </div>
    </div>

    @if (loading()) {
      @for (i of [1,2,3,4]; track i) { <div class="skeleton sk-row"></div> }
    } @else if (rows().length === 0) {
      <p class="muted empty">{{ t().admin.noProducts }}</p>
    } @else {
      <div class="table card">
        <div class="thead">
          <span>{{ t().admin.productCol }}</span><span class="hide-sm">{{ t().admin.categoryCol }}</span>
          <span class="hide-sm">{{ t().admin.stockCol }}</span><span>{{ t().admin.priceCol }}</span>
          <span>{{ t().admin.statusCol }}</span><span></span>
        </div>
        @for (p of rows(); track p.id) {
          <div class="trow" [class.open]="expanded() === p.id">
            <span class="pname">{{ p.name }}</span>
            <span class="hide-sm muted">{{ p.categoryName }}</span>
            <span class="hide-sm num">{{ p.totalStock }}</span>
            <span class="num">{{ p.fromPrice | currency }}</span>
            <span>
              @if (p.isActive) { <span class="badge badge-ok">{{ t().admin.active }}</span> } @else { <span class="badge badge-neutral">{{ t().admin.inactive }}</span> }
              @if (p.isFeatured) { <span class="badge badge-warn star"><sf-icon name="star" [size]="11" /></span> }
            </span>
            <button class="exp" (click)="toggle(p)" [attr.aria-expanded]="expanded() === p.id">
              <sf-icon [name]="expanded() === p.id ? 'chevron-down' : 'edit'" [size]="16" />
            </button>
          </div>

          @if (expanded() === p.id) {
            <div class="editor">
              @if (detailLoading()) {
                <div class="skeleton sk-edit"></div>
              } @else if (detail(); as d) {
                <div class="toggles">
                  <label class="tg"><input type="checkbox" [(ngModel)]="editActive" /> {{ t().admin.active }}</label>
                  <label class="tg"><input type="checkbox" [(ngModel)]="editFeatured" /> {{ t().admin.featured }}</label>
                  <button class="btn btn-primary btn-sm" (click)="saveProduct(d)" [disabled]="savingProduct()">
                    @if (savingProduct()) { <sf-icon name="flame" [size]="14" class="spin" /> } @else { {{ t().common.save }} }
                  </button>
                </div>
                <h4 class="vh">{{ t().admin.variantsFor }}</h4>
                <div class="variants">
                  @for (v of editVariants(); track v.id) {
                    <div class="vrow">
                      <span class="vsize">{{ v.size }}</span>
                      <span class="vsku muted">{{ v.sku }}</span>
                      <label class="vf">{{ t().admin.priceLabel }}<input type="number" min="0" step="0.01" [(ngModel)]="v.price" /></label>
                      <label class="vf">{{ t().admin.stockLabel }}<input type="number" min="0" [(ngModel)]="v.stockQuantity" /></label>
                      <button class="btn btn-ghost btn-sm" (click)="saveVariant(v)" [disabled]="savingVariant() === v.id">
                        @if (savingVariant() === v.id) { <sf-icon name="flame" [size]="13" class="spin" /> } @else { {{ t().admin.saveVariant }} }
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      </div>

      @if (totalPages() > 1) {
        <nav class="pager">
          <button class="pg" [disabled]="page() <= 1" (click)="load(page() - 1)"><sf-icon name="chevron-left" [size]="16" /> {{ t().common.prev }}</button>
          <span class="pg-info num">{{ page() }} / {{ totalPages() }}</span>
          <button class="pg" [disabled]="page() >= totalPages()" (click)="load(page() + 1)">{{ t().common.next }} <sf-icon name="chevron-right" [size]="16" /></button>
        </nav>
      }
    }
  `,
  styles: `
    .bar { margin-bottom: 1.25rem; }
    .search { position: relative; max-width: 22rem; display: flex; align-items: center; }
    .search sf-icon { position: absolute; left: 0.8rem; color: var(--bean-400); }
    .search input { padding-left: 2.4rem; border-radius: var(--radius-pill); }
    .table { overflow: hidden; }
    .thead, .trow { display: grid; grid-template-columns: 2fr 1fr 0.7fr 0.8fr 1.1fr 2.5rem; gap: 0.75rem; align-items: center; padding: 0.85rem 1.1rem; }
    .thead { background: var(--cream-100); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--bean-500); font-weight: 700; }
    .trow { border-top: 1px solid var(--border); font-size: 0.9rem; }
    .trow.open { background: var(--cream-50); }
    .pname { font-weight: 600; }
    .star { padding: 0.2rem 0.4rem; }
    .exp { background: none; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); width: 2rem; height: 2rem; display: grid; place-items: center; cursor: pointer; color: var(--bean-700); transition: border-color 150ms ease, color 150ms ease; }
    .exp:hover { border-color: var(--bean-900); color: var(--bean-900); }
    .editor { border-top: 1px solid var(--border); padding: 1.1rem 1.25rem; background: var(--cream-50); }
    .toggles { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .tg { display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
    .tg input { width: auto; accent-color: var(--bean-900); }
    .vh { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--bean-500); margin: 0 0 0.7rem; }
    .variants { display: flex; flex-direction: column; gap: 0.6rem; }
    .vrow { display: grid; grid-template-columns: 4rem 1fr auto auto auto; gap: 0.75rem; align-items: center; }
    .vsize { font-weight: 600; font-size: 0.88rem; } .vsku { font-size: 0.78rem; }
    .vf { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.72rem; font-weight: 600; color: var(--bean-500); }
    .vf input { width: 6rem; padding: 0.4rem 0.6rem; }
    .empty { padding: 2.5rem; text-align: center; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
    .pg { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-pill); padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
    .pg:disabled { opacity: 0.4; cursor: not-allowed; }
    .pg-info { font-size: 0.85rem; color: var(--bean-500); }
    .sk-row { height: 3.2rem; border-radius: var(--radius-card); margin-bottom: 0.6rem; }
    .sk-edit { height: 8rem; border-radius: var(--radius-sm); }
    @media (max-width: 680px) {
      .thead, .trow { grid-template-columns: 2fr 0.9fr 1.1fr 2.5rem; }
      .hide-sm { display: none; }
      .vrow { grid-template-columns: 1fr 1fr; }
      .vsku { display: none; }
    }
  `
})
export class ProductsComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;

  protected readonly rows = signal<AdminProductListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected search = '';

  protected readonly expanded = signal<string | null>(null);
  protected readonly detail = signal<ProductDetail | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly editVariants = signal<ProductVariantDto[]>([]);
  protected editActive = true;
  protected editFeatured = false;
  protected readonly savingProduct = signal(false);
  protected readonly savingVariant = signal<string | null>(null);

  constructor() { void this.load(1); }

  protected async load(page: number) {
    this.loading.set(true); this.expanded.set(null);
    try {
      const res = await firstValueFrom(this.api.adminProducts(this.search || undefined, page));
      this.rows.set(res.items); this.page.set(res.page); this.totalPages.set(res.totalPages);
    } catch { this.toast.error(this.t().common.error); } finally { this.loading.set(false); }
  }

  protected async toggle(p: AdminProductListItem) {
    if (this.expanded() === p.id) { this.expanded.set(null); return; }
    this.expanded.set(p.id);
    this.detail.set(null); this.detailLoading.set(true);
    try {
      const d = await firstValueFrom(this.api.getProduct(p.slug));
      this.detail.set(d);
      this.editActive = p.isActive;
      this.editFeatured = p.isFeatured;
      this.editVariants.set(d.variants.map(v => ({ ...v })));
    } catch { this.toast.error(this.t().common.error); } finally { this.detailLoading.set(false); }
  }

  protected async saveProduct(d: ProductDetail) {
    if (this.savingProduct()) return;
    this.savingProduct.set(true);
    try {
      await firstValueFrom(this.api.adminUpdateProduct(d.id, {
        name: d.name, categoryId: d.categoryId, isActive: this.editActive, isFeatured: this.editFeatured,
        heroLabel: d.heroLabel, heroLabelEs: d.heroLabelEs, flavorNotes: d.flavorNotes, description: d.description,
        origin: d.origin, roast: d.roastLevel, process: d.process
      }));
      this.rows.update(rows => rows.map(r => r.id === d.id ? { ...r, isActive: this.editActive, isFeatured: this.editFeatured } : r));
      this.toast.success(this.t().admin.saved);
    } catch { this.toast.error(this.t().common.error); } finally { this.savingProduct.set(false); }
  }

  protected async saveVariant(v: ProductVariantDto) {
    if (this.savingVariant()) return;
    this.savingVariant.set(v.id);
    try {
      await firstValueFrom(this.api.adminUpdateVariant(v.id, { price: Number(v.price), stockQuantity: Number(v.stockQuantity) }));
      this.toast.success(this.t().admin.saved);
    } catch { this.toast.error(this.t().common.error); } finally { this.savingVariant.set(null); }
  }
}
