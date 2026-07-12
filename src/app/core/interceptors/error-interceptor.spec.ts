import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { errorInterceptor } from './error-interceptor';
import { environment } from '../../../environments/environment';

describe('errorInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => errorInterceptor(req, next));

  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should navigate to /forbidden on 403 error', () => {
    spyOn(router, 'navigate');

    httpClient.get(`${environment.apiUrl}/admin`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/admin`);
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should pass through 400 errors without navigation', () => {
    spyOn(router, 'navigate');

    httpClient.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should log 500 server errors to console', () => {
    spyOn(console, 'error');

    httpClient.get(`${environment.apiUrl}/users`).subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(console.error).toHaveBeenCalled();
  });

  it('should propagate the error after handling', () => {
    let capturedError: any;

    httpClient.get(`${environment.apiUrl}/users`).subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(capturedError).toBeTruthy();
    expect(capturedError.status).toBe(403);
  });
});
