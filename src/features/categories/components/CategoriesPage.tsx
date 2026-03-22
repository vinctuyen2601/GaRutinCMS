import { useState } from 'react';
import { Table, Button, Input, Tag, Popconfirm, Modal, Form, Switch, InputNumber, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import type { Category } from '../types';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading, mutate } = useSWR('admin-categories', getCategories);
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [editForm] = Form.useForm();

  const handleAdd = async () => {
    const name = addName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await createCategory({ name, slug: slugify(name), sortOrder: 0, isActive: true });
      message.success('Đã thêm danh mục');
      setAddName('');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Thêm thất bại'));
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success('Đã xóa');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  const handleEditOpen = (cat: Category) => {
    setEditItem(cat);
    editForm.setFieldsValue(cat);
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    try {
      const values = await editForm.validateFields();
      await updateCategory(editItem.id, values);
      message.success('Đã cập nhật');
      setEditItem(null);
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Cập nhật thất bại'));
    }
  };

  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (v: string) => <code className="text-xs bg-gray-100 px-1 rounded">{v}</code> },
    { title: 'Thứ tự', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
    { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hiện' : 'Ẩn'}</Tag> },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: Category) => (
        <div className="flex gap-1">
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEditOpen(r)} />
          <Popconfirm title="Xóa danh mục này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => handleDelete(r.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Title level={4} className="!mb-0">Danh mục ({categories.length})</Title>

      <Table dataSource={categories} columns={columns} rowKey="id" loading={isLoading} pagination={false} size="small" />

      <div className="flex gap-2 mt-3">
        <Input placeholder="Tên danh mục *" value={addName} onChange={(e) => setAddName(e.target.value)} onPressEnter={handleAdd} style={{ maxWidth: 300 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} loading={adding}>Thêm</Button>
      </div>

      <Modal
        title="Sửa danh mục"
        open={!!editItem}
        onOk={handleEditSave}
        onCancel={() => setEditItem(null)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" className="pt-2">
          <Form.Item label="Tên" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Slug" name="slug" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Mô tả" name="description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item label="URL ảnh" name="imageUrl"><Input /></Form.Item>
          <div className="flex gap-4">
            <Form.Item label="Thứ tự" name="sortOrder"><InputNumber min={0} /></Form.Item>
            <Form.Item label="Hiển thị" name="isActive" valuePropName="checked"><Switch /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
