import { useEffect } from 'react';
import {
  Card, Form, Input, InputNumber, Select, Switch, Button, Space, message, Typography, Divider,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import type { CreateProductPayload } from '../types';
import { getProducts, createProduct, updateProduct } from '../services';
import { getApiError } from '@/lib/error';
import api from '@/lib/axios';

const { Title } = Typography;
const { TextArea } = Input;

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const fetchCategories = () => api.get('/categories').then((r) => r.data);

export default function ProductFormPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: products = [] } = useSWR(isEdit ? 'admin-products' : null, getProducts);
  const { data: categories = [] } = useSWR('categories', fetchCategories);

  useEffect(() => {
    if (isEdit && products.length > 0) {
      const target = products.find((p: { id: string }) => p.id === id);
      if (target) form.setFieldsValue(target);
    }
  }, [isEdit, products, id, form]);

  const onFinish = async (values: CreateProductPayload) => {
    try {
      if (isEdit && id) {
        await updateProduct(id, values);
        message.success('Đã cập nhật sản phẩm');
      } else {
        await createProduct(values);
        message.success('Đã tạo sản phẩm mới');
      }
      navigate('/products');
    } catch (err) {
      message.error(getApiError(err, 'Có lỗi xảy ra'));
    }
  };

  const categoryOptions = Array.isArray(categories)
    ? categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>Quay lại</Button>
        <Title level={4} className="!mb-0">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ unit: 'con', stockStatus: 'in_stock', isActive: true, isFeatured: false, sortOrder: 0, images: [] }}
        >
          <Divider titlePlacement="left">Thông tin cơ bản</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}>
              <Input
                placeholder="Gà Rutin đực trưởng thành"
                onChange={(e) => {
                  if (!isEdit) form.setFieldValue('slug', slugify(e.target.value));
                }}
              />
            </Form.Item>
            <Form.Item label="Slug (URL)" name="slug" rules={[{ required: true }]}>
              <Input placeholder="ga-rutin-duc-truong-thanh" />
            </Form.Item>
            <Form.Item label="Giá gốc (₫)" name="price" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={1000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
            </Form.Item>
            <Form.Item label="Giá sale (₫)" name="salePrice">
              <InputNumber style={{ width: '100%' }} min={0} step={1000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
            </Form.Item>
            <Form.Item label="Danh mục" name="categoryId">
              <Select options={categoryOptions} placeholder="Chọn danh mục" allowClear />
            </Form.Item>
            <Form.Item label="Đơn vị" name="unit">
              <Input placeholder="con" />
            </Form.Item>
            <Form.Item label="Trọng lượng/đơn vị" name="weightPerUnit">
              <Input placeholder="150-180g" />
            </Form.Item>
            <Form.Item label="Tình trạng kho" name="stockStatus">
              <Select options={[
                { value: 'in_stock',     label: 'Còn hàng'  },
                { value: 'out_of_stock', label: 'Hết hàng'  },
                { value: 'pre_order',    label: 'Đặt trước' },
              ]} />
            </Form.Item>
          </div>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={4} placeholder="Mô tả chi tiết sản phẩm..." />
          </Form.Item>

          <Form.Item label="Ảnh (URL, mỗi ảnh 1 dòng)" name="images">
            <TextArea
              rows={3}
              placeholder="https://cdn.garutin.vn/img1.jpg&#10;https://cdn.garutin.vn/img2.jpg"
              onChange={(e) => {
                const urls = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                form.setFieldValue('images', urls);
              }}
            />
          </Form.Item>

          <Divider titlePlacement="left">SEO</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item label="SEO Title" name="seoTitle"><Input /></Form.Item>
            <Form.Item label="SEO Description" name="seoDescription"><TextArea rows={2} /></Form.Item>
          </div>

          <Divider titlePlacement="left">Cài đặt</Divider>
          <div className="flex gap-6">
            <Form.Item label="Hiển thị" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Nổi bật" name="isFeatured" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Thứ tự" name="sortOrder">
              <InputNumber min={0} />
            </Form.Item>
          </div>

          <Form.Item className="mt-4">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              </Button>
              <Button onClick={() => navigate('/products')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
