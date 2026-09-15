import { useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Typography, Alert, Progress, message, Statistic, Row, Col, Tooltip,
} from 'antd';
import { SyncOutlined, CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { getPosts } from '@/features/posts/services';
import { getProducts } from '@/features/products/services';
import {
  kiemChiMucTheoLo, getSitemap, getGscTrang,
  type TrangThaiUrl, type TrangThaiSitemap,
} from '../services/tro-ly';

const { Text, Paragraph } = Typography;

/**
 * Sức khoẻ chỉ mục — câu hỏi quan trọng hơn mọi bảng thứ hạng.
 *
 * VÌ SAO TAB NÀY ĐỨNG ĐẦU: ngày 15/09/2026 đo ra chỉ 10/88 URL của garutin.com
 * có trong chỉ mục Google, và 75 trang chưa bao giờ được thu thập. Trước đó đã
 * mất nhiều phiên tối ưu tiêu đề, liên kết, nội dung cho những trang mà Google
 * chưa hề đọc. Bảng từ khoá không thể phát hiện chuyện đó — nó chỉ thấy trang
 * ĐÃ có thứ hạng.
 *
 * Mỗi trạng thái đòi một việc khác hẳn, nên bảng phải nói rõ chứ không gộp
 * chung thành "chưa lập chỉ mục":
 *   - "Đã thu thập – chưa lập chỉ mục"  → Google ĐỌC RỒI CHỦ ĐỘNG BỎ. Bấm yêu
 *     cầu lập chỉ mục vô ích; phải sửa nội dung hoặc gộp bài.
 *   - "Đã phát hiện – chưa lập chỉ mục" → chưa buồn đọc. Ngân sách thu thập:
 *     bấm yêu cầu có tác dụng, và nên giảm bớt URL yếu.
 *   - "Google không xác định được URL"  → chưa biết tới bao giờ.
 */

const NHOM: Record<string, { nhan: string; mau: string; viec: string }> = {
  'chi-muc': { nhan: 'Đã lập chỉ mục', mau: 'green', viec: 'Không phải làm gì' },
  'doc-roi-bo': {
    nhan: 'Đã đọc rồi bỏ qua', mau: 'red',
    viec: 'Bấm yêu cầu lập chỉ mục KHÔNG ăn thua — phải sửa nội dung hoặc gộp vào bài khác',
  },
  'chua-doc': {
    nhan: 'Chưa buồn đọc', mau: 'orange',
    viec: 'Bấm "Yêu cầu lập chỉ mục" trong Search Console — khoảng 10 URL mỗi ngày',
  },
  'chua-biet': {
    nhan: 'Google chưa biết tới', mau: 'volcano',
    viec: 'Bấm yêu cầu lập chỉ mục, và kiểm xem có trang nào trỏ tới nó không',
  },
  khac: { nhan: 'Khác', mau: 'default', viec: 'Mở URL trong Search Console để xem chi tiết' },
};

function xepNhom(t?: string): keyof typeof NHOM {
  if (!t) return 'khac';
  if (/đã được gửi|lập chỉ mục$/i.test(t) && !/chưa/i.test(t)) return 'chi-muc';
  if (/thu thập/i.test(t) && /chưa/i.test(t)) return 'doc-roi-bo';
  if (/phát hiện/i.test(t) && /chưa/i.test(t)) return 'chua-doc';
  if (/không xác định/i.test(t)) return 'chua-biet';
  return 'khac';
}

type Dong = TrangThaiUrl & { nhom: keyof typeof NHOM; loai: string; hienThi: number; diem: number };

export default function SucKhoeChiMuc() {
  const [rows, setRows] = useState<Dong[]>([]);
  const [sitemap, setSitemap] = useState<TrangThaiSitemap[] | null>(null);
  const [dangChay, setDangChay] = useState(false);
  const [tienDo, setTienDo] = useState<[number, number]>([0, 0]);

  async function quet() {
    setDangChay(true);
    setRows([]);
    try {
      const [bai, sp, gsc, sm] = await Promise.all([
        getPosts().catch(() => []),
        getProducts().catch(() => []),
        getGscTrang().catch(() => []),
        getSitemap().catch(() => null),
      ]);
      if (Array.isArray(sm)) setSitemap(sm);

      // Bỏ bài đã gộp: chúng chuyển hướng đi nơi khác nên không có URL riêng
      // để lập chỉ mục, đưa vào bảng chỉ làm loãng con số.
      const goc = window.location.origin.replace('admin.', '').replace(/^https?:\/\//, '');
      const site = `https://${goc.includes('localhost') ? 'garutin.com' : goc}`;
      const ds: { url: string; loai: string }[] = [
        { url: `${site}/`, loai: 'trang' },
        { url: `${site}/san-pham`, loai: 'trang' },
        { url: `${site}/blog`, loai: 'trang' },
        ...(bai as { slug: string; status: string; redirectTo?: string }[])
          .filter((b) => b.status === 'published' && !b.redirectTo)
          .map((b) => ({ url: `${site}/blog/${b.slug}`, loai: 'bài' })),
        ...(sp as { slug: string; isActive?: boolean }[])
          .filter((p) => p.isActive !== false)
          .map((p) => ({ url: `${site}/san-pham/${p.slug}`, loai: 'sản phẩm' })),
      ];

      // Hiển thị thật từ Search Console, để xếp thứ tự ưu tiên theo giá trị
      // chứ không theo thứ tự chữ cái. Bỏ tiền tố www: trang www và không-www
      // là cùng một nội dung.
      const ht: Record<string, number> = {};
      gsc.forEach((r) => {
        const u = r.page.replace(/^https:\/\/(www\.)?[^/]+/, '');
        ht[u || '/'] = (ht[u || '/'] || 0) + r.impressions;
      });

      const kq = await kiemChiMucTheoLo(ds.map((x) => x.url), (x, t) => setTienDo([x, t]));
      const loai = Object.fromEntries(ds.map((x) => [x.url, x.loai]));
      setRows(
        kq.map((k) => {
          const duong = k.url.replace(site, '') || '/';
          const hienThi = ht[duong] || 0;
          const nhom = xepNhom(k.trangThai);
          return {
            ...k, nhom, loai: loai[k.url] ?? '', hienThi,
            // Ưu tiên: đang có nhu cầu đo được > trang bán > trang thường.
            diem: hienThi + (duong === '/san-pham' ? 500 : 0) + (loai[k.url] === 'sản phẩm' ? 30 : 0),
          };
        }).sort((a, b) => b.diem - a.diem),
      );
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setDangChay(false);
    }
  }

  const dem = (n: keyof typeof NHOM) => rows.filter((r) => r.nhom === n).length;
  const canBam = rows.filter((r) => r.nhom === 'chua-doc' || r.nhom === 'chua-biet');
  const dotHomNay = canBam.slice(0, 10);

  const chep = (ds: Dong[]) => {
    navigator.clipboard.writeText(ds.map((r) => r.url).join('\n'));
    message.success(`Đã chép ${ds.length} URL — dán từng dòng vào ô tìm kiếm của Search Console`);
  };

  return (
    <Space direction="vertical" size="middle" className="w-full">
      <Alert
        type="info" showIcon
        message="Bài viết ra mà Google không lập chỉ mục thì mọi con số thứ hạng đều vô nghĩa"
        description={
          <Paragraph className="!mb-0">
            Tab này hỏi thẳng Search Console từng URL một. Google <strong>không mở API</strong> cho
            việc yêu cầu lập chỉ mục trang thường, nên phải bấm tay trong Search Console —
            khoảng <strong>10 URL mỗi ngày</strong>. Nút "Chép đợt hôm nay" bên dưới lấy sẵn 10 URL
            đáng bấm nhất.
          </Paragraph>
        }
      />

      <Space wrap>
        <Button type="primary" icon={<SyncOutlined />} loading={dangChay} onClick={quet}>
          Quét trạng thái chỉ mục
        </Button>
        {dangChay && tienDo[1] > 0 && (
          <Progress percent={Math.round((tienDo[0] / tienDo[1]) * 100)} size="small" style={{ width: 'min(220px, 60vw)' }} />
        )}
        {!!dotHomNay.length && (
          <Button icon={<CopyOutlined />} onClick={() => chep(dotHomNay)}>
            Chép đợt hôm nay ({dotHomNay.length} URL)
          </Button>
        )}
      </Space>

      {!!rows.length && (
        <>
          <Row gutter={12}>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Đã lập chỉ mục" value={dem('chi-muc')} suffix={`/ ${rows.length}`}
                  valueStyle={{ color: dem('chi-muc') / rows.length < 0.5 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small"><Statistic title="Chưa buồn đọc" value={dem('chua-doc')} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small"><Statistic title="Google chưa biết" value={dem('chua-biet')} /></Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Đọc rồi bỏ qua" value={dem('doc-roi-bo')}
                  valueStyle={{ color: dem('doc-roi-bo') ? '#cf1322' : undefined }} />
              </Card>
            </Col>
          </Row>

          {dem('doc-roi-bo') > 0 && (
            <Alert
              type="warning" showIcon
              message={`${dem('doc-roi-bo')} trang Google đã đọc rồi chủ động bỏ qua`}
              description="Với những trang này, bấm yêu cầu lập chỉ mục không ăn thua. Google đánh giá nội dung chưa đủ giá trị riêng — phải viết sâu hơn, hoặc gộp vào bài khác cùng chủ đề."
            />
          )}

          {sitemap?.length && (
            <Card size="small" title="Sitemap">
              {sitemap.map((s) => (
                <div key={s.duongDan} className="text-sm">
                  <Text code>{s.duongDan}</Text>{' · '}
                  Google tải lần cuối:{' '}
                  <Text strong>{s.lanCuoiTaiVe ? new Date(s.lanCuoiTaiVe).toLocaleString('vi-VN') : 'chưa bao giờ'}</Text>
                  {' · '}lỗi {s.coLoi ?? 0} · cảnh báo {s.canhBao ?? 0}
                  {s.noiDung?.map((n) => <span key={n.type}>{` · ${n.type}: ${n.submitted} URL`}</span>)}
                </div>
              ))}
            </Card>
          )}

          <Table<Dong>
            rowKey="url" size="small" dataSource={rows}
            pagination={{ pageSize: 30, showSizeChanger: false }}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Trang', dataIndex: 'url', width: 340,
                render: (u: string, r) => (
                  <Space size={4}>
                    <a href={u} target="_blank" rel="noreferrer"><LinkOutlined /></a>
                    <Text ellipsis style={{ maxWidth: 290 }}>{u.replace(/^https?:\/\/[^/]+/, '') || '/'}</Text>
                    <Tag>{r.loai}</Tag>
                  </Space>
                ),
              },
              {
                title: 'Trạng thái', dataIndex: 'nhom', width: 170,
                filters: Object.entries(NHOM).map(([v, n]) => ({ text: n.nhan, value: v })),
                onFilter: (v, r) => r.nhom === v,
                render: (n: keyof typeof NHOM, r) => (
                  <Tooltip title={r.trangThai ?? r.loi}>
                    <Tag color={NHOM[n].mau}>{NHOM[n].nhan}</Tag>
                  </Tooltip>
                ),
              },
              {
                title: 'Hiển thị 90 ngày', dataIndex: 'hienThi', width: 130, align: 'right',
                sorter: (a, b) => a.hienThi - b.hienThi,
                render: (v: number) => (v ? v.toLocaleString('vi-VN') : <Text type="secondary">—</Text>),
              },
              {
                title: 'Google đọc lần cuối', dataIndex: 'lanCuoiThuThap', width: 160,
                render: (v?: string) => v
                  ? new Date(v).toLocaleDateString('vi-VN')
                  : <Text type="secondary">chưa bao giờ</Text>,
              },
              {
                title: 'Nên làm gì', dataIndex: 'nhom', width: 330,
                render: (n: keyof typeof NHOM) => <Text type="secondary">{NHOM[n].viec}</Text>,
              },
            ]}
          />
        </>
      )}
    </Space>
  );
}
