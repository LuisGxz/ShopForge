import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards';

export const routes: Routes = [
  // Full-screen auth (outside the storefront shell)
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) }
    ]
  },

  // Storefront shell (public browsing; checkout/account/admin gated)
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },

      { path: 'shop', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
      { path: 'product/:slug', loadComponent: () => import('./features/product/product.component').then(m => m.ProductComponent) },
      { path: 'cart', loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
      { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },

      { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'checkout/confirmation/:orderNumber', canActivate: [authGuard], loadComponent: () => import('./features/checkout/confirmation.component').then(m => m.ConfirmationComponent) },

      { path: 'account/orders', canActivate: [authGuard], loadComponent: () => import('./features/account/orders.component').then(m => m.OrdersComponent) },
      { path: 'account/orders/:orderNumber', canActivate: [authGuard], loadComponent: () => import('./features/account/order-detail.component').then(m => m.OrderDetailComponent) },
      { path: 'account/wishlist', canActivate: [authGuard], loadComponent: () => import('./features/account/wishlist.component').then(m => m.WishlistComponent) },

      {
        path: 'admin', canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', loadComponent: () => import('./features/admin/dashboard.component').then(m => m.DashboardComponent) },
          { path: 'products', loadComponent: () => import('./features/admin/products.component').then(m => m.ProductsComponent) },
          { path: 'orders', loadComponent: () => import('./features/admin/admin-orders.component').then(m => m.AdminOrdersComponent) }
        ]
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
