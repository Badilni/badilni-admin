export interface Listing {
  _id?: string;
  title: string;
  provider: string;
  price: number;
  tags?: string[];
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  category?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
