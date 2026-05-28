import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('alertAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ForgotPassword {
  email = '';
  emailError = signal('');
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  emailFocused = signal(false);
  submitted = signal(false);

  constructor(
    private router: Router,
    private authService: Auth,
  ) {}

  private validateEmail(): boolean {
    if (!this.email) {
      this.emailError.set('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.emailError.set('Please enter a valid email address');
      return false;
    }
    this.emailError.set('');
    return true;
  }

  onEmailBlur(): void {
    this.emailFocused.set(false);
    this.validateEmail();
  }

  onSubmit(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!this.validateEmail()) return;

    this.isLoading.set(true);

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.submitted.set(true);
        this.successMessage.set(
          res.message ?? 'If an account with that email exists, a password reset code has been sent.'
        );
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  goToResetPassword(): void {
    this.router.navigate(['/auth/reset-password'], { queryParams: { email: this.email } });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
