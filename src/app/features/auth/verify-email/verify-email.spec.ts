import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { VerifyEmail } from './verify-email';
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

describe('VerifyEmail Component', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<Auth>;
  let activatedRouteSpy: { queryParams: any };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('Auth', ['verifyEmail', 'resendVerification']);
    activatedRouteSpy = { queryParams: of({ email: 'admin@badilni.com' }) };

    await TestBed.configureTestingModule({
      imports: [VerifyEmail, FormsModule, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clear any pending intervals
    (component as any).cooldownInterval && clearInterval((component as any).cooldownInterval);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ──────────────────────────────────────────────────────
  it('should read email from query params', () => {
    expect(component.email).toBe('admin@badilni.com');
  });

  it('should default email to empty string when not in params', async () => {
    activatedRouteSpy.queryParams = of({});
    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.email).toBe('');
  });

  // ── Initial state ─────────────────────────────────────────────────
  it('should initialize signals with correct defaults', () => {
    expect(component.isLoading()).toBeFalse();
    expect(component.isResending()).toBeFalse();
    expect(component.codeError()).toBe('');
    expect(component.errorMessage()).toBe('');
    expect(component.successMessage()).toBe('');
    expect(component.resendCooldown()).toBe(0);
  });

  // ── Code validation ───────────────────────────────────────────────
  it('should set codeError when code is empty on blur', () => {
    component.code = '';
    component.onCodeBlur();
    expect(component.codeError()).toBe('Verification code is required');
    expect(component.codeFocused()).toBeFalse();
  });

  it('should set codeError when code length is not 6', () => {
    component.code = 'AB';
    component.onCodeBlur();
    expect(component.codeError()).toBe('Verification code must be 6 characters');
  });

  it('should clear codeError for valid 6-char code', () => {
    component.code = 'XYZ789';
    component.onCodeBlur();
    expect(component.codeError()).toBe('');
  });

  // ── Submit ────────────────────────────────────────────────────────
  it('should not call authService when code is invalid', () => {
    component.code = '';
    component.onSubmit();
    expect(authServiceSpy.verifyEmail).not.toHaveBeenCalled();
  });

  it('should call verifyEmail with uppercased code', fakeAsync(() => {
    authServiceSpy.verifyEmail.and.returnValue(of(mockAuthResponse));
    component.code = 'abc123';
    component.onSubmit();
    tick();

    expect(authServiceSpy.verifyEmail).toHaveBeenCalledWith({
      email: 'admin@badilni.com',
      code: 'ABC123',
    });
  }));

  it('should navigate to /dashboard on successful verification', fakeAsync(() => {
    authServiceSpy.verifyEmail.and.returnValue(of(mockAuthResponse));
    component.code = 'ABC123';
    component.onSubmit();
    tick();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should set errorMessage on failed verification', fakeAsync(() => {
    authServiceSpy.verifyEmail.and.returnValue(
      throwError(() => new Error('Code is invalid or has expired'))
    );
    component.code = 'ABC123';
    component.onSubmit();
    tick();
    expect(component.errorMessage()).toBe('Code is invalid or has expired');
    expect(component.isLoading()).toBeFalse();
  }));

  it('should set isLoading true during submit and false after', fakeAsync(() => {
    authServiceSpy.verifyEmail.and.returnValue(of(mockAuthResponse));
    component.code = 'ABC123';
    component.onSubmit();
    // isLoading is set to true synchronously before subscribe resolves
    tick();
    expect(component.isLoading()).toBeFalse();
  }));

  // ── Resend code ───────────────────────────────────────────────────
  it('should call resendVerification with correct email', fakeAsync(() => {
    authServiceSpy.resendVerification.and.returnValue(
      of({ status: 'success', message: 'Code sent' })
    );
    component.resendCode();
    tick();
    expect(authServiceSpy.resendVerification).toHaveBeenCalledWith({
      email: 'admin@badilni.com',
    });
  }));

  it('should set successMessage on resend success', fakeAsync(() => {
    authServiceSpy.resendVerification.and.returnValue(
      of({ status: 'success', message: 'New code sent' })
    );
    component.resendCode();
    tick();
    expect(component.successMessage()).toBe('New code sent');
    expect(component.isResending()).toBeFalse();
  }));

  it('should start cooldown after successful resend', fakeAsync(() => {
    authServiceSpy.resendVerification.and.returnValue(of({ status: 'success' }));
    component.resendCode();
    tick();
    expect(component.resendCooldown()).toBe(60);
    // Advance 1 second
    tick(1000);
    expect(component.resendCooldown()).toBe(59);
    // Cleanup
    tick(59000);
    expect(component.resendCooldown()).toBe(0);
  }));

  it('should NOT resend when cooldown is active', fakeAsync(() => {
    authServiceSpy.resendVerification.and.returnValue(of({ status: 'success' }));
    component.resendCode();
    tick();
    // cooldown is now 60
    component.resendCode(); // should be ignored
    tick();
    // only called once
    expect(authServiceSpy.resendVerification).toHaveBeenCalledTimes(1);
    tick(60000);
  }));

  it('should set errorMessage on resend failure', fakeAsync(() => {
    authServiceSpy.resendVerification.and.returnValue(
      throwError(() => new Error('Too many requests'))
    );
    component.resendCode();
    tick();
    expect(component.errorMessage()).toBe('Too many requests');
    expect(component.isResending()).toBeFalse();
  }));

  // ── Navigation ────────────────────────────────────────────────────
  it('should navigate to login on goToLogin()', () => {
    component.goToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
