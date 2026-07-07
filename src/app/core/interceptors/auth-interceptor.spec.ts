// src/app/core/interceptors/auth-interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  HttpClient,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';

import { authInterceptor } from './auth-interceptor';
import { Auth } from '../services/auth';
import { environment } from '../../../environments/environment';
import { of, throwError, Subject } from 'rxjs';
import { AuthResponse } from '../models/auth-response';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Auth', ['getToken', 'refreshToken'], {
      isLoggedIn: { set: jasmine.createSpy() },
      currentUser: { set: jasmine.createSpy() },
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        { provide: Auth, useValue: spy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should attach Authorization header when token exists and not auth endpoint', () => {
    authService.getToken.and.returnValue('test-token');

    httpClient.get(`${environment.apiUrl}/users`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should NOT attach Authorization header for login endpoint', () => {
    authService.getToken.and.returnValue('test-token');

    httpClient.post(`${environment.apiUrl}/auth/login`, {}).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should NOT attach Authorization header for signup endpoint', () => {
    authService.getToken.and.returnValue('test-token');

    httpClient.post(`${environment.apiUrl}/auth/signup`, {}).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/signup`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should NOT attach Authorization header when no token', () => {
    authService.getToken.and.returnValue(null);

    httpClient.get(`${environment.apiUrl}/users`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should attempt token refresh on 401 response', () => {
    authService.getToken.and.returnValue('expired-token');
    authService.refreshToken.and.returnValue(
      of({ status: 'success', accessToken: 'new-token', data: { user: {} as any } })
    );

    httpClient.get(`${environment.apiUrl}/users`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({});
  });

  it('should attempt token refresh on a 500 response carrying a JsonWebTokenError name', () => {
    authService.getToken.and.returnValue('bad-token');
    authService.refreshToken.and.returnValue(
      of({ status: 'success', accessToken: 'new-token', data: { user: {} as any } })
    );

    httpClient.get(`${environment.apiUrl}/admin/bookings/stats`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/bookings/stats`);
    req.flush(
      { status: 'error', message: 'jwt malformed', name: 'JsonWebTokenError' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    const retryReq = httpMock.expectOne(`${environment.apiUrl}/admin/bookings/stats`);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({});
  });

  it('should attempt token refresh on a 500 response carrying a TokenExpiredError name', () => {
    authService.getToken.and.returnValue('expired-token');
    authService.refreshToken.and.returnValue(
      of({ status: 'success', accessToken: 'new-token', data: { user: {} as any } })
    );

    httpClient.get(`${environment.apiUrl}/transactions/admin`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/transactions/admin`);
    req.flush(
      { status: 'error', message: 'jwt expired', name: 'TokenExpiredError' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    const retryReq = httpMock.expectOne(`${environment.apiUrl}/transactions/admin`);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({});
  });

  it('should NOT attempt token refresh on a 500 response unrelated to auth', () => {
    authService.getToken.and.returnValue('valid-token');

    httpClient.get(`${environment.apiUrl}/categories`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/categories`);
    req.flush(
      { status: 'error', message: 'Something went wrong!' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(authService.refreshToken).not.toHaveBeenCalled();
  });

  it('should NOT attempt token refresh on a 404 response', () => {
    authService.getToken.and.returnValue('valid-token');

    httpClient.get(`${environment.apiUrl}/admin/audit-log`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin/audit-log`);
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(authService.refreshToken).not.toHaveBeenCalled();
  });

  it('should navigate to login when refresh also fails after a JWT-like 500', () => {
    authService.getToken.and.returnValue('bad-token');
    authService.refreshToken.and.returnValue(
      throwError(() => new Error('Refresh failed')),
    );

    httpClient.get(`${environment.apiUrl}/users`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    req.flush(
      { status: 'error', message: 'jwt expired', name: 'TokenExpiredError' },
      { status: 500, statusText: 'Internal Server Error' },
    );
  });

  // ── Concurrency: only one refresh call for simultaneous auth failures ──

  it('should only call refreshToken once when multiple requests fail with an auth error at the same time', () => {
    authService.getToken.and.returnValue('expired-token');

    const refreshSubject = new Subject<AuthResponse>();
    authService.refreshToken.and.returnValue(refreshSubject.asObservable());

    httpClient.get(`${environment.apiUrl}/users`).subscribe();
    httpClient.get(`${environment.apiUrl}/categories`).subscribe();

    const req1 = httpMock.expectOne(`${environment.apiUrl}/users`);
    const req2 = httpMock.expectOne(`${environment.apiUrl}/categories`);

    // Both requests fail with an auth-related error before the refresh
    // resolves - this is the "several parallel calls, one expired token"
    // scenario (e.g. the dashboard's forkJoin).
    req1.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    req2.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.refreshToken).toHaveBeenCalledTimes(1);

    refreshSubject.next({
      status: 'success',
      accessToken: 'shared-token',
      data: { user: {} as any },
    });
    refreshSubject.complete();

    const retry1 = httpMock.expectOne(`${environment.apiUrl}/users`);
    const retry2 = httpMock.expectOne(`${environment.apiUrl}/categories`);

    expect(retry1.request.headers.get('Authorization')).toBe('Bearer shared-token');
    expect(retry2.request.headers.get('Authorization')).toBe('Bearer shared-token');

    retry1.flush({});
    retry2.flush({});
  });

  it('should call refreshToken again for a new auth failure after a previous refresh has settled', () => {
    authService.getToken.and.returnValue('expired-token');
    authService.refreshToken.and.returnValues(
      of({ status: 'success', accessToken: 'first-token', data: { user: {} as any } }),
      of({ status: 'success', accessToken: 'second-token', data: { user: {} as any } }),
    );

    httpClient.get(`${environment.apiUrl}/users`).subscribe();
    const req1 = httpMock.expectOne(`${environment.apiUrl}/users`);
    req1.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    const retry1 = httpMock.expectOne(`${environment.apiUrl}/users`);
    retry1.flush({});

    httpClient.get(`${environment.apiUrl}/categories`).subscribe();
    const req2 = httpMock.expectOne(`${environment.apiUrl}/categories`);
    req2.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    const retry2 = httpMock.expectOne(`${environment.apiUrl}/categories`);
    expect(retry2.request.headers.get('Authorization')).toBe('Bearer second-token');
    retry2.flush({});

    expect(authService.refreshToken).toHaveBeenCalledTimes(2);
  });
});
