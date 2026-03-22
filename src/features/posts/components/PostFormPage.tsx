import { useEffect } from 'react';
import { Card, Form, Input, Select, Button, Space, message, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import type { CreatePostPayload } from '../types';
import { getPosts, createPost, updatePost } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;
const { TextArea } = Input;

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function PostFormPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: posts = [] } = useSWR(isEdit ? 'admin-posts' : null, getPosts);

  useEffect(() => {
    if (isEdit && posts.length > 0) {
      const target = posts.find((p: { id: string }) => p.id === id);
      if (target) form.setFieldsValue({ ...target, tags: target.tags ?? [] });
    }
  }, [isEdit, posts, id, form]);

  const onFinish = async (values: CreatePostPayload) => {
    try {
      if (isEdit && id) {
        await updatePost(id, values);
        message.success('Đã cập nhật bài viết');
      } else {
        await createPost(values);
        message.success('Đã tạo bài viết mới');
      }
      navigate('/posts');
    } catch (err) {
      message.error(getApiError(err, 'Có lỗi xảy ra'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/posts')}>Quay lại</Button>
        <Title level={4} className="!mb-0">{isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: 'draft', tags: [] }}
        >
          <Divider titlePlacement="left">Nội dung</Divider>
          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
            <Input
              placeholder="Hướng dẫn nuôi gà rutin cho người mới bắt đầu"
              onChange={(e) => {
                if (!isEdit) form.setFieldValue('slug', slugify(e.target.value));
              }}
            />
          </Form.Item>
          <Form.Item label="Slug (URL)" name="slug" rules={[{ required: true }]}>
            <Input placeholder="huong-dan-nuoi-ga-rutin" />
          </Form.Item>
          <Form.Item label="Tóm tắt" name="excerpt">
            <TextArea rows={2} placeholder="Tóm tắt ngắn hiển thị trong danh sách..." />
          </Form.Item>
          <Form.Item label="Nội dung" name="content">
            <TextArea rows={12} placeholder="Nội dung bài viết..." />
          </Form.Item>
          <Form.Item label="Ảnh bìa (URL)" name="coverImage">
            <Input placeholder="https://cdn.garutin.vn/blog/..." />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <Form.Item label="Danh mục" name="category">
              <Input placeholder="nuoi-ga, chia-se, tin-tuc" />
            </Form.Item>
            <Form.Item label="Tags" name="tags">
              <Select mode="tags" placeholder="gà rutin, nuôi gà, trang trại..." />
            </Form.Item>
            <Form.Item label="Trạng thái" name="status">
              <Select options={[
                { value: 'draft',     label: 'Nháp'    },
                { value: 'published', label: 'Đã đăng' },
                { value: 'archived',  label: 'Lưu trữ' },
              ]} />
            </Form.Item>
          </div>

          <Divider titlePlacement="left">SEO</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item label="SEO Title" name="seoTitle"><Input /></Form.Item>
            <Form.Item label="SEO Description" name="seoDescription"><TextArea rows={2} /></Form.Item>
          </div>

          <Form.Item className="mt-4">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isEdit ? 'Lưu thay đổi' : 'Tạo bài viết'}
              </Button>
              <Button onClick={() => navigate('/posts')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
