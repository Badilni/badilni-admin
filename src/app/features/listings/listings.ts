import { Component, OnInit, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listings as ListingsService, ListingsQueryParams } from '../../core/services/listings';
import { Listing } from '../../core/models/listing';

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

  statuses = ['All Status', 'active', 'inactive', 'pending', 'suspended'];

  constructor(private listingsService: ListingsService) {}

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
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
        // ⚠️ BACKEND NOT READY: /listings endpoint not yet implemented – using mock data
        this.listings.set([
          { _id: 'LST-001', title: 'Graphic Design Basics', provider: 'PRV-1045', price: 200, tags: ['Design', 'Graphics'], status: 'active' },
          { _id: 'LST-002', title: 'Web Development', provider: 'PRV-987', price: 500, tags: ['Programming', 'Web'], status: 'active' },
          { _id: 'LST-003', title: 'English Conversation', provider: 'PRV-555', price: 150, tags: ['Language', 'English'], status: 'inactive' },
          { _id: 'LST-004', title: 'Digital Marketing', provider: 'PRV-222', price: 300, tags: ['Marketing', 'Digital'], status: 'active' },
          { _id: 'LST-005', title: 'Photo Editing', provider: 'PRV-333', price: 250, tags: ['Design', 'Photo'], status: 'active' },
        ]);
        this.totalPages.set(1);
        this.totalCount.set(5);
        this.isLoading.set(false);
      },
    });
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

  onNewListing(): void {
    // ⚠️ BACKEND NOT READY: create listing endpoint not yet implemented
    console.warn('New listing - backend not yet implemented');
  }

  onToggleStatus(listing: Listing): void {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';
    this.listingsService.update(listing._id!, { status: newStatus }).subscribe({
      next: () => this.loadListings(),
      error: (err) => console.error('Toggle status failed', err),
    });
  }

  onDelete(id: string): void {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    this.listingsService.delete(id).subscribe({
      next: () => this.loadListings(),
      error: (err) => console.error('Delete failed', err),
    });
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
}
