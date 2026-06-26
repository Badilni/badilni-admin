import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Transactions as TransactionsService,
  TransactionsQueryParams,
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

  private readonly mockTransactions: Transaction[] = [
    { _id: 'TXI-9F00TA', sender: 'USR-2311', receiver: 'PRV-1045', amount: 150, type: 'debit', status: 'completed', createdAt: '2025-05-20 14:30' },
    { _id: 'TXI-BE70B', sender: 'PRV-987', receiver: 'USR-1456', amount: 200, type: 'refund', status: 'completed', createdAt: '2025-05-20 12:15' },
    { _id: 'TXI-706C5A', sender: 'System', receiver: 'USR-3322', amount: 50, type: 'credit', status: 'completed', createdAt: '2025-05-20 09:00' },
    { _id: 'TXI-6C9B4A', sender: 'Admin', receiver: 'USR-7768', amount: 100, type: 'credit', status: 'completed', createdAt: '2025-05-19 18:45' },
    { _id: 'TXI-8AA43F', sender: 'USR-8899', receiver: 'PRV-165', amount: 100, type: 'escrow_hold', status: 'pending', createdAt: '2025-05-19 16:20' },
    { _id: 'TXI-1DD22E', sender: 'USR-2311', receiver: 'PRV-555', amount: 75, type: 'escrow_release', status: 'completed', createdAt: '2025-05-18 11:00' },
  ];

  readonly types = [
    'All Types',
    'credit',
    'debit',
    'escrow_hold',
    'escrow_release',
    'refund',
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

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      credit: 'type-badge type-badge--green',
      debit: 'type-badge type-badge--blue',
      escrow_hold: 'type-badge type-badge--orange',
      escrow_release: 'type-badge type-badge--teal',
      refund: 'type-badge type-badge--purple',
    };
    return map[type] ?? 'type-badge';
  }

  isOutgoing(type: string): boolean {
    return type === 'debit' || type === 'escrow_hold';
  }

  getAmountClass(type: string): string {
    return this.isOutgoing(type) ? 'amount amount--negative' : 'amount amount--positive';
  }

  formatAmount(amount: number, type: string): string {
    const sign = this.isOutgoing(type) ? '-' : '+';
    return `${sign}${amount} TC`;
  }
}
