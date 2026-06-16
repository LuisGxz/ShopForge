import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CartStore } from '../../core/cart.store';
import { defaultGrind, hasGrind, toneClass } from '../../core/catalog.util';
import { parseApiError } from '../../core/api-error';
import { GRIND_OPTIONS } from '../../core/i18n';
import { LanguageService } from '../../core/language.service';
import { ProductDetail, ProductVariantDto, ReviewDto } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { WishlistStore } from '../../core/wishlist.store';
import { IconComponent } from '../../shared/icon.component';
import { StarsComponent } from '../../shared/stars.component';

@Component({
  selector: 'sf-product',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, DecimalPipe, IconComponent, StarsComponent],
  template: `
    @if (loading()) {
      <div class="container detail">
        <div class="gallery"><div class="main skeleton"></div></div>
        <div class="info">
          <div class="skeleton sk-line" style="width:40%"></div>
          <div class="skeleton sk-line big" style="width:80%"></div>
          <div class="skeleton sk-line" style="width:60%"></div>
          <div class="skeleton sk-block"></div>
        </div>
      </div>
    } @else if (notFound()) {
      <div class="container state">
        <span class="mark"><sf-icon name="coffee" [size]="28" /></span>
        <h1 class="serif">404</h1>
        <p class="muted">{{ isEs() ? 'No encontramos ese café.' : "We couldn't find that coffee." }}</p>
        <a routerLink="/shop" class="btn btn-primary btn-sm">{{ t().product.backToShop }}</a>
      </div>
    } @else if (product(); as p) {
      <div class="container detail fade-in">
        <!-- gallery -->
        <div class="gallery">
          <div class="main tone" [class]="toneClass(activeImage()?.tone ?? p.images[0]?.tone)" role="img"
            [attr.aria-label]="activeImage()?.altText">
            <span class="art-label">{{ activeImage()?.altText ?? p.name }}</span>
          </div>
          @if (p.images.length > 1) {
            <div class="thumbs">
              @for (img of p.images; track img.id) {
                <button class="thumb tone" [class]="toneClass(img.tone)" [class.on]="img.id === activeImageId()"
                  (click)="activeImageId.set(img.id)" [attr.aria-label]="img.altText"></button>
              }
            </div>
          }
        </div>

        <!-- info -->
        <div class="info">
          <a routerLink="/shop" [queryParams]="{ category: p.categorySlug }" class="back muted">{{ t().product.backToShop }}</a>
          @if (origin(); as o) { <p class="eyebrow">{{ o }}{{ p.altitudeMeters ? ' · ' + (p.altitudeMeters | number) + ' m' : '' }}</p> }
          <h1 class="serif title">{{ p.name }}</h1>

          <div class="rate-row">
            @if (p.reviewCount > 0) {
              <sf-stars [value]="p.averageRating" [size]="16" />
              <span class="num muted small">{{ p.averageRating.toFixed(1) }} · {{ p.reviewCount }} {{ t().common.reviews }}</span>
            } @else { <span class="muted small">{{ t().product.noReviews }}</span> }
          </div>

          <p class="desc">{{ description() }}</p>

          <div class="tags">
            <span class="chip">{{ lang.roast(p.roastLevel) }}</span>
            <span class="chip">{{ lang.process(p.process) }}</span>
            @if (p.region) { <span class="chip">{{ p.region }}</span> }
          </div>

          <!-- size -->
          <div class="picker">
            <p class="picker-label">{{ t().common.size }}</p>
            <div class="opts">
              @for (v of p.variants; track v.id) {
                <button class="opt num" [class.on]="v.id === variantId()" [disabled]="!v.inStock"
                  (click)="variantId.set(v.id)">
                  {{ lang.pick(v.size, v.sizeEs) }} — {{ v.price | currency }}
                  @if (!v.inStock) { <span class="oos">· {{ t().common.outOfStock }}</span> }
                </button>
              }
            </div>
          </div>

          <!-- grind -->
          @if (showGrind()) {
            <div class="picker">
              <p class="picker-label">{{ t().common.grind }}</p>
              <div class="opts">
                @for (g of grinds; track g) {
                  <button class="opt" [class.on]="g === grind()" (click)="grind.set(g)">{{ lang.grind(g) }}</button>
                }
              </div>
            </div>
          }

          <!-- qty + add -->
          <div class="buy">
            <div class="qty">
              <button (click)="setQty(qty() - 1)" [disabled]="qty() <= 1" aria-label="−"><sf-icon name="minus" [size]="16" /></button>
              <span class="num">{{ qty() }}</span>
              <button (click)="setQty(qty() + 1)" [disabled]="qty() >= maxQty()" aria-label="+"><sf-icon name="plus" [size]="16" /></button>
            </div>
            <button class="btn btn-accent add" (click)="addToBag()" [disabled]="adding() || !selectedVariant()?.inStock">
              @if (adding()) { <sf-icon name="flame" [size]="16" class="spin" /> {{ t().product.adding }} }
              @else if (!selectedVariant()?.inStock) { {{ t().common.outOfStock }} }
              @else { <sf-icon name="shopping-bag" [size]="16" /> {{ t().product.addToBag }} — {{ (selectedVariant()!.price * qty()) | currency }} }
            </button>
            @if (auth.isAuthenticated()) {
              <button class="wish" [class.on]="wishlist.has(p.id)" (click)="toggleWishlist()"
                [attr.aria-label]="wishlist.has(p.id) ? t().product.inWishlist : t().product.addToWishlist">
                <sf-icon name="heart" [size]="18" />
              </button>
            }
          </div>

          @if (selectedVariant(); as v) {
            @if (v.inStock && v.stockQuantity <= 8) { <p class="stock-note">{{ t().common.lowStock }} · {{ v.stockQuantity }}</p> }
          }
        </div>
      </div>

      <!-- reviews -->
      <section class="container reviews">
        <div class="rev-head">
          <h2 class="serif">{{ t().product.reviewsTitle }} @if (p.reviewCount) { <span class="muted num">· {{ p.reviewCount }}</span> }</h2>
        </div>

        <div class="rev-layout">
          <div class="rev-list">
            @if (reviewsLoading()) {
              @for (i of [1,2,3]; track i) { <div class="skeleton sk-rev"></div> }
            } @else if (reviews().length === 0) {
              <div class="rev-empty card">
                <sf-icon name="star" [size]="24" />
                <p class="serif">{{ t().product.noReviews }}</p>
                <p class="muted small">{{ t().product.noReviewsBody }}</p>
              </div>
            } @else {
              @for (r of reviews(); track r.id) {
                <figure class="rev card">
                  <div class="rev-top">
                    <span class="avatar">{{ initials(r.authorName) }}</span>
                    <figcaption>
                      <span class="rev-author">{{ r.authorName }}</span>
                      @if (r.isVerifiedPurchase) { <span class="verified"><sf-icon name="check" [size]="12" /> {{ t().common.verified }}</span> }
                    </figcaption>
                    <span class="rev-stars"><sf-stars [value]="r.rating" [size]="14" /></span>
                  </div>
                  @if (r.title) { <p class="rev-title">{{ r.title }}</p> }
                  <blockquote class="rev-body">{{ r.body }}</blockquote>
                  <time class="muted xsmall">{{ r.createdAtUtc | date:'mediumDate':undefined:lang.dateLocale() }}</time>
                </figure>
              }
              @if (reviewsTotalPages() > 1) {
                <nav class="pager">
                  <button class="pg" [disabled]="reviewsPage() <= 1" (click)="loadReviews(reviewsPage() - 1)"><sf-icon name="chevron-left" [size]="16" /> {{ t().common.prev }}</button>
                  <span class="pg-info num">{{ reviewsPage() }} / {{ reviewsTotalPages() }}</span>
                  <button class="pg" [disabled]="reviewsPage() >= reviewsTotalPages()" (click)="loadReviews(reviewsPage() + 1)">{{ t().common.next }} <sf-icon name="chevron-right" [size]="16" /></button>
                </nav>
              }
            }
          </div>

          <!-- write review -->
          <aside class="rev-form card">
            <h3 class="serif">{{ t().product.writeReview }}</h3>
            @if (!auth.isAuthenticated()) {
              <p class="muted small">{{ t().product.signInToReview }}</p>
              <a routerLink="/auth/login" [queryParams]="{ returnUrl: '/product/' + p.slug }" class="btn btn-ghost btn-sm">{{ t().header.signIn }}</a>
            } @else if (reviewDone()) {
              <div class="thanks"><sf-icon name="check" [size]="20" /><p>{{ t().product.reviewThanks }}</p></div>
            } @else {
              @if (reviewErrors().length) { <div class="error-panel" role="alert"><ul>@for (e of reviewErrors(); track e) { <li>{{ e }}</li> }</ul></div> }
              <div class="field">
                <span class="label">{{ t().product.yourRating }}</span>
                <div class="star-pick">
                  @for (s of [1,2,3,4,5]; track s) {
                    <button type="button" (click)="newRating.set(s)" [class.lit]="s <= newRating()" [attr.aria-label]="s + '★'">
                      <sf-icon name="star" [size]="22" />
                    </button>
                  }
                </div>
              </div>
              <div class="field">
                <label for="rtitle">{{ t().product.reviewTitle }} <span class="muted">({{ t().common.optional }})</span></label>
                <input id="rtitle" [(ngModel)]="newTitle" maxlength="120" [placeholder]="t().product.reviewTitlePh" />
              </div>
              <div class="field">
                <label for="rbody">{{ t().product.reviewBody }}</label>
                <textarea id="rbody" [(ngModel)]="newBody" rows="4" maxlength="1500" [placeholder]="t().product.reviewBodyPh"></textarea>
              </div>
              <button class="btn btn-primary btn-block" (click)="submitReview()" [disabled]="submittingReview() || newRating() === 0 || !newBody.trim()">
                @if (submittingReview()) { <sf-icon name="flame" [size]="16" class="spin" /> {{ t().product.submitting }} }
                @else { {{ t().product.submit }} }
              </button>
            }
          </aside>
        </div>
      </section>
    }
  `,
  styles: `
    .detail { display: grid; gap: 2.5rem; padding-block: 2rem 1rem; }
    @media (min-width: 900px) { .detail { grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; } }
    .gallery { position: sticky; top: 5rem; }
    .main { aspect-ratio: 1; border-radius: var(--radius-lg); }
    .art-label { position: absolute; bottom: 0.7rem; left: 0.9rem; font-family: monospace; font-size: 0.65rem; color: rgba(255,255,255,0.75); }
    .thumbs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; margin-top: 0.6rem; }
    .thumb { aspect-ratio: 1; border-radius: var(--radius-sm); border: none; cursor: pointer; opacity: 0.65; transition: opacity 150ms ease, outline 150ms ease; outline: 2px solid transparent; outline-offset: 2px; }
    .thumb:hover { opacity: 1; }
    .thumb.on { opacity: 1; outline-color: var(--bean-900); }
    .back { display: inline-block; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .back:hover { color: var(--copper-600); }
    .title { font-size: clamp(2rem, 4vw, 2.8rem); line-height: 1.1; margin: 0.3rem 0 0.6rem; }
    .rate-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
    .small { font-size: 0.85rem; } .xsmall { font-size: 0.78rem; } .num.small {}
    .desc { color: var(--bean-700); margin-bottom: 1.25rem; max-width: 34rem; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .picker { margin-bottom: 1.25rem; }
    .picker-label { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; }
    .opts { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .opt { background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-pill);
      padding: 0.55rem 1.1rem; font-size: 0.88rem; font-weight: 600; cursor: pointer; color: var(--bean-900);
      transition: border-color 150ms ease, background 150ms ease, color 150ms ease; }
    .opt:hover:not(:disabled) { border-color: var(--bean-900); }
    .opt.on { background: var(--bean-900); color: var(--cream-50); border-color: var(--bean-900); }
    .opt:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
    .opt .oos { font-weight: 500; }
    .buy { display: flex; gap: 0.75rem; align-items: stretch; margin-top: 1.5rem; }
    .qty { display: flex; align-items: center; border: 1px solid var(--border-strong); border-radius: var(--radius-pill); }
    .qty button { width: 2.75rem; height: 100%; min-height: 44px; background: none; border: none; cursor: pointer; display: grid; place-items: center; color: var(--bean-900); transition: color 140ms ease; }
    .qty button:hover:not(:disabled) { color: var(--copper-600); }
    .qty button:disabled { opacity: 0.35; cursor: not-allowed; }
    .qty span { width: 2rem; text-align: center; font-weight: 700; }
    .add { flex: 1; }
    .wish { width: 3rem; border: 1px solid var(--border-strong); border-radius: var(--radius-pill); background: var(--surface); cursor: pointer; display: grid; place-items: center; color: var(--bean-700); transition: all 150ms ease; }
    .wish:hover { border-color: var(--copper-600); color: var(--copper-600); }
    .wish.on { color: var(--copper-600); border-color: var(--copper-400); }
    .wish.on sf-icon { fill: var(--copper-600); }
    .stock-note { color: var(--warn); font-size: 0.85rem; font-weight: 600; margin-top: 0.75rem; }

    .reviews { padding-block: 2.5rem 4rem; }
    .rev-head { margin-bottom: 1.5rem; } .rev-head h2 { font-size: 1.8rem; }
    .rev-layout { display: grid; gap: 2rem; align-items: start; }
    @media (min-width: 900px) { .rev-layout { grid-template-columns: 1fr 20rem; } }
    .rev-list { display: flex; flex-direction: column; gap: 1rem; }
    .rev { padding: 1.25rem 1.4rem; }
    .rev-top { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.5rem; }
    .avatar { width: 2.1rem; height: 2.1rem; border-radius: var(--radius-pill); background: var(--leaf-soft); color: var(--leaf-600); display: grid; place-items: center; font-size: 0.75rem; font-weight: 700; }
    figcaption { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .rev-author { font-weight: 600; font-size: 0.92rem; }
    .verified { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.72rem; font-weight: 600; color: var(--leaf-600); }
    .rev-stars { margin-left: auto; }
    .rev-title { font-weight: 700; margin: 0.2rem 0 0.3rem; }
    .rev-body { margin: 0 0 0.5rem; color: var(--bean-700); font-size: 0.92rem; }
    .rev-empty { padding: 2rem; text-align: center; display: grid; place-items: center; gap: 0.4rem; color: var(--copper-500); }
    .rev-form { padding: 1.4rem; position: sticky; top: 5rem; }
    .rev-form h3 { font-size: 1.3rem; margin-bottom: 0.9rem; }
    .star-pick { display: flex; gap: 0.15rem; }
    .star-pick button { background: none; border: none; cursor: pointer; color: var(--cream-200); padding: 0.1rem; transition: color 120ms ease, transform 120ms ease; }
    .star-pick button:hover { transform: scale(1.12); }
    .star-pick button.lit { color: var(--copper-500); }
    .star-pick button.lit sf-icon { fill: var(--copper-500); }
    .thanks { display: grid; place-items: center; gap: 0.5rem; padding: 1rem 0; text-align: center; color: var(--leaf-600); }
    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem; }
    .pg { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-pill); padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; color: var(--bean-900); }
    .pg:disabled { opacity: 0.4; cursor: not-allowed; }
    .pg-info { font-size: 0.85rem; color: var(--bean-500); }
    .state { min-height: 50vh; display: grid; place-content: center; justify-items: center; text-align: center; gap: 0.75rem; }
    .state .mark { width: 3.5rem; height: 3.5rem; border-radius: var(--radius-pill); background: var(--bean-900); color: var(--copper-400); display: grid; place-items: center; }
    .sk-line { height: 1rem; border-radius: 4px; margin-bottom: 0.6rem; } .sk-line.big { height: 2.4rem; }
    .sk-block { height: 12rem; border-radius: var(--radius-card); margin-top: 1rem; }
    .sk-rev { height: 7rem; border-radius: var(--radius-card); }
  `
})
export class ProductComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(CartStore);
  private readonly toast = inject(ToastService);
  protected readonly lang = inject(LanguageService);
  protected readonly auth = inject(AuthService);
  protected readonly wishlist = inject(WishlistStore);
  protected readonly t = this.lang.t;
  protected readonly isEs = this.lang.isEs;
  protected readonly toneClass = toneClass;
  protected readonly grinds = GRIND_OPTIONS;

  protected readonly product = signal<ProductDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly variantId = signal<string | null>(null);
  protected readonly grind = signal<string>('Whole bean');
  protected readonly qty = signal(1);
  protected readonly adding = signal(false);
  protected readonly activeImageId = signal<string | null>(null);

  protected readonly reviews = signal<ReviewDto[]>([]);
  protected readonly reviewsLoading = signal(true);
  protected readonly reviewsPage = signal(1);
  protected readonly reviewsTotalPages = signal(1);
  protected readonly newRating = signal(0);
  protected newTitle = '';
  protected newBody = '';
  protected readonly submittingReview = signal(false);
  protected readonly reviewDone = signal(false);
  protected readonly reviewErrors = signal<string[]>([]);

  protected readonly selectedVariant = computed<ProductVariantDto | undefined>(() =>
    this.product()?.variants.find(v => v.id === this.variantId()));
  protected readonly activeImage = computed(() =>
    this.product()?.images.find(i => i.id === this.activeImageId()) ?? this.product()?.images[0]);
  protected readonly maxQty = computed(() => Math.min(20, this.selectedVariant()?.stockQuantity ?? 20));
  protected readonly showGrind = computed(() => hasGrind(this.product()?.categorySlug ?? ''));

  protected origin() { const p = this.product()!; return this.lang.pick(p.origin, p.originEs); }
  protected description() { const p = this.product()!; return this.lang.pick(p.description, p.descriptionEs); }

  constructor() {
    this.route.paramMap.subscribe(pm => { void this.load(pm.get('slug') ?? ''); });
  }

  private async load(slug: string) {
    this.loading.set(true); this.notFound.set(false); this.product.set(null);
    try {
      const p = await firstValueFrom(this.api.getProduct(slug));
      this.product.set(p);
      const firstInStock = p.variants.find(v => v.inStock) ?? p.variants[0];
      this.variantId.set(firstInStock?.id ?? null);
      this.grind.set(defaultGrind(p.categorySlug));
      this.qty.set(1);
      this.activeImageId.set(p.images[0]?.id ?? null);
      this.reviewDone.set(false); this.reviewErrors.set([]);
      this.newRating.set(0); this.newTitle = ''; this.newBody = '';
      void this.loadReviews(1);
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected async loadReviews(page: number) {
    const slug = this.product()?.slug; if (!slug) return;
    this.reviewsLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.getReviews(slug, page));
      this.reviews.set(res.items);
      this.reviewsPage.set(res.page);
      this.reviewsTotalPages.set(res.totalPages);
    } catch { /* keep prior */ } finally { this.reviewsLoading.set(false); }
  }

  protected setQty(n: number) { this.qty.set(Math.max(1, Math.min(this.maxQty(), n))); }

  protected async addToBag() {
    const p = this.product(); const v = this.selectedVariant();
    if (!p || !v || !v.inStock || this.adding()) return;
    this.adding.set(true);
    try {
      await this.cart.add({
        productVariantId: v.id, grind: this.grind(), quantity: this.qty(),
        productId: p.id, productSlug: p.slug, productName: p.name, variantSize: v.size,
        unitPrice: v.price, imageUrl: this.activeImage()?.url, imageTone: this.activeImage()?.tone,
        availableStock: v.stockQuantity
      });
      this.toast.success(this.t().common.added + ' · ' + p.name);
    } catch {
      this.toast.error(this.t().common.error);
    } finally {
      this.adding.set(false);
    }
  }

  protected async toggleWishlist() {
    const p = this.product(); if (!p) return;
    try { await this.wishlist.toggle(p.id); }
    catch { this.toast.error(this.t().common.error); }
  }

  protected async submitReview() {
    const p = this.product();
    if (!p || this.submittingReview() || this.newRating() === 0 || !this.newBody.trim()) return;
    this.submittingReview.set(true); this.reviewErrors.set([]);
    try {
      await firstValueFrom(this.api.createReview(p.slug, {
        rating: this.newRating(), title: this.newTitle.trim() || undefined, body: this.newBody.trim()
      }));
      this.reviewDone.set(true);
      this.toast.success(this.t().product.reviewThanks);
      const fresh = await firstValueFrom(this.api.getProduct(p.slug));
      this.product.set(fresh);
      void this.loadReviews(1);
    } catch (e) {
      this.reviewErrors.set(parseApiError(e, this.t().common.error));
    } finally {
      this.submittingReview.set(false);
    }
  }

  protected initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
