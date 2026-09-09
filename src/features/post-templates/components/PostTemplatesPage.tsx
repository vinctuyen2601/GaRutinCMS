import { useState } from 'react';
import {
  Card, Table, Button, Input, Modal, Form, Switch, Tag, Space, Typography,
  Popconfirm, message, Alert, InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UndoOutlined, LayoutOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import useSWR from 'swr';
import {
  getTemplates, themTemplate, suaTemplate, xoaTemplate, khoiPhucTemplate,
  type PostTemplateRow,
} from '../services';
import { getApiError } from '@/lib/error';

const { Title, Text, Paragraph } = Typography;

export default function PostTemplatesPage() {
  const { data: rows = [], isLoading, mutate } = useSWR('post-templates-admin', getTemplates);
  const [dangSua, setDangSua] = useState<PostTemplateRow | null>(null);
  const [themMoi, setThemMoi] = useState(false);
  const [form] = Form.useForm();

  const moThem = () => {
    form.resetFields();
    setDangSua(null);
    setThemMoi(true);
  };

  const moSua = (r: PostTemplateRow) => {
    form.setFieldsValue(r);
    setDangSua(r);
    setThemMoi(false);
  };

  const luu = async () => {
    const v = await form.validateFields();
    try {
      if (themMoi) await themTemplate(v);
      else if (dangSua) await suaTemplate(dangSua.id, v);
      message.success(themMoi ? 'Đã thêm cấu trúc mới' : 'Đã lưu');
      setThemMoi(false);
      setDangSua(null);
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Lưu thất bại'));
    }
  };

  const doiBat = async (r: PostTemplateRow, bat: boolean) => {
    try {
      await suaTemplate(r.id, { isActive: bat });
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Không đổi được trạng thái'));
    }
  };

  const columns: ColumnsType<PostTemplateRow> = [
    {
      title: 'Tên cấu trúc',
      dataIndex: 'name',
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <Space>
            <a onClick={() => moSua(r)}>{v}</a>
            {r.isBuiltin ? <Tag>dựng sẵn</Tag> : <Tag color="green">tự thêm</Tag>}
          </Space>
          <Text type="secondary" className="text-xs">{r.description || '—'}</Text>
          <Text type="secondary" className="text-xs font-mono">{r.id}</Text>
        </Space>
      ),
    },
    {
      title: 'Hướng dẫn cho AI',
      dataIndex: 'brief',
      width: 300,
      render: (v: string) => (
        <Text type="secondary" className="text-xs">
          {v.length.toLocaleString('vi-VN')} ký tự · {v.slice(0, 70)}…
        </Text>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      width: 80,
      align: 'right' as const,
    },
    {
      title: 'Đang dùng',
      dataIndex: 'isActive',
      width: 100,
      render: (v: boolean, r) => (
        <Switch checked={v} size="small" onChange={(b) => doiBat(r, b)} />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_: unknown, r) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => moSua(r)} />
          {r.isBuiltin ? (
            <Popconfirm
              title="Khôi phục về bản gốc?"
              description="Nội dung bạn đã sửa sẽ bị thay bằng bản gốc trong mã nguồn, và khuôn được bật lại."
              onConfirm={async () => {
                try {
                  await khoiPhucTemplate(r.id);
                  message.success('Đã khôi phục');
                  mutate();
                } catch (e) {
                  message.error(getApiError(e, 'Khôi phục thất bại'));
                }
              }}
            >
              <Button size="small" icon={<UndoOutlined />} />
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Xoá cấu trúc này?"
              description="Chỉ xoá được khi chưa bài nào dùng. Nếu đã có bài dùng, hãy tắt thay vì xoá."
              onConfirm={async () => {
                try {
                  await xoaTemplate(r.id);
                  message.success('Đã xoá');
                  mutate();
                } catch (e) {
                  message.error(getApiError(e, 'Xoá thất bại'));
                }
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">
          <LayoutOutlined className="mr-2" />Cấu trúc bài viết
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={moThem}>
          Thêm cấu trúc
        </Button>
      </div>

      <Alert
        type="info"
        showIcon
        message="Cấu trúc quyết định hình dạng bài AI viết ra"
        description={
          <>
            Nội dung “Hướng dẫn cho AI” của mỗi cấu trúc <b>thay thế</b> ba quy tắc
            mặc định về FAQ, CTA và internal link — nên ví dụ “Danh sách Top N” cố ý
            không có FAQ. Mục đích của việc có nhiều cấu trúc là để bài viết không
            ra cùng một khuôn, thứ mà Google nhận ra là nội dung sản xuất hàng loạt.
          </>
        }
      />

      <Table<PostTemplateRow>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        columns={columns}
        size="small"
        pagination={false}
        rowClassName={(r) => (r.isActive ? '' : 'opacity-50')}
      />

      <Card size="small" title="Vài điều nên biết">
        <Paragraph className="!mb-2 text-sm">
          <b>Tắt thay vì xoá</b> khi cấu trúc đã có bài dùng. Xoá hẳn thì bài cũ trỏ
          tới một mã không còn tồn tại: danh sách bài hiện mã trần thay vì tên, và
          lần cải thiện nội dung sau sẽ lặng lẽ dùng quy tắc mặc định — bài bị viết
          lại theo khuôn khác mà không có gì báo. Hệ thống đã chặn sẵn việc này.
        </Paragraph>
        <Paragraph className="!mb-0 text-sm">
          <b>Mã cấu trúc không đổi được sau khi tạo</b>, vì nó đã được lưu vào từng
          bài viết. Đặt mã ngắn, không dấu, ví dụ <code>huong-dan-nhanh</code>.
        </Paragraph>
      </Card>

      <Modal
        open={themMoi || Boolean(dangSua)}
        onCancel={() => { setThemMoi(false); setDangSua(null); }}
        onOk={luu}
        title={themMoi ? 'Thêm cấu trúc bài viết' : `Sửa: ${dangSua?.name ?? ''}`}
        width={760}
        okText="Lưu"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="id"
            label="Mã cấu trúc"
            tooltip="Không đổi được sau khi tạo, vì mã này được lưu vào từng bài viết."
            rules={[
              { required: true, message: 'Nhập mã cấu trúc' },
              {
                pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
                message: 'Chỉ chữ thường không dấu, số và gạch ngang',
              },
            ]}
          >
            <Input placeholder="vd: huong-dan-nhanh" disabled={!themMoi} />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input placeholder="vd: Hướng dẫn nhanh" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả ngắn" tooltip="Hiện dưới tên khi chọn cấu trúc trong trang soạn bài.">
            <Input placeholder="vd: Bài ngắn 500 từ, đi thẳng vào việc" />
          </Form.Item>
          <Form.Item
            name="brief"
            label="Hướng dẫn cho AI"
            tooltip="Đây là phần gửi thẳng cho AI. Viết rõ mở bài, thân bài, cuối bài, có FAQ hay không, CTA đặt ở đâu."
            rules={[{ required: true, message: 'Nhập hướng dẫn cho AI' }]}
          >
            <Input.TextArea rows={12} style={{ fontFamily: 'monospace', fontSize: 12 }} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự hiển thị">
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
