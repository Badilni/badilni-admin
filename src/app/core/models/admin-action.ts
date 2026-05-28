export interface AdminAction {
  _id?: string;
  admin: string;
  action: string;
  targetModel?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  createdAt?: string;
}
