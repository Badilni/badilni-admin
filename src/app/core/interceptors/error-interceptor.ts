import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 403:
          router.navigate(['/forbidden']);
          break;
        case 404:
          // Let components handle 404s individually
          break;
        case 500:
        case 502:
        case 503:
          console.error('Server error:', error.message);
          break;
      }
      return throwError(() => error);
    }),
  );
};
