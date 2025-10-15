import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const appRoutes: Routes = [
  { path: '', loadComponent: () => import('./restaurants/restaurant-list.page').then(m => m.RestaurantListPage) },
  { path: 'login', loadComponent: () => import('./auth/login.page').then(m => m.LoginPage) },
  { path: 'restaurants/:id', loadComponent: () => import('./restaurants/restaurant-detail.page').then(m => m.RestaurantDetailPage) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage) },
  { path: 'admin', canActivate: [authGuard], loadComponent: () => import('./admin/admin-dashboard.page').then(m => m.AdminDashboardPage) },
  { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./checkout/checkout.page').then(m => m.CheckoutPage) },
  { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./orders/orders.page').then(m => m.OrdersPage) },
  { path: 'orders/:id', canActivate: [authGuard], loadComponent: () => import('./orders/order-detail.page').then(m => m.OrderDetailPage) },
  { path: '**', redirectTo: '' }
];
