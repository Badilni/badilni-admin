import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Transaction } from '../models/transaction';
import {
  mapTransactionFromApi,
  normalizePagination,
  NormalizedPagination,
} from '../mappers/api-mappers';

export interface TransactionsResponse {
  status: string;
  data: {
    transactions: Transaction[];
  };
  pagination: NormalizedPagination;
}

export interface TransactionsQueryParams {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Transactions {
  private readonly apiUrl = `${environment.apiUrl}/transactions/admin`;

  constructor(private http: HttpClient) {}

  getAll(params: TransactionsQueryParams = {}): Observable<TransactionsResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.userId) httpParams = httpParams.set('userId', params.userId);

    return this.http
      .get<{ status: string; data: { transactions: Record<string, unknown>[] }; pagination: Record<string, number> }>(
        this.apiUrl,
        { params: httpParams },
      )
      .pipe(
        map((res) => ({
          status: res.status,
          data: { transactions: res.data.transactions.map(mapTransactionFromApi) },
          pagination: normalizePagination(res.pagination),
        })),
        catchError(this.handleError),
      );
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
