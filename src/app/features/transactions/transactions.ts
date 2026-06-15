import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

import {
  Transactions as TransactionsService,
  TransactionsQueryParams,
} from '../../core/services/transactions';
import { Transaction } from '../../core/models/transaction';

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

  selectedType = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  readonly limit = 10;

  readonly types = [
    'All Types',
    'session_payment',
    'refund',
    'welcome_bonus',
    'admin_adjustment',
    'credit_adjust',
  ];

  constructor(private transactionsService: TransactionsService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
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
        // ⚠️ BACKEND NOT READY – /transactions admin endpoint not yet implemented
        this.transactions.set([
          { _id: 'TXI-9F00TA', from: 'USR-2311', to: 'PRV-1045', amount: -150, type: 'session_payment', date: '2025-05-20 14:30' },
          { _id: 'TXI-BE70B',  from: 'PRV-987',  to: 'USR-1456', amount:  200, type: 'refund',           date: '2025-05-20 12:15' },
          { _id: 'TXI-706C5A', from: 'System',   to: 'USR-3322', amount:   50, type: 'welcome_bonus',    date: '2025-05-20 09:00' },
          { _id: 'TXI-6C9B4A', from: 'Admin',    to: 'USR-7768', amount:  100, type: 'admin_adjustment', date: '2025-05-19 18:45' },
          { _id: 'TXI-8AA43F', from: 'USR-8899', to: 'PRV-165',  amount: -100, type: 'session_payment',  date: '2025-05-19 16:20' },
        ] as unknown as Transaction[]);
        this.totalPages.set(1);
        this.totalCount.set(12458);
        this.isLoading.set(false);
      },
    });
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

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      session_payment:  'type-badge type-badge--blue',
      refund:           'type-badge type-badge--green',
      welcome_bonus:    'type-badge type-badge--teal',
      admin_adjustment: 'type-badge type-badge--purple',
      credit_adjust:    'type-badge type-badge--orange',
    };
    return map[type] ?? 'type-badge';
  }

  getAmountClass(amount: number): string {
    return amount < 0 ? 'amount amount--negative' : 'amount amount--positive';
  }

  formatAmount(amount: number): string {
    return `${amount > 0 ? '+' : ''}${amount} TC`;
  }
}
