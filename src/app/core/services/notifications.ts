import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification';
import {
  mapNotificationFromApi,
  normalizePagination,
  NormalizedPagination,
} from '../mappers/api-mappers';

export interface NotificationsResponse {
  status: string;
  unreadCount?: number;
  data: {
    notifications: Notification[];
  };
  pagination: NormalizedPagination;
}

export interface SendNotificationPayload {
  title: string;
  message: string;
  type: 'system' | 'warning' | 'info' | 'success';
  target: 'broadcast' | 'user';
  userId?: string;
}

export interface NotificationsQueryParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getAll(params: NotificationsQueryParams = {}): Observable<NotificationsResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.unreadOnly) httpParams = httpParams.set('unreadOnly', 'true');

    return this.http
      .get<{
        status: string;
        unreadCount?: number;
        data: { notifications: Record<string, unknown>[] };
        pagination: Record<string, number>;
      }>(this.apiUrl, { params: httpParams })
      .pipe(
        map((res) => ({
          status: res.status,
          unreadCount: res.unreadCount,
          data: {
            notifications: res.data.notifications.map(mapNotificationFromApi),
          },
          pagination: normalizePagination(res.pagination),
        })),
        catchError(this.handleError),
      );
  }

  send(payload: SendNotificationPayload): Observable<Notification> {
    return this.http
      .post<{
        status: string;
        data: { notification?: Record<string, unknown>; count?: number };
      }>(this.apiUrl, {
        title: payload.title,
        message: payload.message,
        // 🐛 FIX: The backend's Notification model defines `type` as a
        // required enum of real domain events (ADMIN_ANNOUNCEMENT,
        // DISPUTE_FILED, CREDITS_WELCOME_BONUS, ...) — see
        // notification.model.ts. Our UI-only categories
        // ('system' | 'warning' | 'info' | 'success') are NOT valid values
        // for that enum, so sending `type: payload.type` here was either
        // silently ignored or overridden by the backend, which is why
        // every admin-created notification always came back as
        // ADMIN_ANNOUNCEMENT (displayed as "system") no matter what was
        // picked in the form. Admin-created notifications are always
        // ADMIN_ANNOUNCEMENT server-side, so we no longer send `type` at
        // all — the UI-level type the admin picks is instead remembered
        // locally (see the notification-type override in
        // features/notifications/notifications.ts) and re-applied after
        // every fetch.
        target: payload.target,
        userId: payload.userId,
      })
      .pipe(
        map((res) => {
          // Broadcast notifications can be created for many users at once,
          // so the backend sometimes only returns a `count` instead of a
          // single notification document. Previously this caused
          // `mapNotificationFromApi(undefined)` to throw, which made a
          // successful creation look like a failed request ("Failed to
          // send notification") even though the notification(s) were
          // already saved server-side. Fall back to a notification built
          // from the submitted payload instead of crashing.
          if (res.data.notification) {
            return mapNotificationFromApi(res.data.notification);
          }
          return {
            _id: `N${Date.now()}`,
            title: payload.title,
            message: payload.message,
            type: payload.type,
            target: payload.target,
            userId: payload.userId,
          };
        }),
        catchError(this.handleError),
      );
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
