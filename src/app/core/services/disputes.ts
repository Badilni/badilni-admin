import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Booking } from '../models/booking';
import {
  mapBookingFromApi,
  normalizePagination,
  NormalizedPagination,
} from '../mappers/api-mappers';

export interface DisputesResponse {
  status: string;
  data: {
    disputes: Booking[];
  };
  pagination: NormalizedPagination;
}

export interface ResolveDisputePayload {
  resolution: 'favor_provider' | 'favor_receiver' | 'split' | 'refund';
  reason: string;
}

export interface DisputesQueryParams {
  page?: number;
  limit?: number;
  bookingId?: string;
  providerId?: string;
  receiverId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Disputes {
  private readonly apiUrl = `${environment.apiUrl}/admin/bookings`;

  constructor(private http: HttpClient) {}

  getAll(params: DisputesQueryParams = {}): Observable<DisputesResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.bookingId) httpParams = httpParams.set('bookingId', params.bookingId);
    if (params.providerId) httpParams = httpParams.set('providerId', params.providerId);
    if (params.receiverId) httpParams = httpParams.set('receiverId', params.receiverId);

    return this.http
      .get<{
        status: string;
        data: { bookings: Record<string, unknown>[] };
        pagination: Record<string, number>;
      }>(`${this.apiUrl}/disputes`, { params: httpParams })
      .pipe(
        map((res) => ({
          status: res.status,
          data: { disputes: res.data.bookings.map(mapBookingFromApi) },
          pagination: normalizePagination(res.pagination),
        })),
        catchError(this.handleError),
      );
  }

  // ✅ Backend ready: PATCH /api/v1/admin/bookings/:id/resolve
  // (booking.routes.ts -> adminBookingController.resolveDispute), validated
  // against resolveDisputeSchema { resolution, reason } — matches this payload.
  resolve(bookingId: string, payload: ResolveDisputePayload): Observable<Booking> {
    return this.http
      .patch<{ status: string; data: { booking: Record<string, unknown> } }>(
        `${this.apiUrl}/${bookingId}/resolve`,
        payload,
      )
      .pipe(
        map((res) => mapBookingFromApi(res.data.booking)),
        catchError(this.handleError),
      );
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
