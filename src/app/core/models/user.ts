export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  photo?: string;
  bio?: string;
  isVerified: boolean;
  status?: 'active' | 'suspended' | 'inactive';
  skillTags?: string[];
  walletBalance?: number;
  creditsInEscrow?: number;
  totalSessionsCompleted?: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}
