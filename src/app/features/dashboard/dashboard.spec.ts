import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Dashboard } from './dashboard';
import { Dashboard as DashboardService } from '../../core/services/dashboard';

describe('Dashboard Component', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;

  const mockStats = {
    sessionsThisWeek: 1246,
    sessionsThisWeekChange: 8,
    openDisputes: 32,
    openDisputesChange: 21,
    pendingBookings: 74,
    pendingBookingsChange: 6,
    totalCreditsInCirculation: 45231,
    totalCreditsInEscrow: 5200,
    creditCirculationChange: 16,
  };

  const mockCharts = {
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
    ],
  };

  beforeEach(async () => {
    dashboardServiceSpy = jasmine.createSpyObj('Dashboard', ['getStats', 'getChartsData']);
    dashboardServiceSpy.getStats.and.returnValue(of(mockStats));
    dashboardServiceSpy.getChartsData.and.returnValue(of(mockCharts));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: DashboardService, useValue: dashboardServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats on init', fakeAsync(() => {
    tick();
    expect(component.stats()).toEqual(mockStats);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should load charts data on init', fakeAsync(() => {
    tick();
    expect(component.chartsData()).toEqual(mockCharts);
  }));

  it('should use mock data when stats API fails', fakeAsync(() => {
    dashboardServiceSpy.getStats.and.returnValue(throwError(() => new Error('Not found')));
    component.ngOnInit();
    tick();
    expect(component.stats()).toBeTruthy();
    expect(component.stats()?.sessionsThisWeek).toBe(1246);
  }));

  it('should use mock charts when charts API fails', fakeAsync(() => {
    dashboardServiceSpy.getChartsData.and.returnValue(throwError(() => new Error('Not found')));
    component.ngOnInit();
    tick();
    expect(component.chartsData()).toBeTruthy();
  }));

  it('should correctly calculate bar height', () => {
    component['maxSessionCount'].set(1246);
    expect(component.getBarHeight(623)).toBe(50);
  });

  it('should return 0 bar height when max is 0', () => {
    component['maxSessionCount'].set(0);
    expect(component.getBarHeight(100)).toBe(0);
  });

  it('should read completed/cancelled/disputed percentages from API', fakeAsync(() => {
    tick();
    expect(component.getCompletedPercent()).toBe(46);
    expect(component.getCancelledPercent()).toBe(24);
    expect(component.getDisputedPercent()).toBe(12);
  }));

  it('should format numbers with commas', () => {
    expect(component.formatNumber(2481)).toBe('2,481');
  });

  it('should format undefined as 0', () => {
    expect(component.formatNumber(undefined)).toBe('0');
  });

  it('should build session chart data from charts response', fakeAsync(() => {
    tick();
    expect(component.sessionDates().length).toBe(7);
    expect(component.sessionCounts().length).toBe(7);
    expect(component.maxSessionCount()).toBe(1246);
  }));

  it('isPositive should return true for zero/positive and false for negative', () => {
    expect(component.isPositive(5)).toBeTrue();
    expect(component.isPositive(0)).toBeTrue();
    expect(component.isPositive(-3)).toBeFalse();
  });
});
