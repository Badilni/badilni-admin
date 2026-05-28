import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  ApiResponse,
  LoginRequest,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  UpdatePasswordRequest,
  UserProfile,
} from '../models/auth-response';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'badilni_access_token';
  private readonly USER_KEY = 'badilni_user';

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  isLoggedIn = signal<boolean>(!!this.getToken());
  currentUser = signal<UserProfile | null>(this.loadUser());

  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // Token helpers
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private saveUser(user: UserProfile): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
    this.isLoggedIn.set(true);
  }

  private loadUser(): UserProfile | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  }

  private clearSession(): void {
    this.removeToken();
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.currentUserSubject.next(null);
    this.isLoggedIn.set(false);
  }

  // Auth endpoints
  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        this.setToken(res.accessToken);
        this.saveUser(res.data.user);
      }),
      catchError(this.handleError),
    );
  }

  signup(payload: SignupRequest): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/signup`, payload, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  logout(): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.clearSession();
          this.router.navigate(['/auth/login']);
        }),
        catchError((err) => {
          // Clear session even if request fails
          this.clearSession();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        }),
      );
  }

  verifyEmail(payload: VerifyEmailRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/verify-email`, payload, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.setToken(res.accessToken);
          this.saveUser(res.data.user);
        }),
        catchError(this.handleError),
      );
  }

  resendVerification(payload: ResendVerificationRequest): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/resend-verification`, payload, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.apiUrl}/forgot-password`, payload, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  resetPassword(payload: ResetPasswordRequest): Observable<AuthResponse> {
    return this.http
      .patch<AuthResponse>(`${this.apiUrl}/reset-password`, payload, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.setToken(res.accessToken);
          this.saveUser(res.data.user);
        }),
        catchError(this.handleError),
      );
  }

  updatePassword(payload: UpdatePasswordRequest): Observable<AuthResponse> {
    return this.http
      .patch<AuthResponse>(`${this.apiUrl}/me/password`, payload, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.setToken(res.accessToken);
          this.saveUser(res.data.user);
        }),
        catchError(this.handleError),
      );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.setToken(res.accessToken);
          this.saveUser(res.data.user);
        }),
        catchError((err) => {
          this.clearSession();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        }),
      );
  }

  // Error handler 
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 429) {
      message = error.error?.message ?? 'Too many attempts. Please try again later.';
    } else if (error.status === 401) {
      message = error.error?.message ?? 'Invalid credentials.';
    } else if (error.status === 400) {
      message = error.error?.message ?? 'Invalid request data.';
    }

    return throwError(() => new Error(message));
  }
}
