import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'cafe',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard', title: 'Dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'category', title: 'Manage Category', canActivate: [adminGuard],
        loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent),
      },
      {
        path: 'product', title: 'Manage Product', canActivate: [adminGuard],
        loadComponent: () => import('./pages/product/product.component').then(m => m.ProductComponent),
      },
      {
        path: 'order', title: 'Manage Order',
        loadComponent: () => import('./pages/order/order.component').then(m => m.OrderComponent),
      },
      {
        path: 'online-orders', title: 'Online Orders',
        loadComponent: () => import('./pages/online-orders/online-orders.component').then(m => m.OnlineOrdersComponent),
      },
      {
        path: 'bill', title: 'View Bill',
        loadComponent: () => import('./pages/bill/bill.component').then(m => m.BillComponent),
      },
      {
        path: 'user', title: 'Manage Users', canActivate: [adminGuard],
        loadComponent: () => import('./pages/user/user.component').then(m => m.UserComponent),
      },
    ],
  },
  {
    // customer-facing online ordering — no login
    path: 'online',
    loadComponent: () => import('./public/public-shell.component').then(m => m.PublicShellComponent),
    children: [
      { path: '', redirectTo: 'menu', pathMatch: 'full' },
      {
        path: 'menu', title: 'Order Online',
        loadComponent: () => import('./public/online-menu.component').then(m => m.OnlineMenuComponent),
      },
      {
        path: 'track', title: 'Track Order',
        loadComponent: () => import('./public/track-order.component').then(m => m.TrackOrderComponent),
      },
      {
        path: 'track/:code', title: 'Track Order',
        loadComponent: () => import('./public/track-order.component').then(m => m.TrackOrderComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
