export type GalleryItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  /** Ảnh đại diện. Với video YouTube có thể bỏ trống — web tự lấy của YouTube. */
  thumbnail?: string;
  caption?: string;
  /** Ngày QUAY, không phải ngày đăng. Dạng YYYY-MM-DD. */
  filmedAt?: string | null;
  source: 'admin' | 'customer';
  customerName?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type CreateGalleryPayload = Omit<GalleryItem, 'id' | 'createdAt'>;
export type UpdateGalleryPayload = Partial<CreateGalleryPayload>;
