import { useState } from 'react';
import {
  Upload,
  Button,
  Typography,
  Card,
  message,
  Input,
  Space,
  Image,
  Popconfirm,
  Spin,
  Empty,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import useSWR from 'swr';
import { uploadMedia, getMediaFiles, deleteMediaFile } from '../services';
import { getApiError } from '@/lib/error';
import type { MediaFile } from '../types';

const { Title, Text } = Typography;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [uploading, setUploading] = useState(false);
  const { data: files = [], isLoading, mutate } = useSWR('media-files', getMediaFiles);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadMedia(file);
      message.success('Upload thành công');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Upload thất bại'));
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMediaFile(id);
      message.success('Đã xóa');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('Đã copy URL');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">
          <FileImageOutlined className="mr-2" />
          Quản lý Media
        </Title>
        <Text type="secondary">{files.length} file</Text>
      </div>

      <Card>
        <Upload.Dragger
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={uploading}
          multiple
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 40, color: '#16a34a' }} />
          </p>
          <p className="ant-upload-text">Kéo thả ảnh vào đây hoặc click để chọn</p>
          <p className="ant-upload-hint text-gray-400">
            Hỗ trợ JPG, PNG, WebP, GIF. Tối đa 10MB mỗi file.
          </p>
        </Upload.Dragger>
        {uploading && (
          <div className="text-center mt-3">
            <Spin size="small" /> <Text type="secondary" className="ml-2">Đang upload...</Text>
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="text-center py-10"><Spin /></div>
      ) : files.length === 0 ? (
        <Empty description="Chưa có file nào" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map((file: MediaFile) => (
            <Card
              key={file.id}
              size="small"
              cover={
                <div className="relative overflow-hidden" style={{ height: 140, background: '#f5f5f5' }}>
                  <Image
                    src={file.url}
                    alt={file.originalName}
                    style={{ width: '100%', height: 140, objectFit: 'cover' }}
                    preview={{ mask: 'Xem' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                </div>
              }
              bodyStyle={{ padding: '8px' }}
            >
              <div className="space-y-1">
                <Text ellipsis={{ tooltip: file.originalName }} className="text-xs block">
                  {file.originalName}
                </Text>
                <div className="flex items-center justify-between">
                  <Tag color="default" className="text-xs m-0">{formatSize(file.size)}</Tag>
                  <Space size={4}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyUrl(file.url)}
                    />
                    <Popconfirm
                      title="Xóa file này?"
                      description="File sẽ bị xóa khỏi R2 và không thể khôi phục."
                      onConfirm={() => handleDelete(file.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>
                <Input
                  size="small"
                  value={file.url}
                  readOnly
                  className="text-xs"
                  style={{ fontSize: 10 }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
