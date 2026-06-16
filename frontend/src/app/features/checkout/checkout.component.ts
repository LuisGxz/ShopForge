import { CurrencyPipe } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CartStore } from '../../core/cart.store';
import { CheckoutStore } from '../../core/checkout.store';
import { toneClass } from '../../core/catalog.util';
import { parseApiError } from '../../core/api-error';
import { LanguageService } from '../../core/language.service';
import { CheckoutIntentResult, ShippingAddressInput } from '../../core/models';
import { getStripe } from '../../core/stripe.util';
import { IconComponent } from '../../shared/icon.component';

type Step = 'shipping' | 'payment' | 'review';

@Component({
  selector: 'sf-checkout',
  imports: [FormsModule, RouterLink, CurrencyPipe, IconComponent],
  template: `
    <div class="container checkout fade-in">
      <h1 class="serif">{{ t().checkout.title }}</h1>

      @if (items().length === 0 && !placed()) {
        <div class="empty card">
          <span class="mark"><sf-icon name="shopping-bag" [size]="26" /></span>
          <p class="muted">{{ t().checkout.emptyRedirect }}</p>
          <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="btn btn-primary btn-sm">{{ t().cart.startShopping }}</a>
        </div>
      } @else {
        <ol class="steps" aria-label="checkout steps">
          <li [class.on]="step() === 'shipping'" [class.done]="stepIndex() > 0">
            <span class="dot">@if (stepIndex() > 0) { <sf-icon name="check" [size]="13" /> } @else { 1 }</span>{{ t().checkout.stepShipping }}
          </li>
          <li class="sep"></li>
          <li [class.on]="step() === 'payment'" [class.done]="stepIndex() > 1">
            <span class="dot">@if (stepIndex() > 1) { <sf-icon name="check" [size]="13" /> } @else { 2 }</span>{{ t().checkout.stepPayment }}
          </li>
          <li class="sep"></li>
          <li [class.on]="step() === 'review'"><span class="dot">3</span>{{ t().checkout.stepReview }}</li>
        </ol>

        <div class="layout">
          <div class="main">
            @if (error().length) { <div class="error-panel" role="alert"><ul>@for (e of error(); track e) { <li>{{ e }}</li> }</ul></div> }

            <!-- STEP 1 — shipping -->
            @if (step() === 'shipping') {
              <form class="card pad" #f="ngForm" (ngSubmit)="continueToPayment(f.valid)">
                <h2 class="serif sec">{{ t().checkout.contact }}</h2>
                <div class="field">
                  <label for="email">{{ t().checkout.email }}</label>
                  <input id="email" name="email" type="email" [(ngModel)]="ship.email" required autocomplete="email" />
                </div>
                <h2 class="serif sec">{{ t().checkout.shippingAddress }}</h2>
                <div class="field">
                  <label for="fullName">{{ t().checkout.fullName }}</label>
                  <input id="fullName" name="fullName" [(ngModel)]="ship.fullName" required autocomplete="name" />
                </div>
                <div class="field">
                  <label for="line1">{{ t().checkout.line1 }}</label>
                  <input id="line1" name="line1" [(ngModel)]="ship.line1" required autocomplete="address-line1" />
                </div>
                <div class="field">
                  <label for="line2">{{ t().checkout.line2 }} <span class="muted">({{ t().common.optional }})</span></label>
                  <input id="line2" name="line2" [(ngModel)]="ship.line2" autocomplete="address-line2" />
                </div>
                <div class="grid2">
                  <div class="field"><label for="city">{{ t().checkout.city }}</label><input id="city" name="city" [(ngModel)]="ship.city" required autocomplete="address-level2" /></div>
                  <div class="field"><label for="state">{{ t().checkout.state }}</label><input id="state" name="state" [(ngModel)]="ship.state" required autocomplete="address-level1" /></div>
                </div>
                <div class="grid2">
                  <div class="field"><label for="postalCode">{{ t().checkout.postalCode }}</label><input id="postalCode" name="postalCode" [(ngModel)]="ship.postalCode" required autocomplete="postal-code" /></div>
                  <div class="field"><label for="country">{{ t().checkout.country }}</label><input id="country" name="country" [(ngModel)]="ship.country" required autocomplete="country-name" /></div>
                </div>
                <div class="field">
                  <label for="phone">{{ t().checkout.phone }} <span class="muted">({{ t().common.optional }})</span></label>
                  <input id="phone" name="phone" type="tel" [(ngModel)]="ship.phone" autocomplete="tel" />
                </div>
                <button class="btn btn-primary btn-block" type="submit" [disabled]="f.invalid || busy()">
                  @if (busy()) { <sf-icon name="flame" [size]="16" class="spin" /> {{ t().common.loading }} } @else { {{ t().checkout.continueToPayment }} }
                </button>
              </form>
            }

            <!-- STEP 2 — payment -->
            @if (step() === 'payment') {
              <div class="card pad">
                <h2 class="serif sec">{{ t().checkout.paymentMethod }}</h2>
                <label class="pay-method">
                  <input type="radio" name="pay" checked />
                  <sf-icon name="credit-card" [size]="20" />
                  <span class="pm-label">{{ t().checkout.card }}</span>
                  <span class="badge badge-neutral">{{ t().checkout.testMode }}</span>
                </label>

                @if (intent()?.livePayments) {
                  <div #cardEl class="stripe-card"></div>
                } @else {
                  <div class="test-card">
                    <div class="field">
                      <label>{{ t().checkout.cardNumber }}</label>
                      <input class="num mono" value="4242 4242 4242 4242" readonly />
                    </div>
                    <div class="grid2">
                      <div class="field"><label>{{ t().checkout.expires }}</label><input class="num mono" value="08 / 28" readonly /></div>
                      <div class="field"><label>CVC</label><input class="mono" value="•••" readonly /></div>
                    </div>
                  </div>
                }
                <p class="note muted"><sf-icon name="info" [size]="13" /> {{ t().checkout.testModeNote }}</p>

                <button class="btn btn-primary btn-block" (click)="step.set('review')">{{ t().checkout.continueToReview }}</button>
                <button class="link back" (click)="backToShipping()">{{ t().checkout.backToShipping }}</button>
              </div>
            }

            <!-- STEP 3 — review -->
            @if (step() === 'review') {
              <div class="card pad">
                <h2 class="serif sec">{{ t().checkout.reviewOrder }}</h2>
                <div class="rev-block">
                  <div class="rev-row"><span class="rl">{{ t().checkout.shipTo }}</span><button class="link" (click)="step.set('shipping')">{{ t().checkout.edit }}</button></div>
                  <p class="rev-val">{{ ship.fullName }}<br>{{ ship.line1 }}@if (ship.line2) {, {{ ship.line2 }}}<br>{{ ship.city }}, {{ ship.state }} {{ ship.postalCode }}<br>{{ ship.country }}</p>
                  <p class="rev-val muted">{{ ship.email }}</p>
                </div>
                <div class="rev-block">
                  <div class="rev-row"><span class="rl">{{ t().checkout.payWith }}</span><button class="link" (click)="step.set('payment')">{{ t().checkout.edit }}</button></div>
                  <p class="rev-val">{{ t().checkout.card }} ···· 4242 <span class="badge badge-neutral">{{ t().checkout.testMode }}</span></p>
                </div>
                <button class="btn btn-accent btn-block" (click)="placeOrder()" [disabled]="busy()">
                  @if (busy()) { <sf-icon name="flame" [size]="16" class="spin" /> {{ t().checkout.placing }} }
                  @else { <sf-icon name="lock" [size]="16" /> {{ t().checkout.placeOrder }} — {{ totals().total | currency }} }
                </button>
                <button class="link back" (click)="step.set('payment')">{{ t().checkout.backToPayment }}</button>
                <p class="enc muted"><sf-icon name="lock" [size]="12" /> {{ t().checkout.encrypted }}</p>
              </div>
            }
          </div>

          <!-- order summary -->
          <aside class="summary">
            <h3 class="serif">{{ t().checkout.yourOrder }}</h3>
            <ul class="sum-items">
              @for (it of items(); track it.id) {
                <li>
                  <span class="si-thumb tone" [class]="toneClass(it.imageTone)"></span>
                  <span class="si-body">
                    <span class="si-name">{{ it.productName }}</span>
                    <span class="si-meta">{{ it.variantSize }} · {{ lang.grind(it.grind) }} · ×{{ it.quantity }}</span>
                  </span>
                  <span class="num si-price">{{ it.lineTotal | currency }}</span>
                </li>
              }
            </ul>
            <dl class="sum-totals">
              <div><dt>{{ t().common.subtotal }}</dt><dd class="num">{{ totals().subtotal | currency }}</dd></div>
              <div><dt>{{ t().common.shipping }}</dt><dd class="num">{{ totals().shipping === 0 ? t().common.free : (totals().shipping | currency) }}</dd></div>
              @if (totals().discount > 0) { <div class="disc"><dt>{{ t().common.discount }} @if (coupon.coupon(); as c) { · {{ c.code }} }</dt><dd class="num">−{{ totals().discount | currency }}</dd></div> }
              <div class="grand"><dt>{{ t().common.total }}</dt><dd class="num">{{ totals().total | currency }}</dd></div>
            </dl>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .checkout { padding-block: 2rem 4rem; }
    .checkout > h1 { font-size: clamp(1.9rem, 4vw, 2.4rem); margin-bottom: 1.5rem; }
    .empty { display: grid; place-items: center; gap: 0.75rem; text-align: center; padding: 3rem 1.5rem; }
    .empty .mark { width: 3rem; height: 3rem; border-radius: var(--radius-pill); background: var(--cream-100); color: var(--copper-600); display: grid; place-items: center; }
    .steps { display: flex; align-items: center; gap: 0.75rem; list-style: none; padding: 0; margin: 0 0 1.75rem; font-size: 0.9rem; font-weight: 600; flex-wrap: wrap; }
    .steps li { display: flex; align-items: center; gap: 0.5rem; color: var(--bean-400); }
    .steps li.on { color: var(--bean-900); }
    .steps li.done { color: var(--leaf-600); }
    .dot { width: 1.75rem; height: 1.75rem; border-radius: var(--radius-pill); border: 1px solid currentColor; display: grid; place-items: center; font-size: 0.8rem; }
    .steps li.on .dot { background: var(--bean-900); color: var(--cream-50); border-color: var(--bean-900); }
    .steps li.done .dot { background: var(--leaf-600); color: #fff; border-color: var(--leaf-600); }
    .sep { flex: 0 0 1.5rem; height: 1px; background: var(--border-strong); }
    .layout { display: grid; gap: 1.5rem; align-items: start; }
    @media (min-width: 900px) { .layout { grid-template-columns: 1fr 20rem; } }
    .pad { padding: 1.5rem; }
    .sec { font-size: 1.2rem; margin: 0.5rem 0 1rem; }
    .sec:first-child { margin-top: 0; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    .pay-method { display: flex; align-items: center; gap: 0.75rem; border: 2px solid var(--bean-900); border-radius: var(--radius-sm); padding: 0.9rem 1rem; margin-bottom: 1rem; }
    .pay-method input { width: auto; accent-color: var(--bean-900); }
    .pm-label { flex: 1; font-weight: 600; font-size: 0.9rem; }
    .mono { font-family: monospace; }
    .test-card input[readonly] { background: var(--cream-100); color: var(--bean-500); cursor: default; }
    .stripe-card { border: 1px solid var(--border-strong); border-radius: var(--radius-sm); padding: 0.9rem; }
    .note { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; margin: 0.85rem 0 1.25rem; }
    .link { background: none; border: none; cursor: pointer; color: var(--copper-600); font-weight: 600; font-size: 0.85rem; }
    .back { display: block; margin: 0.85rem auto 0; }
    .rev-block { padding-bottom: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .rev-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
    .rl { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--bean-500); }
    .rev-val { margin: 0 0 0.2rem; font-size: 0.92rem; line-height: 1.5; }
    .enc { display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.78rem; margin: 0.85rem 0 0; }
    .summary { background: var(--bean-900); color: var(--cream-100); border-radius: var(--radius-card); padding: 1.4rem; position: sticky; top: 5rem; }
    .summary h3 { color: var(--cream-50); font-size: 1.3rem; margin-bottom: 1rem; }
    .sum-items { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 0.85rem; }
    .sum-items li { display: flex; gap: 0.7rem; align-items: center; }
    .si-thumb { width: 2.75rem; height: 2.75rem; border-radius: var(--radius-sm); flex-shrink: 0; }
    .si-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .si-name { color: var(--cream-50); font-weight: 600; font-size: 0.88rem; }
    .si-meta { color: rgba(244,237,226,0.6); font-size: 0.78rem; }
    .si-price { font-size: 0.88rem; }
    .sum-totals { border-top: 1px solid rgba(244,237,226,0.18); padding-top: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .sum-totals div { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .sum-totals dt { color: rgba(244,237,226,0.6); } .sum-totals dd { margin: 0; }
    .sum-totals .disc dd { color: var(--copper-400); }
    .grand { border-top: 1px solid rgba(244,237,226,0.18); padding-top: 0.75rem; margin-top: 0.25rem; }
    .grand dt, .grand dd { color: var(--cream-50); font-weight: 700; font-size: 1.05rem; }
    .badge-neutral { background: rgba(244,237,226,0.12); color: var(--cream-100); }
  `
})
export class CheckoutComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly cart = inject(CartStore);
  protected readonly coupon = inject(CheckoutStore);
  protected readonly lang = inject(LanguageService);
  private readonly auth = inject(AuthService);
  protected readonly t = this.lang.t;
  protected readonly toneClass = toneClass;

  private readonly cardEl = viewChild<ElementRef<HTMLDivElement>>('cardEl');

  protected readonly step = signal<Step>('shipping');
  protected readonly busy = signal(false);
  protected readonly error = signal<string[]>([]);
  protected readonly intent = signal<CheckoutIntentResult | null>(null);
  protected readonly placed = signal(false);

  private stripe: any = null;
  private card: any = null;

  protected readonly items = computed(() => this.cart.cart()?.items ?? []);
  protected readonly totals = computed(() => this.coupon.totals(this.cart.subtotal()));
  protected readonly stepIndex = computed(() => ({ shipping: 0, payment: 1, review: 2 }[this.step()]));

  protected ship: ShippingAddressInput & { email: string } = {
    email: this.auth.user()?.email ?? '', fullName: this.auth.user()?.fullName ?? '',
    line1: '', line2: '', city: '', state: '', postalCode: '', country: 'United States', phone: ''
  };

  /** Creates the order + PaymentIntent, then advances to payment (mounting Stripe Elements when live). */
  protected async continueToPayment(valid: boolean | null) {
    if (!valid || this.busy()) return;
    this.busy.set(true); this.error.set([]);
    try {
      const { email, ...shipping } = this.ship;
      const res = await firstValueFrom(this.api.createCheckoutIntent({
        email, shipping, couponCode: this.coupon.coupon()?.code
      }));
      this.intent.set(res);
      this.step.set('payment');
      if (res.livePayments) setTimeout(() => void this.mountStripe(res), 0);
    } catch (e) {
      this.error.set(parseApiError(e, this.t().checkout.orderError));
    } finally {
      this.busy.set(false);
    }
  }

  private async mountStripe(res: CheckoutIntentResult) {
    try {
      this.stripe = await getStripe(res.publishableKey);
      const elements = this.stripe.elements();
      this.card = elements.create('card', { style: { base: { fontFamily: 'Work Sans, sans-serif', fontSize: '15px' } } });
      const host = this.cardEl()?.nativeElement;
      if (host) this.card.mount(host);
    } catch {
      // Live payments configured but SDK failed to load — surface on place order.
    }
  }

  protected backToShipping() {
    this.intent.set(null); this.card = null; this.stripe = null;
    this.step.set('shipping');
  }

  protected async placeOrder() {
    const intent = this.intent();
    if (!intent || this.busy()) return;
    this.busy.set(true); this.error.set([]);
    try {
      if (intent.livePayments) {
        if (!this.stripe || !this.card) throw new Error('payment-unavailable');
        const result = await this.stripe.confirmCardPayment(intent.clientSecret, { payment_method: { card: this.card } });
        if (result.error) { this.error.set([result.error.message ?? this.t().checkout.orderError]); return; }
      }
      const order = await firstValueFrom(this.api.confirmCheckout(intent.orderNumber));
      this.placed.set(true);
      this.coupon.lastOrder.set(order);
      this.coupon.clearCoupon();
      await this.cart.load();
      this.router.navigate(['/checkout/confirmation', order.orderNumber]);
    } catch (e) {
      this.error.set(parseApiError(e, this.t().checkout.orderError));
    } finally {
      this.busy.set(false);
    }
  }
}
