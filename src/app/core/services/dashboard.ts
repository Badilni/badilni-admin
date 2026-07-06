import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, throwError } from 'rxjs';
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

export interface SessionsByStatusEntry {
  count: number;
  percentage: number;
}

export type SessionsByStatus = Record<
  'pending' | 'accepted' | 'declined' | 'completed' | 'disputed' | 'cancelled',
  SessionsByStatusEntry
>;

export interface CreditFlow {
  date: string;
  creditsIn: number;
  creditsOut: number;
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
  // ⚠️ Endpoint moved: booking.admin module now provides dashboard data,
  // replacing the old (never-implemented) /admin/dashboard/* endpoints.
  private readonly apiUrl = `${environment.apiUrl}/admin/bookings`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<DashboardStatsResponse>(`${this.apiUrl}/stats`)
      .pipe(
        map((res) => res.data.stats),
        catchError(this.handleError),
      );
  }

  getChartsData(days = 7): Observable<ChartsData> {
    const params = new HttpParams().set('days', days);

    return forkJoin({
      overview: this.http.get<{ status: string; data: { overview: SessionsOverview[] } }>(
        `${this.apiUrl}/overview`,
        { params },
      ),
      byStatus: this.http.get<{ status: string; data: { byStatus: SessionsByStatus } }>(
        `${this.apiUrl}/by-status`,
      ),
      creditFlow: this.http.get<{ status: string; data: { creditFlow: CreditFlow[] } }>(
        `${this.apiUrl}/credit-flow`,
        { params },
      ),
    }).pipe(
      map(({ overview, byStatus, creditFlow }) => ({
        sessionsOverview: overview.data.overview,
        sessionsByStatus: byStatus.data.byStatus,
        creditFlow: creditFlow.data.creditFlow,
      })),
      catchError(this.handleError),
    );
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
