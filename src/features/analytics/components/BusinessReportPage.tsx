import { useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Typography, DatePicker,
  Tabs, Progress, Spin, Empty,
} from 'antd';
import {
  TrophyOutlined, SwapOutlined, LineChartOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { getTopProducts, getMonthlyCompare, getProductConversion } from '../services';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n));
const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M ₫';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K ₫';
  return n + ' ₫';
};

function GrowthTag({ value }: { value: number | null }) {
  if (value === null) return <Tag>Chưa có dữ liệu kỳ trước</Tag>;
  if (value > 0) return <Tag color="success" icon={<ArrowUpOutlined />}>+{value}%</Tag>;
  if (value < 0) return <Tag color="error" icon={<ArrowDownOutlined />}>{value}%</Tag>;
  return <Tag>Không đổi</Tag>;
}

// ── Tab 1: Top sản phẩm ──────────────────────────────────────────────────────
function TopProductsTab({ from, to }: { from: string; to: string }) {
  const { data = [], isLoading } = useSWR(
    ['top-products', from, to],
    () => getTopProducts(from, to, 30),
  );

  const max = (data[0] as any)?.totalQty ?? 1;

  const columns = [
    {
      title: '#', key: 'rank', width: 40,
      render: (_: unknown, __: unknown, i: number) => (
        <span className={i < 3 ? 'font-bold text-amber-500' : 'text-gray-400'}>{i + 1}</span>
      ),
    },
    {
      title: 'Sản phẩm', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-medium text-sm">{v}</span>,
    },
    {
      title: 'Số lượng bán', key: 'qty', width: 220,
      render: (_: unknown, r: any) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={Math.round((r.totalQty / max) * 100)}
            showInfo={false} size="small" style={{ width: 80 }}
            strokeColor="#16a34a"
          />
          <span className="font-semibold text-sm">{r.totalQty.toLocaleString('vi-VN')} {r.unit}</span>
        </div>
      ),
    },
    {
      title: 'Doanh thu', dataIndex: 'totalRevenue', key: 'revenue', width: 150,
      sorter: (a: any, b: any) => a.totalRevenue - b.totalRevenue,
      defaultSortOrder: 'descend' as const,
      render: (v: number) => <span className="font-semibold text-green-700">{fmtShort(v)}</span>,
    },
    {
      title: 'Số đơn', dataIndex: 'orderCount', key: 'orders', width: 90,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
  ];

  return (
    <Spin spinning={isLoading}>
      {data.length === 0 && !isLoading ? (
        <Empty description="Chưa có dữ liệu trong khoảng thời gian này" />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(r: any) => r.productId ?? r.name}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      )}
    </Spin>
  );
}

