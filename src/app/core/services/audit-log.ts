import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AdminAction } from '../models/admin-action';

export interface AuditLogResponse {
  status: string;
  data: {
    logs: AdminAction[];
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLog {
  // ⚠️ BACKEND NOT READY: /api/v1/admin/audit-log endpoint not yet implemented
  private readonly apiUrl = `${environment.apiUrl}/admin/audit-log`;

  constructor(private http: HttpClient) {}

  getAll(params: AuditLogQueryParams = {}): Observable<AuditLogResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<AuditLogResponse>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
