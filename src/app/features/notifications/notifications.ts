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

  // Send form state
  formType = signal<SendNotificationPayload['type']>('system');
  formTarget = signal<SendNotificationPayload['target']>('broadcast');
  formUserId = signal('');
  formTitle = signal('');
  formMessage = signal('');
  formError = signal('');

  readonly types = ['All Types', 'system', 'warning', 'info', 'success'];
  readonly notifTypes: { value: SendNotificationPayload['type']; label: string }[] = [
    { value: 'system',  label: 'System'  },
    { value: 'warning', label: 'Warning' },
    { value: 'info',    label: 'Info'    },
    { value: 'success', label: 'Success' },
  ];

  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading.set(true);

    const params: Record<string, unknown> = {};
    if (this.selectedType() && this.selectedType() !== 'All Types') {
      params['type'] = this.selectedType();
    }

    this.notificationsService.getAll(params).subscribe({
      next: (res) => {
        this.notifications.set(res.data.notifications);
        this.isLoading.set(false);
      },
      error: () => {
        // ⚠️ BACKEND NOT READY – /notifications admin endpoint not yet implemented
        this.notifications.set([
          { _id: 'N001', title: 'System Update',     message: 'Scheduled maintenance on May 25...', type: 'system',  target: 'broadcast' },
          { _id: 'N002', title: 'Payment Reminder',  message: "Don't forget to complete your payment...", type: 'warning', target: 'user' },
          { _id: 'N003', title: 'Welcome Bonus',     message: 'You have received 30 TC as welcome bonus', type: 'info',    target: 'broadcast' },
          { _id: 'N004', title: 'Policy Update',     message: 'New terms and conditions are now active.', type: 'system',  target: 'broadcast' },
        ] as Notification[]);
        this.isLoading.set(false);
      },
    });
  }

  onTypeFilterChange(type: string): void {
    this.selectedType.set(type);
    this.loadNotifications();
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
      title:   this.formTitle(),
      message: this.formMessage(),
      type:    this.formType(),
      target:  this.formTarget(),
    };

    if (this.formTarget() === 'user') {
      payload.userId = this.formUserId();
    }

    this.sendLoading.set(true);

    this.notificationsService.send(payload).subscribe({
      next: () => {
        this.sendLoading.set(false);
        this.resetForm();
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Send failed', err);
        this.formError.set('Failed to send notification. Please try again.');
        this.sendLoading.set(false);
      },
    });
  }

  onCancel(): void {
    this.resetForm();
  }

  onDelete(id: string): void {
    this.notificationsService.delete(id).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Delete failed', err),
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
      system:  'type-badge type-badge--gray',
      warning: 'type-badge type-badge--yellow',
      info:    'type-badge type-badge--blue',
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
      system:  '🔔',
      warning: '⚠️',
      info:    '💬',
      success: '✅',
    };
    return map[type] ?? '🔔';
  }
}
