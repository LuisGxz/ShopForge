import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartStore } from '../core/cart.store';
import { LanguageService } from '../core/language.service';
import { ProductListItem } from '../core/models';
import { ToastService } from '../core/toast.service';
import { defaultGrind, toneClass } from '../core/catalog.util';
import { WishlistStore } from '../core/wishlist.store';
import { IconComponent } from './icon.component';
import { StarsComponent } from './stars.component';

/** Catalog product card — image tone, origin, notes, price, rating, quick-add and wishlist heart. */
@Component({
  selector: 'sf-product-card',
  imports: [RouterLink, CurrencyPipe, IconComponent, StarsComponent],
  template: `
    <article class="card-pc fade-in">
      <a [routerLink]="['/product', p().slug]" class="art-link">
        <div class="art tone" [class]="toneClass(p().imageTone)">
          @if (heroLabel(); as hl) { <span class="hero-chip">{{ hl }}</span> }
          @if (!p().inStock) { <span class="oos-chip">{{ t().common.outOfStock }}</span> }
          <span class="art-label">{{ p().name }}</span>
        </div>
      </a>

      @if (auth.isAuthenticated()) {
        <button class="heart" [class.on]="wishlist.has(p().id)" (click)="toggleWishlist($event)"
          [attr.aria-label]="wishlist.has(p().id) ? t().product.inWishlist : t().product.addToWishlist">
          <sf-icon name="heart" [size]="17" />
        </button>
      }

      @if (p().inStock) {
        <button class="quick" (click)="quickAdd($event)" [disabled]="adding()" [attr.aria-label]="t().common.addToBag">
          <sf-icon [name]="adding() ? 'flame' : 'plus'" [size]="18" [class.spin]="adding()" />
        </button>
      }

      <div class="meta">
        @if (origin(); as o) { <p class="eyebrow">{{ o }}</p> }
        <a [routerLink]="['/product', p().slug]" class="name serif">{{ p().name }}</a>
        <p class="notes muted">{{ notes() }}</p>
        <div class="row">
          <p class="price num">{{ p().fromPrice | currency }} <span class="per">/ {{ size() }}</span></p>
          @if (p().reviewCount > 0) {
            <span class="rating"><sf-stars [value]="p().averageRating" [size]="13" /><span class="num rc">{{ p().averageRating.toFixed(1) }}</span></span>
          }
        </div>
      </div>
    </article>
  `,
  styles: `
    .card-pc { position: relative; }
    .art-link { display: block; }
    .art { display: block; border-radius: var(--radius-card); aspect-ratio: 4/5; transition: transform 300ms ease, box-shadow 300ms ease; }
    .art-link:hover .art { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .art-label { position: absolute; bottom: 0.55rem; left: 0.7rem; right: 0.7rem; font-family: monospace; font-size: 0.6rem;
      color: rgba(255,255,255,0.7); letter-spacing: 0.04em; text-transform: lowercase; }
    .hero-chip { position: absolute; top: 0.7rem; left: 0.7rem; background: rgba(251,247,241,0.95); color: var(--bean-900);
      font-size: 0.68rem; font-weight: 700; border-radius: var(--radius-pill); padding: 0.25rem 0.7rem; }
    .oos-chip { position: absolute; top: 0.7rem; left: 0.7rem; background: var(--bean-900); color: var(--cream-100);
      font-size: 0.68rem; font-weight: 700; border-radius: var(--radius-pill); padding: 0.25rem 0.7rem; }
    .heart { position: absolute; top: 0.6rem; right: 0.6rem; width: 2.1rem; height: 2.1rem; border-radius: var(--radius-pill);
      background: rgba(251,247,241,0.92); border: none; cursor: pointer; display: grid; place-items: center; color: var(--bean-700);
      transition: transform 140ms ease, color 140ms ease, background 140ms ease; }
    .heart:hover { transform: scale(1.08); color: var(--copper-600); }
    .heart.on { color: var(--copper-600); }
    .heart.on sf-icon { fill: var(--copper-600); }
    .quick { position: absolute; right: 0.7rem; top: calc(80% - 1.4rem); width: 2.75rem; height: 2.75rem; border-radius: var(--radius-pill);
      background: var(--cream-50); color: var(--bean-900); border: none; cursor: pointer; display: grid; place-items: center;
      box-shadow: var(--shadow-sm); opacity: 0; transform: translateY(6px); transition: all 280ms ease; }
    .card-pc:hover .quick, .quick:focus-visible { opacity: 1; transform: none; }
    .quick:hover:not(:disabled) { background: var(--copper-600); color: #fff; }
    .meta { padding-top: 0.75rem; }
    .name { display: block; font-size: 1.25rem; line-height: 1.15; margin: 0.15rem 0; color: var(--bean-900); transition: color 150ms ease; }
    .name:hover { color: var(--copper-600); }
    .notes { font-size: 0.85rem; margin: 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.55rem; }
    .price { font-weight: 600; font-size: 0.95rem; }
    .per { color: var(--bean-400); font-weight: 400; font-size: 0.82rem; }
    .rating { display: inline-flex; align-items: center; gap: 0.3rem; }
    .rc { font-size: 0.8rem; color: var(--bean-500); }
    @media (hover: none) { .quick { opacity: 1; transform: none; } }
  `
})
export class ProductCardComponent {
  readonly p = input.required<ProductListItem>();

  private readonly api = inject(ApiService);
  private readonly cart = inject(CartStore);
  private readonly toast = inject(ToastService);
  private readonly lang = inject(LanguageService);
  protected readonly auth = inject(AuthService);
  protected readonly wishlist = inject(WishlistStore);

  protected readonly t = this.lang.t;
  protected readonly adding = signal(false);
  protected readonly toneClass = toneClass;

  protected origin() { return this.lang.pick(this.p().origin, this.p().originEs); }
  protected notes() { return this.lang.pick(this.p().flavorNotes, this.p().flavorNotesEs); }
  protected heroLabel() { return this.lang.pick(this.p().heroLabel, this.p().heroLabelEs); }
  protected size() { return this.p().categorySlug === 'coffee' ? '12 oz' : (this.lang.isEs() ? 'unidad' : 'each'); }

  protected async toggleWishlist(ev: Event) {
    ev.preventDefault(); ev.stopPropagation();
    try { await this.wishlist.toggle(this.p().id); }
    catch { this.toast.error(this.t().common.error); }
  }

  /** Adds the cheapest in-stock variant with a sensible default grind. */
  protected async quickAdd(ev: Event) {
    ev.preventDefault(); ev.stopPropagation();
    if (this.adding()) return;
    this.adding.set(true);
    try {
      const detail = await firstValueFrom(this.api.getProduct(this.p().slug));
      const variant = detail.variants.filter(v => v.inStock).sort((a, b) => a.price - b.price)[0];
      if (!variant) { this.toast.error(this.t().common.outOfStock); return; }
      await this.cart.add({
        productVariantId: variant.id, grind: defaultGrind(detail.categorySlug), quantity: 1,
        productId: detail.id, productSlug: detail.slug, productName: detail.name,
        variantSize: variant.size, unitPrice: variant.price,
        imageUrl: detail.images[0]?.url, imageTone: detail.images[0]?.tone, availableStock: variant.stockQuantity
      });
      this.toast.success(this.t().common.added + ' · ' + detail.name);
    } catch {
      this.toast.error(this.t().common.error);
    } finally {
      this.adding.set(false);
    }
  }
}
