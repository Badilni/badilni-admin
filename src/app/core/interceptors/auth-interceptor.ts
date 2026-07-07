// src/app/core/interceptors/auth-interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, shareReplay, switchMap, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { AuthResponse } from '../models/auth-response';

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

/**
 * Coordinates concurrent refresh attempts so only one /auth/refresh request
 * is ever in flight at a time.
 *
 * The backend rate-limits /auth/refresh to just 2 requests per 15 minutes,
 * keyed loosely by IP (the route runs before `protect`, so it can't key by
 * user). Pages that fire several requests in parallel - the dashboard's
 * forkJoin calls, for example - would otherwise each independently notice
 * the same expired/invalid token and each call refreshToken() on their own,
 * burning through that tiny limit inside a single page load. The extra
 * calls then come back 429, and the interceptor used to treat that as
 * "refresh failed" and force a logout - even though the very first refresh
 * in the batch had actually succeeded. Sharing one in-flight refresh across
 * every concurrent failing request fixes both symptoms: submitted
 * POST/PATCH requests retry with the real new token instead of erroring
 * out, and the user is no longer bounced back to the login page for
 * something that wasn't a genuine auth failure.
 */
@Injectable({ providedIn: 'root' })
class AuthRefreshCoordinator {
  private pendingRefresh: Observable<string> | null = null;

  constructor(private authService: Auth) {}

  refresh(): Observable<string> {
    if (!this.pendingRefresh) {
      this.pendingRefresh = this.authService.refreshToken().pipe(
        map((res: AuthResponse) => res.accessToken),
        shareReplay(1),
      );

      // Free the slot once this refresh settles (success or failure) so a
      // later, genuinely new expiry can trigger a fresh refresh call.
      this.pendingRefresh.subscribe({
        complete: () => (this.pendingRefresh = null),
        error: () => (this.pendingRefresh = null),
      });
    }

    return this.pendingRefresh;
  }
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const refreshCoordinator = inject(AuthRefreshCoordinator);

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
      // route, try refreshing it once before giving up. Concurrent
      // failures from other in-flight requests share this same refresh
      // call instead of each starting their own (see AuthRefreshCoordinator).
      if (isAuthRelatedError(error) && !isAuthEndpoint) {
        return refreshCoordinator.refresh().pipe(
          switchMap((newToken) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
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