import { useState } from 'react';
import {
  Card, DatePicker, Row, Col, Table, Typography, Statistic, Spin,
  Input, Button, Space, Tooltip as Tip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChartOutlined, EyeOutlined, UserOutlined, RiseOutlined, SearchOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { getVisitStats, getVisitTable, getHourStats, getProductFunnel } from '../services';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const GREEN = '#16a34a';
const BLUE = '#2563eb';
const MUTED = '#898781';
const GRID = '#e1e0d9';

/** Tên gọi dân dã cho từng khung bốn tiếng, để chủ trại đọc bảng không phải nhẩm. */
const BUOI = ['đêm', 'sáng sớm', 'buổi sáng', 'đầu chiều', 'cuối chiều', 'buổi tối'];

/**
 * Số khách tối thiểu để một tỉ lệ phần trăm nói được điều gì.
 *
 * Bên 17Fishing dùng 100. Trại này lưu lượng nhỏ hơn nhiều, để 100 thì gần như
 * mọi dòng đều mờ và có dấu sao — bảng mất tác dụng. 30 là mức thấp nhất còn
 * đọc được: dưới đó, một người mua thêm là tỉ lệ nhảy vài phần trăm.
 */
const TOI_THIEU_MAU = 30;

interface ProductFunnelRow {
  slug: string;
  name: string;
  viewers: number;
  cartEvents: number;
  carters: number;
  checkouters: number;
  quantitySold: number;
  orders: number;
  buyers: number;
  revenue: number;
}

/** Tỉ lệ phần trăm, tô đỏ khi thấp và mờ đi khi mẫu quá nhỏ để kết luận. */
function TiLe({ value, mau, nguong, goiY }: {
  value: number; mau: number; nguong: number; goiY: string;
}) {
  if (mau === 0) return <span style={{ color: '#d9d9d9' }}>—</span>;
  const pct = (value / mau) * 100;
  if (mau < TOI_THIEU_MAU) {
    return (
      <Tip title={`Mới ${mau} khách — quá ít để kết luận. Cần khoảng ${TOI_THIEU_MAU} khách.`}>
        <span style={{ color: '#bfbfbf' }}>{pct.toFixed(1)}%*</span>
      </Tip>
    );
  }
  const yeu = pct < nguong;
  return (
    <Tip title={yeu ? goiY : 'Ổn'}>
      <span style={{ color: yeu ? '#cf1322' : '#389e0d', fontWeight: 600, cursor: 'help' }}>
        {pct.toFixed(1)}%
      </span>
    </Tip>
  );
}

const WEB_URL = 'https://garutin.com';

const COT_PHEU: ColumnsType<ProductFunnelRow> = [
  {
    title: 'Sản phẩm',
    dataIndex: 'name',
    ellipsis: true,
    render: (v: string, r) => (
      <a href={`${WEB_URL}/san-pham/${r.slug}`} target="_blank" rel="noreferrer">{v}</a>
    ),
  },
  {
    title: 'Khách xem',
    dataIndex: 'viewers',
    align: 'right',
    width: 100,
    sorter: (a, b) => a.viewers - b.viewers,
    defaultSortOrder: 'descend',
    render: (v: number) => v.toLocaleString('vi-VN'),
  },
  {
    title: 'Thêm giỏ',
    dataIndex: 'carters',
    align: 'right',
    width: 100,
    sorter: (a, b) => a.carters - b.carters,
    render: (v: number, r) => (
      <Tip title={`${r.cartEvents} lượt bấm, từ ${v} khách khác nhau`}>
        <span style={{ cursor: 'help' }}>{v.toLocaleString('vi-VN')}</span>
      </Tip>
    ),
  },
  {
    title: 'Tỉ lệ thêm giỏ',
    key: 'tiLeThemGio',
    align: 'right',
    width: 130,
    sorter: (a, b) => (a.viewers ? a.carters / a.viewers : 0) - (b.viewers ? b.carters / b.viewers : 0),
    render: (_: unknown, r) => (
      <TiLe value={r.carters} mau={r.viewers} nguong={10}
        goiY="Ít người bấm thêm giỏ — thường do ảnh chưa đẹp, mô tả sơ sài, giá cao hơn mặt bằng, hoặc đang hết hàng." />
    ),
  },
  {
    title: 'Vào đặt hàng',
    dataIndex: 'checkouters',
    align: 'right',
    width: 120,
    sorter: (a, b) => a.checkouters - b.checkouters,
    render: (v: number, r) => (
      <Tip title={r.carters > 0
        ? `${v}/${r.carters} khách đã thêm giỏ mang sản phẩm này sang trang đặt hàng`
        : 'Số khách mang sản phẩm này vào trang đặt hàng'}>
        <span style={{ cursor: 'help' }}>{v.toLocaleString('vi-VN')}</span>
      </Tip>
    ),
  },
  {
    title: 'Đã bán',
    dataIndex: 'quantitySold',
    align: 'right',
    width: 95,
    sorter: (a, b) => a.quantitySold - b.quantitySold,
    render: (v: number, r) => (
      <Tip title={`${v} sản phẩm, trong ${r.orders} đơn`}>
        <span style={{ fontWeight: 600, cursor: 'help' }}>{v.toLocaleString('vi-VN')}</span>
      </Tip>
    ),
  },
  {
    title: 'Tỉ lệ mua',
    key: 'tiLeMua',
    align: 'right',
    width: 110,
    sorter: (a, b) => (a.viewers ? a.buyers / a.viewers : 0) - (b.viewers ? b.buyers / b.viewers : 0),
    render: (_: unknown, r) => (
      <TiLe value={r.buyers} mau={r.viewers} nguong={2}
        goiY="Nhiều người xem nhưng ít ai chốt. Nếu tỉ lệ thêm giỏ vẫn cao thì vướng ở giá hoặc khâu đặt hàng, không phải ở trang sản phẩm." />
    ),
  },
  {
    title: 'Doanh thu',
    dataIndex: 'revenue',
    align: 'right',
    width: 130,
    sorter: (a, b) => a.revenue - b.revenue,
    render: (v: number) =>
      v > 0 ? <span style={{ fontWeight: 600 }}>{v.toLocaleString('vi-VN')}đ</span>
            : <span style={{ color: '#bfbfbf' }}>—</span>,
  },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-lg rounded-md border border-gray-100 px-3 py-2 text-xs">
      <div className="font-medium text-gray-500 mb-1">{dayjs(label).format('DD/MM/YYYY')}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold">
            {typeof p.value === 'number' ? p.value.toLocaleString('vi-VN') : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface TimelineRow {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

/**
 * Một khung giờ bốn tiếng trong ngày, giờ Việt Nam. Máy chủ luôn trả đủ sáu
 * khung kể cả khung không có ai — khung vắng cũng là thông tin.
 */
interface HourRow {
  bucket: number;
  label: string;
  visits: number;
  visitors: number;
  orders: number;
}

interface TableRow {
  path: string;
  visits: number;
  uniqueVisitors: number;
}

export default function AnalyticsPage() {
  const today    = dayjs().format('YYYY-MM-DD');
  const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const [from, setFrom]               = useState(monthAgo);
  const [to, setTo]                   = useState(today);
  const [searchInput, setSearchInput] = useState('');
  const [appliedPath, setAppliedPath] = useState('');

  const { data: stats, isLoading: loadingStats } = useSWR(
    ['analytics-visits', from, to],
    () => getVisitStats(from, to),
  );

  const { data: pheu = [], isLoading: loadingPheu } = useSWR(
    ['analytics-product-funnel', from, to],
    () => getProductFunnel(from, to),
  );

  const { data: hourData, isLoading: loadingHours } = useSWR(
    ['analytics-hours', from, to],
    () => getHourStats(from, to),
  );

  const { data: rawTable, isLoading: loadingTable } = useSWR(
    ['analytics-table', from, to, appliedPath],
    () => getVisitTable({ from, to, path: appliedPath || undefined }),
  );

  const total          = stats?.total ?? 0;
  const uniqueVisitors = stats?.uniqueVisitors ?? 0;
  const timeline: TimelineRow[] = stats?.timeline ?? [];

  const hours: HourRow[] = hourData ?? [];
  // So sánh theo khung đông nhất chứ không theo tổng: khi lưu lượng dồn vào
  // một khung thì các thanh tính theo tổng đều ngắn tũn, nhìn không ra chênh
  // lệch giữa những khung còn lại.
  const hourMax = Math.max(1, ...hours.map(h => h.visits));

  const hourColumns: ColumnsType<HourRow> = [
    {
      title: 'Khung giờ',
      dataIndex: 'label',
      key: 'label',
      width: 130,
      render: (v: string, r) => (
        <span className="font-medium">
          {v} <span className="text-gray-400 text-xs ml-1">{BUOI[r.bucket]}</span>
        </span>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'visits',
      key: 'visits',
      render: (v: number) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-[60px] h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(v / hourMax) * 100}%`, background: GREEN }} />
          </div>
          <span className="font-semibold w-12 text-right">{v.toLocaleString('vi-VN')}</span>
        </div>
      ),
    },
    {
      title: 'Khách',
      dataIndex: 'visitors',
      key: 'visitors',
      width: 100,
      render: (v: number) => <span className="text-blue-600 font-semibold">{v.toLocaleString('vi-VN')}</span>,
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'orders',
      key: 'orders',
      width: 100,
      render: (v: number) => (
        <span className={v > 0 ? 'font-semibold' : 'text-gray-300'}>{v.toLocaleString('vi-VN')}</span>
      ),
    },
  ];

  const tableColumns: ColumnsType<TableRow> = [
    {
      title: 'Đường dẫn',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (v: string) => (
        <a
          href={`https://garutin.com${v}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline text-xs font-mono"
        >
          {v}
        </a>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'visits',
      key: 'visits',
      width: 140,
      sorter: (a, b) => a.visits - b.visits,
      defaultSortOrder: 'descend',
      render: (v: number) => <span className="font-semibold">{v.toLocaleString('vi-VN')}</span>,
    },
    {
      title: 'Unique users',
      dataIndex: 'uniqueVisitors',
      key: 'uniqueVisitors',
      width: 140,
      sorter: (a, b) => a.uniqueVisitors - b.uniqueVisitors,
      render: (v: number) => <span className="text-blue-600 font-semibold">{v.toLocaleString('vi-VN')}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <Title level={4} className="!mb-0">
        <BarChartOutlined className="mr-2" />Phân tích lượt truy cập
      </Title>

      {/* Date filter */}
      <Card size="small">
        <RangePicker
          value={[dayjs(from), dayjs(to)]}
          onChange={v => {
            if (v?.[0] && v?.[1]) {
              setFrom(v[0].format('YYYY-MM-DD'));
              setTo(v[1].format('YYYY-MM-DD'));
            }
          }}
          allowClear={false}
        />
      </Card>

      {/* Summary cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng lượt truy cập"
              value={total}
              prefix={<EyeOutlined />}
              loading={loadingStats}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Unique users (IP)"
              value={uniqueVisitors}
              prefix={<UserOutlined />}
              loading={loadingStats}
              valueStyle={{ color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tỷ lệ truy cập / unique"
              value={uniqueVisitors > 0 ? (total / uniqueVisitors).toFixed(1) : '—'}
              prefix={<RiseOutlined />}
              loading={loadingStats}
              suffix="lượt/người"
            />
          </Card>
        </Col>
      </Row>

      {/* Daily timeline */}
      <Card title="Lượt truy cập theo ngày" size="small">
        <Spin spinning={loadingStats}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => dayjs(d).format('DD/MM')}
                tick={{ fontSize: 11, fill: MUTED }}
                axisLine={{ stroke: '#c3c2b7' }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Line type="monotone" dataKey="visits" name="Lượt xem" stroke={GREEN} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="uniqueVisitors" name="Unique visitors" stroke={BLUE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Spin>
      </Card>

      {/* Phễu theo từng sản phẩm */}
      <Card
        title="Từng sản phẩm: xem → thêm giỏ → vào đặt hàng → mua"
        size="small"
        extra={
          <span className="text-xs text-gray-400">
            Ẩn sản phẩm chưa có hoạt động nào · số liệu tính từ lúc bật đo hành vi
          </span>
        }
      >
        <Spin spinning={loadingPheu}>
          <Table<ProductFunnelRow>
            dataSource={pheu}
            columns={COT_PHEU}
            rowKey="slug"
            size="small"
            scroll={{ x: 900 }}
            pagination={{ pageSize: 20, showTotal: t => `${t} sản phẩm` }}
          />
          <div className="text-xs text-gray-500 mt-3 leading-relaxed">
            <b>Cách đọc theo từng bước rơi rụng:</b><br />
            • <b>Xem nhiều, thêm giỏ ít</b> → vấn đề ở trang sản phẩm: ảnh, mô tả, giá, hoặc đang hết hàng.<br />
            • <b>Thêm giỏ nhiều, vào đặt hàng ít</b> → khách nhìn tổng tiền trong giỏ rồi đổi ý: vướng ở giá.<br />
            • <b>Vào đặt hàng rồi vẫn không thành đơn</b> → vướng ở chính khâu đặt hàng.<br />
            Cột <b>Đã bán</b> đếm từ đơn hàng thật. <b>Tỉ lệ mua</b> chỉ tính đơn đặt qua web —
            đơn chốt qua Zalo hoặc điện thoại không được tính vào đây.<br />
            Sản phẩm không ai xem <i>và</i> không bán được món nào thì được ẩn khỏi bảng. Sản phẩm
            có bán nhưng chưa ai xem vẫn hiện — đó thường là đơn chốt qua Zalo.
          </div>
        </Spin>
      </Card>

      {/* Khung giờ khách ghé thăm */}
      <Card
        title={<><ClockCircleOutlined className="mr-2" />Khung giờ khách ghé thăm</>}
        size="small"
        extra={<span className="text-xs text-gray-400">giờ Việt Nam</span>}
      >
        <Spin spinning={loadingHours}>
          <Table<HourRow>
            dataSource={hours}
            columns={hourColumns}
            rowKey="bucket"
            size="small"
            pagination={false}
            scroll={{ x: 460 }}
          />
        </Spin>
        <div className="text-xs text-gray-400 mt-2">
          Đơn hàng tính theo giờ khách đặt. Dùng bảng này để chọn giờ đăng bài và giờ trực Zalo.
        </div>
      </Card>

      {/* Top pages table */}
      <Card
        title="Chi tiết theo trang"
        extra={
          <Space>
            <Input
              placeholder="Tìm đường dẫn..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onPressEnter={() => setAppliedPath(searchInput)}
              style={{ width: 220 }}
              allowClear
              onClear={() => { setSearchInput(''); setAppliedPath(''); }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={() => setAppliedPath(searchInput)}>
              Lọc
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingTable}>
          <Table<TableRow>
            dataSource={rawTable ?? []}
            columns={tableColumns}
            rowKey="path"
            size="small"
            scroll={{ x: 500 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: t => `${t.toLocaleString('vi-VN')} trang`,
            }}
          />
        </Spin>
      </Card>
    </div>
  );
}
