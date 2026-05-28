import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ForgotPassword } from './forgot-password';
import { Auth } from '../../../core/services/auth';

describe('ForgotPassword Component', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('Auth', ['forgotPassword']);

    await TestBed.configureTestingModule({
      imports: [ForgotPassword, FormsModule, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial state ─────────────────────────────────────────────────
  it('should initialize with empty state', () => {
    expect(component.email).toBe('');
    expect(component.isLoading()).toBeFalse();
    expect(component.submitted()).toBeFalse();
    expect(component.emailError()).toBe('');
    expect(component.successMessage()).toBe('');
    expect(component.errorMessage()).toBe('');
  });

  // ── Email validation ──────────────────────────────────────────────
  it('should set error when email is empty on blur', () => {
    component.email = '';
    component.onEmailBlur();
    expect(component.emailError()).toBe('Email is required');
  });

  it('should set error for invalid email format', () => {
    component.email = 'not-an-email';
    component.onEmailBlur();
    expect(component.emailError()).toBe('Please enter a valid email address');
  });

  it('should clear error for valid email', () => {
    component.email = 'admin@badilni.com';
    component.onEmailBlur();
    expect(component.emailError()).toBe('');
  });

  // ── Submit ────────────────────────────────────────────────────────
  it('should not call authService if email is invalid', () => {
    component.email = '';
    component.onSubmit();
    expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('should set submitted and successMessage on success', fakeAsync(() => {
    authServiceSpy.forgotPassword.and.returnValue(
      of({ status: 'success', message: 'Check your email' })
    );

    component.email = 'admin@badilni.com';
    component.onSubmit();
    tick();

    expect(component.submitted()).toBeTrue();
    expect(component.successMessage()).toBe('Check your email');
    expect(component.isLoading()).toBeFalse();
  }));

  it('should set errorMessage on failure', fakeAsync(() => {
    authServiceSpy.forgotPassword.and.returnValue(
      throwError(() => new Error('Server error'))
    );

    component.email = 'admin@badilni.com';
    component.onSubmit();
    tick();

    expect(component.errorMessage()).toBe('Server error');
    expect(component.submitted()).toBeFalse();
    expect(component.isLoading()).toBeFalse();
  }));

  it('should call authService with correct email payload', fakeAsync(() => {
    authServiceSpy.forgotPassword.and.returnValue(of({ status: 'success' }));

    component.email = 'admin@badilni.com';
    component.onSubmit();
    tick();

    expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith({ email: 'admin@badilni.com' });
  }));

  // ── Navigation ────────────────────────────────────────────────────
  it('should navigate to reset-password with email param', () => {
    component.email = 'admin@badilni.com';
    component.goToResetPassword();
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/reset-password'],
      { queryParams: { email: 'admin@badilni.com' } }
    );
  });

  it('should navigate to login on goToLogin()', () => {
    component.goToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
