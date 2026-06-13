import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavItem } from '../../../core/models/nav-item';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  currentUser = computed(() => this.authService.currentUser());

  activeRoute = signal('/dashboard');

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', iconKey: 'dashboard' },
    { label: 'Users', route: '/users', iconKey: 'users' },
    { label: 'Disputes', route: '/disputes', iconKey: 'disputes' },
    { label: 'Listings', route: '/listings', iconKey: 'listings' },
    { label: 'Transactions', route: '/transactions', iconKey: 'transactions' },
    { label: 'Notifications', route: '/notifications', iconKey: 'notifications' },
    { label: 'Categories', route: '/categories', iconKey: 'categories' },
    { label: 'Audit Log', route: '/audit-log', iconKey: 'auditlog' },
  ];

  constructor(private authService: Auth, private router: Router) {
    this.activeRoute.set(this.router.url);
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => this.activeRoute.set(e.urlAfterRedirects));
  }

  isActive(route: string): boolean {
    return this.activeRoute().startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
