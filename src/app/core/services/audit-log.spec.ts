import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AuditLog } from './audit-log';
import { environment } from '../../../environments/environment';

describe('AuditLog Service', () => {
  let service: AuditLog;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/admin/audit-log`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditLog],
    });
    service = TestBed.inject(AuditLog);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch audit logs and normalize pagination', fakeAsync(() => {
    let result: any;
    service.getAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      data: {
        logs: [
          {
            _id: 'LOG-1',
            admin: { _id: 'ADM-1', name: 'Admin One', email: 'admin@badilni.com' },
            action: 'suspend',
            targetId: 'USR-1',
            targetModel: 'User',
            details: { reason: 'Violation of terms' },
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    });
    tick();

    expect(result.data.logs.length).toBe(1);
    expect(result.pagination.totalCount).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  }));

  it('should resolve a populated admin object to its display name', fakeAsync(() => {
    let result: any;
    service.getAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    req.flush({
      status: 'success',
      data: {
        logs: [
          {
            _id: 'LOG-2',
            admin: { _id: 'ADM-2', name: 'Sara Admin' },
            action: 'delete',
            createdAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      },
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    });
    tick();

    expect(result.data.logs[0].admin).toBe('Sara Admin');
  }));

  it('should fall back to admin id when populated name is missing', fakeAsync(() => {
    let result: any;
    service.getAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    req.flush({
      status: 'success',
      data: {
        logs: [
          { _id: 'LOG-3', admin: { _id: 'ADM-3' }, action: 'unsuspend' },
        ],
      },
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    });
    tick();

    expect(result.data.logs[0].admin).toBe('ADM-3');
  }));

  it('should attach query params when provided', fakeAsync(() => {
    service
      .getAll({ page: 2, limit: 20, action: 'delete', admin: 'ADM-1', targetId: 'USR-1' })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === apiUrl &&
        r.params.get('page') === '2' &&
        r.params.get('limit') === '20' &&
        r.params.get('action') === 'delete' &&
        r.params.get('admin') === 'ADM-1' &&
        r.params.get('targetId') === 'USR-1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      data: { logs: [] },
      pagination: { total: 0, page: 2, limit: 20, pages: 0 },
    });
    tick();
  }));

  it('should propagate errors', fakeAsync(() => {
    let capturedError: any;
    service.getAll().subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
    tick();

    expect(capturedError).toBeTruthy();
  }));
});
