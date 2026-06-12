import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification';

export interface NotificationsResponse {
  status: string;
  data: {
    notifications: Notification[];
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface NotificationResponse {
  status: string;
  data: {
    notification: Notification;
  };
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
  type?: string;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  // ⚠️ BACKEND NOT READY: /api/v1/notifications admin endpoint not yet implemented
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getAll(params: NotificationsQueryParams = {}): Observable<NotificationsResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<NotificationsResponse>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  send(payload: SendNotificationPayload): Observable<Notification> {
    return this.http
      .post<NotificationResponse>(this.apiUrl, payload)
      .pipe(
        map((res) => res.data.notification),
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
