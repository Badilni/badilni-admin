import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';
import {
  mapUserFromApi,
  mapUserToApi,
  normalizePagination,
  NormalizedPagination,
} from '../mappers/api-mappers';

export interface UsersResponse {
  status: string;
  data: {
    users: User[];
  };
  pagination: NormalizedPagination;
}

export interface UserResponse {
  status: string;
  data: {
    user: User;
  };
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  keyword?: string;
  role?: string;
  sort?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  status?: User['status'];
}

@Injectable({
  providedIn: 'root',
})
export class Users {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(params: UsersQueryParams = {}): Observable<UsersResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<{ status: string; data: { users: Record<string, unknown>[] }; pagination: Record<string, number> }>(
        this.apiUrl,
        { params: httpParams },
      )
      .pipe(
        map((res) => {
          let users = res.data.users.map(mapUserFromApi);
          if (params.role && params.role !== 'All Roles') {
            users = users.filter((u) => u.role === params.role);
          }
          return {
            status: res.status,
            data: { users },
            pagination: normalizePagination(res.pagination),
          };
        }),
        catchError(this.handleError),
      );
  }

  getById(id: string): Observable<User> {
    return this.http
      .get<{ status: string; data: { user: Record<string, unknown> } }>(`${this.apiUrl}/${id}`)
      .pipe(
        map((res) => mapUserFromApi(res.data.user)),
        catchError(this.handleError),
      );
  }

  create(data: CreateUserPayload): Observable<User> {
    const payload = mapUserToApi({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      status: data.status,
    });

    return this.http
      .post<{ status: string; data: { user: Record<string, unknown> } }>(this.apiUrl, payload)
      .pipe(
        map((res) => mapUserFromApi(res.data.user)),
        catchError(this.handleError),
      );
  }

  update(id: string, data: Partial<User>): Observable<User> {
    const payload = mapUserToApi(data);

    return this.http
      .patch<{ status: string; data: { user: Record<string, unknown> } }>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map((res) => mapUserFromApi(res.data.user)),
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
