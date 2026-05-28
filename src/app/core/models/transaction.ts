export interface Transaction {
  _id?: string;
  sender: string;
  receiver: string;
  booking?: string;
  type: 'credit' | 'debit' | 'escrow_hold' | 'escrow_release' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
