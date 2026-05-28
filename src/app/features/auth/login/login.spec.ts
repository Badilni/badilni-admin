import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { Auth } from '../../../core/services/auth';
import { AuthResponse } from '../../../core/models/auth-response';

const mockAdminResponse: AuthResponse = {
  status: 'success',
  accessToken: 'mock-access-token',
  data: {
    user: {
      _id: '123',
      name: 'Admin User',
      email: 'admin@badilni.com',
      role: 'admin',
      isVerified: true,
    },
  },
};

const mockUserResponse: AuthResponse = {
  status: 'success',
  accessToken: 'mock-access-token',
  data: {
    user: {
      _id: '456',
      name: 'Regular User',
      email: 'user@badilni.com',
      role: 'user',
      isVerified: true,
    },
  },
};

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authServiceSpy = jasmine.createSpyObj('Auth', ['login', 'logout']);

    await TestBed.configureTestingModule({
      imports: [Login, FormsModule, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data', () => {
    expect(component.loginData.email).toBe('');
    expect(component.loginData.password).toBe('');
    expect(component.loginData.rememberMe).toBeFalse();
  });

  it('should have 15 particles', () => {
    expect(component.particles.length).toBe(15);
  });

  // Signals initial state
  it('should initialize signals correctly', () => {
    expect(component.showPassword()).toBeFalse();
    expect(component.isLoading()).toBeFalse();
    expect(component.emailFocused()).toBeFalse();
    expect(component.passwordFocused()).toBeFalse();
    expect(component.emailError()).toBe('');
    expect(component.passwordError()).toBe('');
    expect(component.loginError()).toBe('');
  });

  // Toggle password
  it('should toggle showPassword signal', () => {
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
    component.togglePassword();
    expect(component.showPassword()).toBeFalse();
  });

  // Email validation
  it('should set emailError when email is empty on blur', () => {
    component.loginData.email = '';
    component.onEmailBlur();
    expect(component.emailError()).toBe('Email is required');
    expect(component.emailFocused()).toBeFalse();
  });

  it('should set emailError for invalid email format', () => {
    component.loginData.email = 'invalid-email';
    component.onEmailBlur();
    expect(component.emailError()).toBe('Please enter a valid email address');
  });

  it('should clear emailError for valid email', () => {
    component.loginData.email = 'admin@badilni.com';
    component.onEmailBlur();
    expect(component.emailError()).toBe('');
  });

  // Password validation
  it('should set passwordError when password is empty on blur', () => {
    component.loginData.password = '';
    component.onPasswordBlur();
    expect(component.passwordError()).toBe('Password is required');
    expect(component.passwordFocused()).toBeFalse();
  });

  it('should set passwordError for short password', () => {
    component.loginData.password = '123';
    component.onPasswordBlur();
    expect(component.passwordError()).toBe('Password must be at least 6 characters');
  });

  it('should clear passwordError for valid password', () => {
    component.loginData.password = 'validPass123';
    component.onPasswordBlur();
    expect(component.passwordError()).toBe('');
  });

  // Form submission
  it('should not call authService if form is invalid', async () => {
    component.loginData.email = '';
    component.loginData.password = '';
    await component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should set isLoading to true during submission and false on success', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(of(mockAdminResponse));

    component.loginData.email = 'admin@badilni.com';
    component.loginData.password = 'securePass123';
    component.onSubmit();

    tick();
    expect(component.isLoading()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should navigate to /dashboard after successful admin login', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(of(mockAdminResponse));

    component.loginData.email = 'admin@badilni.com';
    component.loginData.password = 'securePass123';
    component.onSubmit();
    tick();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should set loginError for non-admin user login', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(of(mockUserResponse));
    authServiceSpy.logout.and.returnValue(of({ status: 'success' } as any));

    component.loginData.email = 'user@badilni.com';
    component.loginData.password = 'securePass123';
    component.onSubmit();
    tick();

    expect(component.loginError()).toBe('Access restricted to admin accounts only.');
  }));

  it('should set loginError on failed login', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(
      throwError(() => new Error('Incorrect email or password'))
    );

    component.loginData.email = 'admin@badilni.com';
    component.loginData.password = 'wrongPassword123';
    component.onSubmit();
    tick();

    expect(component.loginError()).toBe('Incorrect email or password');
    expect(component.isLoading()).toBeFalse();
  }));

  // Forgot password 
  it('should navigate to forgot-password and prevent default', () => {
    const mockEvent = new MouseEvent('click');
    spyOn(mockEvent, 'preventDefault');

    component.onForgotPassword(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/forgot-password']);
  });

  // Remember me
  it('should save email to localStorage when rememberMe is true', fakeAsync(() => {
    spyOn(localStorage, 'setItem');
    authServiceSpy.login.and.returnValue(of(mockAdminResponse));

    component.loginData.email = 'admin@badilni.com';
    component.loginData.password = 'securePass123';
    component.loginData.rememberMe = true;
    component.onSubmit();
    tick();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'badilni_remembered_email',
      'admin@badilni.com'
    );
  }));

  it('should remove email from localStorage when rememberMe is false', fakeAsync(() => {
    spyOn(localStorage, 'removeItem');
    authServiceSpy.login.and.returnValue(of(mockAdminResponse));

    component.loginData.email = 'admin@badilni.com';
    component.loginData.password = 'securePass123';
    component.loginData.rememberMe = false;
    component.onSubmit();
    tick();

    expect(localStorage.removeItem).toHaveBeenCalledWith('badilni_remembered_email');
  }));
});
