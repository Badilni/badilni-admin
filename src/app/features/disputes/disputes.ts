import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Disputes as DisputesService,
  ResolveDisputePayload,
} from '../../core/services/disputes';
import { Booking } from '../../core/models/booking';
import { matchesKeyword, paginateItems } from '../../shared/utils/mock-data';

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './disputes.html',
  styleUrl: './disputes.css',
})
export class Disputes implements OnInit {
  disputes = signal<Booking[]>([]);
  isLoading = signal(true);

  searchKeyword = signal('');
  usingMock = signal(false);

  showPanel = signal(false);
  showViewModal = signal(false);
  selectedDispute = signal<Booking | null>(null);
  resolveLoading = signal(false);

  resolution = signal<ResolveDisputePayload['resolution']>('favor_provider');
  reason = signal('');

  currentPage = signal(1);
  totalPages = signal(1);
  readonly limit = 10;

  private readonly mockDisputes: Booking[] = [
    { _id: 'BK5-7P3A', provider: 'PRV-1045', requester: 'USR-2311', listing: 'LST-001', creditsAmount: 150, status: 'disputed', createdAt: '2025-05-31' },
    { _id: 'BKI-Q290', provider: 'PRV-987', requester: 'USR-1456', listing: 'LST-002', creditsAmount: 200, status: 'disputed', createdAt: '2025-05-13' },
    { _id: 'BK8-B418', provider: 'PRV-555', requester: 'USR-3322', listing: 'LST-003', creditsAmount: 150, status: 'disputed', createdAt: '2025-05-13' },
    { _id: 'BK9-4D5E', provider: 'PRV-322', requester: 'USR-7768', listing: 'LST-004', creditsAmount: 250, status: 'disputed', createdAt: '2025-05-13' },
    { _id: 'BK0-9F8C', provider: 'PRV-333', requester: 'USR-8899', listing: 'LST-005', creditsAmount: 180, status: 'disputed', createdAt: '2025-05-13' },
  ];

  readonly resolutions: { value: ResolveDisputePayload['resolution']; label: string }[] = [
    { value: 'favor_provider', label: 'Favor Provider' },
    { value: 'favor_receiver', label: 'Favor Receiver' },
    { value: 'split', label: 'Split (50/50)' },
    { value: 'refund', label: 'Refund (Full)' },
  ];

  constructor(private disputesService: DisputesService) {}

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    if (this.usingMock()) {
      this.applyMockFilter();
      return;
    }

    this.isLoading.set(true);

    this.disputesService
      .getAll({ page: this.currentPage(), limit: this.limit })
      .subscribe({
        next: (res) => {
          this.disputes.set(res.data.disputes);
          this.totalPages.set(res.pagination.totalPages);
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

    let filtered = [...this.mockDisputes];
    const keyword = this.searchKeyword();
    if (keyword) {
      filtered = filtered.filter((d) =>
        matchesKeyword(keyword, [d._id, d.provider, d.requester, d.listing]),
      );
    }

    const { data, totalPages } = paginateItems(filtered, this.currentPage(), this.limit);
    this.disputes.set(data);
    this.totalPages.set(totalPages);
    this.isLoading.set(false);
  }

  onSearch(value: string): void {
    this.searchKeyword.set(value);
    this.currentPage.set(1);
    this.loadDisputes();
  }

  openViewModal(dispute: Booking): void {
    this.selectedDispute.set(dispute);
    this.showViewModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    if (!this.showPanel()) {
      this.selectedDispute.set(null);
    }
  }

  openResolvePanel(dispute: Booking): void {
    this.selectedDispute.set(dispute);
    this.resolution.set('favor_provider');
    this.reason.set('');
    this.showViewModal.set(false);
    this.showPanel.set(true);
  }

  closePanel(): void {
    this.showPanel.set(false);
    this.selectedDispute.set(null);
  }

  onConfirmResolve(): void {
    const dispute = this.selectedDispute();
    if (!dispute || !this.reason().trim()) return;

    this.resolveLoading.set(true);

    const payload: ResolveDisputePayload = {
      resolution: this.resolution(),
      reason: this.reason(),
    };

    this.disputesService.resolve(dispute._id!, payload).subscribe({
      next: () => {
        this.resolveLoading.set(false);
        this.closePanel();
        this.loadDisputes();
      },
      error: () => {
        if (this.usingMock()) {
          const idx = this.mockDisputes.findIndex((d) => d._id === dispute._id);
          if (idx >= 0) this.mockDisputes.splice(idx, 1);
          this.resolveLoading.set(false);
          this.closePanel();
          this.applyMockFilter();
        } else {
          this.resolveLoading.set(false);
        }
      },
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadDisputes();
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  setResolution(value: ResolveDisputePayload['resolution']): void {
    this.resolution.set(value);
  }

  setReason(value: string): void {
    this.reason.set(value);
  }
}
