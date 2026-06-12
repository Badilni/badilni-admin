import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardStats } from '../models/dashboard-stats';

export interface DashboardStatsResponse {
  status: string;
  data: {
    stats: DashboardStats;
  };
}

export interface SessionsOverview {
  date: string;
  count: number;
}

export interface SessionsByStatus {
  completed: number;
  cancelled: number;
  disputed: number;
}

export interface CreditFlow {
  date: string;
  income: number;
  outcome: number;
}

export interface ChartsData {
  sessionsOverview: SessionsOverview[];
  sessionsByStatus: SessionsByStatus;
  creditFlow: CreditFlow[];
}

@Injectable({
  providedIn: 'root',
})
export class Dashboard {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<DashboardStatsResponse>(`${this.apiUrl}/admin/dashboard/stats`)
      .pipe(
        map((res) => res.data.stats),
        catchError(this.handleError),
      );
  }

  getChartsData(): Observable<ChartsData> {
    return this.http
      .get<{ status: string; data: ChartsData }>(
        `${this.apiUrl}/admin/dashboard/charts`,
      )
      .pipe(
        map((res) => res.data),
        catchError(this.handleError),
      );
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
