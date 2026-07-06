import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Transactions, AdminAdjustmentPayload } from './transactions';
import { environment } from '../../../environments/environment';

describe('Transactions', () => {
  let service: Transactions;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/transactions/admin`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Transactions],
    });
    service = TestBed.inject(Transactions);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // getAll
  it('should fetch all transactions with normalized pagination', fakeAsync(() => {
    let result: any;
    service.getAll().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      data: {
        transactions: [
          {
            _id: 'TX-1',
            fromUser: { _id: 'U1', name: 'Ahmed' },
            toUser: { _id: 'U2', name: 'Sara' },
            amount: 100,
            type: 'session_payment',
            createdAt: '2025-05-20T00:00:00.000Z',
          },
        ],
      },
      pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
    });
    tick();

    expect(result.data.transactions.length).toBe(1);
    expect(result.data.transactions[0].sender).toBe('Ahmed');
    expect(result.pagination.totalCount).toBe(1);
  }));

  it('should attach query params when provided', fakeAsync(() => {
    service.getAll({ page: 2, limit: 20, type: 'refund', userId: 'U1' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === apiUrl &&
        r.params.get('page') === '2' &&
        r.params.get('limit') === '20' &&
        r.params.get('type') === 'refund' &&
        r.params.get('userId') === 'U1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      status: 'success',
      data: { transactions: [] },
      pagination: { page: 2, limit: 20, totalCount: 0, totalPages: 0 },
    });
    tick();
  }));

  it('should propagate errors from getAll', fakeAsync(() => {
    let capturedError: any;
    service.getAll().subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne((r) => r.url === apiUrl);
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
    tick();

    expect(capturedError).toBeTruthy();
  }));

  // adminAdjustment
  it('should call POST /transactions/admin with the adjustment payload', fakeAsync(() => {
    const payload: AdminAdjustmentPayload = {
      userId: 'U1',
      amount: 50,
      description: 'Manual credit adjustment',
    };
    let result: any;

    service.adminAdjustment(payload).subscribe((transaction) => (result = transaction));

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      status: 'success',
      data: {
        transaction: {
          _id: 'TX-99',
          fromUser: null,
          toUser: { _id: 'U1', name: 'Ahmed' },
          amount: 50,
          type: 'admin_adjustment',
          description: 'Manual credit adjustment',
          createdAt: '2025-06-01T00:00:00.000Z',
        },
      },
    });
    tick();

    expect(result.receiver).toBe('Ahmed');
    expect(result.amount).toBe(50);
    expect(result.type).toBe('admin_adjustment');
  }));

  it('should propagate errors from adminAdjustment', fakeAsync(() => {
    const payload: AdminAdjustmentPayload = {
      userId: 'U1',
      amount: -10,
      description: 'Violation penalty',
    };
    let capturedError: any;

    service.adminAdjustment(payload).subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne(apiUrl);
    req.flush(
      { message: 'Adjustment would bring the user wallet below zero' },
      { status: 400, statusText: 'Bad Request' },
    );
    tick();

    expect(capturedError).toBeTruthy();
  }));
});
