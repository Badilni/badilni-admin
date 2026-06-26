import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Users as UsersService, UsersQueryParams } from '../../core/services/users';
import { User } from '../../core/models/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, DecimalPipe, TitleCasePipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  users = signal<User[]>([]);
  isLoading = signal(true);
  error = signal('');

  searchKeyword = signal('');
  selectedRole = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  limit = 10;

  roles = ['All Roles', 'user', 'admin'];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    const params: UsersQueryParams = {
      page: this.currentPage(),
      limit: this.limit,
    };
    if (this.searchKeyword()) params.keyword = this.searchKeyword();
    if (this.selectedRole() && this.selectedRole() !== 'All Roles') {
      params.role = this.selectedRole();
    }

    this.usersService.getAll(params).subscribe({
      next: (res) => {
        this.users.set(res.data.users);
        this.totalPages.set(res.pagination.totalPages);
        this.totalCount.set(res.pagination.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        // ⚠️ Mock data – replace when backend /users is ready
        this.users.set([
          { _id: 'USR-2311', name: 'Ahmed Samir',   email: 'ahmed@example.com',   role: 'user',  walletBalance: 1250, totalSessionsCompleted: 24,  status: 'active',    isVerified: true },
          { _id: 'USR-1456', name: 'Sara Ali',      email: 'sara@example.com',    role: 'user',  walletBalance: 3210, totalSessionsCompleted: 56,  status: 'active',    isVerified: true },
          { _id: 'USR-3322', name: 'Mohamed Hassan', email: 'mohamed@example.com', role: 'user',  walletBalance: 320,  totalSessionsCompleted: 8,   status: 'suspended', isVerified: true },
          { _id: 'USR-7768', name: 'Omar Khaled',   email: 'omar@example.com',    role: 'user',  walletBalance: 1040, totalSessionsCompleted: 102, status: 'active',    isVerified: true },
          { _id: 'USR-8899', name: 'Nouran Magdy',  email: 'nouran@example.com',  role: 'user',  walletBalance: 980,  totalSessionsCompleted: 19,  status: 'active',    isVerified: true },
        ] as User[]);
        this.totalPages.set(5);
        this.totalCount.set(50);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.searchKeyword.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onRoleChange(role: string): void {
    this.selectedRole.set(role);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  onExport(): void {
    // ⚠️ BACKEND NOT READY: export endpoint not yet implemented
    console.warn('Export endpoint not yet implemented');
  }

  onView(userId: string): void {
    console.log('View user:', userId);
  }

  onEdit(userId: string): void {
    console.log('Edit user:', userId);
  }

  onDelete(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersService.delete(userId).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Delete failed', err),
    });
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      active: 'badge badge--active',
      suspended: 'badge badge--suspended',
      inactive: 'badge badge--inactive',
    };
    return map[status ?? 'inactive'] ?? 'badge';
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      user: 'User',
      admin: 'Admin',
    };
    return map[role] ?? role;
  }
}
