import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { CouponValidationResult, OrderDetail } from './models';

export const FREE_SHIPPING_THRESHOLD = 60;
export const FLAT_SHIPPING = 6.5;

export interface OrderTotals { subtotal: number; shipping: number; discount: number; total: number; }

/** Holds the applied promo code between the cart and checkout views and computes order totals. */
@Injectable({ providedIn: 'root' })
export class CheckoutStore {
  private readonly api = inject(ApiService);
  readonly coupon = signal<CouponValidationResult | null>(null);
  /** Set on a successful checkout so the confirmation page can render without a refetch. */
  readonly lastOrder = signal<OrderDetail | null>(null);

  /** Validates a code against the current subtotal; stores it when valid. Returns the result. */
  async applyCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
    const res = await firstValueFrom(this.api.validateCoupon(code.trim(), subtotal));
    this.coupon.set(res.isValid ? res : null);
    return res;
  }

  clearCoupon(): void { this.coupon.set(null); }

  /** Re-validates a stored coupon after the subtotal changes; drops it if no longer valid. */
  async revalidate(subtotal: number): Promise<void> {
    const code = this.coupon()?.code;
    if (!code) return;
    try { await this.applyCoupon(code, subtotal); } catch { this.clearCoupon(); }
  }

  totals(subtotal: number): OrderTotals {
    const shipping = subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    const discount = Math.min(subtotal, this.coupon()?.discount ?? 0);
    const total = round(Math.max(0, subtotal - discount) + shipping);
    return { subtotal: round(subtotal), shipping, discount: round(discount), total };
  }
}

function round(n: number): number { return Math.round(n * 100) / 100; }
