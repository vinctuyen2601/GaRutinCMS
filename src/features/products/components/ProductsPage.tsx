import { useState, useMemo } from 'react';
import { Table, Button, Tag, Popconfirm, Space, Typography, message, Image, Select, Input, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import type { Product } from '../types';
import { getProducts, deleteProduct, updateProduct } from '../services';
import { getCategories } from '@/features/categories/services';
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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [reordering, setReordering] = useState(false);

  const { data: products = [], isLoading, mutate } = useSWR('admin-products', getProducts);
  const { data: categories = [] } = useSWR('admin-categories', getCategories);

  const filtered = products.filter((p) => {
    const matchCat = !categoryFilter || p.categoryId === categoryFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Trang chủ hiển thị sản phẩm nổi bật theo sort_order giảm dần (số càng lớn càng lên đầu)
  const featuredList = useMemo(
    () => products.filter((p) => p.isFeatured).sort((a, b) => b.sortOrder - a.sortOrder),
    [products],
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      message.success('Đã xóa sản phẩm');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  // Kéo 1 sản phẩm lên/xuống trong danh sách nổi bật — gán lại thứ tự tuần tự cho
  // toàn bộ danh sách hiển thị để đảm bảo luôn đổi vị trí thấy được, kể cả khi
  // nhiều sản phẩm đang cùng giá trị sortOrder mặc định.
  const moveFeatured = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= featuredList.length) return;

    const reordered = [...featuredList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setReordering(true);
    try {
      const total = reordered.length;
      await Promise.all(
        reordered.map((p, i) => {
          const newSortOrder = total - i;
          if (p.sortOrder === newSortOrder) return null;
          return updateProduct(p.id, { sortOrder: newSortOrder });
        }),
      );
      await mutate();
    } catch (e) {
      message.error(getApiError(e, 'Cập nhật thứ tự thất bại'));
    } finally {
      setReordering(false);
    }
  };

  const columns = [
    ...(featuredOnly
      ? [
          {
            title: 'Vị trí',
            key: 'position',
            width: 90,
            render: (_: unknown, __: Product, i: number) => (
              <Space size={4}>
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <Button
                  type="text" size="small" icon={<ArrowUpOutlined />}
                  disabled={i === 0 || reordering}
                  onClick={() => moveFeatured(i, -1)}
                />
                <Button
                  type="text" size="small" icon={<ArrowDownOutlined />}
                  disabled={i === featuredList.length - 1 || reordering}
                  onClick={() => moveFeatured(i, 1)}
                />
              </Space>
            ),
          },
        ]
      : []),
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
        <Title level={4} className="!mb-0">
          Sản phẩm ({featuredOnly ? featuredList.length : `${filtered.length}/${products.length}`})
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
          Thêm sản phẩm
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Tìm theo tên..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          disabled={featuredOnly}
          style={{ width: 220 }}
        />
        <Select
          placeholder="Lọc theo danh mục"
          allowClear
          value={categoryFilter}
          onChange={setCategoryFilter}
          disabled={featuredOnly}
          style={{ width: 200 }}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <div className="flex items-center gap-2 ml-auto">
          <Switch checked={featuredOnly} onChange={setFeaturedOnly} />
          <span className="text-sm text-gray-600">
            Sắp xếp sản phẩm nổi bật {featuredOnly && <span className="text-gray-400">(kéo lên/xuống để đổi vị trí)</span>}
          </span>
        </div>
      </div>

      <Table
        dataSource={featuredOnly ? featuredList : filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={featuredOnly ? false : { pageSize: 20 }}
        scroll={{ x: 700 }}
      />
    </div>
  );
}
