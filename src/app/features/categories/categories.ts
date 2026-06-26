import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Categories as CategoriesService,
  CategoriesQueryParams,
} from '../../core/services/categories';
import { Category } from '../../core/models/category';
import { matchesKeyword, paginateItems } from '../../shared/utils/mock-data';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  error = signal('');

  searchKeyword = signal('');
  usingMock = signal(false);

  showModal = signal(false);
  isEditMode = signal(false);
  modalLoading = signal(false);

  formData = signal<Partial<Category>>({
    name: '',
    slug: '',
    icon: '',
    order: 0,
    active: true,
  });

  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  readonly limit = 10;

  private readonly mockCategories: Category[] = [
    { _id: 'CAT-001', name: 'Design', slug: 'design', icon: '🎨', order: 1, active: true },
    { _id: 'CAT-002', name: 'Programming', slug: 'programming', icon: '💻', order: 2, active: true },
    { _id: 'CAT-003', name: 'Marketing', slug: 'marketing', icon: '📢', order: 3, active: true },
    { _id: 'CAT-004', name: 'Language', slug: 'language', icon: '🌐', order: 4, active: true },
    { _id: 'CAT-005', name: 'Business', slug: 'business', icon: '💼', order: 5, active: false },
  ];

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    if (this.usingMock()) {
      this.applyMockFilter();
      return;
    }

    this.isLoading.set(true);

    const params: CategoriesQueryParams = {
      page: this.currentPage(),
      limit: this.limit,
    };

    this.categoriesService.getAll(params).subscribe({
      next: (res) => {
        this.categories.set(res.data.categories);
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

    let filtered = [...this.mockCategories];
    const keyword = this.searchKeyword();
    if (keyword) {
      filtered = filtered.filter((c) =>
        matchesKeyword(keyword, [c.name, c.slug]),
      );
    }

    const { data, totalCount, totalPages } = paginateItems(
      filtered,
      this.currentPage(),
      this.limit,
    );

    this.categories.set(data);
    this.totalCount.set(totalCount);
    this.totalPages.set(totalPages);
    this.isLoading.set(false);
  }

  onSearch(value: string): void {
    this.searchKeyword.set(value);
    this.currentPage.set(1);
    this.loadCategories();
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.formData.set({ name: '', slug: '', icon: '', order: 0, active: true });
    this.showModal.set(true);
  }

  openEditModal(category: Category): void {
    this.isEditMode.set(true);
    this.formData.set({ ...category });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSave(): void {
    this.modalLoading.set(true);
    const data = this.formData();

    if (this.isEditMode() && data._id) {
      this.categoriesService.update(data._id, data).subscribe({
        next: () => { this.modalLoading.set(false); this.closeModal(); this.loadCategories(); },
        error: () => {
          if (this.usingMock()) {
            const idx = this.mockCategories.findIndex((c) => c._id === data._id);
            if (idx >= 0) this.mockCategories[idx] = { ...this.mockCategories[idx], ...data } as Category;
            this.modalLoading.set(false);
            this.closeModal();
            this.applyMockFilter();
          } else {
            this.modalLoading.set(false);
          }
        },
      });
    } else {
      this.categoriesService.create(data).subscribe({
        next: () => { this.modalLoading.set(false); this.closeModal(); this.loadCategories(); },
        error: () => {
          if (this.usingMock()) {
            const newCat: Category = {
              _id: `CAT-${Date.now()}`,
              name: data.name!,
              slug: data.slug ?? data.name!.toLowerCase().replace(/\s+/g, '-'),
              icon: data.icon ?? '📁',
              order: data.order ?? 0,
              active: data.active ?? true,
            };
            this.mockCategories.push(newCat);
            this.modalLoading.set(false);
            this.closeModal();
            this.applyMockFilter();
          } else {
            this.modalLoading.set(false);
          }
        },
      });
    }
  }

  onDelete(id: string): void {
    if (!confirm('Are you sure you want to delete this category?')) return;
    this.categoriesService.delete(id).subscribe({
      next: () => this.loadCategories(),
      error: () => {
        if (this.usingMock()) {
          const idx = this.mockCategories.findIndex((c) => c._id === id);
          if (idx >= 0) this.mockCategories.splice(idx, 1);
          this.applyMockFilter();
        }
      },
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadCategories();
  }

  updateForm(field: keyof Category, value: string | number | boolean): void {
    this.formData.update((prev) => ({ ...prev, [field]: value }));
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getStatusClass(active: boolean | undefined): string {
    return active ? 'badge badge--active' : 'badge badge--inactive';
  }

  getStatusLabel(active: boolean | undefined): string {
    return active ? 'Active' : 'Inactive';
  }
}
