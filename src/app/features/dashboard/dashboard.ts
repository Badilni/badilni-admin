import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard as DashboardService, ChartsData } from '../../core/services/dashboard';
import { DashboardStats } from '../../core/models/dashboard-stats';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  stats = signal<DashboardStats | null>(null);
  chartsData = signal<ChartsData | null>(null);
  isLoading = signal(true);
  error = signal('');

  // Chart data helpers
  sessionDates = signal<string[]>([]);
  sessionCounts = signal<number[]>([]);
  maxSessionCount = signal(0);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadChartsData();
  }

  private loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        // ⚠️ BACKEND NOT READY: using mock data until /api/v1/admin/dashboard/stats is implemented
        this.stats.set({
          totalUsers: 2481,
          totalListings: 1246,
          totalTransactions: 45231,
          totalRevenue: 45231,
          activeDisputes: 32,
          newUsersToday: 128,
          completedBookingsToday: 1246,
          pendingBookings: 74,
        });
        this.isLoading.set(false);
      },
    });
  }

  private loadChartsData(): void {
    this.dashboardService.getChartsData().subscribe({
      next: (data) => {
        this.chartsData.set(data);
        this.buildSessionChart(data);
      },
      error: () => {
        // ⚠️ BACKEND NOT READY: using mock data until /api/v1/admin/dashboard/charts is implemented
        const mockCharts: ChartsData = {
          sessionsOverview: [
            { date: 'May 14', count: 300 },
            { date: 'May 15', count: 500 },
            { date: 'May 16', count: 800 },
            { date: 'May 17', count: 600 },
            { date: 'May 18', count: 1000 },
            { date: 'May 19', count: 900 },
            { date: 'May 20', count: 1246 },
          ],
          sessionsByStatus: {
            completed: 566,
            cancelled: 286,
            disputed: 144,
          },
          creditFlow: [
            { date: '14', income: 4000, outcome: -2000 },
            { date: '15', income: 6000, outcome: -3000 },
            { date: '16', income: 8000, outcome: -4000 },
            { date: '17', income: 5000, outcome: -2500 },
            { date: '18', income: 9000, outcome: -5000 },
            { date: '19', income: 7000, outcome: -3500 },
            { date: '20', income: 10000, outcome: -4218 },
          ],
        };
        this.chartsData.set(mockCharts);
        this.buildSessionChart(mockCharts);
      },
    });
  }

  private buildSessionChart(data: ChartsData): void {
    const dates = data.sessionsOverview.map((s) => s.date);
    const counts = data.sessionsOverview.map((s) => s.count);
    const max = Math.max(...counts);
    this.sessionDates.set(dates);
    this.sessionCounts.set(counts);
    this.maxSessionCount.set(max);
  }

  getBarHeight(count: number): number {
    const max = this.maxSessionCount();
    if (max === 0) return 0;
    return Math.round((count / max) * 100);
  }

  getSessionsTotal(): number {
    const d = this.chartsData();
    if (!d) return 0;
    return (
      d.sessionsByStatus.completed +
      d.sessionsByStatus.cancelled +
      d.sessionsByStatus.disputed
    );
  }

  getCompletedPercent(): number {
    const total = this.getSessionsTotal();
    if (total === 0) return 0;
    return Math.round(
      ((this.chartsData()?.sessionsByStatus.completed ?? 0) / total) * 100,
    );
  }

  getCancelledPercent(): number {
    const total = this.getSessionsTotal();
    if (total === 0) return 0;
    return Math.round(
      ((this.chartsData()?.sessionsByStatus.cancelled ?? 0) / total) * 100,
    );
  }

  getDisputedPercent(): number {
    const total = this.getSessionsTotal();
    if (total === 0) return 0;
    return Math.round(
      ((this.chartsData()?.sessionsByStatus.disputed ?? 0) / total) * 100,
    );
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined) return '0';
    return value.toLocaleString();
  }
}
