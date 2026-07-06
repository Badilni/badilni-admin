import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from '../services/auth';

// The backend's dev-mode error handler does not convert JWT errors (invalid/
// expired token) into a 401 AppError - it lets sendErrorDev return them with
// a raw statusCode of 500 instead. To keep the refresh-token flow working
// regardless of that backend behaviour, we also treat a 500 response as an
// auth failure when its body carries a recognizable JWT error signature.
const JWT_ERROR_NAMES = new Set(['JsonWebTokenError', 'TokenExpiredError']);

const isAuthRelatedError = (error: HttpErrorResponse): boolean => {
  if (error.status === 401) {
    return true;
  }

  if (error.status !== 500) {
    return false;
  }

  const body = error.error as { name?: string; message?: string } | null;
  if (!body) {
    return false;
  }

  if (body.name && JWT_ERROR_NAMES.has(body.name)) {
    return true;
  }

  const message = body.message?.toLowerCase() ?? '';
  return message.includes('jwt') || message.includes('log in');
};

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // Skip attaching token for auth endpoints
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/signup') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/verify-email') ||
    req.url.includes('/auth/resend-verification') ||
    req.url.includes('/auth/refresh');

  const token = authService.getToken();

  const authReq =
    token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If the token appears invalid/expired and not already on an auth
      // route, try refreshing it once before giving up.
      if (isAuthRelatedError(error) && !isAuthEndpoint) {
        return authService.refreshToken().pipe(
          switchMap((res) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};