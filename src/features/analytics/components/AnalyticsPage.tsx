import { useState, useMemo } from 'react';
import {
  Card, DatePicker, Row, Col, Table, Tag, Typography, Statistic, Spin,
  Select, Input, Button, Space, Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChartOutlined, EyeOutlined, UserOutlined, RiseOutlined, SearchOutlined,
} from '@ant-design/icons';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { getVisitStats, getVisitTable } from '../services';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  facebook: { label: 'Facebook', color: '#1877f2' },
  youtube:  { label: 'YouTube',  color: '#ff0000' },
  tiktok:   { label: 'TikTok',   color: '#010101' },
  zalo:     { label: 'Zalo',     color: '#0068ff' },
  web:      { label: 'Trực tiếp', color: '#16a34a' },
  other:    { label: 'Khác',     color: '#9ca3af' },
};

const PLATFORM_OPTIONS = [
  { value: '', label: 'Tất cả nền tảng' },
  ...Object.entries(PLATFORM_LABELS).map(([value, { label }]) => ({ value, label })),
];

interface TimelineRow {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface TableRow {
  path: string;
  platform: string;
  visits: number;
  uniqueVisitors: number;
}

export default function AnalyticsPage() {
  const today    = dayjs().format('YYYY-MM-DD');
  const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const [from, setFrom]           = useState(monthAgo);
  const [to, setTo]               = useState(today);
  const [platform, setPlatform]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedPath, setAppliedPath] = useState('');

  const { data: stats, isLoading: loadingStats } = useSWR(
    ['analytics-visits', from, to],
    () => getVisitStats(from, to),
  );

  const { data: rawTable, isLoading: loadingTable } = useSWR(
    ['analytics-table', from, to, platform, appliedPath],
    () => getVisitTable({ from, to, platform: platform || undefined, path: appliedPath || undefined }),
  );

  const total          = stats?.total ?? 0;
  const uniqueVisitors = stats?.uniqueVisitors ?? 0;
  const byPlatform: { platform: string; visits: number }[] = stats?.byPlatform ?? [];
  const timeline: TimelineRow[] = stats?.timeline ?? [];

  const maxVisits = useMemo(() => Math.max(...timeline.map((r: TimelineRow) => r.visits), 1), [timeline]);

  const timelineColumns: ColumnsType<TimelineRow> = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (v: string) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      title: 'Lượt xem',
      dataIndex: 'visits',
      key: 'visits',
      sorter: (a, b) => a.visits - b.visits,
      render: (v: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={Math.round((v / maxVisits) * 100)}
            showInfo={false}
            size="small"
            style={{ width: 80 }}
            strokeColor="#16a34a"
          />
          <span className="font-semibold text-sm">{v.toLocaleString('vi-VN')}</span>
        </div>
      ),
    },
    {
      title: 'Unique users',
      dataIndex: 'uniqueVisitors',
      key: 'uniqueVisitors',
      sorter: (a, b) => a.uniqueVisitors - b.uniqueVisitors,
      render: (v: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={Math.round((v / maxVisits) * 100)}
            showInfo={false}
            size="small"
            style={{ width: 80 }}
            strokeColor="#2563eb"
          />
          <span className="font-semibold text-sm text-blue-600">{v.toLocaleString('vi-VN')}</span>
        </div>
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
      title: 'Nền tảng',
      dataIndex: 'platform',
      key: 'platform',
      width: 130,
      filters: Object.entries(PLATFORM_LABELS).map(([value, { label }]) => ({ text: label, value })),
      onFilter: (value, record) => record.platform === value,
      render: (v: string) => {
        const p = PLATFORM_LABELS[v] ?? { label: v, color: '#9ca3af' };
        return <Tag color={p.color} style={{ color: '#fff', borderColor: p.color }}>{p.label}</Tag>;
      },
    },
    {
      title: 'Lượt xem',
      dataIndex: 'visits',
      key: 'visits',
      width: 120,
      sorter: (a, b) => a.visits - b.visits,
      defaultSortOrder: 'descend',
      render: (v: number) => <span className="font-semibold">{v.toLocaleString('vi-VN')}</span>,
    },
    {
      title: 'Unique users',
      dataIndex: 'uniqueVisitors',
      key: 'uniqueVisitors',
      width: 130,
      sorter: (a, b) => a.uniqueVisitors - b.uniqueVisitors,
      render: (v: number) => <span className="text-blue-600 font-semibold">{v.toLocaleString('vi-VN')}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <Title level={4} className="!mb-0">
        <BarChartOutlined className="mr-2" />Phân tích lượt truy cập
      </Title>

      {/* Filters */}
      <Card size="small">
        <Space wrap>
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
        </Space>
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

      {/* Platform breakdown */}
      <Card title="Phân tích theo nền tảng" size="small">
        <Spin spinning={loadingStats}>
          <div className="space-y-2">
            {byPlatform.map(row => {
              const p = PLATFORM_LABELS[row.platform] ?? { label: row.platform, color: '#9ca3af' };
              const pct = total > 0 ? Math.round((row.visits / total) * 100) : 0;
              return (
                <div key={row.platform} className="flex items-center gap-3">
                  <Tag color={p.color} style={{ color: '#fff', borderColor: p.color, minWidth: 90, textAlign: 'center' }}>
                    {p.label}
                  </Tag>
                  <Progress
                    percent={pct}
                    showInfo={false}
                    style={{ flex: 1 }}
                    strokeColor={p.color}
                  />
                  <span className="text-sm font-semibold w-12 text-right">{row.visits.toLocaleString('vi-VN')}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Spin>
      </Card>

      {/* Daily timeline */}
      <Card title="Lượt truy cập theo ngày" size="small">
        <Spin spinning={loadingStats}>
          <Table<TimelineRow>
            dataSource={[...timeline].reverse()}
            columns={timelineColumns}
            rowKey="date"
            size="small"
            pagination={{ pageSize: 14, showSizeChanger: false }}
          />
        </Spin>
      </Card>

      {/* Top pages table */}
      <Card
        title="Chi tiết theo trang"
        extra={
          <Space>
            <Select
              style={{ width: 160 }}
              options={PLATFORM_OPTIONS}
              value={platform}
              onChange={v => setPlatform(v)}
            />
            <Input
              placeholder="Tìm đường dẫn..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onPressEnter={() => setAppliedPath(searchInput)}
              style={{ width: 200 }}
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
            rowKey={r => `${r.path}__${r.platform}`}
            size="small"
            scroll={{ x: 700 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: t => `${t.toLocaleString('vi-VN')} dòng`,
            }}
          />
        </Spin>
      </Card>
    </div>
  );
}
