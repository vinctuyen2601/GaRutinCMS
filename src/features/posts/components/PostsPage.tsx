import { Table, Button, Tag, Popconfirm, Space, Typography, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import dayjs from 'dayjs';
import type { Post } from '../types';
import { getPosts, deletePost } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Nháp',      color: 'default' },
  published: { label: 'Đã đăng',   color: 'green'   },
  archived:  { label: 'Lưu trữ',   color: 'gray'    },
};

export default function PostsPage() {
  const navigate = useNavigate();
  const { data: posts = [], isLoading, mutate } = useSWR('admin-posts', getPosts);

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      message.success('Đã xóa bài viết');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, r: Post) => (
        <a onClick={() => navigate(`/posts/${r.id}/edit`)}>{title}</a>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => v || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const cfg = STATUS_MAP[s] ?? { label: s, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: Post) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/posts/${r.id}/edit`)} />
          <Popconfirm title="Xóa bài viết này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => handleDelete(r.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">Bài viết ({posts.length})</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/posts/new')}>
          Thêm bài viết
        </Button>
      </div>

      <Table
        dataSource={posts}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}
