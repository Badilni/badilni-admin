export interface Transaction {
  _id?: string;
  sender: string;
  receiver: string;
  booking?: string;
  type:
    | 'session_payment'
    | 'escrow_lock'
    | 'refund'
    | 'welcome_bonus'
    | 'admin_adjustment';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
