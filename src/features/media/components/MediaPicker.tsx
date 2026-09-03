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
  /**
   * Loại tệp cho chọn. Mặc định 'image' để mọi chỗ đang dùng giữ nguyên hành vi.
   *
   * Cần tách vì thư viện nay chứa cả ảnh lẫn video: chọn video cho sản phẩm mà
   * hiện lẫn hàng chục ảnh thì phải tự lọc bằng mắt, còn chọn nhầm một tệp ảnh
   * làm video thì trang sản phẩm hiện khung đen không báo lỗi gì.
   */
  kind?: 'image' | 'video';
};

export default function MediaPicker({ onSelect, name, kind = 'image' }: Props) {
  const laVideo = kind === 'video';
  const nhan = laVideo ? 'video' : 'ảnh';
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: tatCa = [], isLoading, mutate } = useSWR(open ? 'media-files' : null, getMediaFiles);
  // Lọc theo mimeType do máy chủ ghi lúc tải lên, không đoán theo đuôi tệp:
  // tệp tải từ nơi khác về có thể không có đuôi.
  const files = tatCa.filter((f: MediaFile) =>
    laVideo ? f.mimeType?.startsWith('video/') : f.mimeType?.startsWith('image/'),
  );

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
        okText={`Chọn ${nhan} này`}
        cancelText="Hủy"
        okButtonProps={{ disabled: !selected, icon: <CheckOutlined /> }}
        width={800}
      >
        <div className="mb-3">
          <Upload
            accept={laVideo ? 'video/*' : 'image/*'}
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={uploading}
          >
            <Button size="small" icon={<UploadOutlined />} loading={uploading}>
              Upload {nhan} mới
            </Button>
          </Upload>
        </div>

        {isLoading ? (
          <div className="text-center py-10"><Spin /></div>
        ) : files.length === 0 ? (
          <Empty description={`Chưa có ${nhan} nào`} />
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
                {laVideo ? (
                  // preload="metadata": đủ để trình duyệt dựng khung hình đầu
                  // làm ảnh xem trước, không tải cả tệp.
                  <video
                    src={file.url}
                    muted
                    preload="metadata"
                    style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <img
                    src={file.url}
                    alt={file.originalName}
                    style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                  />
                )}
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
