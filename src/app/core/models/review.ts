export interface Review {
  _id?: string;
  reviewer: string;
  reviewee: string;
  booking?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}
