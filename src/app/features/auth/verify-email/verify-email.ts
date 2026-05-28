import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css'],
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
export class VerifyEmail implements OnInit {
  email = '';
  code = '';

  codeError = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);
  isResending = signal(false);
  codeFocused = signal(false);
  resendCooldown = signal(0);

  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

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

  onCodeBlur(): void {
    this.codeFocused.set(false);
    this.validateCode();
  }

  private validateCode(): boolean {
    if (!this.code.trim()) {
      this.codeError.set('Verification code is required');
      return false;
    }
    if (this.code.trim().length !== 6) {
      this.codeError.set('Verification code must be 6 characters');
      return false;
    }
    this.codeError.set('');
    return true;
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.validateCode()) return;

    this.isLoading.set(true);

    this.authService
      .verifyEmail({
        email: this.email,
        code: this.code.trim().toUpperCase(),
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        },
        error: (err: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.message ?? 'Verification failed. Please try again.');
        },
      });
  }

  resendCode(): void {
    if (this.resendCooldown() > 0 || this.isResending()) return;

    this.errorMessage.set('');
    this.successMessage.set('');
    this.isResending.set(true);

    this.authService.resendVerification({ email: this.email }).subscribe({
      next: (res) => {
        this.isResending.set(false);
        this.successMessage.set(
          res.message ?? 'A new verification code has been sent to your email.'
        );
        this.startCooldown();
      },
      error: (err: Error) => {
        this.isResending.set(false);
        this.errorMessage.set(err.message ?? 'Failed to resend code. Please try again.');
      },
    });
  }

  private startCooldown(seconds = 60): void {
    this.resendCooldown.set(seconds);
    this.cooldownInterval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
        }
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
