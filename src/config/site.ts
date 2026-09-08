/**
 * Danh tính của shop, gom về một tệp.
 *
 * Trước đây tên miền web bị ghi cứng rải rác trong mã (trang phân tích, trang
 * đánh giá) — đổi tên miền là phải đi tìm từng chỗ, sót một chỗ thì bấm vào mở
 * nhầm sang web khác mà không có lỗi nào báo.
 *
 * Giữ bản dự phòng là tên miền đang chạy thật: khai thiếu biến thì thấy ngay
 * tên miền quen, khác với kiểu hỏng âm thầm.
 *
 * VITE_* được nhúng lúc BUILD — đổi biến xong phải build lại.
 */
export const WEB_URL = (
  import.meta.env.VITE_WEB_URL || 'https://garutin.com'
).replace(/\/+$/, '');
