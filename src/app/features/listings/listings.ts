import { Component, OnInit, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listings as ListingsService, ListingsQueryParams } from '../../core/services/listings';
import { Categories as CategoriesService } from '../../core/services/categories';
import { Category } from '../../core/models/category';
import { Listing } from '../../core/models/listing';
import { matchesKeyword, paginateItems } from '../../shared/utils/mock-data';

type ModalMode = 'create' | 'edit' | 'view' | null;

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './listings.html',
  styleUrl: './listings.css',
})
export class Listings implements OnInit {
  listings = signal<Listing[]>([]);
  isLoading = signal(true);
  error = signal('');

  searchKeyword = signal('');
  selectedStatus = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  limit = 10;

  usingMock = signal(false);
  private readonly mockListings: Listing[] = [
    { _id: 'LST-001', title: 'Graphic Design Basics', provider: 'PRV-1045', price: 200, tags: ['Design', 'Graphics'], status: 'active', description: 'Learn graphic design fundamentals' },
    { _id: 'LST-002', title: 'Web Development', provider: 'PRV-987', price: 500, tags: ['Programming', 'Web'], status: 'active', description: 'Full-stack web development course' },
    { _id: 'LST-003', title: 'English Conversation', provider: 'PRV-555', price: 150, tags: ['Language', 'English'], status: 'inactive', description: 'Practice English speaking skills' },
    { _id: 'LST-004', title: 'Digital Marketing', provider: 'PRV-222', price: 300, tags: ['Marketing', 'Digital'], status: 'active', description: 'Social media and SEO marketing' },
    { _id: 'LST-005', title: 'Photo Editing', provider: 'PRV-333', price: 250, tags: ['Design', 'Photo'], status: 'pending', description: 'Adobe Photoshop and Lightroom' },
    { _id: 'LST-006', title: 'Mobile App Development', provider: 'PRV-444', price: 600, tags: ['Programming', 'Mobile'], status: 'suspended', description: 'React Native mobile apps' },
  ];

  modalMode = signal<ModalMode>(null);
  modalLoading = signal(false);
  selectedListing = signal<Listing | null>(null);
  formData = signal<Partial<Listing>>({
    title: '',
    provider: '',
    price: 1,
    tags: [],
    status: 'active',
    description: '',
  });
  tagsInput = signal('');

  statuses = ['All Status', 'active', 'inactive'];
  categoriesList = signal<Category[]>([]);
  formError = signal('');

  constructor(
    private listingsService: ListingsService,
    private categoriesService: CategoriesService
  ) {}

  ngOnInit(): void {
    this.loadListings();
    this.loadCategoriesList();
  }

  loadListings(): void {
    if (this.usingMock()) {
      this.applyMockFilter();
      return;
    }

    this.isLoading.set(true);
    const params: ListingsQueryParams = {
      page: this.currentPage(),
      limit: this.limit,
    };
    if (this.searchKeyword()) params.keyword = this.searchKeyword();
    if (this.selectedStatus() && this.selectedStatus() !== 'All Status') {
      params.status = this.selectedStatus();
    }

    this.listingsService.getAll(params).subscribe({
      next: (res) => {
        this.listings.set(res.data.listings);
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

    let filtered = [...this.mockListings];

    const keyword = this.searchKeyword();
    if (keyword) {
      filtered = filtered.filter((l) =>
        matchesKeyword(keyword, [l.title, l.provider, ...(l.tags ?? [])]),
      );
    }

    const status = this.selectedStatus();
    if (status && status !== 'All Status') {
      filtered = filtered.filter((l) => l.status === status);
    }

    const { data, totalCount, totalPages } = paginateItems(
      filtered,
      this.currentPage(),
      this.limit,
    );

    this.listings.set(data);
    this.totalCount.set(totalCount);
    this.totalPages.set(totalPages);
    this.isLoading.set(false);
  }

  onSearch(value: string): void {
    this.searchKeyword.set(value);
    this.currentPage.set(1);
    this.loadListings();
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadListings();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadListings();
  }

  loadCategoriesList(): void {
    this.categoriesService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.categoriesList.set(res.data.categories);
      },
    });
  }

  openCreateModal(): void {
    this.formError.set('');
    this.formData.set({ title: '', provider: '', price: 1, tags: [], status: 'active', description: '', category: '' });
    this.tagsInput.set('');
    this.modalMode.set('create');
  }

  openViewModal(listing: Listing): void {
    this.selectedListing.set(listing);
    this.modalMode.set('view');
  }

  openEditModal(listing: Listing): void {
    this.formError.set('');
    this.formData.set({ ...listing });
    this.tagsInput.set((listing.tags ?? []).join(', '));
    this.modalMode.set('edit');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedListing.set(null);
  }

  onSave(): void {
    const data = this.formData();
    this.formError.set('');

    if (!data.title?.trim()) {
      this.formError.set('Title is required');
      return;
    }
    if (data.title.length < 5) {
      this.formError.set('Title must be at least 5 characters');
      return;
    }

    if (!data.category?.trim()) {
      this.formError.set('Category is required');
      return;
    }

    if (!data.description?.trim()) {
      this.formError.set('Description is required');
      return;
    }
    if (data.description.length < 20) {
      this.formError.set('Description must be at least 20 characters');
      return;
    }

    if (data.price === undefined || data.price < 1 || data.price > 20) {
      this.formError.set('Hourly rate must be between 1 and 20');
      return;
    }

    const tags = this.tagsInput()
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    data.tags = tags;

    this.modalLoading.set(true);
    const mode = this.modalMode();

    if (mode === 'edit' && data._id) {
      this.listingsService.update(data._id, data).subscribe({
        next: () => {
          this.modalLoading.set(false);
          this.closeModal();
          this.loadListings();
        },
        error: (err) => {
          this.modalLoading.set(false);
          const errMsg = err?.error?.message || 'Failed to update listing';
          this.formError.set(errMsg);
        },
      });
    } else if (mode === 'create') {
      this.listingsService.create(data).subscribe({
        next: () => {
          this.modalLoading.set(false);
          this.closeModal();
          this.loadListings();
        },
        error: (err) => {
          this.modalLoading.set(false);
          const errMsg = err?.error?.message || 'Failed to create listing';
          this.formError.set(errMsg);
        },
      });
    }
  }

  onToggleStatus(listing: Listing): void {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    this.listingsService.update(listing._id!, { status: newStatus }).subscribe({
      next: () => this.loadListings(),
      error: () => {
        if (this.usingMock()) {
          const idx = this.mockListings.findIndex((l) => l._id === listing._id);
          if (idx >= 0) this.mockListings[idx] = { ...this.mockListings[idx], status: newStatus };
          this.applyMockFilter();
        }
      },
    });
  }

  onDelete(id: string): void {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    this.listingsService.delete(id).subscribe({
      next: () => this.loadListings(),
      error: () => {
        if (this.usingMock()) {
          const idx = this.mockListings.findIndex((l) => l._id === id);
          if (idx >= 0) this.mockListings.splice(idx, 1);
          this.applyMockFilter();
        }
      },
    });
  }

  updateForm(field: keyof Listing, value: string | number): void {
    this.formData.update((prev) => ({ ...prev, [field]: value }));
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      active: 'badge badge--active',
      inactive: 'badge badge--inactive',
      pending: 'badge badge--pending',
      suspended: 'badge badge--suspended',
    };
    return map[status] ?? 'badge';
  }

  isFormMode(): boolean {
    const mode = this.modalMode();
    return mode === 'create' || mode === 'edit';
  }
}
