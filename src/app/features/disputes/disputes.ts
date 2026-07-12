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
    {
      _id: 'BK5-7P3A',
      provider: 'Provider A',
      receiver: 'User 2311',
      listing: 'Graphic Design',
      creditsTotal: 150,
      durationHours: 1,
      scheduledAt: '2025-06-05T10:00:00Z',
      status: 'disputed',
      createdAt: '2025-05-31',
    },
    {
      _id: 'BKI-Q290',
      provider: 'Provider B',
      receiver: 'User 1456',
      listing: 'Web Development',
      creditsTotal: 200,
      durationHours: 2,
      scheduledAt: '2025-05-20T14:00:00Z',
      status: 'disputed',
      createdAt: '2025-05-13',
    },
    {
      _id: 'BK8-B418',
      provider: 'Provider C',
      receiver: 'User 3322',
      listing: 'English Conversation',
      creditsTotal: 150,
      durationHours: 1,
      scheduledAt: '2025-05-22T09:30:00Z',
      status: 'disputed',
      createdAt: '2025-05-13',
    },
    {
      _id: 'BK9-4D5E',
      provider: 'Provider D',
      receiver: 'User 7768',
      listing: 'Digital Marketing',
      creditsTotal: 250,
      durationHours: 2,
      scheduledAt: '2025-05-24T16:00:00Z',
      status: 'disputed',
      createdAt: '2025-05-13',
    },
    {
      _id: 'BK0-9F8C',
      provider: 'Provider E',
      receiver: 'User 8899',
      listing: 'Photo Editing',
      creditsTotal: 180,
      durationHours: 1,
      scheduledAt: '2025-05-26T11:15:00Z',
      status: 'disputed',
      createdAt: '2025-05-13',
    },
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
          let disputes = res.data.disputes;

          const keyword = this.searchKeyword();
          if (keyword) {
            disputes = disputes.filter((d) =>
              matchesKeyword(keyword, [d._id, d.provider, d.receiver, d.listing]),
            );
          }

          this.disputes.set(disputes);
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
        matchesKeyword(keyword, [d._id, d.provider, d.receiver, d.listing]),
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
