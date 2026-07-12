import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { signal, computed } from '@angular/core';

import { adminGuard } from './admin-guard';
import { Auth } from '../services/auth';

describe('adminGuard', () => {
  let router: Router;
  let isLoggedInSignal = signal(false);
  let role: 'admin' | 'user' = 'user';

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  beforeEach(() => {
    isLoggedInSignal = signal(false);
    role = 'user';

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        {
          provide: Auth,
          useValue: {
            isLoggedIn: isLoggedInSignal,
            isAdmin: computed(() => role === 'admin'),
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow activation for logged-in admin', () => {
    isLoggedInSignal.set(true);
    role = 'admin';

    const result = executeGuard({} as any, { url: '/admin/users' } as any);
    expect(result).toBeTrue();
  });

  it('should block non-admin logged-in user and redirect to /forbidden', () => {
    spyOn(router, 'navigate');
    isLoggedInSignal.set(true);
    role = 'user';

    const result = executeGuard({} as any, { url: '/admin/users' } as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should redirect unauthenticated user to login', () => {
    spyOn(router, 'navigate');
    isLoggedInSignal.set(false);

    const result = executeGuard({} as any, { url: '/admin/users' } as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/admin/users' } },
    );
  });
});
