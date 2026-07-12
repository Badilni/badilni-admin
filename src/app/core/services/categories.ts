import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category';
import { mapCategoryFromApi, normalizePagination, NormalizedPagination } from '../mappers/api-mappers';

export interface CategoriesResponse {
  status: string;
  data: {
    categories: Category[];
  };
  pagination: NormalizedPagination;
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
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(params: CategoriesQueryParams = {}): Observable<CategoriesResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<{ status: string; data: { categories: Record<string, unknown>[] }; pagination: Record<string, number> }>(
        this.apiUrl,
        { params: httpParams },
      )
      .pipe(
        map((res) => ({
          status: res.status,
          data: { categories: res.data.categories.map(mapCategoryFromApi) },
          pagination: normalizePagination(res.pagination),
        })),
        catchError(this.handleError),
      );
  }

  getById(id: string): Observable<Category> {
    return this.http
      .get<{ status: string; data: { category: Record<string, unknown> } }>(`${this.apiUrl}/${id}`)
      .pipe(
        map((res) => mapCategoryFromApi(res.data.category)),
        catchError(this.handleError),
      );
  }

  create(data: Partial<Category>): Observable<Category> {
    const payload = {
      name: data.name,
      slug: data.slug,
      icon: data.icon,
      order: data.order,
      active: data.active,
    };
    return this.http
      .post<{ status: string; data: { category: Record<string, unknown> } }>(this.apiUrl, payload)
      .pipe(
        map((res) => mapCategoryFromApi(res.data.category)),
        catchError(this.handleError),
      );
  }

  update(id: string, data: Partial<Category>): Observable<Category> {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload['name'] = data.name;
    if (data.slug !== undefined) payload['slug'] = data.slug;
    if (data.icon !== undefined) payload['icon'] = data.icon;
    if (data.order !== undefined) payload['order'] = data.order;
    if (data.active !== undefined) payload['active'] = data.active;

    return this.http
      .patch<{ status: string; data: { category: Record<string, unknown> } }>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map((res) => mapCategoryFromApi(res.data.category)),
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
