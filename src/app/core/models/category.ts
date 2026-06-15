export interface Category {
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  order?: number;
  status?: 'active' | 'inactive';
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
