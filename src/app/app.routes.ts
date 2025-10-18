import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const appRoutes: Routes = [
  { path: '', loadComponent: () => import('./restaurants/restaurant-list.page').then(m => m.RestaurantListPage) },
  { path: 'b2b', loadComponent: () => import('./b2b/b2b.page').then(m => m.B2bPage) },
  { path: 'login', loadComponent: () => import('./auth/login.page').then(m => m.LoginPage) },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/password-reset.page').then(m => m.PasswordResetPage),
  },
  { path: 'register', loadComponent: () => import('./auth/register.page').then(m => m.RegisterPage) },
  { path: 'restaurants/:id', loadComponent: () => import('./restaurants/restaurant-detail.page').then(m => m.RestaurantDetailPage) },
  { path: 'chains/:id', loadComponent: () => import('./chains/chain-detail.page').then(m => m.ChainDetailPage) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage) },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/admin-dashboard.page').then(m => m.AdminDashboardPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'details' },
      {
        path: 'details',
        loadComponent: () =>
          import('./admin/admin-restaurant-details.page').then(m => m.AdminRestaurantDetailsPage),
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin/admin-recent-orders.page').then(m => m.AdminRecentOrdersPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/admin-restaurant-users.page').then(m => m.AdminRestaurantUsersPage),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./admin/admin-analytics.page').then(m => m.AdminAnalyticsPage),
      },
      {
        path: 'photos',
        loadComponent: () => import('./admin/admin-restaurant-photos.page').then(m => m.AdminRestaurantPhotosPage),
      },
      {
        path: 'locations',
        loadComponent: () => import('./admin/admin-locations.page').then(m => m.AdminLocationsPage),
      },
      {
        path: 'menu',
        loadComponent: () => import('./admin/admin-menu.page').then(m => m.AdminMenuPage),
      },
      {
        path: 'options',
        loadComponent: () => import('./admin/admin-options.page').then(m => m.AdminOptionsPage),
      },
      {
        path: 'discounts',
        loadComponent: () => import('./admin/admin-discounts.page').then(m => m.AdminDiscountsPage),
      },
    ],
  },
  { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./checkout/checkout.page').then(m => m.CheckoutPage) },
  { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./orders/orders.page').then(m => m.OrdersPage) },
  { path: 'orders/:id', canActivate: [authGuard], loadComponent: () => import('./orders/order-detail.page').then(m => m.OrderDetailPage) },
  {
    path: 'algemene-voorwaarden',
    loadComponent: () => import('./legal/terms.page').then(m => m.TermsPage),
  },
  {
    path: 'privacyverklaring',
    loadComponent: () => import('./legal/privacy.page').then(m => m.PrivacyPage),
  },
  { path: '**', redirectTo: '' }
];
