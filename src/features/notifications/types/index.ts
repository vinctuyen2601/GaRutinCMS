export type ChannelType = 'telegram' | 'zalo' | 'email';

/**
 * Sự kiện có thể đăng ký nhận thông báo.
 *
 * Chỉ liệt kê sự kiện mà máy chủ THẬT SỰ phát ra. Bên 17Fishing còn có
 * 'review.created', nhưng dự án này không có mục đánh giá — để lại thì chủ
 * trại tick vào một ô không bao giờ kêu, rồi tưởng hệ thống hỏng.
 */
export const EVENTS = [
  { value: 'order.created',        label: '🛒 Đơn hàng mới' },
  { value: 'order.status_updated', label: '📦 Cập nhật trạng thái đơn' },
];

export interface NotificationChannel {
  id: string;
  name: string;
  type: ChannelType;
  config: Record<string, string>;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
