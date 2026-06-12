export interface Notification {
  _id?: string;
  title: string;
  message: string;
  type: 'system' | 'warning' | 'info' | 'success';
  target: 'broadcast' | 'user';
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
