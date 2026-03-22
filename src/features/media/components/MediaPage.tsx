import { useState } from 'react';
import { Upload, Button, Typography, Card, message, Input, Space } from 'antd';
import { UploadOutlined, CopyOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { uploadMedia } from '../services';
import { getApiError } from '@/lib/error';

const { Title, Text } = Typography;

export default function MediaPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadMedia(file);
      setUploadedUrl(res.url);
      message.success('Upload thành công');
    } catch (e) {
      message.error(getApiError(e, 'Upload thất bại'));
    } finally {
      setUploading(false);
    }
    return false; // prevent default upload
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(uploadedUrl);
    message.success('Đã copy URL');
  };

  return (
    <div className="space-y-4">
      <Title level={4} className="!mb-0">Upload Media</Title>

      <Card>
        <Upload.Dragger
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 40, color: '#16a34a' }} />
          </p>
          <p className="ant-upload-text">Kéo thả ảnh vào đây hoặc click để chọn</p>
          <p className="ant-upload-hint text-gray-400">Hỗ trợ JPG, PNG, WebP. Tối đa 10MB.</p>
        </Upload.Dragger>

        {uploading && <div className="text-center mt-4 text-gray-500">Đang upload...</div>}

        {uploadedUrl && (
          <div className="mt-4 space-y-3">
            <Text type="secondary">URL ảnh vừa upload:</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input value={uploadedUrl} readOnly />
              <Button icon={<CopyOutlined />} onClick={copyUrl}>Copy</Button>
            </Space.Compact>
            <img src={uploadedUrl} alt="uploaded" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }} />
          </div>
        )}
      </Card>
    </div>
  );
}
