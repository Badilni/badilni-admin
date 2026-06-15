import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Disputes as DisputesService,
  ResolveDisputePayload,
} from '../../core/services/disputes';
import { Booking } from '../../core/models/booking';

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

  showPanel = signal(false);
  selectedDispute = signal<Booking | null>(null);
  resolveLoading = signal(false);

  resolution = signal<ResolveDisputePayload['resolution']>('favor_provider');
  reason = signal('');

  currentPage = signal(1);
  totalPages = signal(1);
  readonly limit = 10;

  readonly resolutions: { value: ResolveDisputePayload['resolution']; label: string }[] = [
    { value: 'favor_provider', label: 'Favor Provider'  },
    { value: 'favor_receiver', label: 'Favor Receiver'  },
    { value: 'split',          label: 'Split (50/50)'   },
    { value: 'refund',         label: 'Refund (Full)'   },
  ];

  constructor(private disputesService: DisputesService) {}

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
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
          // ⚠️ BACKEND NOT READY – /disputes endpoint not yet implemented
          this.disputes.set([
            { _id: 'BK5-7P3A', provider: 'PRV-1045', receiver: 'USR-2311', amount: 150, sessionSec: 0, status: 'disputed', date: '2025-05-31' },
            { _id: 'BKI-Q290', provider: 'PRV-987',  receiver: 'USR-1456', amount: 200, sessionSec: 0, status: 'disputed', date: '2025-05-13' },
            { _id: 'BK8-B418', provider: 'PRV-555',  receiver: 'USR-3322', amount: 150, sessionSec: 0, status: 'disputed', date: '2025-05-13' },
            { _id: 'BK9-4D5E', provider: 'PRV-322',  receiver: 'USR-7768', amount: 250, sessionSec: 0, status: 'disputed', date: '2025-05-13' },
            { _id: 'BK0-9F8C', provider: 'PRV-333',  receiver: 'USR-8899', amount: 180, sessionSec: 0, status: 'disputed', date: '2025-05-13' },
          ] as unknown as Booking[]);
          this.totalPages.set(1);
          this.isLoading.set(false);
        },
      });
  }

  openResolvePanel(dispute: Booking): void {
    this.selectedDispute.set(dispute);
    this.resolution.set('favor_provider');
    this.reason.set('');
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
      error: (err) => {
        console.error('Resolve failed', err);
        this.resolveLoading.set(false);
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
