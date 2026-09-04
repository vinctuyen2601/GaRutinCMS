import api from '@/lib/axios';

export type Review = {
  id: string;
  productId: string;
  productName?: string | null;
  productSlug?: string | null;
  customerName: string;
  phone?: string;
  rating: number;
  comment?: string;
  images?: string[];
  video?: string | null;
  isApproved: boolean;
  ip?: string | null;
  createdAt: string;
};

export const getReviews = (status?: 'pending' | 'approved') =>
  api.get<Review[]>('/admin/reviews', { params: status ? { status } : {} }).then(r => r.data);

export const getPendingCount = () =>
  api.get<{ count: number }>('/admin/reviews/pending-count').then(r => r.data.count);

export const updateReview = (id: string, payload: Partial<Pick<Review, 'isApproved' | 'comment' | 'customerName' | 'rating'>>) =>
  api.patch<Review>(`/admin/reviews/${id}`, payload).then(r => r.data);

export const deleteReview = (id: string) => api.delete(`/admin/reviews/${id}`);
