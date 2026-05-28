import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
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
export class ResetPassword implements OnInit {
  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';

  codeError = signal('');
  passwordError = signal('');
  confirmPasswordError = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  codeFocused = signal(false);
  passwordFocused = signal(false);
  confirmPasswordFocused = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: Auth,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] ?? '';
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onCodeBlur(): void {
    this.codeFocused.set(false);
    this.validateCode();
  }

  onPasswordBlur(): void {
    this.passwordFocused.set(false);
    this.validatePassword();
  }

  onConfirmPasswordBlur(): void {
    this.confirmPasswordFocused.set(false);
    this.validateConfirmPassword();
  }

  private validateCode(): boolean {
    if (!this.code.trim()) {
      this.codeError.set('Reset code is required');
      return false;
    }
    if (this.code.trim().length !== 6) {
      this.codeError.set('Reset code must be 6 characters');
      return false;
    }
    this.codeError.set('');
    return true;
  }

  private validatePassword(): boolean {
    if (!this.newPassword) {
      this.passwordError.set('Password is required');
      return false;
    }
    if (this.newPassword.length < 8) {
      this.passwordError.set('Password must be at least 8 characters');
      return false;
    }
    this.passwordError.set('');
    return true;
  }

  private validateConfirmPassword(): boolean {
    if (!this.confirmPassword) {
      this.confirmPasswordError.set('Please confirm your password');
      return false;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError.set('Passwords do not match');
      return false;
    }
    this.confirmPasswordError.set('');
    return true;
  }

  onSubmit(): void {
    this.errorMessage.set('');

    const isCodeValid = this.validateCode();
    const isPasswordValid = this.validatePassword();
    const isConfirmValid = this.validateConfirmPassword();

    if (!isCodeValid || !isPasswordValid || !isConfirmValid) return;

    this.isLoading.set(true);

    this.authService
      .resetPassword({
        email: this.email,
        code: this.code.trim().toUpperCase(),
        password: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message ?? 'Something went wrong. Please try again.');
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
