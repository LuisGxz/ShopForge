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

      // Built in F6 — reachable placeholders for now (no dead links).
      { path: 'shop', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Shop' } },
      { path: 'product/:slug', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Product' } },
      { path: 'cart', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Your cart' } },
      { path: 'about', loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'About this project' } },
      { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Checkout' } },
      { path: 'account/orders', canActivate: [authGuard], loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'My orders' } },
      { path: 'account/wishlist', canActivate: [authGuard], loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Wishlist' } },
      { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./features/placeholder/placeholder.component').then(m => m.PlaceholderComponent), data: { title: 'Admin' } }
    ]
  },

  { path: '**', redirectTo: '' }
];
