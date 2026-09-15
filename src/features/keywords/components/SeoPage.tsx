import { lazy, Suspense, useState } from 'react';
import { Tabs, Typography, Spin } from 'antd';
import {
  SearchOutlined, DatabaseOutlined, TeamOutlined, RadarChartOutlined,
} from '@ant-design/icons';

const TabTuKhoa = lazy(() => import('./TroLyKeywordPage'));
const SucKhoeChiMuc = lazy(() => import('./SucKhoeChiMuc'));
const DoiThuSerp = lazy(() => import('./DoiThuSerp'));
const VungTrang = lazy(() => import('./VungTrang'));

const { Title } = Typography;

/**
 * Trang SEO — bốn câu hỏi của người quản trị, xếp theo thứ tự thật sự quan trọng.
 *
 * THỨ TỰ NÀY LÀ KẾT LUẬN CỦA MỘT PHÉP ĐO, không phải sở thích sắp xếp. Ngày
 * 15/09/2026 đo ra chỉ 10/88 URL của site có trong chỉ mục Google và 75 trang
 * chưa bao giờ được thu thập. Trước đó nhiều phiên đã tối ưu tiêu đề, liên kết
 * và nội dung cho những trang mà Google chưa hề đọc. Bảng từ khoá không thể
 * phát hiện chuyện đó vì nó chỉ thấy trang ĐÃ có thứ hạng — nên "Sức khoẻ chỉ
 * mục" phải đứng trước nó.
 *
 * Nạp lười từng tab: mỗi tab gọi API riêng, và ba tab mới đều gọi ra dịch vụ
 * ngoài (Search Console, serper.dev) nên đừng chạy thứ người ta chưa mở tới.
 */
export default function SeoPage() {
  const [tab, setTab] = useState('chi-muc');

  return (
    <div className="space-y-4">
      <Title level={4} className="!mb-0">
        <SearchOutlined className="mr-2" />Từ khoá &amp; SEO
      </Title>

      <Tabs
        activeKey={tab} onChange={setTab} destroyInactiveTabPane={false}
        items={[
          {
            key: 'chi-muc',
            label: <><DatabaseOutlined className="mr-1" />Sức khoẻ chỉ mục</>,
            children: <Suspense fallback={<Spin />}><SucKhoeChiMuc /></Suspense>,
          },
          {
            key: 'tu-khoa',
            label: <><SearchOutlined className="mr-1" />Từ khoá</>,
            children: <Suspense fallback={<Spin />}><TabTuKhoa /></Suspense>,
          },
          {
            key: 'doi-thu',
            label: <><TeamOutlined className="mr-1" />Đối thủ</>,
            children: <Suspense fallback={<Spin />}><DoiThuSerp /></Suspense>,
          },
          {
            key: 'vung-trang',
            label: <><RadarChartOutlined className="mr-1" />Vùng trắng</>,
            children: <Suspense fallback={<Spin />}><VungTrang /></Suspense>,
          },
        ]}
      />
    </div>
  );
}
