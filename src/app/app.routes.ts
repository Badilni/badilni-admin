import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  // Root redirect
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // Auth routes (public)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then(
            (m) => m.ForgotPassword,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then(
            (m) => m.ResetPassword,
          ),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email').then(
            (m) => m.VerifyEmail,
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // Protected admin routes
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'users',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/users/users').then((m) => m.Users),
  },
  {
    path: 'listings',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/listings/listings').then((m) => m.Listings),
  },
  {
    path: 'categories',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/categories/categories').then((m) => m.Categories),
  },
  {
    path: 'transactions',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/transactions/transactions').then((m) => m.Transactions),
  },
  {
    path: 'disputes',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/disputes/disputes').then((m) => m.Disputes),
  },
  {
    path: 'notifications',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/notifications/notifications').then((m) => m.Notifications),
  },
  {
    path: 'audit-log',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/audit-log/audit-log').then((m) => m.AuditLog),
  },

  // Forbidden page
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },

  // Wildcard
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
