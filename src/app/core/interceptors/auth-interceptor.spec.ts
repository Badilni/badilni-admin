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
import { of, throwError } from 'rxjs';

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
});
