import { WEB_URL } from '@/config/site';

export { WEB_URL };

/**
 * Công cụ tạo link theo dõi quảng cáo (UTM).
 *
 * Tách phần xử lý chuỗi khỏi giao diện để kiểm thử được, và vì mấy quy tắc ở
 * đây tuy nhỏ nhưng sai là hỏng cả số liệu về sau.
 */

/**
 * Các nguồn quảng cáo hay dùng.
 *
 * `value` đi vào utm_source và được lưu NGUYÊN VĂN, nên nguồn nào cũng đo được.
 * Nhưng cột `platform` của máy chủ thì bị ép về danh sách cố định
 * (facebook | youtube | tiktok | zalo | web | other) — nguồn nằm ngoài danh
 * sách đó sẽ hiện là 'other' ở các báo cáo cũ theo platform, trong khi báo cáo
 * theo nguồn/chiến dịch vẫn hiện đúng tên. Đã đánh dấu bằng `ngoaiDanhSach`.
 */
export const NGUON = [
  { value: 'facebook', label: 'Facebook',   medium: 'cpc',      goiY: 'Quảng cáo hoặc bài đăng trên Facebook' },
  { value: 'tiktok',   label: 'TikTok',     medium: 'cpc',      goiY: 'Video TikTok hoặc quảng cáo TikTok' },
  { value: 'youtube',  label: 'YouTube',    medium: 'video',    goiY: 'Mô tả video hoặc quảng cáo YouTube' },
  { value: 'zalo',     label: 'Zalo',       medium: 'social',   goiY: 'Zalo OA, nhóm chat, tin nhắn cho khách' },
  { value: 'google',   label: 'Google Ads', medium: 'cpc',      goiY: 'Quảng cáo tìm kiếm Google', ngoaiDanhSach: true },
  { value: 'shopee',   label: 'Shopee',     medium: 'referral', goiY: 'Gian hàng hoặc tin nhắn Shopee', ngoaiDanhSach: true },
  { value: 'other',    label: 'Khác',       medium: 'referral', goiY: 'Diễn đàn, hội nhóm, đối tác' },
] as const;

/**
 * Chuẩn hoá tên chiến dịch: bỏ dấu, chữ thường, nối bằng gạch ngang.
 *
 * Bắt buộc vì giá trị này đi thẳng vào URL. "Sale Tháng 9" để nguyên sẽ thành
 * "Sale%20Th%C3%A1ng%209" trong báo cáo — không ai đọc nổi, và cùng một chiến
 * dịch gõ hoa gõ thường sẽ tách thành hai dòng khác nhau.
 */
export function chuanHoa(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export type ThamSo = {
  duongDan: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
};

/**
 * Ghép link cuối cùng.
 *
 * Dùng URL và searchParams thay vì nối chuỗi tay, để đường dẫn có sẵn tham số
 * không bị hỏng và mọi ký tự đều được mã hoá đúng.
 */
export function taoLink({ duongDan, source, medium, campaign, content }: ThamSo): string {
  const url = new URL(duongDan || '/', WEB_URL);
  url.searchParams.set('utm_source', source);
  if (medium) url.searchParams.set('utm_medium', medium);
  if (campaign) url.searchParams.set('utm_campaign', campaign);
  if (content) url.searchParams.set('utm_content', content);
  return url.toString();
}
