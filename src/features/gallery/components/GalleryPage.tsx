import { useState } from 'react';
import {
  Table, Button, Tag, Popconfirm, Modal, Form, Input, Switch, InputNumber,
  Select, DatePicker, Upload, message, Typography, Space, Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, PlayCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import useSWR from 'swr';
import type { GalleryItem } from '../types';
import { getGalleryItems, createGalleryItem, updateGalleryItem, deleteGalleryItem } from '../services';
import { anhDaiDien, youtubeId } from '../lib';
import { uploadMedia } from '@/features/media/services';
import { getApiError } from '@/lib/error';

const { Title, Text } = Typography;

/** Khớp với giới hạn của máy chủ (MediaController.TOI_DA). */
const TOI_DA_MB = 25;

export default function GalleryPage() {
  const { data: items = [], isLoading, mutate } = useSWR('admin-gallery', getGalleryItems);
  const [dangMo, setDangMo] = useState<GalleryItem | 'moi' | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [form] = Form.useForm();

  const loaiDangChon = Form.useWatch('type', form);
  const urlDangChon = Form.useWatch('url', form) as string | undefined;

  const mo = (item: GalleryItem | 'moi') => {
    setDangMo(item);
    form.setFieldsValue(
      item === 'moi'
        ? { type: 'video', source: 'admin', sortOrder: 0, isActive: true, filmedAt: dayjs() }
        : { ...item, filmedAt: item.filmedAt ? dayjs(item.filmedAt) : null },
    );
  };

  const luu = async () => {
    try {
      const v = await form.validateFields();
      setDangLuu(true);
      const payload = {
        ...v,
        // Máy chủ nhận chuỗi ngày, không nhận đối tượng dayjs.
        filmedAt: v.filmedAt ? v.filmedAt.format('YYYY-MM-DD') : undefined,
      };
      if (dangMo === 'moi') await createGalleryItem(payload);
      else if (dangMo) await updateGalleryItem(dangMo.id, payload);
      message.success(dangMo === 'moi' ? 'Đã thêm' : 'Đã cập nhật');
      setDangMo(null);
      mutate();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return; // lỗi form, antd tự hiện
      message.error(getApiError(e, 'Lưu thất bại'));
    } finally {
      setDangLuu(false);
    }
  };

  const xoa = async (id: string) => {
    try {
      await deleteGalleryItem(id);
      message.success('Đã xóa');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xóa thất bại'));
    }
  };

  /** Bật/tắt hiển thị ngay tại bảng, không phải mở hộp thoại. */
  const doiHienThi = async (item: GalleryItem, hien: boolean) => {
    try {
      await updateGalleryItem(item.id, { isActive: hien });
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Không đổi được trạng thái'));
    }
  };

  const taiLen = async (file: File) => {
    if (file.size > TOI_DA_MB * 1024 * 1024) {
      message.error(
        `Tệp ${Math.round(file.size / 1024 / 1024)} MB, vượt quá ${TOI_DA_MB} MB. ` +
          'Video dài nên đăng YouTube rồi dán link vào đây.',
      );
      return false;
    }
    setDangTai(true);
    try {
      const saved = await uploadMedia(file);
      form.setFieldsValue({
        url: saved.url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
      });
      message.success('Đã tải lên');
    } catch (e) {
      message.error(getApiError(e, 'Tải lên thất bại'));
    } finally {
      setDangTai(false);
    }
    return false; // tự gọi API, không để antd tự tải
  };

  const columns = [
    {
      title: '',
      key: 'anh',
      width: 90,
      render: (_: unknown, r: GalleryItem) => {
        const src = anhDaiDien(r);
        return (
          <div className="relative w-20 h-14 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
            {src ? (
              <img src={src} alt="" className="w-full h-full object-cover" />
            ) : (
              <video src={r.url} className="w-full h-full object-cover" muted preload="metadata" />
            )}
            {r.type === 'video' && (
              <PlayCircleFilled className="absolute text-white text-lg drop-shadow" />
            )}
          </div>
        );
      },
    },
    {
      title: 'Nội dung',
      key: 'noiDung',
      render: (_: unknown, r: GalleryItem) => (
        <div>
          <div className="text-sm">{r.caption || <Text type="secondary">(chưa có chú thích)</Text>}</div>
          <div className="text-xs text-gray-400 truncate max-w-[320px]">{r.url}</div>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 90,
      render: (v: string, r: GalleryItem) =>
        v === 'video' ? (
          <Tag color={youtubeId(r.url) ? 'red' : 'blue'}>{youtubeId(r.url) ? 'YouTube' : 'Video'}</Tag>
        ) : (
          <Tag>Ảnh</Tag>
        ),
    },
    {
      title: 'Ngày quay',
      dataIndex: 'filmedAt',
      width: 130,
      render: (v: string | null) => {
        if (!v) return <Text type="secondary">—</Text>;
        const thang = dayjs().diff(dayjs(v), 'month');
        // Video cũ làm giảm niềm tin chứ không tăng: khách thấy "quay năm
        // ngoái" là nghi đàn đã bán hết. Nhắc chủ trại thay clip.
        return (
          <span>
            {dayjs(v).format('DD/MM/YYYY')}
            {thang >= 6 && <Tag color="orange" className="ml-1">cũ</Tag>}
          </span>
        );
      },
    },
    {
      title: 'Nguồn',
      dataIndex: 'source',
      width: 110,
      render: (v: string, r: GalleryItem) =>
        v === 'customer' ? <Tag color="green">{r.customerName || 'Khách'}</Tag> : <Tag>Trang trại</Tag>,
    },
    { title: 'Thứ tự', dataIndex: 'sortOrder', width: 80 },
    {
      title: 'Hiện',
      dataIndex: 'isActive',
      width: 70,
      render: (v: boolean, r: GalleryItem) => (
        <Switch size="small" checked={v} onChange={(c) => doiHienThi(r, c)} />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: GalleryItem) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => mo(r)} />
          <Popconfirm title="Xóa mục này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => xoa(r.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const idYt = urlDangChon ? youtubeId(urlDangChon) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">Ảnh & video trang trại ({items.length})</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => mo('moi')}>Thêm</Button>
      </div>

      <Text type="secondary" className="text-xs block">
        Hiển thị ở mục &quot;Hình ảnh thật từ trang trại&quot; trên trang chủ. Thứ tự càng
        nhỏ càng lên đầu.
      </Text>

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="small"
        scroll={{ x: 900 }}
      />

      <Modal
        open={dangMo !== null}
        title={dangMo === 'moi' ? 'Thêm ảnh / video' : 'Sửa'}
        onCancel={() => setDangMo(null)}
        onOk={luu}
        confirmLoading={dangLuu}
        okText="Lưu"
        cancelText="Hủy"
        width={620}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="Loại" name="type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'video', label: 'Video' },
                { value: 'image', label: 'Ảnh' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Đường dẫn"
            name="url"
            rules={[{ required: true, message: 'Dán link hoặc tải tệp lên' }]}
            extra={
              loaiDangChon === 'video'
                ? 'Dán link YouTube, hoặc tải clip ngắn (dưới ' + TOI_DA_MB + ' MB) lên.'
                : undefined
            }
          >
            <Input placeholder="https://youtube.com/watch?v=... hoặc tải tệp lên bên dưới" />
          </Form.Item>

          <Space className="mb-4">
            <Upload beforeUpload={taiLen} showUploadList={false} accept="image/*,video/*">
              <Button icon={<UploadOutlined />} loading={dangTai}>Tải tệp lên</Button>
            </Upload>
            {loaiDangChon === 'video' && !idYt && (
              <Text type="secondary" className="text-xs">
                Video tự lưu chạy chậm trên 4G — clip dài nên dùng YouTube.
              </Text>
            )}
          </Space>

          {idYt && (
            <Alert
              type="success"
              showIcon
              className="mb-4"
              message="Nhận ra link YouTube"
              description={
                <img
                  src={`https://img.youtube.com/vi/${idYt}/mqdefault.jpg`}
                  alt=""
                  className="rounded mt-1"
                  style={{ width: 200 }}
                />
              }
            />
          )}

          <Form.Item
            label="Ảnh đại diện"
            name="thumbnail"
            extra="Bỏ trống nếu là YouTube — web tự lấy ảnh của YouTube."
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item label="Chú thích" name="caption">
            <Input placeholder="Đàn cút 45 ngày tuổi, chuồng số 2" />
          </Form.Item>

          <Form.Item
            label="Ngày quay"
            name="filmedAt"
            extra="Ngày quay thật, không phải ngày đăng. Khách nhìn video cũ sẽ nghi đàn đã bán hết."
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>

          <Form.Item label="Nguồn" name="source">
            <Select
              options={[
                { value: 'admin', label: 'Trang trại tự quay' },
                { value: 'customer', label: 'Khách gửi' },
              ]}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(a, b) => a.source !== b.source}>
            {({ getFieldValue }) =>
              getFieldValue('source') === 'customer' ? (
                <Form.Item label="Tên khách" name="customerName">
                  <Input placeholder="Anh Tuấn - Hà Nội" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item label="Thứ tự" name="sortOrder" className="flex-1">
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item label="Hiển thị" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
