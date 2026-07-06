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
  Math = Math;

  stats = signal<DashboardStats | null>(null);
  chartsData = signal<ChartsData | null>(null);
  isLoading = signal(true);

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
        this.stats.set({
          sessionsThisWeek: 1246,
          sessionsThisWeekChange: 8,
          openDisputes: 32,
          openDisputesChange: 21,
          pendingBookings: 74,
          pendingBookingsChange: 6,
          totalCreditsInCirculation: 45231,
          totalCreditsInEscrow: 5200,
          creditCirculationChange: 16,
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
            pending: { count: 74, percentage: 6 },
            accepted: { count: 120, percentage: 10 },
            declined: { count: 20, percentage: 2 },
            completed: { count: 566, percentage: 46 },
            disputed: { count: 144, percentage: 12 },
            cancelled: { count: 286, percentage: 24 },
          },
          creditFlow: [
            { date: '14', creditsIn: 4000, creditsOut: 2000 },
            { date: '15', creditsIn: 6000, creditsOut: 3000 },
            { date: '16', creditsIn: 8000, creditsOut: 4000 },
            { date: '17', creditsIn: 5000, creditsOut: 2500 },
            { date: '18', creditsIn: 9000, creditsOut: 5000 },
            { date: '19', creditsIn: 7000, creditsOut: 3500 },
            { date: '20', creditsIn: 10000, creditsOut: 4218 },
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
    const max = Math.max(...counts, 0);
    this.sessionDates.set(dates);
    this.sessionCounts.set(counts);
    this.maxSessionCount.set(max);
  }

  getBarHeight(count: number): number {
    const max = this.maxSessionCount();
    if (max === 0) return 0;
    return Math.round((count / max) * 100);
  }

  getCompletedPercent(): number {
    return this.chartsData()?.sessionsByStatus.completed.percentage ?? 0;
  }

  getCancelledPercent(): number {
    return this.chartsData()?.sessionsByStatus.cancelled.percentage ?? 0;
  }

  getDisputedPercent(): number {
    return this.chartsData()?.sessionsByStatus.disputed.percentage ?? 0;
  }

  formatNumber(value: number | undefined): string {
    if (value === undefined) return '0';
    return value.toLocaleString();
  }

  changeLabel(value: number | undefined): string {
    if (value === undefined) return '0%';
    return `${Math.abs(value)}% vs last week`;
  }

  isPositive(value: number | undefined): boolean {
    return (value ?? 0) >= 0;
  }
}
