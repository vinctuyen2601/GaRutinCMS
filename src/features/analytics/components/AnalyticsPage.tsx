import { useState } from 'react';
import {
  Card, DatePicker, Row, Col, Table, Typography, Statistic, Spin,
  Input, Button, Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChartOutlined, EyeOutlined, UserOutlined, RiseOutlined, SearchOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { getVisitStats, getVisitTable } from '../services';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const GREEN = '#16a34a';
const BLUE = '#2563eb';
const MUTED = '#898781';
const GRID = '#e1e0d9';

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

  const { data: rawTable, isLoading: loadingTable } = useSWR(
    ['analytics-table', from, to, appliedPath],
    () => getVisitTable({ from, to, path: appliedPath || undefined }),
  );

  const total          = stats?.total ?? 0;
  const uniqueVisitors = stats?.uniqueVisitors ?? 0;
  const timeline: TimelineRow[] = stats?.timeline ?? [];

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
