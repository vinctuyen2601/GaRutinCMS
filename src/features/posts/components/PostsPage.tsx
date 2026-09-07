import { useState } from 'react';
import { Table, Button, Tag, Popconfirm, Space, Typography, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import dayjs from 'dayjs';
import type { Post } from '../types';
import { getPosts, deletePost, updatePost, getPostTemplates } from '../services';
import { getActiveKeyword, crawlToDrafts } from '@/features/keywords/services';
import { getApiError } from '@/lib/error';
import { getVisitTable } from '@/features/analytics/services';

const { Title } = Typography;

/** Một dòng của bảng lượt truy cập, gom theo đường dẫn. */
type DongTruyCap = { path: string; visits: number; uniqueVisitors: number };

/**
 * Đổi danh sách đường dẫn thành bảng tra theo slug bài viết.
 *
 * Không gọi thêm endpoint mới: /admin/analytics/table đã gom sẵn theo path, chỉ
 * cần lọc '/blog/' rồi cắt lấy phần slug. Gọi không kèm from/to để lấy toàn
 * thời gian — bài viết tích luỹ người đọc dần, cắt theo tháng sẽ làm bài cũ
 * trông như không ai đọc.
 */
function bangLuotDoc(rows: DongTruyCap[]): Record<string, DongTruyCap> {
  const map: Record<string, DongTruyCap> = {};
  for (const r of rows) {
    // Bỏ tham số truy vấn và dấu / thừa ở cuối, nếu không cùng một bài sẽ nằm
    // ở nhiều dòng khác nhau và số đếm bị chia nhỏ.
    const sach = r.path.split('?')[0].replace(/\/+$/, '');
    const m = sach.match(/^\/blog\/(.+)$/);
    if (!m) continue;
    const slug = m[1];
    const da = map[slug];
    map[slug] = da
      ? { ...r, visits: da.visits + r.visits, uniqueVisitors: da.uniqueVisitors + r.uniqueVisitors }
      : r;
  }
  return map;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Nháp',      color: 'default' },
  published: { label: 'Đã đăng',   color: 'green'   },
  archived:  { label: 'Lưu trữ',   color: 'orange'  },
};

export default function PostsPage() {
  const navigate = useNavigate();
  const { data: posts = [], isLoading, mutate } = useSWR('admin-posts', getPosts);
  const { data: activeKeyword } = useSWR('admin-keywords-active', getActiveKeyword);
  const { data: postTemplates = [] } = useSWR('post-templates', getPostTemplates);
  const [crawling, setCrawling] = useState(false);
  const { data: luotTruyCap = [] } = useSWR('blog-visits', () => getVisitTable({ path: '/blog/' }));
  const luotDoc = bangLuotDoc(luotTruyCap as DongTruyCap[]);

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      message.success('Đã xóa bài viết');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  const handleCrawl = async () => {
    setCrawling(true);
    try {
      const result = await crawlToDrafts(3);
      message.success(`Đã tạo ${result.created.length} bài draft từ keyword "${result.keyword}"`);
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Crawl thất bại'));
    } finally {
      setCrawling(false);
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
      title: 'Cấu trúc',
      dataIndex: 'templateId',
      key: 'templateId',
      width: 170,
      render: (v: string) => {
        if (!v) return <span className="text-gray-400">—</span>;
        const t = postTemplates.find((pt) => pt.id === v);
        // Khuôn bị gỡ khỏi mã nguồn thì không tra được tên — hiện lại chính id
        // thay vì để trống, để còn biết bài này từng theo khuôn nào.
        return t
          ? <Tooltip title={t.description}><Tag color="blue">{t.name}</Tag></Tooltip>
          : <Tag>{v}</Tag>;
      },
    },
    {
      title: 'Lượt đọc',
      key: 'luotDoc',
      width: 110,
      align: 'right' as const,
      // Sắp xếp được: câu hỏi "bài nào nhiều người đọc nhất" phải trả lời bằng
      // một cú bấm, không phải đọc dò cả trang.
      sorter: (a: Post, b: Post) =>
        (luotDoc[a.slug]?.uniqueVisitors ?? 0) - (luotDoc[b.slug]?.uniqueVisitors ?? 0),
      render: (_: unknown, r: Post) => {
        const d = luotDoc[r.slug];
        if (!d) return <span className="text-gray-400">—</span>;
        // Hiện số NGƯỜI đọc chứ không phải số lượt: một người tải lại trang năm
        // lần không phải là năm người quan tâm. Số lượt để trong tooltip.
        return (
          <Tooltip title={`${d.visits} lượt xem, ${d.uniqueVisitors} người`}>
            <span className={d.uniqueVisitors >= 50 ? 'font-semibold text-green-600' : ''}>
              {d.uniqueVisitors}
            </span>
          </Tooltip>
        );
      },
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
          ) : (
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
        <Space>
          <Tooltip title={activeKeyword ? `Crawl 3 bài với keyword "${activeKeyword.keyword}"` : 'Chưa có keyword active'}>
            <Button
              icon={<ThunderboltOutlined />}
              loading={crawling}
              disabled={!activeKeyword}
              onClick={handleCrawl}
              style={{ borderColor: '#16a34a', color: '#16a34a' }}
            >
              Crawl tự động
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/posts/new')}>
            Thêm bài viết
          </Button>
        </Space>
      </div>

      <Table
        dataSource={posts}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 600 }}
      />
    </div>
  );
}
