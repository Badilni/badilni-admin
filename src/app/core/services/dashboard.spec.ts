import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { Dashboard } from './dashboard';
import { environment } from '../../../environments/environment';

describe('Dashboard Service', () => {
  let service: Dashboard;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/admin/bookings`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Dashboard],
    });
    service = TestBed.inject(Dashboard);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dashboard stats from /admin/bookings/stats', fakeAsync(() => {
    let result: any;
    service.getStats().subscribe((stats) => (result = stats));

    const req = httpMock.expectOne(`${apiUrl}/stats`);
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      data: {
        stats: {
          sessionsThisWeek: 100,
          sessionsThisWeekChange: 5,
          openDisputes: 3,
          openDisputesChange: -10,
          pendingBookings: 12,
          pendingBookingsChange: 2,
          totalCreditsInCirculation: 5000,
          totalCreditsInEscrow: 400,
          creditCirculationChange: 8,
        },
      },
    });
    tick();

    expect(result.sessionsThisWeek).toBe(100);
    expect(result.openDisputes).toBe(3);
  }));

  it('should fetch charts data from overview, by-status, and credit-flow', fakeAsync(() => {
    let result: any;
    service.getChartsData(7).subscribe((charts) => (result = charts));

    const overviewReq = httpMock.expectOne(
      (r) => r.url === `${apiUrl}/overview` && r.params.get('days') === '7',
    );
    const byStatusReq = httpMock.expectOne(`${apiUrl}/by-status`);
    const creditFlowReq = httpMock.expectOne(
      (r) => r.url === `${apiUrl}/credit-flow` && r.params.get('days') === '7',
    );

    overviewReq.flush({
      status: 'success',
      data: { overview: [{ date: '2026-07-01', count: 10 }] },
    });
    byStatusReq.flush({
      status: 'success',
      data: {
        byStatus: {
          pending: { count: 1, percentage: 10 },
          accepted: { count: 2, percentage: 20 },
          declined: { count: 0, percentage: 0 },
          completed: { count: 5, percentage: 50 },
          disputed: { count: 1, percentage: 10 },
          cancelled: { count: 1, percentage: 10 },
        },
      },
    });
    creditFlowReq.flush({
      status: 'success',
      data: { creditFlow: [{ date: '01', creditsIn: 100, creditsOut: 50 }] },
    });
    tick();

    expect(result.sessionsOverview.length).toBe(1);
    expect(result.sessionsByStatus.completed.count).toBe(5);
    expect(result.creditFlow[0].creditsIn).toBe(100);
  }));

  it('should propagate errors from getStats', fakeAsync(() => {
    let capturedError: any;
    service.getStats().subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne(`${apiUrl}/stats`);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
    tick();

    expect(capturedError).toBeTruthy();
  }));
});
