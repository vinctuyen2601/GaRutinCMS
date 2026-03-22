import { useState } from 'react';
import { Modal, Button, Image, Spin, Empty, Upload, message, Tag } from 'antd';
import { FolderOpenOutlined, UploadOutlined, CheckOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import { getMediaFiles, uploadMedia } from '../services';
import { getApiError } from '@/lib/error';
import type { MediaFile } from '../types';

type Props = {
  onSelect: (url: string) => void;
  name?: string; // tên sản phẩm/bài viết — dùng để đặt tên file SEO-friendly
};

export default function MediaPicker({ onSelect, name }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files = [], isLoading, mutate } = useSWR(open ? 'media-files' : null, getMediaFiles);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const saved = await uploadMedia(file);
      message.success('Upload thành công');
      mutate();
      setSelected(saved.url);
    } catch (e) {
      message.error(getApiError(e, 'Upload thất bại'));
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleOk = () => {
    if (selected) {
      onSelect(selected);
      setOpen(false);
      setSelected(null);
    }
  };

  return (
    <>
      <Button
        type="link"
        size="small"
        icon={<FolderOpenOutlined />}
        onClick={() => setOpen(true)}
        style={{ padding: 0, height: 'auto' }}
      >
        Thư viện
      </Button>

      <Modal
        title="Chọn ảnh từ thư viện"
        open={open}
        onCancel={() => { setOpen(false); setSelected(null); }}
        onOk={handleOk}
        okText="Chọn ảnh này"
        cancelText="Hủy"
        okButtonProps={{ disabled: !selected, icon: <CheckOutlined /> }}
        width={800}
      >
        <div className="mb-3">
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={uploading}
          >
            <Button size="small" icon={<UploadOutlined />} loading={uploading}>
              Upload ảnh mới
            </Button>
          </Upload>
        </div>

        {isLoading ? (
          <div className="text-center py-10"><Spin /></div>
        ) : files.length === 0 ? (
          <Empty description="Chưa có ảnh nào" />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
            {files.map((file: MediaFile) => (
              <div
                key={file.id}
                onClick={() => setSelected(file.url)}
                className="cursor-pointer relative rounded overflow-hidden border-2 transition-all"
                style={{
                  borderColor: selected === file.url ? '#1677ff' : 'transparent',
                  background: '#f5f5f5',
                }}
              >
                <img
                  src={file.url}
                  alt={file.originalName}
                  style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                />
                {selected === file.url && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                    <Tag color="blue" icon={<CheckOutlined />} className="m-0">Đã chọn</Tag>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
