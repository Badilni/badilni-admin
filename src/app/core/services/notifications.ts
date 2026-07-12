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
        data: { notification: Record<string, unknown>; count: number };
      }>(this.apiUrl, {
        title: payload.title,
        message: payload.message,
        target: payload.target,
        userId: payload.userId,
      })
      .pipe(
        map((res) => mapNotificationFromApi(res.data.notification)),
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
