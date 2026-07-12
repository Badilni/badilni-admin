// src/app/features/users/users.ts
import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Users as UsersService, UsersQueryParams } from '../../core/services/users';
import { User } from '../../core/models/user';
import { matchesKeyword, paginateItems } from '../../shared/utils/mock-data';

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

  usingMock = signal(false);
  private readonly mockUsers: User[] = [
    { _id: 'USR-2311', name: 'Ahmed Samir', email: 'ahmed@example.com', role: 'user', walletBalance: 1250, totalSessionsCompleted: 24, status: 'active', isVerified: true },
    { _id: 'USR-1456', name: 'Sara Ali', email: 'sara@example.com', role: 'user', walletBalance: 3210, totalSessionsCompleted: 56, status: 'active', isVerified: true },
    { _id: 'USR-3322', name: 'Mohamed Hassan', email: 'mohamed@example.com', role: 'user', walletBalance: 320, totalSessionsCompleted: 8, status: 'suspended', isVerified: true },
    { _id: 'USR-7768', name: 'Omar Khaled', email: 'omar@example.com', role: 'user', walletBalance: 1040, totalSessionsCompleted: 102, status: 'active', isVerified: true },
    { _id: 'USR-8899', name: 'Nouran Magdy', email: 'nouran@example.com', role: 'user', walletBalance: 980, totalSessionsCompleted: 19, status: 'active', isVerified: true },
    { _id: 'USR-9901', name: 'Admin User', email: 'admin@badilni.com', role: 'admin', walletBalance: 0, totalSessionsCompleted: 0, status: 'active', isVerified: true },
  ];

  showViewModal = signal(false);
  showEditModal = signal(false);
  isEditMode = signal(false);
  modalLoading = signal(false);
  selectedUser = signal<User | null>(null);
  formData = signal<Partial<User>>({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
  });
  formPassword = signal('');
  // Mirrors the backend's `passwordSchema` (auth.schema.ts) so a create
  // attempt never reaches the API with a password that Zod will reject.
  formPasswordError = signal('');

  roles = ['All Roles', 'user', 'admin'];
  statusOptions: User['status'][] = ['active', 'suspended', 'inactive'];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    if (this.usingMock()) {
      this.applyMockFilter();
      return;
    }

    this.isLoading.set(true);

    const keyword = this.searchKeyword().trim();
    const roleFilter =
      this.selectedRole() && this.selectedRole() !== 'All Roles'
        ? this.selectedRole()
        : undefined;

    if (keyword) {
      // The backend's `keyword` query param only searches the `name` field.
      // To also match against email we fetch a larger batch (max page size
      // allowed by the API) and filter/paginate name-or-email matches on
      // the client instead of forwarding the keyword to the server.
      const params: UsersQueryParams = { page: 1, limit: 100 };
      if (roleFilter) params.role = roleFilter;

      this.usersService.getAll(params).subscribe({
        next: (res) => {
          const filtered = res.data.users.filter((u) =>
            matchesKeyword(keyword, [u.name, u.email]),
          );
          const { data, totalCount, totalPages } = paginateItems(
            filtered,
            this.currentPage(),
            this.limit,
          );
          this.users.set(data);
          this.totalCount.set(totalCount);
          this.totalPages.set(totalPages);
          this.isLoading.set(false);
        },
        error: () => {
          this.usingMock.set(true);
          this.applyMockFilter();
        },
      });
      return;
    }

    const params: UsersQueryParams = {
      page: this.currentPage(),
      limit: this.limit,
    };
    if (roleFilter) params.role = roleFilter;

    this.usersService.getAll(params).subscribe({
      next: (res) => {
        this.users.set(res.data.users);
        this.totalPages.set(res.pagination.totalPages);
        this.totalCount.set(res.pagination.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.usingMock.set(true);
        this.applyMockFilter();
      },
    });
  }

  private applyMockFilter(): void {
    this.isLoading.set(true);

    let filtered = [...this.mockUsers];

    const keyword = this.searchKeyword();
    if (keyword) {
      filtered = filtered.filter((u) =>
        matchesKeyword(keyword, [u.name, u.email]),
      );
    }

    const role = this.selectedRole();
    if (role && role !== 'All Roles') {
      filtered = filtered.filter((u) => u.role === role);
    }

    const { data, totalCount, totalPages } = paginateItems(
      filtered,
      this.currentPage(),
      this.limit,
    );

    this.users.set(data);
    this.totalCount.set(totalCount);
    this.totalPages.set(totalPages);
    this.isLoading.set(false);
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
    const data = this.usingMock() ? this.mockUsers : this.users();
    const csv = [
      'ID,Name,Email,Role,Status,Credits,Sessions',
      ...data.map(
        (u) =>
          `${u._id},${u.name},${u.email},${u.role},${u.status ?? ''},${u.walletBalance ?? 0},${u.totalSessionsCompleted ?? 0}`,
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.formData.set({ name: '', email: '', role: 'user', status: 'active' });
    this.formPassword.set('');
    this.formPasswordError.set('');
    this.showEditModal.set(true);
  }

  onView(user: User): void {
    this.selectedUser.set(user);
    this.showViewModal.set(true);
  }

  onEdit(user: User): void {
    this.isEditMode.set(true);
    this.formData.set({ ...user });
    this.showEditModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedUser.set(null);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  // Matches the backend's passwordSchema (min 8 chars + upper + lower +
  // number + special character). Keeping this in sync prevents create-user
  // requests from ever being rejected by the API's Zod validation.
  private isPasswordStrongEnough(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  }

  onSave(): void {
    const data = this.formData();
    if (!data.name?.trim() || !data.email?.trim()) return;

    this.modalLoading.set(true);

    if (this.isEditMode() && data._id) {
      const id = data._id;
      // NOTE: the backend's `getAllUsers` list endpoint only returns users
      // whose `active` field is not explicitly `false`, so suspending a
      // user would make them vanish from a fresh `loadUsers()` call. To
      // keep the row visible after ANY edit (including status changes),
      // we merge the server's response into the already-loaded list
      // instead of reloading it from the API.
      this.usersService.update(id, data).subscribe({
        next: (updatedUser) => {
          this.modalLoading.set(false);
          this.closeEditModal();
          // The backend never returns the `active` field on read (it's
          // `select: false` on the schema), so trust the status the user
          // just submitted rather than whatever came back from the API.
          const merged: User = { ...updatedUser, status: data.status ?? updatedUser.status };
          this.users.update((list) =>
            list.map((u) => (u._id === merged._id ? merged : u)),
          );
        },
        error: () => {
          if (this.usingMock()) {
            const idx = this.mockUsers.findIndex((u) => u._id === id);
            if (idx >= 0) {
              this.mockUsers[idx] = { ...this.mockUsers[idx], ...data } as User;
            }
            this.modalLoading.set(false);
            this.closeEditModal();
            this.applyMockFilter();
          } else {
            this.modalLoading.set(false);
          }
        },
      });
    } else {
      if (!this.isPasswordStrongEnough(this.formPassword())) {
        this.formPasswordError.set(
          'Password must be 8+ characters and include an uppercase letter, a lowercase letter, a number, and a special character.',
        );
        this.modalLoading.set(false);
        return;
      }
      this.formPasswordError.set('');

      this.usersService.create({
        name: data.name!,
        email: data.email!,
        password: this.formPassword(),
        role: data.role,
        status: data.status,
      }).subscribe({
        next: () => {
          this.modalLoading.set(false);
          this.closeEditModal();
          this.loadUsers();
        },
        error: () => {
          if (this.usingMock()) {
            const newUser: User = {
              _id: `USR-${Date.now()}`,
              name: data.name!,
              email: data.email!,
              role: data.role ?? 'user',
              status: data.status ?? 'active',
              isVerified: false,
              walletBalance: 0,
              totalSessionsCompleted: 0,
            };
            this.mockUsers.unshift(newUser);
            this.modalLoading.set(false);
            this.closeEditModal();
            this.applyMockFilter();
          } else {
            this.modalLoading.set(false);
          }
        },
      });
    }
  }

  onDelete(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.usersService.delete(userId).subscribe({
      next: () => this.loadUsers(),
      error: () => {
        if (this.usingMock()) {
          const idx = this.mockUsers.findIndex((u) => u._id === userId);
          if (idx >= 0) this.mockUsers.splice(idx, 1);
          this.applyMockFilter();
        }
      },
    });
  }

  updateForm(field: keyof User, value: string | number | boolean): void {
    this.formData.update((prev) => ({ ...prev, [field]: value }));
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
