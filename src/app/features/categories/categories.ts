import { Component, OnInit, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Categories as CategoriesService,
  CategoriesQueryParams,
} from '../../core/services/categories';
import { Category } from '../../core/models/category';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  error = signal('');

  showModal = signal(false);
  isEditMode = signal(false);
  modalLoading = signal(false);

  formData = signal<Partial<Category>>({
    name: '',
    slug: '',
    icon: '',
    order: 0,
    status: 'active',
  });

  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  readonly limit = 10;

  constructor(private categoriesService: CategoriesService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
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
        // ⚠️ BACKEND NOT READY – /categories endpoint not yet implemented, using mock data
        this.categories.set([
          { _id: 'CAT-001', name: 'Design',      slug: 'design',      icon: '🎨', order: 1, status: 'active'   },
          { _id: 'CAT-002', name: 'Programming', slug: 'programming', icon: '💻', order: 2, status: 'active'   },
          { _id: 'CAT-003', name: 'Marketing',   slug: 'marketing',   icon: '📢', order: 3, status: 'active'   },
          { _id: 'CAT-004', name: 'Language',    slug: 'language',    icon: '🌐', order: 4, status: 'active'   },
          { _id: 'CAT-005', name: 'Business',    slug: 'business',    icon: '💼', order: 5, status: 'inactive' },
        ] as Category[]);
        this.totalPages.set(1);
        this.totalCount.set(5);
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.formData.set({ name: '', slug: '', icon: '', order: 0, status: 'active' });
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
        error: (err) => { console.error('Update failed', err); this.modalLoading.set(false); },
      });
    } else {
      this.categoriesService.create(data).subscribe({
        next: () => { this.modalLoading.set(false); this.closeModal(); this.loadCategories(); },
        error: (err) => { console.error('Create failed', err); this.modalLoading.set(false); },
      });
    }
  }

  onDelete(id: string): void {
    if (!confirm('Are you sure you want to delete this category?')) return;
    this.categoriesService.delete(id).subscribe({
      next: () => this.loadCategories(),
      error: (err) => console.error('Delete failed', err),
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadCategories();
  }

  updateForm(field: keyof Category, value: string | number): void {
    this.formData.update((prev) => ({ ...prev, [field]: value }));
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      active:   'badge badge--active',
      inactive: 'badge badge--inactive',
    };
    return map[status] ?? 'badge';
  }
}
