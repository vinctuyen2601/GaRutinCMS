/**
 * Giới hạn tải tệp, khai đúng một chỗ.
 *
 * Trước đây con số nằm rải rác dưới dạng chữ trong giao diện và không khớp với
 * bất cứ thứ gì: màn Media ghi "Tối đa 10MB" trong khi máy chủ KHÔNG chặn gì
 * cả. Dòng chữ đó vừa sai vừa không ai kiểm được là sai.
 *
 * PHẢI khớp với MediaController.TOI_DA bên GaRutinBE. Lệch thì hoặc người dùng
 * bị từ chối sau khi đã chờ tải xong, hoặc được hứa nhiều hơn máy chủ nhận.
 *
 * Vì sao 18 chứ không phải một số tròn hơn: nginx trước API đặt
 * client_max_body_size 20m — đo thật trên máy chủ, tệp 20.000.000 byte qua
 * được, đúng 20 MiB trả 413. Vượt ngưỡng là nginx chặn trước khi tới ứng dụng
 * và người dùng thấy trang lỗi thô, không phải câu báo lỗi tử tế. 18 chừa chỗ
 * cho phần bao multipart.
 */
export const UPLOAD_MAX_MB = 18;

/** Loại tệp máy chủ nhận — khớp MediaController.LOAI_CHO_PHEP. */
export const UPLOAD_ACCEPT = 'image/*,video/*';

/** Câu gợi ý dùng chung dưới các ô tải lên. */
export const UPLOAD_HINT =
  `Ảnh (JPG, PNG, WebP, GIF) và video ngắn (MP4). Tối đa ${UPLOAD_MAX_MB}MB mỗi tệp — ` +
  'video dài nên đăng YouTube rồi dán link.';

/** Trả về câu báo lỗi nếu tệp quá lớn, ngược lại null. */
export function quaLon(file: File): string | null {
  if (file.size <= UPLOAD_MAX_MB * 1024 * 1024) return null;
  return (
    `Tệp ${Math.round(file.size / 1024 / 1024)} MB, vượt quá ${UPLOAD_MAX_MB} MB. ` +
    'Video dài nên đăng YouTube rồi dán link.'
  );
}
