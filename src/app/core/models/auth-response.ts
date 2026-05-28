export interface AuthResponse {
  status: string;
  accessToken: string;
  data: {
    user: UserProfile;
  };
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  photo?: string;
  bio?: string;
  isVerified: boolean;
  skillTags?: string[];
  walletBalance?: number;
  creditsInEscrow?: number;
  totalSessionsCompleted?: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  bio?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T = null> {
  status: string;
  message?: string;
  data?: T;
}
