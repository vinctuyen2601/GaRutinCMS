import { useState } from 'react';
import { Table, Input, Button, Typography, Card, message, Spin } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import { getSiteConfig, updateSiteConfig } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;

export default function SiteConfigPage() {
  const { data: config, isLoading, mutate } = useSWR('site-config', getSiteConfig);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  const entries = config ? Object.entries(config) : [];

  const handleEdit = (key: string, value: string) => {
    setEditing(key);
    setEditValue(value);
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      await updateSiteConfig(key, editValue);
      message.success('Đã lưu');
      setEditing(null);
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'Key', dataIndex: 'key', key: 'key', width: 200, render: (k: string) => <code className="text-xs bg-gray-100 px-1 rounded">{k}</code> },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
      render: (v: string, r: { key: string }) =>
        editing === r.key ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onPressEnter={() => handleSave(r.key)}
            autoFocus
          />
        ) : (
          <span>{v || <span className="text-gray-400">—</span>}</span>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, r: { key: string; value: string }) =>
        editing === r.key ? (
          <div className="flex gap-1">
            <Button type="primary" size="small" icon={<SaveOutlined />} loading={saving} onClick={() => handleSave(r.key)}>Lưu</Button>
            <Button size="small" icon={<CloseOutlined />} onClick={() => setEditing(null)}>Hủy</Button>
          </div>
        ) : (
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r.key, r.value ?? '')} />
        ),
    },
  ];

  const data = entries.map(([key, value]) => ({ key, value }));

  return (
    <div className="space-y-4">
      <Title level={4} className="!mb-0">Cài đặt Website</Title>
      <Card>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: 500 }}
          locale={{ emptyText: 'Chưa có cấu hình' }}
        />
      </Card>
    </div>
  );
}
