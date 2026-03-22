import { useState } from 'react';
import { Table, Button, Tag, Popconfirm, Space, Typography, message, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import type { Product } from '../types';
import { getProducts, deleteProduct } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;

const STOCK_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_stock:    { label: 'Còn hàng',    color: 'green'  },
  out_of_stock:{ label: 'Hết hàng',    color: 'red'    },
  pre_order:   { label: 'Đặt trước',   color: 'blue'   },
};

const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ProductsPage() {
  const navigate = useNavigate();
  const { data: products = [], isLoading, mutate } = useSWR('admin-products', getProducts);

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      message.success('Đã xóa sản phẩm');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      key: 'image',
      width: 64,
      render: (images: string[]) =>
        images?.[0] ? (
          <Image src={images[0]} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">—</div>
        ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r: Product) => (
        <a onClick={() => navigate(`/products/${r.id}/edit`)}>{name}</a>
      ),
    },
    {
      title: 'Giá',
      key: 'price',
      render: (_: unknown, r: Product) => (
        <span>
          {r.salePrice ? (
            <>
              <span className="text-red-500 font-medium">{formatVND(r.salePrice)}</span>{' '}
              <span className="text-gray-400 line-through text-xs">{formatVND(r.price)}</span>
            </>
          ) : (
            <span className="font-medium">{formatVND(r.price)}</span>
          )}
        </span>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockStatus',
      key: 'stockStatus',
      render: (s: string) => {
        const cfg = STOCK_STATUS_LABELS[s] ?? { label: s, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Nổi bật',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (v: boolean) => v ? <Tag color="gold">Nổi bật</Tag> : null,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hiện' : 'Ẩn'}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: Product) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/products/${r.id}/edit`)} />
          <Popconfirm title="Xóa sản phẩm này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => handleDelete(r.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">Sản phẩm ({products.length})</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
          Thêm sản phẩm
        </Button>
      </div>

      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 700 }}
      />
    </div>
  );
}
