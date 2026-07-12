import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AuditLog as AuditLogService,
  AuditLogQueryParams,
} from '../../core/services/audit-log';
import { AdminAction } from '../../core/models/admin-action';
import { matchesKeyword, paginateItems } from '../../shared/utils/mock-data';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.css',
})
export class AuditLog implements OnInit {
  logs = signal<AdminAction[]>([]);
  isLoading = signal(true);
  totalCount = signal(0);

  searchKeyword = signal('');
  selectedAction = signal('');
  currentPage = signal(1);
  totalPages = signal(1);
  readonly limit = 10;

  usingMock = signal(false);
  showViewModal = signal(false);
  selectedLog = signal<AdminAction | null>(null);

  private readonly mockLogs: AdminAction[] = [
    { _id: 'LOG-001', admin: 'ADM-001', targetId: 'USR-2311', action: 'suspend', details: { reason: 'Violation of terms' }, createdAt: 'May 20, 2025 14:30' },
    { _id: 'LOG-002', admin: 'ADM-002', targetId: 'USR-1456', action: 'credit_adjust', details: { reason: 'Manual adjustment' }, createdAt: 'May 20, 2025 12:15' },
    { _id: 'LOG-003', admin: 'ADM-001', targetId: 'USR-3322', action: 'unsuspend', details: { reason: 'Appeal approved' }, createdAt: 'May 20, 2025 09:00' },
    { _id: 'LOG-004', admin: 'ADM-003', targetId: 'USR-7768', action: 'delete', details: { reason: 'Spam content' }, createdAt: 'May 19, 2025 18:45' },
    { _id: 'LOG-005', admin: 'ADM-002', targetId: 'USR-8899', action: 'resolve_dispute', details: { reason: 'Favor receiver' }, createdAt: 'May 19, 2025 16:20' },
    { _id: 'LOG-006', admin: 'ADM-001', targetId: 'CAT-003', action: 'create_category', details: { reason: 'New category added' }, createdAt: 'May 18, 2025 10:00' },
    { _id: 'LOG-007', admin: 'ADM-002', targetId: 'ALL', action: 'send_notification', details: { reason: 'System maintenance alert' }, createdAt: 'May 17, 2025 08:30' },
  ];

  readonly actions = [
    'All Actions',
    'suspend',
    'unsuspend',
    'delete',
    'delete_category',
    'credit_adjust',
    'resolve_dispute',
    'create_category',
    'update_category',
    'send_notification',
  ];

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    if (this.usingMock()) {
      this.applyMockFilter();
      return;
    }

    this.isLoading.set(true);

    const params: AuditLogQueryParams = {
      page: this.currentPage(),
      limit: this.limit,
    };

    if (this.selectedAction() && this.selectedAction() !== 'All Actions') {
      params.action = this.selectedAction();
    }

    this.auditLogService.getAll(params).subscribe({
      next: (res) => {
        let logs = res.data.logs;

        const keyword = this.searchKeyword();
        if (keyword) {
          logs = logs.filter((l) =>
            matchesKeyword(keyword, [
              l._id,
              l.admin,
              l.targetId,
              l.action,
              this.formatDetails(l.details),
            ]),
          );
        }

        this.logs.set(logs);
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

    let filtered = [...this.mockLogs];

    const keyword = this.searchKeyword();
    if (keyword) {
      filtered = filtered.filter((l) =>
        matchesKeyword(keyword, [l._id, l.admin, l.targetId, l.action, this.formatDetails(l.details)]),
      );
    }

    const action = this.selectedAction();
    if (action && action !== 'All Actions') {
      filtered = filtered.filter((l) => l.action === action);
    }

    const { data, totalCount, totalPages } = paginateItems(
      filtered,
      this.currentPage(),
      this.limit,
    );

    this.logs.set(data);
    this.totalCount.set(totalCount);
    this.totalPages.set(totalPages);
    this.isLoading.set(false);
  }

  onSearch(value: string): void {
    this.searchKeyword.set(value);
    this.currentPage.set(1);
    this.loadLogs();
  }

  onActionChange(action: string): void {
    this.selectedAction.set(action);
    this.currentPage.set(1);
    this.loadLogs();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLogs();
  }

  openViewModal(log: AdminAction): void {
    this.selectedLog.set(log);
    this.showViewModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedLog.set(null);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getActionClass(action: string): string {
    const map: Record<string, string> = {
      suspend: 'action-badge action-badge--red',
      unsuspend: 'action-badge action-badge--green',
      delete: 'action-badge action-badge--darkred',
      delete_category: 'action-badge action-badge--darkred',
      credit_adjust: 'action-badge action-badge--blue',
      resolve_dispute: 'action-badge action-badge--purple',
      create_category: 'action-badge action-badge--teal',
      update_category: 'action-badge action-badge--orange',
      send_notification: 'action-badge action-badge--gray',
    };
    return map[action] ?? 'action-badge action-badge--gray';
  }

  formatAdminId(id: string): string {
    return `#${id}`;
  }

  formatTargetId(id: string | undefined): string {
    return id ? `#${id}` : '—';
  }

  formatDetails(details: Record<string, unknown> | undefined): string {
    if (!details) return '—';
    if (typeof details['reason'] === 'string') return details['reason'];
    return Object.values(details).join(', ') || '—';
  }
}
