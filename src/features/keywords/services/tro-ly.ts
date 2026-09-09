import api from '@/lib/axios';

export type ViecNenLam =
  | 'bo-sung'
  | 'viet-moi' | 'sua-tieu-de' | 'gop-bai' | 'da-tot' | 'bo-qua' | 'chua-du-lieu';

export type BaiKhop = {
  id: string; slug: string; title: string; nguoiDoc: number;
  /** Heading H2/H3 của bài — đủ để biết bài nói gì mà không phải mở ra. */
  danY: string[];
};

export type KetQuaBoSung = {
  slug: string;
  tieuDeBai: string;
  viTri: string;
  html: string;
  lyDo: string;
  nenVietMoi: boolean;
};

export type DongPhanTich = {
  id: string;
  keyword: string;
  impressions: number | null;
  clicks: number | null;
  position: string | null;
  ctr: number | null;
  nguon: string;
  ghiChu: string | null;
  daBoQua: boolean;
  lyDoBoQua: string | null;
  viec: ViecNenLam;
  lyDo: string;
  baiKhop: BaiKhop[];
};

export type GoiY = {
  id: string; keyword: string; tuKhoaGoc: string | null; loai: string;
};

export const gopBai = (giuLai: string, gopVao: string[]) =>
  api.post<{ daGop: string[]; loi: { slug: string; lyDo: string }[] }>(
    '/admin/posts/gop', { giuLai, gopVao }).then((r) => r.data);

export const getPhanTich = (boQua = false) =>
  api.get<DongPhanTich[]>('/admin/keywords/phan-tich', { params: { boQua } })
    .then((r) => r.data);

export const doiBoQua = (id: string, boQua: boolean, lyDo?: string) =>
  api.patch(`/admin/keywords/${id}/bo-qua`, { boQua, lyDo }).then((r) => r.data);

export const nhapSearchConsole = (
  rows: { keyword: string; impressions: number; clicks: number; position?: number }[],
) => api.post<{ them: number; capNhat: number; tong: number }>(
  '/admin/keywords/nhap-search-console', { rows }).then((r) => r.data);

export const gscSanSang = () =>
  api.get<{ sanSang: boolean }>('/admin/keywords/gsc-san-sang').then((r) => r.data);

export const dongBoSearchConsole = (soNgay = 90) =>
  api.post<{ them: number; capNhat: number; tong: number; soNgay: number }>(
    '/admin/keywords/dong-bo-search-console', { soNgay }).then((r) => r.data);

export const getGoiY = () => api.get<GoiY[]>('/admin/keywords/goi-y').then((r) => r.data);

export const timGoiY = (keyword: string) =>
  api.post<{ them: number; boQuaViDaCoBai: number; tuDong: number; cauHoi: number; lienQuan: number }>(
    '/admin/keywords/goi-y/tim', { keyword }).then((r) => r.data);

export const quetSau = (soTuGoc = 12) =>
  api.post<{ them: number; soTuGoc: number }>(
    '/admin/keywords/goi-y/quet-sau', { soTuGoc }).then((r) => r.data);

export const nhanGoiY = (id: string) =>
  api.post(`/admin/keywords/goi-y/${id}/nhan`).then((r) => r.data);

export const boQuaGoiY = (id: string) =>
  api.post(`/admin/keywords/goi-y/${id}/bo-qua`).then((r) => r.data);

/**
 * Đọc dữ liệu dán từ Search Console.
 *
 * Nhận cả dán trực tiếp từ bảng (ngăn bằng Tab) lẫn tệp CSV tải về (ngăn bằng
 * dấu phẩy), vì hai cách lấy dữ liệu đó cho ra hai định dạng khác nhau và người
 * dùng không có lý do gì phải biết điều đó.
 *
 * Bỏ qua dòng tiêu đề và mọi dòng không có số — Search Console hay kèm dòng
 * tổng và chú thích.
 */
/**
 * Tách một dòng CSV, tôn trọng dấu nháy kép.
 *
 * Cắt thô bằng split(',') sẽ làm hỏng những từ khoá có dấu phẩy — và hỏng theo
 * kiểu tệ nhất: dòng đó bị bỏ IM LẶNG, người dùng tưởng đã nhập đủ.
 */
function tachCsv(dong: string): string[] {
  const o: string[] = [];
  let cur = '';
  let trongNhay = false;
  for (let i = 0; i < dong.length; i++) {
    const c = dong[i];
    if (c === '"') {
      // "" bên trong chuỗi có nháy nghĩa là một dấu nháy thật.
      if (trongNhay && dong[i + 1] === '"') { cur += '"'; i++; }
      else trongNhay = !trongNhay;
    } else if (c === ',' && !trongNhay) {
      o.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  o.push(cur);
  return o;
}

export function docDanSearchConsole(text: string) {
  const rows: { keyword: string; impressions: number; clicks: number; position?: number }[] = [];
  for (const dong of text.split('\n')) {
    if (!dong.trim()) continue;
    const o = dong.includes('\t') ? dong.split('\t') : tachCsv(dong);
    if (o.length < 3) continue;
    const keyword = o[0].trim().replace(/^"|"$/g, '');
    // Search Console xuất số có dấu ngăn nghìn; Number("1.234") ra 1.234 nên
    // phải bỏ dấu trước, nếu không 1.234 lượt hiển thị thành 1 lượt.
    const so = (x: string) => Number((x ?? '').replace(/[.,\s]/g, '').replace(/"/g, ''));
    const clicks = so(o[1]);
    const impressions = so(o[2]);
    if (!keyword || !Number.isFinite(clicks) || !Number.isFinite(impressions)) continue;
    if (/^(truy vấn|query|top queries)/i.test(keyword)) continue;
    // Vị trí có phần thập phân thật (4,7) nên xử lý riêng, không dùng `so`.
    const viTri = o[4] ?? o[3];
    const p = viTri ? Number(String(viTri).replace(',', '.').replace(/[^\d.]/g, '')) : NaN;
    rows.push({
      keyword, clicks, impressions,
      ...(Number.isFinite(p) && p > 0 ? { position: p } : {}),
    });
  }
  return rows;
}

/** Nhờ AI soạn phần HTML còn thiếu cho một từ khoá. */
export const soanBoSung = (keyword: string, slugs: string[]) =>
  api.post<KetQuaBoSung>('/admin/keywords/bo-sung', { keyword, slugs }).then((r) => r.data);

/** Đường làm tay: lấy prompt để dán sang chat AI bên ngoài. */
export const promptBoSung = (keyword: string, slugs: string[]) =>
  api.post<{ system: string; user: string; prompt: string }>(
    '/admin/keywords/bo-sung/prompt', { keyword, slugs }).then((r) => r.data);

/** Đường làm tay: dán kết quả từ chat ngoài vào để đọc ra. */
export const applyBoSung = (text: string) =>
  api.post<KetQuaBoSung>('/admin/keywords/bo-sung/apply', { text }).then((r) => r.data);
