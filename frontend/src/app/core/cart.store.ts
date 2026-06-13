import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CartDto } from './models';

/** Holds the signed-in user's server cart and keeps the header badge in sync. */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly cart = signal<CartDto | null>(null);
  readonly count = computed(() => this.cart()?.itemCount ?? 0);
  readonly subtotal = computed(() => this.cart()?.subtotal ?? 0);

  constructor() {
    // Load when a session appears; clear when it goes away.
    effect(() => {
      if (this.auth.isAuthenticated()) void this.load();
      else this.cart.set(null);
    });
  }

  async load(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    try { this.cart.set(await firstValueFrom(this.api.getCart())); } catch { /* surfaced by callers when needed */ }
  }

  async add(productVariantId: string, grind: string, quantity = 1): Promise<void> {
    this.cart.set(await firstValueFrom(this.api.addCartItem({ productVariantId, grind, quantity })));
  }

  async update(itemId: string, quantity: number): Promise<void> {
    this.cart.set(await firstValueFrom(this.api.updateCartItem(itemId, quantity)));
  }

  async remove(itemId: string): Promise<void> {
    this.cart.set(await firstValueFrom(this.api.removeCartItem(itemId)));
  }
}
