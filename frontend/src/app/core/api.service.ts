import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';
import {
  AdminOrderListItem, AdminProductListItem, CartDto, CategoryDto, CheckoutIntentResult,
  CouponValidationResult, DashboardDto, OrderDetail, OrderListItem, PagedResult,
  ProductDetail, ProductFilters, ProductListItem, ReviewDto, ShippingAddressInput, WishlistItem
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ---- Catalog (public) ----
  getCategories() { return this.http.get<CategoryDto[]>(`${API_URL}/categories`); }

  getProducts(filters: ProductFilters) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filters))
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    return this.http.get<PagedResult<ProductListItem>>(`${API_URL}/products`, { params });
  }

  getProduct(slug: string) { return this.http.get<ProductDetail>(`${API_URL}/products/${slug}`); }

  getReviews(slug: string, page = 1, pageSize = 10) {
    return this.http.get<PagedResult<ReviewDto>>(`${API_URL}/products/${slug}/reviews`, { params: { page, pageSize } });
  }
  createReview(slug: string, body: { rating: number; title?: string; body: string }) {
    return this.http.post<ReviewDto>(`${API_URL}/products/${slug}/reviews`, body);
  }

  // ---- Cart (auth) ----
  getCart() { return this.http.get<CartDto>(`${API_URL}/cart`); }
  addCartItem(body: { productVariantId: string; grind: string; quantity: number }) {
    return this.http.post<CartDto>(`${API_URL}/cart/items`, body);
  }
  updateCartItem(id: string, quantity: number) { return this.http.put<CartDto>(`${API_URL}/cart/items/${id}`, { quantity }); }
  removeCartItem(id: string) { return this.http.delete<CartDto>(`${API_URL}/cart/items/${id}`); }

  // ---- Coupons / checkout ----
  validateCoupon(code: string, subtotal: number) {
    return this.http.post<CouponValidationResult>(`${API_URL}/coupons/validate`, { code, subtotal });
  }
  createCheckoutIntent(body: { email: string; shipping: ShippingAddressInput; couponCode?: string }) {
    return this.http.post<CheckoutIntentResult>(`${API_URL}/checkout/intent`, body);
  }
  confirmCheckout(orderNumber: string) {
    return this.http.post<OrderDetail>(`${API_URL}/checkout/confirm`, { orderNumber });
  }

  // ---- Orders / wishlist (auth) ----
  getOrders(page = 1, pageSize = 10) {
    return this.http.get<PagedResult<OrderListItem>>(`${API_URL}/orders`, { params: { page, pageSize } });
  }
  getOrder(orderNumber: string) { return this.http.get<OrderDetail>(`${API_URL}/orders/${orderNumber}`); }
  getWishlist() { return this.http.get<WishlistItem[]>(`${API_URL}/wishlist`); }
  toggleWishlist(productId: string) { return this.http.post<{ inWishlist: boolean }>(`${API_URL}/wishlist/toggle`, { productId }); }

  // ---- Admin ----
  adminDashboard() { return this.http.get<DashboardDto>(`${API_URL}/admin/dashboard`); }
  adminProducts(search?: string, page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<AdminProductListItem>>(`${API_URL}/admin/products`, { params });
  }
  adminUpdateProduct(id: string, body: unknown) { return this.http.put<ProductDetail>(`${API_URL}/admin/products/${id}`, body); }
  adminUpdateVariant(id: string, body: { price: number; stockQuantity: number }) {
    return this.http.put<void>(`${API_URL}/admin/variants/${id}`, body);
  }
  adminOrders(status?: string, page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<AdminOrderListItem>>(`${API_URL}/admin/orders`, { params });
  }
  adminAdvanceOrder(orderNumber: string) { return this.http.post<OrderDetail>(`${API_URL}/admin/orders/${orderNumber}/advance`, {}); }
  adminCancelOrder(orderNumber: string) { return this.http.post<OrderDetail>(`${API_URL}/admin/orders/${orderNumber}/cancel`, {}); }
}
