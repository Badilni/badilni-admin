import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AdminAction } from '../models/admin-action';
import {
  mapAdminActionFromApi,
  normalizePagination,
  NormalizedPagination,
} from '../mappers/api-mappers';

export interface AuditLogResponse {
  status: string;
  data: {
    logs: AdminAction[];
  };
  pagination: NormalizedPagination;
}

// Matches adminActionQuerySchema (adminAction.schema.ts): page, limit,
// action, admin, targetId. There is no `sort` param on the backend for
// this endpoint.
export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  admin?: string;
  targetId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLog {
  // ✅ Backend ready: GET /api/v1/admin-actions (adminAction.routes.ts).
  // The endpoint moved from /admin/audit-log to /admin-actions, but the
  // response shape (status/data.logs/pagination) is unchanged.
  private readonly apiUrl = `${environment.apiUrl}/admin-actions`;

  constructor(private http: HttpClient) {}

  getAll(params: AuditLogQueryParams = {}): Observable<AuditLogResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.admin) httpParams = httpParams.set('admin', params.admin);
    if (params.targetId) httpParams = httpParams.set('targetId', params.targetId);

    return this.http
      .get<{
        status: string;
        data: { logs: Record<string, unknown>[] };
        pagination: Record<string, number>;
      }>(this.apiUrl, { params: httpParams })
      .pipe(
        map((res) => ({
          status: res.status,
          data: { logs: res.data.logs.map(mapAdminActionFromApi) },
          pagination: normalizePagination(res.pagination),
        })),
        catchError(this.handleError),
      );
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
