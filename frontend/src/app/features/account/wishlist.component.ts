import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../core/cart.store';
import { defaultGrind, toneClass } from '../../core/catalog.util';
import { LanguageService } from '../../core/language.service';
import { ToastService } from '../../core/toast.service';
import { WishlistStore } from '../../core/wishlist.store';
import { IconComponent } from '../../shared/icon.component';
import { StarsComponent } from '../../shared/stars.component';

@Component({
  selector: 'sf-wishlist',
  imports: [RouterLink, CurrencyPipe, IconComponent, StarsComponent],
  template: `
    <div class="container wl fade-in">
      <h1 class="serif">{{ t().wishlist.title }}</h1>

      @if (loading()) {
        <div class="grid">@for (i of [1,2,3]; track i) { <div class="skeleton sk-card"></div> }</div>
      } @else if (items().length === 0) {
        <div class="state card">
          <span class="mark"><sf-icon name="heart" [size]="26" /></span>
          <h2 class="serif">{{ t().wishlist.empty }}</h2>
          <p class="muted">{{ t().wishlist.emptyBody }}</p>
          <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="btn btn-primary btn-sm">{{ t().wishlist.browse }}</a>
        </div>
      } @else {
        <div class="grid">
          @for (w of items(); track w.productId) {
            <article class="wcard card">
              <a [routerLink]="['/product', w.slug]" class="art tone" [class]="toneClass(w.imageTone)" [attr.aria-label]="w.name">
                @if (!w.inStock) { <span class="oos-chip">{{ t().common.outOfStock }}</span> }
              </a>
              <button class="heart on" (click)="remove(w.productId)" [attr.aria-label]="t().common.remove"><sf-icon name="heart" [size]="16" /></button>
              <div class="meta">
                @if (origin(w); as o) { <p class="eyebrow">{{ o }}</p> }
                <a [routerLink]="['/product', w.slug]" class="name serif">{{ w.name }}</a>
                <div class="row">
                  <span class="num price">{{ w.fromPrice | currency }}</span>
                  @if (w.reviewCount > 0) { <span class="rating"><sf-stars [value]="w.averageRating" [size]="12" /></span> }
                </div>
                <button class="btn btn-ghost btn-sm add" (click)="addToBag(w.slug, w.productId)" [disabled]="!w.inStock || adding() === w.productId">
                  @if (adding() === w.productId) { <sf-icon name="flame" [size]="14" class="spin" /> } @else { <sf-icon name="shopping-bag" [size]="14" /> {{ t().wishlist.moveToBag }} }
                </button>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .wl { padding-block: 2rem 4rem; }
    .wl > h1 { font-size: clamp(1.9rem, 4vw, 2.4rem); margin-bottom: 1.5rem; }
    .grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
    @media (min-width: 560px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 920px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    .wcard { position: relative; padding: 0.7rem; }
    .art { display: block; aspect-ratio: 4/3; border-radius: var(--radius-sm); }
    .oos-chip { position: absolute; top: 0.6rem; left: 0.6rem; background: var(--bean-900); color: var(--cream-100); font-size: 0.68rem; font-weight: 700; border-radius: var(--radius-pill); padding: 0.2rem 0.6rem; }
    .heart { position: absolute; top: 1rem; right: 1rem; width: 2.1rem; height: 2.1rem; border-radius: var(--radius-pill); background: rgba(251,247,241,0.92); border: none; cursor: pointer; display: grid; place-items: center; color: var(--copper-600); transition: transform 140ms ease; }
    .heart:hover { transform: scale(1.1); }
    .heart sf-icon { fill: var(--copper-600); }
    .meta { padding: 0.75rem 0.4rem 0.4rem; }
    .name { display: block; font-size: 1.15rem; line-height: 1.15; margin: 0.15rem 0 0.5rem; color: var(--bean-900); }
    .name:hover { color: var(--copper-600); }
    .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .price { font-weight: 700; }
    .add { width: 100%; }
    .state { display: grid; place-items: center; gap: 0.75rem; text-align: center; padding: 3rem 1.5rem; }
    .state .mark { width: 3.25rem; height: 3.25rem; border-radius: var(--radius-pill); background: var(--cream-100); color: var(--copper-600); display: grid; place-items: center; }
    .state h2 { font-size: 1.5rem; }
    .sk-card { height: 16rem; border-radius: var(--radius-card); }
  `
})
export class WishlistComponent {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartStore);
  private readonly toast = inject(ToastService);
  protected readonly store = inject(WishlistStore);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  protected readonly toneClass = toneClass;

  protected readonly items = this.store.items;
  protected readonly loading = signal(true);
  protected readonly adding = signal<string | null>(null);

  constructor() { void this.init(); }

  private async init() {
    this.loading.set(true);
    await this.store.load();
    this.loading.set(false);
  }

  protected origin(w: { origin?: string; originEs?: string }) { return this.lang.pick(w.origin, w.originEs); }

  protected async remove(productId: string) {
    try { await this.store.toggle(productId); }
    catch { this.toast.error(this.t().common.error); }
  }

  protected async addToBag(slug: string, productId: string) {
    if (this.adding()) return;
    this.adding.set(productId);
    try {
      const detail = await firstValueFrom(this.api.getProduct(slug));
      const variant = detail.variants.filter(v => v.inStock).sort((a, b) => a.price - b.price)[0];
      if (!variant) { this.toast.error(this.t().common.outOfStock); return; }
      await this.cart.add({
        productVariantId: variant.id, grind: defaultGrind(detail.categorySlug), quantity: 1,
        productId: detail.id, productSlug: detail.slug, productName: detail.name, variantSize: variant.size,
        unitPrice: variant.price, imageUrl: detail.images[0]?.url, imageTone: detail.images[0]?.tone,
        availableStock: variant.stockQuantity
      });
      this.toast.success(this.t().common.added + ' · ' + detail.name);
    } catch {
      this.toast.error(this.t().common.error);
    } finally {
      this.adding.set(null);
    }
  }
}
