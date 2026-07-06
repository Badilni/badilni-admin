export interface Booking {
  _id?: string;
  provider: string;
  receiver: string;
  listing?: string;
  request?: string;
  scheduledAt: string;
  durationHours: number;
  creditsTotal: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'disputed' | 'cancelled';
  providerConfirmed?: boolean;
  receiverConfirmed?: boolean;
  meetingLink?: string;
  note?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
