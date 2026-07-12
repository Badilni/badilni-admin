import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { NotificationsService } from './notifications';
import { environment } from '../../../environments/environment';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/notifications`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationsService],
    });
    service = TestBed.inject(NotificationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map backend notifications (body -> message, ADMIN_ANNOUNCEMENT -> system)', fakeAsync(() => {
    let result: any;
    service.getAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      unreadCount: 1,
      data: {
        notifications: [
          {
            _id: 'N-1',
            type: 'ADMIN_ANNOUNCEMENT',
            title: 'Maintenance',
            body: 'Scheduled downtime tonight',
            createdAt: '2026-07-01T00:00:00.000Z',
          },
        ],
      },
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    });
    tick();

    expect(result.data.notifications[0].message).toBe('Scheduled downtime tonight');
    expect(result.data.notifications[0].type).toBe('system');
    expect(result.data.notifications[0].target).toBe('broadcast');
    expect(result.pagination.totalCount).toBe(1);
  }));

  it('should send admin notification with backend payload shape', fakeAsync(() => {
    let result: any;
    service
      .send({
        title: 'Hello',
        message: 'World',
        type: 'info',
        target: 'broadcast',
      })
      .subscribe((notification) => (result = notification));

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Hello',
      message: 'World',
      target: 'broadcast',
      userId: undefined,
    });
    req.flush({
      status: 'success',
      data: {
        count: 10,
        notification: {
          _id: 'N-2',
          type: 'ADMIN_ANNOUNCEMENT',
          title: 'Hello',
          body: 'World',
        },
      },
    });
    tick();

    expect(result.title).toBe('Hello');
    expect(result.message).toBe('World');
    expect(result.type).toBe('system');
  }));

  it('should delete a notification', fakeAsync(() => {
    let completed = false;
    service.delete('N-1').subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${apiUrl}/N-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    tick();

    expect(completed).toBeTrue();
  }));

  it('should propagate errors from getAll', fakeAsync(() => {
    let capturedError: any;
    service.getAll().subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
    tick();

    expect(capturedError).toBeTruthy();
  }));
});
