import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { WishlistItem } from './models';

/** Caches the signed-in user's wishlist so the heart toggle stays in sync across views. */
@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly items = signal<WishlistItem[]>([]);
  private readonly ids = computed(() => new Set(this.items().map(i => i.productId)));

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) void this.load();
      else this.items.set([]);
    });
  }

  has(productId: string): boolean { return this.ids().has(productId); }

  async load(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    try { this.items.set(await firstValueFrom(this.api.getWishlist())); } catch { /* ignore */ }
  }

  /** Toggles membership; returns the new state. Refreshes the list afterward. */
  async toggle(productId: string): Promise<boolean> {
    const res = await firstValueFrom(this.api.toggleWishlist(productId));
    await this.load();
    return res.inWishlist;
  }
}
