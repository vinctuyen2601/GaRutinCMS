import { useState } from 'react';
import { Table, Tag, Button, Tabs, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import dayjs from 'dayjs';
import type { Order, OrderStatus } from '../types';
import { getOrders } from '../services';

const { Title } = Typography;

const STATUS_CFG: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: 'Chờ xử lý',  color: 'orange'  },
  confirmed: { label: 'Đã xác nhận', color: 'blue'   },
  shipping:  { label: 'Đang giao',   color: 'cyan'    },
  delivered: { label: 'Đã giao',     color: 'green'   },
  cancelled: { label: 'Đã hủy',      color: 'red'     },
};

const SOURCE_LABELS: Record<string, string> = {
  web: 'Web', zalo: 'Zalo', phone: 'Điện thoại', other: 'Khác',
};

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function OrdersPage() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const { data: orders = [], isLoading } = useSWR('admin-orders', () => getOrders());

  const filtered = activeStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === activeStatus);

  const tabItems = [
    { key: 'all',       label: `Tất cả (${orders.length})` },
    { key: 'pending',   label: `Chờ xử lý (${orders.filter((o) => o.status === 'pending').length})` },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'shipping',  label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  const columns = [
    { title: 'Mã đơn', dataIndex: 'orderNumber', key: 'orderNumber', render: (v: string, r: Order) => <a onClick={() => navigate(`/orders/${r.id}`)}>{v}</a> },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName' },
    { title: 'SĐT', dataIndex: 'customerPhone', key: 'customerPhone' },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => formatVND(v) },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s: OrderStatus) => <Tag color={STATUS_CFG[s]?.color}>{STATUS_CFG[s]?.label}</Tag> },
    { title: 'Nguồn', dataIndex: 'source', key: 'source', render: (s: string) => SOURCE_LABELS[s] ?? s },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('DD/MM HH:mm') },
    { title: '', key: 'action', render: (_: unknown, r: Order) => <Button size="small" onClick={() => navigate(`/orders/${r.id}`)}>Chi tiết</Button> },
  ];

  return (
    <div className="space-y-4">
      <Title level={4} className="!mb-0">Đơn hàng</Title>

      <Tabs
        activeKey={activeStatus}
        onChange={setActiveStatus}
        items={tabItems}
      />

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 800 }}
        onRow={(r) => ({ onClick: () => navigate(`/orders/${r.id}`) })}
        rowClassName="cursor-pointer hover:bg-gray-50"
      />
    </div>
  );
}
