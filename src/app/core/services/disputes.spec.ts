import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { Disputes } from './disputes';
import { environment } from '../../../environments/environment';

describe('Disputes Service', () => {
  let service: Disputes;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/admin/bookings`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Disputes],
    });
    service = TestBed.inject(Disputes);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch disputes from /admin/bookings/disputes', fakeAsync(() => {
    let result: any;
    service.getAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/disputes`);
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      data: {
        bookings: [
          {
            _id: 'BK-1',
            provider: { _id: 'P1', name: 'Provider A' },
            receiver: { _id: 'R1', name: 'Receiver A' },
            listing: { _id: 'L1', title: 'Design' },
            creditsTotal: 100,
            durationHours: 1,
            scheduledAt: '2026-07-01T10:00:00.000Z',
            status: 'disputed',
          },
        ],
      },
      pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
    });
    tick();

    expect(result.data.disputes.length).toBe(1);
    expect(result.data.disputes[0].provider).toBe('Provider A');
    expect(result.pagination.totalCount).toBe(1);
  }));

  it('should resolve a dispute via PATCH /admin/bookings/:id/resolve', fakeAsync(() => {
    let result: any;
    service
      .resolve('BK-1', { resolution: 'favor_receiver', reason: 'Provider missed session' })
      .subscribe((booking) => (result = booking));

    const req = httpMock.expectOne(`${apiUrl}/BK-1/resolve`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      resolution: 'favor_receiver',
      reason: 'Provider missed session',
    });
    req.flush({
      status: 'success',
      data: {
        booking: {
          _id: 'BK-1',
          provider: { name: 'Provider A' },
          receiver: { name: 'Receiver A' },
          listing: { title: 'Design' },
          creditsTotal: 100,
          durationHours: 1,
          scheduledAt: '2026-07-01T10:00:00.000Z',
          status: 'completed',
        },
      },
    });
    tick();

    expect(result._id).toBe('BK-1');
    expect(result.status).toBe('completed');
  }));

  it('should propagate errors from getAll', fakeAsync(() => {
    let capturedError: any;
    service.getAll().subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/disputes`);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
    tick();

    expect(capturedError).toBeTruthy();
  }));
});
