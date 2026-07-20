import { useMemo } from 'react';
import { Card, Col, Row, Statistic, Spin, Alert, Tag, Progress, Empty } from 'antd';
import {
  ShoppingCartOutlined, ClockCircleOutlined, ShoppingOutlined, FileTextOutlined,
  EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined,
} from '@ant-design/icons';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { getOrderStats, getVisitStats, getMonthlyCompare, getTopProducts } from '../../analytics/services';

const fetchProducts = () => api.get('/admin/products').then((r) => r.data);
const fetchPosts = () => api.get('/admin/posts').then((r) => r.data);

const GREEN = '#16a34a';
const BLUE = '#2563eb';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const MUTED = '#898781';
const GRID = '#e1e0d9';

const STATUS_CFG: Record<string, { label: string; color: string; hex: string }> = {
  pending:   { label: 'Chờ xử lý',   color: 'orange', hex: AMBER },
  confirmed: { label: 'Đã xác nhận', color: 'blue',   hex: BLUE },
  shipping:  { label: 'Đang giao',   color: 'cyan',   hex: '#06b6d4' },
  delivered: { label: 'Đã giao',     color: 'green',  hex: GREEN },
  cancelled: { label: 'Đã hủy',      color: 'red',    hex: RED },
};

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M ₫';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K ₫';
  return n + ' ₫';
};

function GrowthTag({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <Tag>—</Tag>;
  if (value > 0) return <Tag color="success" icon={<ArrowUpOutlined />}>+{value}%</Tag>;
  if (value < 0) return <Tag color="error" icon={<ArrowDownOutlined />}>{value}%</Tag>;
  return <Tag>Không đổi</Tag>;
}

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const { data: orderStats, isLoading: orderLoading } = useSWR(
    ['dash-orders', monthAgo, today], () => getOrderStats(monthAgo, today),
  );
  const { data: visitStats, isLoading: visitLoading } = useSWR(
    ['dash-visits', monthAgo, today], () => getVisitStats(monthAgo, today),
  );
  const { data: monthly, isLoading: monthlyLoading } = useSWR('dash-monthly', getMonthlyCompare);
  const { data: topProducts = [], isLoading: topLoading } = useSWR(
    ['dash-top-products', monthAgo, today], () => getTopProducts(monthAgo, today, 5),
  );
  const { data: products = [], isLoading: productsLoading } = useSWR('dashboard-products', fetchProducts);
  const { data: posts = [], isLoading: postsLoading } = useSWR('dashboard-posts', fetchPosts);

  const byStatus: { status: string; count: number }[] = orderStats?.byStatus ?? [];
  const pendingOrders = byStatus.find((s) => s.status === 'pending')?.count ?? 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalPosts = Array.isArray(posts) ? posts.length : 0;

  const revenueTimeline = orderStats?.timeline ?? [];
  const visitTimeline = visitStats?.timeline ?? [];

  const maxTopQty = useMemo(
    () => Math.max(...(topProducts as { totalQty: number }[]).map((p) => p.totalQty), 1),
    [topProducts],
  );
  const maxStatusCount = useMemo(
    () => Math.max(...byStatus.map((s) => s.count), 1),
    [byStatus],
  );

  const initialLoading = orderLoading || visitLoading || monthlyLoading || productsLoading || postsLoading;

  if (initialLoading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <span className="text-xs text-gray-400">
          30 ngày qua · {dayjs(monthAgo).format('DD/MM')} – {dayjs(today).format('DD/MM/YYYY')}
        </span>
      </div>

      {/* KPI hero row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng này"
              value={monthly?.current?.revenue ?? 0}
              formatter={(v) => fmtShort(Number(v))}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: GREEN }}
            />
            <div className="mt-2"><GrowthTag value={monthly?.revenueGrowth} /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn hàng tháng này"
              value={monthly?.current?.orders ?? 0}
              suffix="đơn"
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: BLUE }}
            />
            <div className="mt-2"><GrowthTag value={monthly?.ordersGrowth} /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lượt truy cập (30 ngày)"
              value={visitStats?.total ?? 0}
              prefix={<EyeOutlined />}
            />
            <div className="mt-2 text-xs text-gray-400">
              {(visitStats?.uniqueVisitors ?? 0).toLocaleString('vi-VN')} unique visitors
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/orders')}>
            <Statistic
              title="Đơn chờ xử lý"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: pendingOrders > 0 ? AMBER : GREEN }}
            />
          </Card>
        </Col>
      </Row>

      {/* Trend charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Doanh thu theo ngày" size="small">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueTimeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => dayjs(d).format('DD/MM')}
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={{ stroke: '#c3c2b7' }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(v) => fmtShort(v)}
                  tick={{ fontSize: 11, fill: MUTED }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="revenue" name="Doanh thu"
                  stroke={GREEN} strokeWidth={2} fill="url(#revenueFill)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Lượt truy cập theo ngày" size="small">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={visitTimeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          </Card>
        </Col>
      </Row>

      {/* Top products + order status breakdown */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<span><TrophyOutlined className="mr-2" />Top 5 sản phẩm bán chạy</span>} size="small">
            <Spin spinning={topLoading}>
              {topProducts.length === 0 ? (
                <Empty description="Chưa có dữ liệu" />
              ) : (
                <div className="space-y-3">
                  {(topProducts as any[]).map((p, i) => (
                    <div key={p.productId ?? p.name} className="flex items-center gap-3">
                      <span className={`text-xs w-4 ${i < 3 ? 'font-bold text-amber-500' : 'text-gray-400'}`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm truncate">{p.name}</span>
                      <Progress
                        percent={Math.round((p.totalQty / maxTopQty) * 100)}
                        showInfo={false} size="small" style={{ width: 80 }} strokeColor={GREEN}
                      />
                      <span className="text-sm font-semibold w-20 text-right">
                        {p.totalQty.toLocaleString('vi-VN')} {p.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Đơn hàng theo trạng thái" size="small">
            {byStatus.length === 0 ? (
              <Empty description="Chưa có dữ liệu" />
            ) : (
              <div className="space-y-3">
                {byStatus.map((s) => {
                  const cfg = STATUS_CFG[s.status] ?? { label: s.status, color: 'default', hex: MUTED };
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <Tag color={cfg.color} className="w-24 text-center">{cfg.label}</Tag>
                      <Progress
                        percent={Math.round((s.count / maxStatusCount) * 100)}
                        showInfo={false} size="small" style={{ width: 100 }} strokeColor={cfg.hex}
                      />
                      <span className="text-sm font-semibold">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick totals */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Sản phẩm" value={totalProducts} prefix={<ShoppingOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Bài viết" value={totalPosts} prefix={<FileTextOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
      </Row>

      {pendingOrders > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`Có ${pendingOrders} đơn hàng chờ xử lý`}
          description="Vào mục Đơn hàng để xem và cập nhật trạng thái."
        />
      )}
    </div>
  );
}
