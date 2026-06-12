import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category';

export interface CategoriesResponse {
  status: string;
  data: {
    categories: Category[];
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CategoryResponse {
  status: string;
  data: {
    category: Category;
  };
}

export interface CategoriesQueryParams {
  page?: number;
  limit?: number;
  keyword?: string;
  sort?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Categories {
  // ⚠️ BACKEND NOT READY: /api/v1/categories endpoint not yet implemented
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(params: CategoriesQueryParams = {}): Observable<CategoriesResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<CategoriesResponse>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  getById(id: string): Observable<Category> {
    return this.http
      .get<CategoryResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map((res) => res.data.category),
        catchError(this.handleError),
      );
  }

  create(data: Partial<Category>): Observable<Category> {
    return this.http
      .post<CategoryResponse>(this.apiUrl, data)
      .pipe(
        map((res) => res.data.category),
        catchError(this.handleError),
      );
  }

  update(id: string, data: Partial<Category>): Observable<Category> {
    return this.http
      .patch<CategoryResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((res) => res.data.category),
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
