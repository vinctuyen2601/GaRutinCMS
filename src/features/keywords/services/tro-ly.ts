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

// ─────────────────────────────────────────────────────────────────────────────
// Sức khoẻ chỉ mục · Đối thủ · Vùng trắng
//
// Bảy endpoint dưới đây đã có ở máy chủ từ trước mà chưa chỗ nào trong CMS gọi
// tới. Chúng trả lời ba câu người quản trị thật sự cần hỏi, và câu đầu tiên
// quan trọng hơn cả bảng từ khoá: bài viết ra mà Google không lập chỉ mục thì
// mọi con số thứ hạng đều vô nghĩa.
// ─────────────────────────────────────────────────────────────────────────────

export type TrangThaiUrl = {
  url: string;
  trangThai?: string;
  robots?: string;
  lanCuoiThuThap?: string;
  urlChinhTac?: string;
  loi?: string;
};

/**
 * TỐI ĐA 10 URL MỖI LƯỢT — con số này không tuỳ tiện: API nằm sau CloudFront,
 * bị cắt cứng ở 30 giây và khi đó trả HTML 504 của chính nó, log ứng dụng
 * không ghi gì nên lỗi trông như máy chủ im lặng. Mỗi URL là một lời gọi ra
 * Google. Người gọi tự chia lô — xem kiemChiMucTheoLo bên dưới.
 */
export const kiemChiMuc = (urls: string[]) =>
  api.post<TrangThaiUrl[]>('/admin/keywords/kiem-chi-muc', { urls }).then((r) => r.data);

/** Chia lô 10, chạy tuần tự, báo tiến độ. Lô hỏng không làm hỏng cả mẻ. */
export async function kiemChiMucTheoLo(
  urls: string[],
  tienDo?: (xong: number, tong: number) => void,
): Promise<TrangThaiUrl[]> {
  const ra: TrangThaiUrl[] = [];
  for (let i = 0; i < urls.length; i += 10) {
    const lo = urls.slice(i, i + 10);
    try {
      ra.push(...(await kiemChiMuc(lo)));
    } catch (e) {
      ra.push(...lo.map((url) => ({ url, loi: (e as Error).message })));
    }
    tienDo?.(Math.min(i + 10, urls.length), urls.length);
  }
  return ra;
}

export type TrangThaiSitemap = {
  duongDan: string;
  lanCuoiTaiVe?: string;
  lanCuoiGui?: string;
  coLoi?: string;
  canhBao?: string;
  daXuLy?: boolean;
  noiDung?: { type: string; submitted: string; indexed: string }[];
};

export const getSitemap = () =>
  api.get<TrangThaiSitemap[] | { loi: string }>('/admin/keywords/sitemap').then((r) => r.data);

export type DongSerp = {
  hang: number;
  tenMien: string;
  url: string;
  tieuDe: string;
  loai: 'san' | 'mang-xa-hoi' | 'cua-minh' | 'khac';
};

export type KetQuaSerp = {
  tuKhoa: string;
  ketQua: DongSerp[];
  hangCuaMinh: number | null;
  soSan: number;
  soMangXaHoi: number;
  ketLuan: 'kho-voi-toi' | 'voi-toi-duoc';
  loi?: string;
};

/** Cũng tối đa 10 từ khoá mỗi lượt, cùng lý do CloudFront như trên. */
export const doiThu = (keywords: string[]) =>
  api.post<KetQuaSerp[]>('/admin/keywords/doi-thu', { keywords }).then((r) => r.data);

export const tuKhoaHangDau = (so = 10) =>
  api.get<string[]>('/admin/keywords/hang-dau', { params: { so } }).then((r) => r.data);

export type DongVungTrang = {
  keyword: string;
  loai: string;
  thuongMai: boolean;
  /** Bao nhiêu gợi ý khác cùng cụm lõi — thay cho số lượt tìm mà ta không có. */
  coCum: number;
  /** Slug bài đang nhắm cụm này, null nếu chưa có bài nào. */
  baiGan: string | null;
  diem: number;
};

export type KetQuaVungTrang = {
  tong: number;
  theoLoai: Record<string, number>;
  dong: DongVungTrang[];
};

/**
 * Máy chủ trả OBJECT `{ tong, theoLoai, dong }`, KHÔNG phải mảng trần.
 * Khai sai kiểu ở đây từng làm trắng màn hình cả tab: `rows.filter is not a
 * function`. Nên vừa khai đúng, vừa chốt lại bằng Array.isArray — đổi dạng
 * phản hồi ở máy chủ thì tab hiện rỗng chứ không sập.
 */
export const getVungTrang = () =>
  api.get<KetQuaVungTrang>('/admin/keywords/vung-trang').then((r) => ({
    tong: r.data?.tong ?? 0,
    theoLoai: r.data?.theoLoai ?? {},
    dong: Array.isArray(r.data?.dong) ? r.data.dong : [],
  }));

export type KetQuaMoRong = {
  dot: number;
  daHoi: number;
  them: number;
  rong: number;
  /** Hỏi gần hết mà toàn rỗng — nhiều khả năng Google đang chặn, đừng chạy tiếp. */
  nghiBiChan: boolean;
  tongCum: number;
  /** SỐ cụm còn lại, không phải danh sách. Gọi tiếp bằng cách tăng `dot`. */
  conLai: number;
};

export const moRong = (cumGoc: string[], dot = 0, moiDot = 20) =>
  api.post<KetQuaMoRong>('/admin/keywords/mo-rong', { cumGoc, dot, moiDot })
    .then((r) => r.data);

export type DongTrangGsc = { page: string; clicks: number; impressions: number; position: number };

export const getGscTrang = (soNgay = 90) =>
  api.get<DongTrangGsc[]>('/admin/keywords/gsc-trang', { params: { soNgay } }).then((r) => r.data);
