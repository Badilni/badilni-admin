import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { Auth } from './auth';
import { AuthResponse, ApiResponse, UserProfile } from '../models/auth-response';
import { environment } from '../../../environments/environment';

const mockUser: UserProfile = {
  _id: '123',
  name: 'Admin User',
  email: 'admin@badilni.com',
  role: 'admin',
  isVerified: true,
};

const mockAuthResponse: AuthResponse = {
  status: 'success',
  accessToken: 'mock-access-token',
  data: { user: mockUser },
};

describe('Auth Service', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  let router: Router;
  const apiUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [Auth],
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Initial state ───────────────────────────────────────────────
  it('should initialize as logged out when no token exists', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should initialize as logged in when token exists in localStorage', () => {
    localStorage.setItem('badilni_access_token', 'existing-token');
    localStorage.setItem('badilni_user', JSON.stringify(mockUser));
    const freshService = new Auth(
      TestBed.inject(require('@angular/common/http').HttpClient),
      router,
    );
    expect(freshService.isLoggedIn()).toBeTrue();
    expect(freshService.currentUser()).toEqual(mockUser);
  });

  // ── Token helpers ────────────────────────────────────────────────
  it('getToken() should return null when no token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken() should return token after login', fakeAsync(() => {
    service.login({ email: 'admin@badilni.com', password: 'password' }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush(mockAuthResponse);
    tick();
    expect(service.getToken()).toBe('mock-access-token');
  }));

  // ── Login ────────────────────────────────────────────────────────
  it('should set token and user on successful login', fakeAsync(() => {
    service.login({ email: 'admin@badilni.com', password: 'password' }).subscribe((res) => {
      expect(res.accessToken).toBe('mock-access-token');
    });
    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
    tick();
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.currentUser()).toEqual(mockUser);
    expect(localStorage.getItem('badilni_access_token')).toBe('mock-access-token');
  }));

  it('should return error on failed login', fakeAsync(() => {
    let errorMsg = '';
    service.login({ email: 'bad@email.com', password: 'wrong' }).subscribe({
      error: (err: Error) => (errorMsg = err.message),
    });
    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush({ message: 'Incorrect email or password' }, { status: 401, statusText: 'Unauthorized' });
    tick();
    expect(errorMsg).toBe('Incorrect email or password');
  }));

  // ── Logout ───────────────────────────────────────────────────────
  it('should clear session and navigate to login on logout', fakeAsync(() => {
    spyOn(router, 'navigate');
    // Seed session
    localStorage.setItem('badilni_access_token', 'token');
    localStorage.setItem('badilni_user', JSON.stringify(mockUser));

    service.logout().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/logout`);
    req.flush({ status: 'success' });
    tick();

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('badilni_access_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  }));

  it('should clear session even if logout request fails', fakeAsync(() => {
    spyOn(router, 'navigate');
    localStorage.setItem('badilni_access_token', 'token');

    service.logout().subscribe({ error: () => {} });
    const req = httpMock.expectOne(`${apiUrl}/logout`);
    req.flush({}, { status: 500, statusText: 'Server Error' });
    tick();

    expect(service.isLoggedIn()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  }));

  // ── Verify email ─────────────────────────────────────────────────
  it('should set token and user on successful email verification', fakeAsync(() => {
    service.verifyEmail({ email: 'test@test.com', code: 'ABC123' }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/verify-email`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
    tick();
    expect(service.isLoggedIn()).toBeTrue();
  }));

  // ── Forgot password ──────────────────────────────────────────────
  it('should call forgot-password endpoint', fakeAsync(() => {
    const mockRes: ApiResponse = { status: 'success', message: 'Email sent' };
    service.forgotPassword({ email: 'admin@badilni.com' }).subscribe((res) => {
      expect(res.status).toBe('success');
    });
    const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRes);
    tick();
  }));

  // ── Reset password ───────────────────────────────────────────────
  it('should set token on successful password reset', fakeAsync(() => {
    service
      .resetPassword({ email: 'admin@badilni.com', code: 'ABC123', password: 'newPass123' })
      .subscribe();
    const req = httpMock.expectOne(`${apiUrl}/reset-password`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockAuthResponse);
    tick();
    expect(service.getToken()).toBe('mock-access-token');
  }));

  // ── isAdmin computed ─────────────────────────────────────────────
  it('isAdmin should return true for admin role', fakeAsync(() => {
    service.login({ email: 'admin@badilni.com', password: 'password' }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush(mockAuthResponse);
    tick();
    expect(service.isAdmin()).toBeTrue();
  }));

  it('isAdmin should return false for regular user', fakeAsync(() => {
    const userResponse: AuthResponse = {
      ...mockAuthResponse,
      data: { user: { ...mockUser, role: 'user' } },
    };
    service.login({ email: 'user@badilni.com', password: 'password' }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush(userResponse);
    tick();
    expect(service.isAdmin()).toBeFalse();
  }));

  // ── Refresh token ────────────────────────────────────────────────
  it('should update token on successful refresh', fakeAsync(() => {
    service.refreshToken().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
    tick();
    expect(service.getToken()).toBe('mock-access-token');
  }));

  it('should navigate to login and clear session on failed refresh', fakeAsync(() => {
    spyOn(router, 'navigate');
    service.refreshToken().subscribe({ error: () => {} });
    const req = httpMock.expectOne(`${apiUrl}/refresh`);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    tick();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(service.isLoggedIn()).toBeFalse();
  }));

  // ── Error handling ───────────────────────────────────────────────
  it('should return network error message when status is 0', fakeAsync(() => {
    let errorMsg = '';
    service.login({ email: 'admin@badilni.com', password: 'pass' }).subscribe({
      error: (err: Error) => (errorMsg = err.message),
    });
    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush(null, { status: 0, statusText: 'Unknown Error' });
    tick();
    expect(errorMsg).toContain('Unable to connect');
  }));

  it('should return 429 rate limit message', fakeAsync(() => {
    let errorMsg = '';
    service.login({ email: 'admin@badilni.com', password: 'pass' }).subscribe({
      error: (err: Error) => (errorMsg = err.message),
    });
    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush({ message: 'Too many login attempts. Please try again in 15 minutes' }, {
      status: 429,
      statusText: 'Too Many Requests',
    });
    tick();
    expect(errorMsg).toContain('Too many');
  }));
});
