export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'provider' | 'admin';
  photo?: string;
  bio?: string;
  isVerified: boolean;
  skillTags?: string[];
  walletBalance?: number;
  creditsInEscrow?: number;
  totalSessionsCompleted?: number;
  averageRating?: number;
  credits?: number;
  sessions?: number;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}
