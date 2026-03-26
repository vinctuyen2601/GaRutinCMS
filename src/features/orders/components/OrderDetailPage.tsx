import { Card, Descriptions, Table, Select, Button, Tag, message, Typography, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import dayjs from 'dayjs';
import type { OrderStatus, OrderItem } from '../types';
import { getOrder, updateOrderStatus } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;

const STATUS_CFG: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: 'Chờ xử lý',  color: 'orange' },
  confirmed: { label: 'Đã xác nhận', color: 'blue'  },
  shipping:  { label: 'Đang giao',   color: 'cyan'   },
  delivered: { label: 'Đã giao',     color: 'green'  },
  cancelled: { label: 'Đã hủy',      color: 'red'    },
};

const STATUS_OPTIONS = Object.entries(STATUS_CFG).map(([v, c]) => ({ value: v, label: c.label }));

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, mutate } = useSWR(id ? `order-${id}` : null, () => getOrder(id!));

  const handleStatusChange = async (status: OrderStatus) => {
    try {
      await updateOrderStatus(id!, status);
      message.success('Đã cập nhật trạng thái');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Cập nhật thất bại'));
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  if (!order) return <div>Không tìm thấy đơn hàng</div>;

  const itemColumns = [
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', render: (v: number, r: OrderItem) => `${v} ${r.unit}` },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', render: (v: number) => formatVND(v) },
    { title: 'Thành tiền', key: 'total', render: (_: unknown, r: OrderItem) => formatVND(r.price * r.quantity) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>Quay lại</Button>
          <Title level={4} className="!mb-0">Đơn hàng #{order.orderNumber}</Title>
        </div>
        <Tag color={STATUS_CFG[order.status]?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
          {STATUS_CFG[order.status]?.label}
        </Tag>
      </div>

      <Card title="Thông tin khách hàng">
        <Descriptions column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Tên">{order.customerName}</Descriptions.Item>
          <Descriptions.Item label="SĐT">
            <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ" span={2}>{order.customerAddress || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={2}>{order.notes || '—'}</Descriptions.Item>
          <Descriptions.Item label="Nguồn">{order.source}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Sản phẩm đặt">
        <Table
          dataSource={order.items}
          columns={itemColumns}
          rowKey={(r, i) => `item-${i}`}
          pagination={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}><strong>Tổng cộng</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={1}><strong>{formatVND(order.totalAmount)}</strong></Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Card title="Cập nhật trạng thái">
        <Space wrap>
          <Select
            value={order.status}
            options={STATUS_OPTIONS}
            style={{ width: 180 }}
            onChange={handleStatusChange}
          />
          <a href={`https://zalo.me/${order.customerPhone}`} target="_blank" rel="noopener noreferrer">
            <Button>Liên hệ Zalo</Button>
          </a>
          <a href={`tel:${order.customerPhone}`}>
            <Button>Gọi điện</Button>
          </a>
        </Space>
      </Card>
    </div>
  );
}
