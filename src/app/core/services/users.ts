import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';

export interface UsersResponse {
  status: string;
  data: {
    users: User[];
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
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
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<UsersResponse>(this.apiUrl, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  getById(id: string): Observable<User> {
    return this.http
      .get<UserResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map((res) => res.data.user),
        catchError(this.handleError),
      );
  }

  update(id: string, data: Partial<User>): Observable<User> {
    return this.http
      .patch<UserResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((res) => res.data.user),
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