// ── Tab 2: So sánh tháng ─────────────────────────────────────────────────────
function MonthlyCompareTab() {
  const { data, isLoading } = useSWR('monthly-compare', getMonthlyCompare);

  if (isLoading) return <div className="text-center py-10"><Spin /></div>;
  if (!data) return <Empty />;

  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-');
    return `Tháng ${mo}/${y}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        So sánh <b>{monthLabel(data.month)}</b> với <b>{monthLabel(data.prevMonth)}</b>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card title="Doanh thu" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<span className="text-xs text-gray-500">{monthLabel(data.month)}</span>}
                  value={data.current.revenue}
                  formatter={v => fmtShort(Number(v))}
                  valueStyle={{ color: '#16a34a', fontSize: 20 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span className="text-xs text-gray-500">{monthLabel(data.prevMonth)}</span>}
                  value={data.previous.revenue}
                  formatter={v => fmtShort(Number(v))}
                  valueStyle={{ fontSize: 18, color: '#9ca3af' }}
                />
              </Col>
            </Row>
            <div className="mt-3 flex items-center gap-2">
              <Text className="text-sm text-gray-500">Tăng trưởng:</Text>
              <GrowthTag value={data.revenueGrowth} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="Đơn hàng" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<span className="text-xs text-gray-500">{monthLabel(data.month)}</span>}
                  value={data.current.orders}
                  suffix="đơn"
                  valueStyle={{ color: '#2563eb', fontSize: 20 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span className="text-xs text-gray-500">{monthLabel(data.prevMonth)}</span>}
                  value={data.previous.orders}
                  suffix="đơn"
                  valueStyle={{ fontSize: 18, color: '#9ca3af' }}
                />
              </Col>
            </Row>
            <div className="mt-3 flex items-center gap-2">
              <Text className="text-sm text-gray-500">Tăng trưởng:</Text>
              <GrowthTag value={data.ordersGrowth} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Chi tiết so sánh" size="small">
        <Table
          size="small"
          pagination={false}
          dataSource={[
            { metric: 'Doanh thu', cur: fmt(data.current.revenue), prev: fmt(data.previous.revenue), growth: data.revenueGrowth },
            { metric: 'Số đơn hàng', cur: `${data.current.orders} đơn`, prev: `${data.previous.orders} đơn`, growth: data.ordersGrowth },
            {
              metric: 'Doanh thu TB/đơn',
              cur: data.current.orders > 0 ? fmtShort(data.current.revenue / data.current.orders) : '—',
              prev: data.previous.orders > 0 ? fmtShort(data.previous.revenue / data.previous.orders) : '—',
              growth: null,
            },
          ]}
          columns={[
            { title: 'Chỉ số', dataIndex: 'metric', key: 'metric', width: 180 },
            { title: monthLabel(data.month), dataIndex: 'cur', key: 'cur', render: (v: string) => <span className="font-semibold">{v}</span> },
            { title: monthLabel(data.prevMonth), dataIndex: 'prev', key: 'prev', render: (v: string) => <span className="text-gray-400">{v}</span> },
            { title: 'Tăng trưởng', dataIndex: 'growth', key: 'growth', render: (v: number | null) => <GrowthTag value={v} /> },
          ]}
          rowKey="metric"
        />
      </Card>
    </div>
  );
}

// ── Tab 3: Chuyển đổi sản phẩm ───────────────────────────────────────────────
function ProductConversionTab({ from, to }: { from: string; to: string }) {
  const { data = [], isLoading } = useSWR(
    ['product-conversion', from, to],
    () => getProductConversion(from, to),
  );

  const columns = [
    {
      title: '#', key: 'rank', width: 40,
      render: (_: unknown, __: unknown, i: number) => (
        <span className={i < 3 ? 'font-bold text-amber-500' : 'text-gray-400'}>{i + 1}</span>
      ),
    },
    {
      title: 'Sản phẩm', dataIndex: 'name', key: 'name',
      render: (v: string, r: any) => (
        <div>
          <div className="font-medium text-sm">{v}</div>
          <span className="text-xs text-gray-400 font-mono">/san-pham/{r.slug}</span>
        </div>
      ),
    },
    {
      title: 'Lượt xem', dataIndex: 'views', key: 'views', width: 120,
      sorter: (a: any, b: any) => a.views - b.views,
      render: (v: number) => <span className="tabular-nums">{(v ?? 0).toLocaleString('vi-VN')}</span>,
    },
    {
      title: 'Số đơn', dataIndex: 'orders', key: 'orders', width: 100,
      sorter: (a: any, b: any) => a.orders - b.orders,
      render: (v: number) => <Tag color="blue">{v ?? 0}</Tag>,
    },
    {
      title: 'Tỷ lệ chuyển đổi', key: 'rate', width: 200,
      sorter: (a: any, b: any) => (a.conversionRate ?? 0) - (b.conversionRate ?? 0),
      defaultSortOrder: 'descend' as const,
      render: (_: unknown, r: any) => {
        const rate = r.conversionRate ?? 0;
        if (r.views === 0) return <span className="text-gray-300">—</span>;
        const color = rate >= 10 ? '#16a34a' : rate >= 3 ? '#f59e0b' : '#ef4444';
        return (
          <div className="flex items-center gap-2">
            <Progress
              percent={Math.min(rate, 100)}
              showInfo={false} size="small" style={{ width: 80 }}
              strokeColor={color}
            />
            <span className="font-semibold text-sm tabular-nums" style={{ color }}>{rate.toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <Spin spinning={isLoading}>
      {data.length === 0 && !isLoading ? (
        <Empty description="Chưa có dữ liệu trong khoảng thời gian này" />
      ) : (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="productId"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      )}
    </Spin>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BusinessReportPage() {
  const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const today    = dayjs().format('YYYY-MM-DD');
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo]     = useState(today);

  const tabs = [
    {
      key: 'products',
      label: <span><TrophyOutlined className="mr-1" />Top sản phẩm</span>,
      children: <TopProductsTab from={from} to={to} />,
    },
    {
      key: 'monthly',
      label: <span><SwapOutlined className="mr-1" />So sánh tháng</span>,
      children: <MonthlyCompareTab />,
    },
    {
      key: 'conversion',
      label: <span><LineChartOutlined className="mr-1" />Chuyển đổi SP</span>,
      children: <ProductConversionTab from={from} to={to} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">Báo cáo kinh doanh</Title>
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
      </div>
      <Tabs items={tabs} />
    </div>
  );
}
