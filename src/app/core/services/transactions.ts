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

export interface AdminAdjustmentPayload {
  userId: string;
  // Positive amount credits the user's wallet, negative deducts from it
  amount: number;
  description: string;
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

  // Admin-only credit adjustment — maps to POST /api/v1/transactions/admin
  adminAdjustment(payload: AdminAdjustmentPayload): Observable<Transaction> {
    return this.http
      .post<{ status: string; data: { transaction: Record<string, unknown> } }>(
        this.apiUrl,
        payload,
      )
      .pipe(
        map((res) => mapTransactionFromApi(res.data.transaction)),
        catchError(this.handleError),
      );
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
