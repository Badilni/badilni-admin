import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

export interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  animations: [
    trigger('logoAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5) translateY(-40px)' }),
        animate(
          '0.8s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })
        ),
      ]),
    ]),
    trigger('textAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(
          '0.7s 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('decorationAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0)' }),
        animate(
          '1s 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'scale(1)' })
        ),
      ]),
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(60px) scale(0.95)' }),
        animate(
          '0.7s 0.1s cubic-bezier(0.34, 1.2, 0.64, 1)',
          style({ opacity: 1, transform: 'translateX(0) scale(1)' })
        ),
      ]),
    ]),
    trigger('alertAnimation', [
      transition(':enter', [
        animate(
          '0.4s cubic-bezier(0.34, 1.4, 0.64, 1)',
          keyframes([
            style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(2px) scale(1.01)', offset: 0.7 }),
            style({ opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 }),
          ])
        ),
      ]),
      transition(':leave', [
        animate('0.25s ease-in', style({ opacity: 0, transform: 'translateY(-8px)' })),
      ]),
    ]),
  ],
})

export class Login {
  loginData: LoginData = {
    email: '',
    password: '',
    rememberMe: false,
  };

  showPassword = signal(false);
  isLoading = signal(false);
  emailFocused = signal(false);
  passwordFocused = signal(false);
  emailError = signal('');
  passwordError = signal('');
  loginError = signal('');

  // 15 particles for background animation
  readonly particles = Array.from({ length: 15 }, (_, i) => i);

  constructor(private router: Router) {
    const remembered = localStorage.getItem('badilni_remembered_email');
    if (remembered) {
      this.loginData.email = remembered;
      this.loginData.rememberMe = true;
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onEmailBlur(): void {
    this.emailFocused.set(false);
    this.validateEmail();
  }

  onPasswordBlur(): void {
    this.passwordFocused.set(false);
    this.validatePassword();
  }

  private validateEmail(): boolean {
    if (!this.loginData.email) {
      this.emailError.set('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginData.email)) {
      this.emailError.set('Please enter a valid email address');
      return false;
    }
    this.emailError.set('');
    return true;
  }

  private validatePassword(): boolean {
    if (!this.loginData.password) {
      this.passwordError.set('Password is required');
      return false;
    }
    if (this.loginData.password.length < 6) {
      this.passwordError.set('Password must be at least 6 characters');
      return false;
    }
    this.passwordError.set('');
    return true;
  }

  async onSubmit(): Promise<void> {
    this.loginError.set('');
    const isEmailValid = this.validateEmail();
    const isPasswordValid = this.validatePassword();
    if (!isEmailValid || !isPasswordValid) return;

    this.isLoading.set(true);
    try {
      // TODO: replace with real AuthService.login() call
      await new Promise<void>((_, reject) =>
        setTimeout(() => reject({ message: 'Invalid credentials. Please try again.' }), 1200)
      );

      if (this.loginData.rememberMe) {
        localStorage.setItem('badilni_remembered_email', this.loginData.email);
      } else {
        localStorage.removeItem('badilni_remembered_email');
      }
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.loginError.set(error?.message ?? 'Invalid credentials. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/auth/forgot-password']);
  }
}
