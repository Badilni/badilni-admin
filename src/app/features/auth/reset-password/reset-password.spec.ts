import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ResetPassword } from './reset-password';
import { Auth } from '../../../core/services/auth';
import { AuthResponse } from '../../../core/models/auth-response';

const mockAuthResponse: AuthResponse = {
  status: 'success',
  accessToken: 'mock-token',
  data: {
    user: {
      _id: '123',
      name: 'Admin',
      email: 'admin@badilni.com',
      role: 'admin',
      isVerified: true,
    },
  },
};

describe('ResetPassword Component', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<Auth>;
  let activatedRouteSpy: { queryParams: any };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('Auth', ['resetPassword']);
    activatedRouteSpy = { queryParams: of({ email: 'admin@badilni.com' }) };

    await TestBed.configureTestingModule({
      imports: [ResetPassword, FormsModule, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ──────────────────────────────────────────────────────
  it('should read email from query params on init', () => {
    expect(component.email).toBe('admin@badilni.com');
  });

  it('should handle missing email query param gracefully', async () => {
    activatedRouteSpy.queryParams = of({});
    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.email).toBe('');
  });

  // ── Initial state ─────────────────────────────────────────────────
  it('should initialize signals correctly', () => {
    expect(component.isLoading()).toBeFalse();
    expect(component.showPassword()).toBeFalse();
    expect(component.showConfirmPassword()).toBeFalse();
    expect(component.codeError()).toBe('');
    expect(component.passwordError()).toBe('');
    expect(component.confirmPasswordError()).toBe('');
    expect(component.errorMessage()).toBe('');
  });

  // ── Toggle password ───────────────────────────────────────────────
  it('should toggle showPassword', () => {
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
    component.togglePassword();
    expect(component.showPassword()).toBeFalse();
  });

  it('should toggle showConfirmPassword', () => {
    component.toggleConfirmPassword();
    expect(component.showConfirmPassword()).toBeTrue();
  });

  // ── Code validation ───────────────────────────────────────────────
  it('should set codeError when code is empty', () => {
    component.code = '';
    component.onCodeBlur();
    expect(component.codeError()).toBe('Reset code is required');
  });

  it('should set codeError when code length is not 6', () => {
    component.code = 'ABC';
    component.onCodeBlur();
    expect(component.codeError()).toBe('Reset code must be 6 characters');
  });

  it('should clear codeError for valid 6-char code', () => {
    component.code = 'ABC123';
    component.onCodeBlur();
    expect(component.codeError()).toBe('');
  });

  // ── Password validation ───────────────────────────────────────────
  it('should set passwordError when password is empty', () => {
    component.newPassword = '';
    component.onPasswordBlur();
    expect(component.passwordError()).toBe('Password is required');
  });

  it('should set passwordError when password is too short', () => {
    component.newPassword = 'short';
    component.onPasswordBlur();
    expect(component.passwordError()).toBe('Password must be at least 8 characters');
  });

  it('should clear passwordError for valid password', () => {
    component.newPassword = 'validPass123';
    component.onPasswordBlur();
    expect(component.passwordError()).toBe('');
  });

  // ── Confirm password validation ───────────────────────────────────
  it('should set confirmPasswordError when confirm is empty', () => {
    component.confirmPassword = '';
    component.onConfirmPasswordBlur();
    expect(component.confirmPasswordError()).toBe('Please confirm your password');
  });

  it('should set confirmPasswordError when passwords do not match', () => {
    component.newPassword = 'password123';
    component.confirmPassword = 'different123';
    component.onConfirmPasswordBlur();
    expect(component.confirmPasswordError()).toBe('Passwords do not match');
  });

  it('should clear confirmPasswordError when passwords match', () => {
    component.newPassword = 'password123';
    component.confirmPassword = 'password123';
    component.onConfirmPasswordBlur();
    expect(component.confirmPasswordError()).toBe('');
  });

  // ── Form submit ───────────────────────────────────────────────────
  it('should not call authService when form is invalid', () => {
    component.code = '';
    component.newPassword = '';
    component.confirmPassword = '';
    component.onSubmit();
    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('should call resetPassword with correct payload', fakeAsync(() => {
    authServiceSpy.resetPassword.and.returnValue(of(mockAuthResponse));

    component.code = 'abc123';
    component.newPassword = 'newPassword123';
    component.confirmPassword = 'newPassword123';
    component.onSubmit();
    tick();

    expect(authServiceSpy.resetPassword).toHaveBeenCalledWith({
      email: 'admin@badilni.com',
      code: 'ABC123',
      password: 'newPassword123',
    });
  }));

  it('should uppercase the code before sending', fakeAsync(() => {
    authServiceSpy.resetPassword.and.returnValue(of(mockAuthResponse));

    component.code = 'abc123';
    component.newPassword = 'newPassword123';
    component.confirmPassword = 'newPassword123';
    component.onSubmit();
    tick();

    const call = authServiceSpy.resetPassword.calls.mostRecent().args[0];
    expect(call.code).toBe('ABC123');
  }));

  it('should navigate to /dashboard on success', fakeAsync(() => {
    authServiceSpy.resetPassword.and.returnValue(of(mockAuthResponse));

    component.code = 'ABC123';
    component.newPassword = 'newPassword123';
    component.confirmPassword = 'newPassword123';
    component.onSubmit();
    tick();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should set errorMessage on failure', fakeAsync(() => {
    authServiceSpy.resetPassword.and.returnValue(
      throwError(() => new Error('Code is invalid or has expired'))
    );

    component.code = 'ABC123';
    component.newPassword = 'newPassword123';
    component.confirmPassword = 'newPassword123';
    component.onSubmit();
    tick();

    expect(component.errorMessage()).toBe('Code is invalid or has expired');
    expect(component.isLoading()).toBeFalse();
  }));

  // ── Navigation ────────────────────────────────────────────────────
  it('should navigate to login', () => {
    component.goToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should navigate to forgot-password', () => {
    component.goToForgotPassword();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/forgot-password']);
  });
});
