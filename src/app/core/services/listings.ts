import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Listing } from '../models/listing';
import {
  mapListingFromApi,
  mapListingToApi,
  normalizePagination,
  NormalizedPagination,
} from '../mappers/api-mappers';

export interface ListingsResponse {
  status: string;
  data: {
    listings: Listing[];
  };
  pagination: NormalizedPagination;
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
  private readonly apiUrl = `${environment.apiUrl}/skill-listings`;

  constructor(private http: HttpClient) {}

  getAll(params: ListingsQueryParams = {}): Observable<ListingsResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    if (params.status === 'active') {
      httpParams = httpParams.set('isActive', 'true');
    } else if (params.status === 'inactive') {
      httpParams = httpParams.set('isActive', 'false');
    }

    return this.http
      .get<{ status: string; data: { skillListings: Record<string, unknown>[] }; pagination: Record<string, number> }>(
        this.apiUrl,
        { params: httpParams },
      )
      .pipe(
        map((res) => ({
          status: res.status,
          data: { listings: res.data.skillListings.map(mapListingFromApi) },
          pagination: normalizePagination(res.pagination),
        })),
        catchError(this.handleError),
      );
  }

  getById(id: string): Observable<Listing> {
    return this.http
      .get<{ status: string; data: { skillListing: Record<string, unknown> } }>(`${this.apiUrl}/${id}`)
      .pipe(
        map((res) => mapListingFromApi(res.data.skillListing)),
        catchError(this.handleError),
      );
  }

  create(data: Partial<Listing>): Observable<Listing> {
    const payload = mapListingToApi(data);

    return this.http
      .post<{ status: string; data: { skillListing: Record<string, unknown> } }>(this.apiUrl, payload)
      .pipe(
        map((res) => mapListingFromApi(res.data.skillListing)),
        catchError(this.handleError),
      );
  }

  update(id: string, data: Partial<Listing>): Observable<Listing> {
    const payload = mapListingToApi(data);

    return this.http
      .patch<{ status: string; data: { skillListing: Record<string, unknown> } }>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map((res) => mapListingFromApi(res.data.skillListing)),
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
