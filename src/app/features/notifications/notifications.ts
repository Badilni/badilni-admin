import { Component, OnInit, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  NotificationsService,
  SendNotificationPayload,
} from '../../core/services/notifications';
import { Notification } from '../../core/models/notification';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  notifications = signal<Notification[]>([]);
  isLoading = signal(true);
  sendLoading = signal(false);

  selectedType = signal('');
  searchKeyword = signal('');
  usingMock = signal(false);

  showSendModal = signal(false);
  showViewModal = signal(false);
  selectedNotification = signal<Notification | null>(null);

  formType = signal<SendNotificationPayload['type']>('system');
  formTarget = signal<SendNotificationPayload['target']>('broadcast');
  formUserId = signal('');
  formTitle = signal('');
  formMessage = signal('');
  formError = signal('');

  private readonly mockNotifications: Notification[] = [
    { _id: 'N001', title: 'System Update', message: 'Scheduled maintenance on May 25...', type: 'system', target: 'broadcast' },
    { _id: 'N002', title: 'Payment Reminder', message: "Don't forget to complete your payment...", type: 'warning', target: 'user' },
    { _id: 'N003', title: 'Welcome Bonus', message: 'You have received 30 TC as welcome bonus', type: 'info', target: 'broadcast' },
    { _id: 'N004', title: 'Policy Update', message: 'New terms and conditions are now active.', type: 'system', target: 'broadcast' },
    { _id: 'N005', title: 'Session Completed', message: 'Your session has been marked as complete.', type: 'success', target: 'user' },
  ];

  readonly types = ['All Types', 'system', 'warning', 'info', 'success'];
  readonly notifTypes: { value: SendNotificationPayload['type']; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
    { value: 'success', label: 'Success' },
  ];

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    if (this.usingMock()) {
      this.applyMockFilter();
      return;
    }

    this.isLoading.set(true);

    const params: { page?: number; limit?: number } = {
      page: 1,
      limit: 50,
    };

    this.notificationsService.getAll(params).subscribe({
      next: (res) => {
        let notifications = res.data.notifications;

        const keyword = this.searchKeyword().trim().toLowerCase();
        if (keyword) {
          notifications = notifications.filter(
            (n) =>
              n.title.toLowerCase().includes(keyword) ||
              n.message.toLowerCase().includes(keyword),
          );
        }

        const type = this.selectedType();
        if (type && type !== 'All Types') {
          notifications = notifications.filter((n) => n.type === type);
        }

        this.notifications.set(notifications);
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

    let filtered = [...this.mockNotifications];

    const keyword = this.searchKeyword().trim().toLowerCase();
    if (keyword) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(keyword) ||
          n.message.toLowerCase().includes(keyword),
      );
    }

    const type = this.selectedType();
    if (type && type !== 'All Types') {
      filtered = filtered.filter((n) => n.type === type);
    }

    this.notifications.set(filtered);
    this.isLoading.set(false);
  }

  onSearch(value: string): void {
    this.searchKeyword.set(value);
    this.loadNotifications();
  }

  onTypeFilterChange(type: string): void {
    this.selectedType.set(type);
    this.loadNotifications();
  }

  openSendModal(): void {
    this.resetForm();
    this.showSendModal.set(true);
  }

  closeSendModal(): void {
    this.showSendModal.set(false);
    this.resetForm();
  }

  openViewModal(notif: Notification): void {
    this.selectedNotification.set(notif);
    this.showViewModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedNotification.set(null);
  }

  onSend(): void {
    this.formError.set('');

    if (!this.formTitle().trim() || !this.formMessage().trim()) {
      this.formError.set('Title and message are required.');
      return;
    }

    if (this.formTarget() === 'user' && !this.formUserId().trim()) {
      this.formError.set('User ID is required for targeted notifications.');
      return;
    }

    const payload: SendNotificationPayload = {
      title: this.formTitle(),
      message: this.formMessage(),
      type: this.formType(),
      target: this.formTarget(),
    };

    if (this.formTarget() === 'user') {
      payload.userId = this.formUserId();
    }

    this.sendLoading.set(true);

    this.notificationsService.send(payload).subscribe({
      next: () => {
        this.sendLoading.set(false);
        this.closeSendModal();
        this.loadNotifications();
      },
      error: () => {
        if (this.usingMock()) {
          const newNotif: Notification = {
            _id: `N${Date.now()}`,
            title: payload.title,
            message: payload.message,
            type: payload.type,
            target: payload.target,
          };
          this.mockNotifications.unshift(newNotif);
          this.sendLoading.set(false);
          this.closeSendModal();
          this.applyMockFilter();
        } else {
          this.formError.set('Failed to send notification. Please try again.');
          this.sendLoading.set(false);
        }
      },
    });
  }

  onDelete(id: string): void {
    this.notificationsService.delete(id).subscribe({
      next: () => this.loadNotifications(),
      error: () => {
        if (this.usingMock()) {
          const idx = this.mockNotifications.findIndex((n) => n._id === id);
          if (idx >= 0) this.mockNotifications.splice(idx, 1);
          this.applyMockFilter();
        }
      },
    });
  }

  private resetForm(): void {
    this.formType.set('system');
    this.formTarget.set('broadcast');
    this.formUserId.set('');
    this.formTitle.set('');
    this.formMessage.set('');
    this.formError.set('');
  }

  getTypeClass(type: string): string {
    const map: Record<string, string> = {
      system: 'type-badge type-badge--gray',
      warning: 'type-badge type-badge--yellow',
      info: 'type-badge type-badge--blue',
      success: 'type-badge type-badge--green',
    };
    return map[type] ?? 'type-badge';
  }

  getTargetClass(target: string): string {
    return target === 'broadcast'
      ? 'target-badge target-badge--broadcast'
      : 'target-badge target-badge--user';
  }

  getNotifIcon(type: string): string {
    const map: Record<string, string> = {
      system: '🔔',
      warning: '⚠️',
      info: '💬',
      success: '✅',
    };
    return map[type] ?? '🔔';
  }
}
