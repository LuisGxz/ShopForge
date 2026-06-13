export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UserDto { id: string; email: string; fullName: string; role: 'Customer' | 'Admin'; }
export interface AuthResponse { accessToken: string; refreshToken: string; expiresInSeconds: number; user: UserDto; }

export interface CategoryDto {
  id: number; slug: string; name: string; nameEs?: string;
  description: string; descriptionEs?: string; sortOrder: number; productCount: number;
}

export interface ProductVariantDto {
  id: string; size: string; sizeEs?: string; sku: string;
  price: number; stockQuantity: number; inStock: boolean; sortOrder: number;
}

export interface ProductImageDto { id: string; url: string; altText: string; tone?: string; sortOrder: number; }

export interface ProductListItem {
  id: string; slug: string; name: string; categorySlug: string;
  origin?: string; originEs?: string; roastLevel: string; process: string;
  flavorNotes: string; flavorNotesEs?: string;
  heroLabel?: string; heroLabelEs?: string;
  averageRating: number; reviewCount: number;
  fromPrice: number; imageUrl?: string; imageTone?: string;
  isFeatured: boolean; inStock: boolean;
}

export interface ProductDetail {
  id: string; slug: string; name: string; categoryId: number; categorySlug: string; categoryName: string; categoryNameEs?: string;
  origin?: string; originEs?: string; region?: string; altitudeMeters?: number;
  roastLevel: string; process: string;
  flavorNotes: string; flavorNotesEs?: string;
  description: string; descriptionEs?: string;
  heroLabel?: string; heroLabelEs?: string;
  averageRating: number; reviewCount: number;
  variants: ProductVariantDto[]; images: ProductImageDto[];
}

export interface ReviewDto {
  id: string; authorName: string; rating: number; title?: string; body: string;
  isVerifiedPurchase: boolean; createdAtUtc: string;
}

export interface CartItemDto {
  id: string; productVariantId: string; productId: string; productSlug: string; productName: string;
  variantSize: string; grind: string; unitPrice: number; quantity: number; lineTotal: number;
  imageUrl?: string; imageTone?: string; availableStock: number;
}
export interface CartDto { id: string; items: CartItemDto[]; subtotal: number; itemCount: number; }

export interface CouponValidationResult { isValid: boolean; code: string; discount: number; message: string; }

export interface ShippingAddressInput {
  fullName: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string; phone?: string;
}
export interface CheckoutIntentResult {
  orderNumber: string; clientSecret: string; total: number; publishableKey: string; livePayments: boolean;
}

export interface OrderItemDto {
  productName: string; productSlug: string; imageUrl?: string;
  variantSize: string; grind: string; unitPrice: number; quantity: number; lineTotal: number;
}
export interface ShippingAddressDto extends ShippingAddressInput {}
export interface OrderListItem { orderNumber: string; status: string; total: number; itemCount: number; placedAtUtc: string; }
export interface OrderDetail {
  orderNumber: string; status: string; contactEmail: string; shippingAddress: ShippingAddressDto;
  subtotal: number; shippingCost: number; discountAmount: number; total: number; couponCode?: string;
  placedAtUtc: string; paidAtUtc?: string; items: OrderItemDto[];
}

export interface WishlistItem {
  productId: string; slug: string; name: string; origin?: string; originEs?: string;
  fromPrice: number; imageUrl?: string; imageTone?: string; averageRating: number; reviewCount: number; inStock: boolean;
}

// ---- Admin ----
export interface AdminProductListItem {
  id: string; slug: string; name: string; categoryName: string; isActive: boolean; isFeatured: boolean;
  averageRating: number; reviewCount: number; fromPrice: number; totalStock: number; variantCount: number;
}
export interface AdminOrderListItem {
  orderNumber: string; contactEmail: string; status: string; total: number; itemCount: number; placedAtUtc: string;
}
export interface DashboardDto {
  totalRevenue: number; paidOrders: number; averageOrderValue: number; pendingOrders: number;
  ordersByStatus: { status: string; count: number }[];
  topProducts: { productName: string; unitsSold: number; revenue: number }[];
  salesByDay: { date: string; revenue: number; orders: number }[];
  lowStock: { productName: string; variantSize: string; stockQuantity: number }[];
}

export interface ProductFilters {
  search?: string; category?: string; roast?: string; process?: string;
  minPrice?: number; maxPrice?: number; sort?: string; page?: number; pageSize?: number;
}
