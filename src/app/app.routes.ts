import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';
import { chainAdminGuard } from './core/chain-admin.guard';
import { restaurantAdminGuard } from './core/restaurant-admin.guard';

export const appRoutes: Routes = [
  { path: '', loadComponent: () => import('./restaurants/restaurant-list.page').then(m => m.RestaurantListPage) },
  { path: 'b2b', loadComponent: () => import('./b2b/b2b.page').then(m => m.B2bPage) },
  { path: 'login', loadComponent: () => import('./auth/login.page').then(m => m.LoginPage) },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/password-reset.page').then(m => m.PasswordResetPage),
  },
  {
    path: 'password/edit',
    loadComponent: () => import('./auth/password-update.page').then(m => m.PasswordUpdatePage),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./auth/password-update.page').then(m => m.PasswordUpdatePage),
  },
  { path: 'register', loadComponent: () => import('./auth/register.page').then(m => m.RegisterPage) },
  {
    path: 'api',
    children: [
      {
        path: 'v1/password/edit',
        loadComponent: () => import('./auth/password-update.page').then(m => m.PasswordUpdatePage),
      },
    ],
  },
  { path: 'restaurants/:id', loadComponent: () => import('./restaurants/restaurant-detail.page').then(m => m.RestaurantDetailPage) },
  { path: 'chains/:id', loadComponent: () => import('./chains/chain-detail.page').then(m => m.ChainDetailPage) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage) },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./admin/admin-shell.page').then(m => m.AdminShellPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./admin/admin-default-redirect.component').then(m => m.AdminDefaultRedirectComponent),
      },
      {
        path: 'restaurants',
        canActivate: [restaurantAdminGuard],
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
            path: 'user-roles',
            loadComponent: () => import('./admin/admin-user-roles.page').then(m => m.AdminUserRolesPage),
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
          {
            path: 'loyalty',
            loadComponent: () =>
              import('./admin/admin-restaurant-loyalty.page').then(m => m.AdminRestaurantLoyaltyPage),
          },
        ],
      },
      {
        path: 'chains',
        canActivate: [chainAdminGuard],
        loadComponent: () =>
          import('./admin/admin-chain-dashboard.page').then(m => m.AdminChainDashboardPage),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'details' },
          {
            path: 'details',
            loadComponent: () => import('./admin/admin-chain-details.page').then(m => m.AdminChainDetailsPage),
          },
          {
            path: 'restaurants',
            loadComponent: () =>
              import('./admin/admin-chain-restaurants.page').then(m => m.AdminChainRestaurantsPage),
          },
          {
            path: 'loyalty',
            loadComponent: () =>
              import('./admin/admin-chain-loyalty.page').then(m => m.AdminChainLoyaltyPage),
          },
          {
            path: 'analytics',
            loadComponent: () =>
              import('./admin/admin-chain-analytics.page').then(m => m.AdminChainAnalyticsPage),
          },
        ],
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
