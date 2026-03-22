import { Table, Button, Tag, Popconfirm, Space, Typography, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import dayjs from 'dayjs';
import type { Post } from '../types';
import { getPosts, deletePost, updatePost } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Nháp',      color: 'default' },
  published: { label: 'Đã đăng',   color: 'green'   },
  archived:  { label: 'Lưu trữ',   color: 'orange'  },
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

  const handleTogglePublish = async (post: Post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await updatePost(post.id, { status: newStatus });
      message.success(newStatus === 'published' ? 'Đã đăng bài' : 'Đã hủy đăng');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Cập nhật thất bại'));
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
      width: 130,
      render: (v: string) => v || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => {
        const cfg = STATUS_MAP[s] ?? { label: s, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 120,
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      render: (_: unknown, r: Post) => (
        <Space size={4}>
          {r.status === 'published' ? (
            <Tooltip title="Hủy đăng → Nháp">
              <Popconfirm
                title="Hủy đăng bài viết này?"
                description="Bài viết sẽ chuyển về trạng thái Nháp."
                okText="Hủy đăng"
                cancelText="Bỏ qua"
                onConfirm={() => handleTogglePublish(r)}
              >
                <Button type="text" size="small" icon={<StopOutlined />} danger>
                  Hủy đăng
                </Button>
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="Đăng bài">
              <Popconfirm
                title="Đăng bài viết này?"
                okText="Đăng"
                cancelText="Bỏ qua"
                okButtonProps={{ style: { background: '#16a34a', borderColor: '#16a34a' } }}
                onConfirm={() => handleTogglePublish(r)}
              >
                <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#16a34a' }}>
                  Đăng bài
                </Button>
              </Popconfirm>
            </Tooltip>
          )}
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
