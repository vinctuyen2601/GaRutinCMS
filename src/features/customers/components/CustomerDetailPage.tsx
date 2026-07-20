import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Table, Tag, Space, Typography, message,
  Select, Statistic, Row, Col,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import { getCustomer, updateCustomer, getCustomerOrders } from '../services';
import { updateOrderStatus } from '@/features/orders/services';
import type { Order, OrderStatus } from '@/features/orders/types';

const { Title, Text } = Typography;

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Number(n)) + ' ₫';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const STATUS_CFG: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: 'Chờ xử lý',   color: 'orange' },
  confirmed: { label: 'Đã xác nhận', color: 'blue' },
  shipping:  { label: 'Đang giao',   color: 'cyan' },
  delivered: { label: 'Đã giao',     color: 'green' },
  cancelled: { label: 'Đã hủy',      color: 'red' },
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: customer, mutate: mutateCustomer } = useSWR(
    id ? ['customer', id] : null,
    () => getCustomer(id!),
    { onSuccess: (data) => form.setFieldsValue(data) },
  );

  const { data: orders = [], isLoading: ordersLoading, mutate: mutateOrders } = useSWR(
    customer?.phone ? ['customer-orders', customer.phone] : null,
    () => getCustomerOrders(customer!.phone),
  );

  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + Number(o.totalAmount), 0);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateCustomer(id!, values);
      await mutateCustomer();
      message.success('Đã cập nhật thông tin khách hàng');
      setEditing(false);
    } catch {
      message.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      await mutateOrders();
      message.success('Đã cập nhật trạng thái');
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (v: string) => <span className="font-mono font-semibold text-sm">#{v}</span>,
    },
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (v: string) => <Text className="text-xs text-gray-500">{fmtDate(v)}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (v: OrderStatus, r: Order) => (
        <Select
          value={v}
          size="small"
          style={{ width: 140 }}
          onChange={(val) => handleStatusChange(r.id, val)}
          options={Object.entries(STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label }))}
          labelRender={({ value }) => (
            <Tag color={STATUS_CFG[value as OrderStatus].color} style={{ margin: 0 }}>
              {STATUS_CFG[value as OrderStatus].label}
            </Tag>
          )}
        />
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      render: (v: number) => <span className="font-semibold text-green-600">{fmt(v)}</span>,
    },
  ];

  if (!customer) return null;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')} />
        <Title level={4} className="!mb-0">
          {customer.name || customer.phone}
        </Title>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Số đơn hàng" value={orders.filter((o) => o.status !== 'cancelled').length} suffix="đơn" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Tổng chi tiêu" value={totalSpent} formatter={(v) => fmt(Number(v))} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Khách từ" value={fmtDate(customer.createdAt)} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Thông tin khách hàng"
        extra={
          editing ? (
            <Space>
              <Button onClick={() => { setEditing(false); form.setFieldsValue(customer); }}>Huỷ</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>Lưu</Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>Chỉnh sửa</Button>
          )
        }
      >
        <Form form={form} layout="vertical" disabled={!editing}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="name" label="Tên khách hàng">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="Địa chỉ">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title={`Lịch sử đơn hàng (${orders.length})`}>
        <Table
          dataSource={orders}
          columns={orderColumns}
          rowKey="id"
          loading={ordersLoading}
          size="small"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (r: Order) => (
              <div className="px-4 py-2 space-y-1">
                {r.items?.map((item, i) => (
                  <div key={i} className="text-sm text-gray-600">
                    {item.name} × {item.quantity} {item.unit} — {fmt(item.price)}
                  </div>
                ))}
                {r.notes && <div className="text-xs text-gray-400 mt-2">Ghi chú: {r.notes}</div>}
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
