import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartStore } from '../../core/cart.store';
import { CheckoutStore, FREE_SHIPPING_THRESHOLD } from '../../core/checkout.store';
import { toneClass } from '../../core/catalog.util';
import { LanguageService } from '../../core/language.service';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-cart',
  imports: [FormsModule, RouterLink, CurrencyPipe, IconComponent],
  template: `
    <div class="container cart fade-in">
      <h1 class="serif">{{ t().cart.title }}</h1>

      @if (items().length === 0) {
        <div class="empty card">
          <span class="mark"><sf-icon name="shopping-bag" [size]="28" /></span>
          <h2 class="serif">{{ t().cart.emptyTitle }}</h2>
          <p class="muted">{{ t().cart.emptyBody }}</p>
          <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="btn btn-primary btn-sm">{{ t().cart.startShopping }}</a>
        </div>
      } @else {
        <div class="layout">
          <ul class="lines">
            @for (it of items(); track it.id) {
              <li class="line card">
                <a [routerLink]="['/product', it.productSlug]" class="thumb tone" [class]="toneClass(it.imageTone)" [attr.aria-label]="it.productName"></a>
                <div class="body">
                  <a [routerLink]="['/product', it.productSlug]" class="name serif">{{ it.productName }}</a>
                  <p class="muted variant">{{ it.variantSize }} · {{ lang.grind(it.grind) }}</p>
                  <p class="unit num muted">{{ it.unitPrice | currency }} {{ t().product.perItem }}</p>
                  <button class="rm" (click)="remove(it.id)"><sf-icon name="trash" [size]="14" /> {{ t().cart.remove }}</button>
                </div>
                <div class="right">
                  <div class="qty">
                    <button (click)="update(it.id, it.quantity - 1)" [disabled]="busy() || it.quantity <= 1" aria-label="−"><sf-icon name="minus" [size]="14" /></button>
                    <span class="num">{{ it.quantity }}</span>
                    <button (click)="update(it.id, it.quantity + 1)" [disabled]="busy() || it.quantity >= maxFor(it.availableStock)" aria-label="+"><sf-icon name="plus" [size]="14" /></button>
                  </div>
                  <p class="line-total num">{{ it.lineTotal | currency }}</p>
                </div>
              </li>
            }
          </ul>

          <aside class="summary card">
            <h2 class="serif">{{ t().cart.orderSummary }}</h2>

            <div class="coupon">
              @if (coupon.coupon(); as c) {
                <div class="coupon-on">
                  <span class="chip"><sf-icon name="tag" [size]="13" /> {{ c.code }} {{ t().cart.couponApplied }}</span>
                  <button class="link-btn" (click)="removeCoupon()">{{ t().common.remove }}</button>
                </div>
              } @else {
                <div class="coupon-row">
                  <input type="text" [(ngModel)]="couponCode" [placeholder]="t().cart.couponPlaceholder" (keyup.enter)="applyCoupon()" [attr.aria-label]="t().cart.couponPlaceholder" />
                  <button class="btn btn-ghost btn-sm" (click)="applyCoupon()" [disabled]="couponBusy() || !couponCode.trim()">{{ t().common.apply }}</button>
                </div>
                @if (couponError()) { <p class="form-error">{{ couponError() }}</p> }
              }
            </div>

            <dl class="totals">
              <div><dt>{{ t().common.subtotal }}</dt><dd class="num">{{ totals().subtotal | currency }}</dd></div>
              <div><dt>{{ t().cart.estShipping }}</dt><dd class="num">{{ totals().shipping === 0 ? t().common.free : (totals().shipping | currency) }}</dd></div>
              @if (totals().discount > 0) { <div class="disc"><dt>{{ t().common.discount }}</dt><dd class="num">−{{ totals().discount | currency }}</dd></div> }
              <div class="grand"><dt>{{ t().common.total }}</dt><dd class="num">{{ totals().total | currency }}</dd></div>
            </dl>

            @if (totals().subtotal < freeThreshold && totals().subtotal > 0) {
              <div class="ship-progress">
                <div class="bar"><span [style.width.%]="freePct()"></span></div>
                <p class="muted xsmall">{{ (freeThreshold - totals().subtotal) | currency }} {{ t().cart.freeShippingHint }}</p>
              </div>
            }

            @if (auth.isAuthenticated()) {
              <a routerLink="/checkout" class="btn btn-accent btn-block checkout">{{ t().cart.checkout }} <sf-icon name="arrow-right" [size]="16" /></a>
            } @else {
              <a routerLink="/auth/login" [queryParams]="{ returnUrl: '/checkout' }" class="btn btn-accent btn-block checkout">{{ t().cart.signInToCheckout }}</a>
            }
            <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="keep">{{ t().confirmation.keepShopping }}</a>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .cart { padding-block: 2rem 4rem; }
    .cart > h1 { font-size: clamp(2rem, 4vw, 2.6rem); margin-bottom: 1.5rem; }
    .empty { display: grid; place-items: center; gap: 0.75rem; text-align: center; padding: 3.5rem 1.5rem; }
    .empty .mark { width: 3.5rem; height: 3.5rem; border-radius: var(--radius-pill); background: var(--cream-100); color: var(--copper-600); display: grid; place-items: center; }
    .empty h2 { font-size: 1.6rem; }
    .layout { display: grid; gap: 1.5rem; align-items: start; }
    @media (min-width: 880px) { .layout { grid-template-columns: 1fr 21rem; } }
    .lines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
    .line { display: grid; grid-template-columns: 5rem 1fr auto; gap: 1rem; padding: 1rem; align-items: start; }
    .thumb { width: 5rem; height: 5rem; border-radius: var(--radius-sm); display: block; }
    .body { min-width: 0; }
    .name { display: block; font-size: 1.15rem; line-height: 1.1; color: var(--bean-900); }
    .name:hover { color: var(--copper-600); }
    .variant { font-size: 0.85rem; margin: 0.2rem 0; }
    .unit { font-size: 0.82rem; margin: 0; }
    .rm { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; cursor: pointer; color: var(--bean-400); font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0 0; transition: color 140ms ease; }
    .rm:hover { color: var(--danger); }
    .right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.6rem; }
    .qty { display: flex; align-items: center; border: 1px solid var(--border-strong); border-radius: var(--radius-pill); }
    .qty button { width: 2.1rem; height: 2.1rem; background: none; border: none; cursor: pointer; display: grid; place-items: center; color: var(--bean-900); transition: color 140ms ease; }
    .qty button:hover:not(:disabled) { color: var(--copper-600); }
    .qty button:disabled { opacity: 0.35; cursor: not-allowed; }
    .qty span { width: 1.8rem; text-align: center; font-weight: 700; font-size: 0.9rem; }
    .line-total { font-weight: 700; }
    .summary { padding: 1.4rem; position: sticky; top: 5rem; }
    .summary > h2 { font-size: 1.4rem; margin-bottom: 1rem; }
    .coupon { padding-bottom: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .coupon-row { display: flex; gap: 0.5rem; }
    .coupon-row input { flex: 1; }
    .coupon-on { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .link-btn { background: none; border: none; cursor: pointer; color: var(--bean-400); font-size: 0.82rem; font-weight: 600; }
    .link-btn:hover { color: var(--danger); }
    .totals { margin: 0 0 1rem; display: flex; flex-direction: column; gap: 0.55rem; }
    .totals div { display: flex; justify-content: space-between; font-size: 0.92rem; }
    .totals dt { color: var(--bean-500); } .totals dd { margin: 0; font-weight: 600; }
    .totals .disc dd { color: var(--copper-600); }
    .grand { border-top: 1px solid var(--border); padding-top: 0.7rem; margin-top: 0.2rem; }
    .grand dt, .grand dd { font-size: 1.05rem; font-weight: 700; color: var(--bean-900); }
    .ship-progress { margin-bottom: 1rem; }
    .bar { height: 6px; background: var(--cream-200); border-radius: 999px; overflow: hidden; margin-bottom: 0.4rem; }
    .bar span { display: block; height: 100%; background: var(--copper-500); border-radius: 999px; transition: width 300ms ease; }
    .xsmall { font-size: 0.78rem; }
    .checkout { margin-bottom: 0.75rem; }
    .keep { display: block; text-align: center; font-size: 0.85rem; font-weight: 600; color: var(--copper-600); }
  `
})
export class CartComponent {
  protected readonly cart = inject(CartStore);
  protected readonly coupon = inject(CheckoutStore);
  protected readonly auth = inject(AuthService);
  protected readonly lang = inject(LanguageService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly t = this.lang.t;
  protected readonly toneClass = toneClass;
  protected readonly freeThreshold = FREE_SHIPPING_THRESHOLD;

  protected readonly items = computed(() => this.cart.cart()?.items ?? []);
  protected readonly busy = this.cart.busy;
  protected readonly totals = computed(() => this.coupon.totals(this.cart.subtotal()));
  protected readonly freePct = computed(() => Math.min(100, (this.totals().subtotal / this.freeThreshold) * 100));

  protected couponCode = '';
  protected readonly couponBusy = signal(false);
  protected readonly couponError = signal('');

  protected maxFor(stock: number) { return Math.min(20, stock || 20); }

  protected async update(id: string, qty: number) {
    if (qty < 1) return;
    try { await this.cart.update(id, qty); await this.coupon.revalidate(this.cart.subtotal()); }
    catch { this.toast.error(this.t().common.error); }
  }

  protected async remove(id: string) {
    try { await this.cart.remove(id); await this.coupon.revalidate(this.cart.subtotal()); }
    catch { this.toast.error(this.t().common.error); }
  }

  protected async applyCoupon() {
    const code = this.couponCode.trim();
    if (!code || this.couponBusy()) return;
    this.couponBusy.set(true); this.couponError.set('');
    try {
      const res = await this.coupon.applyCoupon(code, this.cart.subtotal());
      if (res.isValid) { this.toast.success(res.code + ' ' + this.t().cart.couponApplied); this.couponCode = ''; }
      else this.couponError.set(res.message || this.t().cart.couponInvalid);
    } catch {
      this.couponError.set(this.t().cart.couponInvalid);
    } finally {
      this.couponBusy.set(false);
    }
  }

  protected removeCoupon() { this.coupon.clearCoupon(); }
}
