import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Listing } from '../models/listing';

export interface ListingsResponse {
  status: string;
  data: {
    listings: Listing[];
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface ListingResponse {
  status: string;
  data: {
    listing: Listing;
  };
}

export interface ListingsQueryParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Listings {
  // ⚠️ BACKEND NOT READY: /api/v1/listings endpoint not yet implemented
  private readonly apiUrl = `${environment.apiUrl}/listings`;

  constructor(private http: HttpClient) {}

  getAll(params: ListingsQueryParams = {}): Observable<ListingsResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<ListingsResponse>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  getById(id: string): Observable<Listing> {
    return this.http
      .get<ListingResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map((res) => res.data.listing),
        catchError(this.handleError),
      );
  }

  create(data: Partial<Listing>): Observable<Listing> {
    return this.http
      .post<ListingResponse>(this.apiUrl, data)
      .pipe(
        map((res) => res.data.listing),
        catchError(this.handleError),
      );
  }

  update(id: string, data: Partial<Listing>): Observable<Listing> {
    return this.http
      .patch<ListingResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((res) => res.data.listing),
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
