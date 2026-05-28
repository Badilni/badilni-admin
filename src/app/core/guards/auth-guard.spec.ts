import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';

import { authGuard } from './auth-guard';
import { Auth } from '../services/auth';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authServiceSpy: jasmine.SpyObj<Auth>;
  let router: Router;

  beforeEach(() => {
    const isLoggedInSignal = signal(false);
    authServiceSpy = jasmine.createSpyObj('Auth', ['getToken'], {
      isLoggedIn: isLoggedInSignal,
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: Auth, useValue: authServiceSpy }],
    });

    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow activation when user is logged in', () => {
    (authServiceSpy as any).isLoggedIn = signal(true);

    const result = executeGuard(
      {} as any,
      { url: '/dashboard' } as any,
    );

    expect(result).toBeTrue();
  });

  it('should block activation and redirect to login when not logged in', () => {
    spyOn(router, 'navigate');
    (authServiceSpy as any).isLoggedIn = signal(false);

    const result = executeGuard(
      {} as any,
      { url: '/dashboard' } as any,
    );

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/dashboard' } },
    );
  });

  it('should pass returnUrl as query param when blocking access', () => {
    spyOn(router, 'navigate');
    (authServiceSpy as any).isLoggedIn = signal(false);

    executeGuard({} as any, { url: '/users/123' } as any);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/users/123' } },
    );
  });
});
