export interface Booking {
  _id?: string;
  requester: string;
  provider: string;
  listing: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  creditsAmount: number;
  scheduledAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
