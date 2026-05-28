import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal, computed } from '@angular/core';

import { adminGuard } from './admin-guard';
import { Auth } from '../services/auth';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let router: Router;

  function createAuthSpy(isLoggedIn: boolean, role: 'admin' | 'user' = 'user') {
    const isLoggedInSig = signal(isLoggedIn);
    const isAdminSig = computed(() => role === 'admin');
    return {
      isLoggedIn: isLoggedInSig,
      isAdmin: isAdminSig,
    } as unknown as Auth;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
    });
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow activation for logged-in admin', () => {
    TestBed.overrideProvider(Auth, { useValue: createAuthSpy(true, 'admin') });

    const result = executeGuard({} as any, { url: '/admin/users' } as any);
    expect(result).toBeTrue();
  });

  it('should block non-admin logged-in user and redirect to /forbidden', () => {
    spyOn(router, 'navigate');
    TestBed.overrideProvider(Auth, { useValue: createAuthSpy(true, 'user') });

    const result = executeGuard({} as any, { url: '/admin/users' } as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should redirect unauthenticated user to login', () => {
    spyOn(router, 'navigate');
    TestBed.overrideProvider(Auth, { useValue: createAuthSpy(false) });

    const result = executeGuard({} as any, { url: '/admin/users' } as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/admin/users' } },
    );
  });
});
