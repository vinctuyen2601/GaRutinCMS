import { useState, useMemo } from 'react';
import { Table, Input, Typography, Tag, Popconfirm, message, Select, Space, Button, Modal, Form, Tabs } from 'antd';
import { UserOutlined, SearchOutlined, PhoneOutlined, EnvironmentOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { getCustomers, deleteCustomer, createCustomer, getDeletedCustomers } from '../services';
import type { Customer } from '../types';

const { Title } = Typography;

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Number(n)) + ' ₫';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

type OrderFilter = 'all' | 'has_order' | 'repeat' | 'no_order';
type SpendFilter = 'all' | '500k' | '1m' | '5m';
type SortBy = 'updated' | 'spent_desc' | 'orders_desc';

export default function CustomersPage() {
  const [activeTab, setActiveTab]        = useState<'active' | 'deleted'>('active');
  const [search, setSearch]              = useState('');
  const [orderFilter, setOrderFilter]    = useState<OrderFilter>('all');
  const [spendFilter, setSpendFilter]    = useState<SpendFilter>('all');
  const [sortBy, setSortBy]              = useState<SortBy>('updated');
  const [createModal, setCreateModal]    = useState(false);
  const [createSaving, setCreateSaving]  = useState(false);
  const [createForm] = Form.useForm();
  const navigate = useNavigate();

  const swrKey = ['admin-customers', search];
  const { data: customers = [], isLoading } = useSWR(
    swrKey,
    () => getCustomers(search || undefined),
  );
  const { data: deletedCustomers = [], isLoading: deletedLoading } = useSWR(
    'admin-customers-deleted',
    getDeletedCustomers,
  );

  const handleCreate = async () => {
    const values = await createForm.validateFields();
    setCreateSaving(true);
    try {
      await createCustomer(values);
      message.success('Đã tạo khách hàng');
      createForm.resetFields();
      setCreateModal(false);
      mutate(swrKey);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      message.error(msg === 'Số điện thoại đã tồn tại' ? msg : 'Tạo thất bại');
    } finally {
      setCreateSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success('Đã xóa khách hàng');
      mutate(swrKey);
      mutate('admin-customers-deleted');
    } catch {
      message.error('Xóa thất bại');
    }
  };

  const filtered = useMemo(() => {
    let list = [...customers];

    if (orderFilter === 'has_order') list = list.filter(c => c.orderCount >= 1);
    if (orderFilter === 'repeat')    list = list.filter(c => c.orderCount >= 2);
    if (orderFilter === 'no_order')  list = list.filter(c => c.orderCount === 0);

    if (spendFilter === '500k') list = list.filter(c => c.totalSpent >= 500_000);
    if (spendFilter === '1m')   list = list.filter(c => c.totalSpent >= 1_000_000);
    if (spendFilter === '5m')   list = list.filter(c => c.totalSpent >= 5_000_000);

    if (sortBy === 'spent_desc')  list.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sortBy === 'orders_desc') list.sort((a, b) => b.orderCount - a.orderCount);

    return list;
  }, [customers, orderFilter, spendFilter, sortBy]);

  const activeColumns = [
    {
      title: 'SĐT', dataIndex: 'phone', key: 'phone',
      render: (v: string) => (
        <span className="font-mono font-semibold">
          <PhoneOutlined className="mr-1.5" style={{ color: '#6b7280' }} />{v}
        </span>
      ),
    },
    {
      title: 'Tên', dataIndex: 'name', key: 'name',
      render: (v: string) => v || <span className="text-gray-400">—</span>,
    },
    {
      title: 'Địa chỉ', dataIndex: 'address', key: 'address', ellipsis: true,
      render: (v: string) => v
        ? <span><EnvironmentOutlined className="mr-1" style={{ color: '#6b7280' }} />{v}</span>
        : <span className="text-gray-400">—</span>,
    },
    {
      title: 'Số đơn', dataIndex: 'orderCount', key: 'orderCount', width: 90,
      sorter: (a: Customer, b: Customer) => a.orderCount - b.orderCount,
      render: (v: number) => (
        <Tag color={v >= 2 ? 'blue' : v === 1 ? 'geekblue' : 'default'}>{v} đơn</Tag>
      ),
    },
    {
      title: 'Tổng chi', dataIndex: 'totalSpent', key: 'totalSpent', width: 140,
      sorter: (a: Customer, b: Customer) => a.totalSpent - b.totalSpent,
      render: (v: number) => (
        <span className="font-semibold text-green-600">{fmt(v)}</span>
      ),
    },
    {
      title: 'Lần cuối', dataIndex: 'updatedAt', key: 'updatedAt', width: 110,
      render: (v: string) => <span className="text-gray-500 text-xs">{fmtDate(v)}</span>,
    },
    {
      title: '', key: 'action', width: 130,
      render: (_: unknown, r: Customer) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <a onClick={() => navigate(`/customers/${r.id}`)} className="text-blue-500 text-sm cursor-pointer">
            Chi tiết
          </a>
          <Popconfirm
            title="Xóa khách hàng?"
            description="Dữ liệu sẽ bị ẩn, không thể khôi phục dễ dàng."
            onConfirm={() => handleDelete(r.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <DeleteOutlined className="text-red-400 hover:text-red-600 cursor-pointer" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const deletedColumns = [
    {
      title: 'SĐT', dataIndex: 'phone', key: 'phone',
      render: (v: string) => (
        <span className="font-mono text-gray-500">
          <PhoneOutlined className="mr-1.5" />{v}
        </span>
      ),
    },
    {
      title: 'Tên', dataIndex: 'name', key: 'name',
      render: (v: string) => v || <span className="text-gray-400">—</span>,
    },
    {
      title: 'Địa chỉ', dataIndex: 'address', key: 'address', ellipsis: true,
      render: (v: string) => v || <span className="text-gray-400">—</span>,
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 110,
      render: (v: string) => <span className="text-gray-500 text-xs">{fmtDate(v)}</span>,
    },
    {
      title: 'Ngày xóa', dataIndex: 'deletedAt', key: 'deletedAt', width: 110,
      render: (v: string) => <span className="text-red-400 text-xs">{fmtDate(v)}</span>,
    },
  ];

  const tabItems = [
    {
      key: 'active',
      label: `Đang hoạt động (${customers.length})`,
      children: (
        <>
          <Space wrap size={8} className="mb-3">
            <Select value={orderFilter} onChange={setOrderFilter} style={{ width: 160 }}
              options={[
                { value: 'all',       label: 'Tất cả đơn hàng' },
                { value: 'has_order', label: 'Đã có đơn' },
                { value: 'repeat',    label: 'Mua lại (≥2 đơn)' },
                { value: 'no_order',  label: 'Chưa có đơn' },
              ]}
            />
            <Select value={spendFilter} onChange={setSpendFilter} style={{ width: 160 }}
              options={[
                { value: 'all',  label: 'Mọi mức chi' },
                { value: '500k', label: 'Chi ≥ 500k' },
                { value: '1m',   label: 'Chi ≥ 1 triệu' },
                { value: '5m',   label: 'Chi ≥ 5 triệu' },
              ]}
            />
            <Select value={sortBy} onChange={setSortBy} style={{ width: 170 }}
              options={[
                { value: 'updated',     label: 'Sắp xếp: Mới nhất' },
                { value: 'spent_desc',  label: 'Sắp xếp: Chi nhiều nhất' },
                { value: 'orders_desc', label: 'Sắp xếp: Đơn nhiều nhất' },
              ]}
            />
          </Space>
          <Table
            dataSource={filtered}
            columns={activeColumns}
            rowKey="id"
            loading={isLoading}
            size="small"
            pagination={{ pageSize: 20, showTotal: t => `${t} khách hàng` }}
            scroll={{ x: 600 }}
            onRow={(r) => ({ onClick: () => navigate(`/customers/${r.id}`), style: { cursor: 'pointer' } })}
          />
        </>
      ),
    },
    {
      key: 'deleted',
      label: (
        <span style={{ color: '#9ca3af' }}>
          Đã xóa {deletedCustomers.length > 0 && <Tag color="default">{deletedCustomers.length}</Tag>}
        </span>
      ),
      children: (
        <Table
          dataSource={deletedCustomers}
          columns={deletedColumns}
          rowKey="id"
          loading={deletedLoading}
          size="small"
          pagination={{ pageSize: 20, showTotal: t => `${t} khách hàng` }}
          scroll={{ x: 500 }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title level={4} className="!mb-0">
          <UserOutlined className="mr-2" />
          Khách hàng {activeTab === 'active' ? `(${filtered.length}/${customers.length})` : ''}
        </Title>
        <Space>
          {activeTab === 'active' && (
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tên hoặc SĐT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
              style={{ width: 240 }}
            />
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            Thêm khách hàng
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={v => setActiveTab(v as 'active' | 'deleted')} items={tabItems} />

      <Modal
        title="Thêm khách hàng mới"
        open={createModal}
        onCancel={() => { setCreateModal(false); createForm.resetFields(); }}
        onOk={handleCreate}
        okText="Tạo"
        cancelText="Hủy"
        confirmLoading={createSaving}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ' },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="0905..." maxLength={11} />
          </Form.Item>
          <Form.Item name="name" label="Họ tên">
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input prefix={<EnvironmentOutlined />} placeholder="123 Đường ABC, TP.HCM" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
