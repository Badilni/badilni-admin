import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Transactions as TransactionsService,
  TransactionsQueryParams,
  AdminAdjustmentPayload,
} from '../../core/services/transactions';
import { Transaction } from '../../core/models/transaction';
import { matchesKeyword, paginateItems } from '../../shared/utils/mock-data';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {
  transactions = signal<Transaction[]>([]);
  isLoading = signal(true);
  totalCount = signal(0);

  searchKeyword = signal('');
  selectedType = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  readonly limit = 10;

  usingMock = signal(false);
  showViewModal = signal(false);
  selectedTransaction = signal<Transaction | null>(null);

  // New Admin Adjustment modal state
  showAdjustModal = signal(false);
  adjustLoading = signal(false);
  adjustError = signal('');
  adjustForm = signal<AdminAdjustmentPayload>({
    userId: '',
    amount: 0,
    description: '',
  });

  private readonly mockTransactions: Transaction[] = [
    { _id: 'TXI-9F00TA', sender: 'Ahmed Samir', receiver: 'Sara Ali', amount: 150, type: 'session_payment', status: 'completed', createdAt: '2025-05-20 14:30' },
    { _id: 'TXI-BE70B', sender: 'System', receiver: 'Mohamed Hassan', amount: 200, type: 'refund', status: 'completed', createdAt: '2025-05-20 12:15' },
    { _id: 'TXI-706C5A', sender: 'System', receiver: 'Omar Khaled', amount: 50, type: 'welcome_bonus', status: 'completed', createdAt: '2025-05-20 09:00' },
    { _id: 'TXI-6C9B4A', sender: 'Admin', receiver: 'Nouran Magdy', amount: 100, type: 'admin_adjustment', status: 'completed', createdAt: '2025-05-19 18:45' },
    { _id: 'TXI-8AA43F', sender: 'Ahmed Samir', receiver: 'Ahmed Samir', amount: 100, type: 'escrow_lock', status: 'completed', createdAt: '2025-05-19 16:20' },
  ];

  readonly types = [
    'All Types',
    'session_payment',
    'escrow_lock',
    'refund',
    'welcome_bonus',
    'admin_adjustment',
  ];

  constructor(private transactionsService: TransactionsService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    if (this.usingMock()) {
      this.applyMockFilter();
      return;
    }

    this.isLoading.set(true);

    const params: TransactionsQueryParams = {
      page: this.currentPage(),
      limit: this.limit,
    };

    if (this.selectedType() && this.selectedType() !== 'All Types') {
      params.type = this.selectedType();
    }

    this.transactionsService.getAll(params).subscribe({
      next: (res) => {
        this.transactions.set(res.data.transactions);
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

    let filtered = [...this.mockTransactions];

    const keyword = this.searchKeyword();
    if (keyword) {
      filtered = filtered.filter((t) =>
        matchesKeyword(keyword, [t._id, t.sender, t.receiver, t.type]),
      );
    }

    const type = this.selectedType();
    if (type && type !== 'All Types') {
      filtered = filtered.filter((t) => t.type === type);
    }

    const { data, totalCount, totalPages } = paginateItems(
      filtered,
      this.currentPage(),
      this.limit,
    );

    this.transactions.set(data);
    this.totalCount.set(totalCount);
    this.totalPages.set(totalPages);
    this.isLoading.set(false);
  }

  onSearch(value: string): void {
    this.searchKeyword.set(value);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  onTypeChange(type: string): void {
    this.selectedType.set(type);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadTransactions();
  }

  openViewModal(tx: Transaction): void {
    this.selectedTransaction.set(tx);
    this.showViewModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedTransaction.set(null);
  }

  // ── Admin Adjustment ──

  openAdjustModal(): void {
    this.adjustForm.set({ userId: '', amount: 0, description: '' });
    this.adjustError.set('');
    this.showAdjustModal.set(true);
  }

  closeAdjustModal(): void {
    this.showAdjustModal.set(false);
  }

  updateAdjustForm(field: keyof AdminAdjustmentPayload, value: string | number): void {
    this.adjustForm.update((prev) => ({ ...prev, [field]: value }));
  }

  onSubmitAdjustment(): void {
    const data = this.adjustForm();
    this.adjustError.set('');

    if (!data.userId.trim()) {
      this.adjustError.set('User ID is required.');
      return;
    }
    if (!data.amount || Number(data.amount) === 0) {
      this.adjustError.set('Amount must be a non-zero number.');
      return;
    }
    if (!data.description.trim() || data.description.trim().length < 5) {
      this.adjustError.set('Description must be at least 5 characters.');
      return;
    }

    this.adjustLoading.set(true);

    this.transactionsService
      .adminAdjustment({
        userId: data.userId.trim(),
        amount: Number(data.amount),
        description: data.description.trim(),
      })
      .subscribe({
        next: () => {
          this.adjustLoading.set(false);
          this.closeAdjustModal();
          this.loadTransactions();
        },
        error: (err) => {
          if (this.usingMock()) {
            const newTx: Transaction = {
              _id: `TXI-${Date.now()}`,
              sender: 'Admin',
              receiver: `#${data.userId}`,
              amount: Math.abs(Number(data.amount)),
              type: 'admin_adjustment',
              status: 'completed',
              description: data.description,
              createdAt: new Date().toLocaleString(),
            };
            this.mockTransactions.unshift(newTx);
            this.adjustLoading.set(false);
            this.closeAdjustModal();
            this.applyMockFilter();
          } else {
            this.adjustLoading.set(false);
            this.adjustError.set(
              err?.error?.message ?? 'Failed to apply adjustment. Please try again.',
            );
          }
        },
      });
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      session_payment: 'type-badge type-badge--blue',
      escrow_lock: 'type-badge type-badge--orange',
      refund: 'type-badge type-badge--purple',
      welcome_bonus: 'type-badge type-badge--green',
      admin_adjustment: 'type-badge type-badge--teal',
    };
    return map[type] ?? 'type-badge';
  }

  isOutgoing(type: string): boolean {
    return type === 'session_payment' || type === 'escrow_lock';
  }

  getAmountClass(type: string): string {
    return this.isOutgoing(type) ? 'amount amount--negative' : 'amount amount--positive';
  }

  formatAmount(amount: number, type: string): string {
    const sign = this.isOutgoing(type) ? '-' : '+';
    return `${sign}${amount} TC`;
  }
}
