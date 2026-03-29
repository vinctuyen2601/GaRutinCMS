import { useState } from 'react';
import {
  Table, Button, Tag, Popconfirm, Space, Typography, Modal,
  Form, Input, message, Badge, Tooltip, Alert,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CheckCircleOutlined,
  StopOutlined, ThunderboltOutlined, EditOutlined,
} from '@ant-design/icons';
import useSWR from 'swr';
import dayjs from 'dayjs';
import type { Keyword, CreateKeywordPayload } from '../types';
import type { CrawlToDraftsResult } from '../types';
import {
  getKeywords, createKeyword, updateKeyword,
  activateKeyword, deactivateKeyword, deleteKeyword, crawlToDrafts,
} from '../services';
import { getApiError } from '@/lib/error';

const { Title, Text } = Typography;

export default function KeywordsPage() {
  const { data: keywords = [], isLoading, mutate } = useSWR('admin-keywords', getKeywords);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Keyword | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<CrawlToDraftsResult | null>(null);
  const [form] = Form.useForm<CreateKeywordPayload>();

  const activeKeyword = keywords.find((k) => k.isActive);

  const handleCreate = async (values: CreateKeywordPayload) => {
    try {
      await createKeyword(values);
      message.success('Đã thêm keyword');
      setCreateOpen(false);
      form.resetFields();
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Thêm thất bại'));
    }
  };

  const handleEdit = async (values: CreateKeywordPayload) => {
    if (!editItem) return;
    try {
      await updateKeyword(editItem.id, values);
      message.success('Đã cập nhật keyword');
      setEditItem(null);
      form.resetFields();
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Cập nhật thất bại'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateKeyword(id);
      message.success('Đã bật keyword');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Thất bại'));
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateKeyword(id);
      message.success('Đã tắt keyword');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Thất bại'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKeyword(id);
      message.success('Đã xóa');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  const handleCrawl = async () => {
    if (!activeKeyword) {
      message.warning('Chưa có keyword active. Hãy activate một keyword trước.');
      return;
    }
    setCrawling(true);
    try {
      const result = await crawlToDrafts(3);
      setCrawlResult(result);
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Crawl thất bại'));
    } finally {
      setCrawling(false);
    }
  };

  const columns = [
    {
      title: 'Keyword',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (kw: string, r: Keyword) => (
        <Space>
          {r.isActive && <Badge status="success" />}
          <Text strong={r.isActive}>{kw}</Text>
          {r.isActive && <Tag color="green">Active</Tag>}
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (v: string) => v || '—',
    },
    {
      title: 'Số lần crawl',
      dataIndex: 'crawlCount',
      key: 'crawlCount',
      width: 120,
      align: 'center' as const,
      render: (v: number) => v || 0,
    },
    {
      title: 'Crawl gần nhất',
      dataIndex: 'lastCrawledAt',
      key: 'lastCrawledAt',
      width: 150,
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_: unknown, r: Keyword) => (
        <Space size={4}>
          {r.isActive ? (
            <Popconfirm title="Tắt keyword này?" okText="Tắt" cancelText="Hủy" onConfirm={() => handleDeactivate(r.id)}>
              <Button type="text" size="small" icon={<StopOutlined />} danger>Tắt</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Bật keyword này?"
              description="Keyword đang active sẽ bị tắt."
              okText="Bật"
              cancelText="Hủy"
              okButtonProps={{ style: { background: '#16a34a', borderColor: '#16a34a' } }}
              onConfirm={() => handleActivate(r.id)}
            >
              <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#16a34a' }}>
                Bật
              </Button>
            </Popconfirm>
          )}
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditItem(r); form.setFieldsValue({ keyword: r.keyword, category: r.category }); }}
          />
          <Popconfirm
            title="Xóa keyword này?"
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Title level={4} className="!mb-0">
          Keywords ({keywords.length})
          {activeKeyword && (
            <Text type="secondary" className="text-sm font-normal ml-2">
              — đang active: <Text strong>"{activeKeyword.keyword}"</Text>
            </Text>
          )}
        </Title>
        <Space>
          <Tooltip title={!activeKeyword ? 'Chưa có keyword active' : `Crawl 3 bài với keyword "${activeKeyword.keyword}"`}>
            <Button
              icon={<ThunderboltOutlined />}
              loading={crawling}
              disabled={!activeKeyword}
              onClick={handleCrawl}
              style={{ borderColor: '#16a34a', color: '#16a34a' }}
            >
              Crawl bài viết
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateOpen(true); form.resetFields(); }}>
            Thêm keyword
          </Button>
        </Space>
      </div>

      {!activeKeyword && (
        <Alert
          type="warning"
          showIcon
          message="Chưa có keyword active. Hãy activate một keyword để có thể crawl bài viết tự động."
        />
      )}

      <Table
        dataSource={keywords}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        scroll={{ x: 600 }}
      />

      {/* Modal tạo mới */}
      <Modal
        title="Thêm keyword"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4">
          <Form.Item name="keyword" label="Keyword" rules={[{ required: true, message: 'Nhập keyword' }]}>
            <Input placeholder="vd: kỹ thuật nuôi gà rutin sinh sản" />
          </Form.Item>
          <Form.Item name="category" label="Danh mục (tuỳ chọn)">
            <Input placeholder="vd: ky-thuat-chan-nuoi" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa */}
      <Modal
        title="Sửa keyword"
        open={!!editItem}
        onCancel={() => { setEditItem(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleEdit} className="mt-4">
          <Form.Item name="keyword" label="Keyword" rules={[{ required: true, message: 'Nhập keyword' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Danh mục (tuỳ chọn)">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal kết quả crawl */}
      <Modal
        title="Kết quả Crawl"
        open={!!crawlResult}
        onCancel={() => setCrawlResult(null)}
        footer={<Button type="primary" onClick={() => setCrawlResult(null)}>Đóng</Button>}
      >
        {crawlResult && (
          <div className="space-y-3">
            <Text>Keyword: <Text strong>"{crawlResult.keyword}"</Text></Text>

            {crawlResult.created.length > 0 && (
              <div>
                <Text type="success" strong>✓ Đã tạo {crawlResult.created.length} bài draft:</Text>
                <ul className="mt-1 space-y-1">
                  {crawlResult.created.map((p) => (
                    <li key={p.id} className="text-sm">• {p.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {crawlResult.errors.length > 0 && (
              <div>
                <Text type="danger" strong>✗ {crawlResult.errors.length} URL thất bại:</Text>
                <ul className="mt-1 space-y-1">
                  {crawlResult.errors.map((e, i) => (
                    <li key={i} className="text-sm text-red-500">• {e.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
