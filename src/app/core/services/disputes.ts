import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Booking } from '../models/booking';

export interface DisputesResponse {
  status: string;
  data: {
    disputes: Booking[];
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface DisputeResponse {
  status: string;
  data: {
    dispute: Booking;
  };
}

export interface ResolveDisputePayload {
  resolution: 'favor_provider' | 'favor_receiver' | 'split' | 'refund';
  reason: string;
}

export interface DisputesQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Disputes {
  // ⚠️ BACKEND NOT READY: /api/v1/disputes admin endpoint not yet implemented
  private readonly apiUrl = `${environment.apiUrl}/disputes`;

  constructor(private http: HttpClient) {}

  getAll(params: DisputesQueryParams = {}): Observable<DisputesResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<DisputesResponse>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  resolve(
    bookingId: string,
    payload: ResolveDisputePayload,
  ): Observable<Booking> {
    return this.http
      .patch<DisputeResponse>(`${this.apiUrl}/${bookingId}/resolve`, payload)
      .pipe(
        map((res) => res.data.dispute),
        catchError(this.handleError),
      );
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
