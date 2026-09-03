/**
 * Nhận diện link YouTube và dựng ảnh đại diện.
 *
 * Lặp lại quy tắc của web (GaRutinWeb/src/components/shared/GallerySection.tsx)
 * để CMS xem trước được ngay lúc dán link, không phải mở web ra kiểm.
 */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/**
 * Ảnh đại diện để xem trước.
 *
 * Video tự lưu không có sẵn ảnh đại diện — trình duyệt chỉ dựng được sau khi
 * tải tệp, nên trả null và để giao diện hiện thẻ video thật.
 */
export function anhDaiDien(item: { type: string; url: string; thumbnail?: string }): string | null {
  if (item.thumbnail) return item.thumbnail;
  if (item.type !== 'video') return item.url;
  const id = youtubeId(item.url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}
