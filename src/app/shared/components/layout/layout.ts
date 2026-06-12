import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  currentUser = computed(() => this.authService.currentUser());

  constructor(private authService: Auth) {}

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
