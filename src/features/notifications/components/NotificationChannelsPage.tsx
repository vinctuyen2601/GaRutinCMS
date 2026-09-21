import { useState } from 'react';
import {
  Card, Button, Table, Tag, Switch, Modal, Form, Input, Select, Checkbox,
  Popconfirm, message, Typography, Space, Badge, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, BellOutlined,
} from '@ant-design/icons';
import useSWR, { mutate } from 'swr';
import { getChannels, createChannel, updateChannel, deleteChannel, testChannel } from '../services';
import { EVENTS } from '../types';
import type { NotificationChannel, ChannelType } from '../types';

const { Title, Text } = Typography;

/**
 * `color` là màu ĐẶC (dùng cho biểu tượng, biểu đồ). `the` là bộ ba cho thẻ chữ.
 *
 * Trước 21/09/2026 thẻ viết `<Tag color={hex} style={{ color: '#fff' }}>`. Mẫu
 * đó VÔ HÌNH: antd v5 không tô nền bằng mã màu truyền vào, nó tự suy ra một nền
 * NHẠT từ màu đó — nên chữ trắng nằm trên nền gần trắng. Đo trên trình duyệt
 * thật: 1,12:1. Cùng lỗi với cột Nền tảng ở trang Phân tích, sửa cùng ngày.
 *
 * Bỏ ép chữ trắng thôi thì antd cho 2,7 – 3,4:1, vẫn dưới ngưỡng 4.5 của chữ
 * thường. Nên đặt hẳn màu đo được, ≥7:1. Đổi thì phải đo lại.
 */
const TYPE_CFG: Record<ChannelType, { label: string; color: string; the: { bg: string; fg: string; border: string }; fields: { key: string; label: string; placeholder: string; secret?: boolean }[] }> = {
  telegram: {
    label: 'Telegram',
    color: '#229ED9',
    the: { bg: '#e8f5fc', fg: '#0a5375', border: '#bfe4f6' },
    fields: [
      { key: 'botToken', label: 'Bot Token', placeholder: '110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw', secret: true },
      { key: 'chatId',   label: 'Chat ID',   placeholder: '-1001234567890 (group) hoặc 123456789 (user)' },
    ],
  },
  zalo: {
    label: 'Zalo OA',
    color: '#0068FF',
    the: { bg: '#e8f1ff', fg: '#00429b', border: '#bcd5fb' },
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'OA Access Token từ Zalo Developers', secret: true },
      { key: 'userId',      label: 'Zalo User ID', placeholder: 'ID người nhận đã follow OA' },
    ],
  },
  email: {
    label: 'Email',
    color: '#EA4335',
    the: { bg: '#fdeceb', fg: '#941a10', border: '#f8c8c4' },
    // Khoá gửi thư và địa chỉ người gửi nằm ở biến môi trường của máy chủ, vì
    // Resend chỉ cho gửi từ tên miền đã xác thực — để người dùng tự gõ thì chỉ
    // sinh ra lỗi khó hiểu. Ở đây chỉ khai báo người nhận.
    fields: [
      { key: 'to', label: 'Email nhận', placeholder: 'shop@example.com — nhiều địa chỉ thì ngăn bằng dấu phẩy' },
    ],
  },
};

const EMPTY_FORM = { name: '', type: 'telegram' as ChannelType, config: {} as Record<string, string>, events: [] as string[], isActive: true };

export default function NotificationChannelsPage() {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationChannel | null>(null);
  const [selectedType, setSelectedType] = useState<ChannelType>('telegram');
  const [testing, setTesting] = useState<string | null>(null);

  const { data: channels = [], isLoading } = useSWR('notification-channels', getChannels);

  const openCreate = () => {
    setEditing(null);
    setSelectedType('telegram');
    form.setFieldsValue(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (ch: NotificationChannel) => {
    setEditing(ch);
    setSelectedType(ch.type);
    form.setFieldsValue({ name: ch.name, type: ch.type, events: ch.events, isActive: ch.isActive, ...ch.config });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const { name, type, events, isActive, ...rest } = values;
    const cfg = TYPE_CFG[type as ChannelType];
    const config: Record<string, string> = {};
    cfg.fields.forEach(f => { if (rest[f.key]) config[f.key] = rest[f.key]; });

    try {
      if (editing) {
        await updateChannel(editing.id, { name, type, config, events, isActive });
        message.success('Đã cập nhật kênh');
      } else {
        await createChannel({ name, type, config, events, isActive: isActive ?? true });
        message.success('Đã thêm kênh thông báo');
      }
      mutate('notification-channels');
      setModalOpen(false);
    } catch {
      message.error('Lưu thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteChannel(id);
    message.success('Đã xóa kênh');
    mutate('notification-channels');
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    const res = await testChannel(id);
    setTesting(null);
    if (res.ok) {
      message.success('Gửi test thành công! Kiểm tra kênh nhận.');
    } else {
      message.error(`Test thất bại: ${res.error}`);
    }
  };

  const handleToggle = async (ch: NotificationChannel, isActive: boolean) => {
    await updateChannel(ch.id, { isActive });
    mutate('notification-channels');
  };

  const columns = [
    {
      title: 'Tên kênh', key: 'name',
      render: (_: unknown, r: NotificationChannel) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <Tag
            style={{
              fontSize: 11,
              background: TYPE_CFG[r.type]?.the.bg,
              color: TYPE_CFG[r.type]?.the.fg,
              borderColor: TYPE_CFG[r.type]?.the.border,
            }}
          >
            {TYPE_CFG[r.type]?.label}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Nhận thông báo', key: 'events',
      render: (_: unknown, r: NotificationChannel) => (
        <div className="flex flex-wrap gap-1">
          {r.events.length === 0
            ? <span className="text-gray-400 text-xs">Chưa chọn</span>
            : r.events.map(e => {
                const ev = EVENTS.find(x => x.value === e);
                return <Tag key={e} style={{ fontSize: 11 }}>{ev?.label ?? e}</Tag>;
              })
          }
        </div>
      ),
    },
    {
      title: 'Trạng thái', key: 'isActive', width: 100,
      render: (_: unknown, r: NotificationChannel) => (
        <Switch
          size="small"
          checked={r.isActive}
          onChange={v => handleToggle(r, v)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: '', key: 'action', width: 130,
      render: (_: unknown, r: NotificationChannel) => (
        <Space onClick={e => e.stopPropagation()}>
          <Tooltip title="Gửi tin thử">
            <Button
              size="small" icon={<SendOutlined />}
              loading={testing === r.id}
              onClick={() => handleTest(r.id)}
            />
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="Xóa kênh thông báo?"
            onConfirm={() => handleDelete(r.id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-y-2">
        <Title level={4} className="!mb-0">
          <BellOutlined className="mr-2" />Kênh thông báo
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm kênh
        </Button>
      </div>

      <Card size="small">
        <Text type="secondary" className="text-xs">
          Mỗi kênh là một nhóm chat hoặc người nhận. Bạn có thể tạo nhiều kênh nhận cùng một loại thông báo.
          Telegram dễ cấu hình nhất — tạo bot qua <b>@BotFather</b>, thêm vào nhóm, lấy <b>chat_id</b> bằng <b>@userinfobot</b>.
        </Text>
      </Card>

      <Table
        scroll={{ x: 'max-content' }}
        dataSource={channels}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
        locale={{ emptyText: 'Chưa có kênh nào. Thêm kênh để nhận thông báo tự động.' }}
      />

      <Modal
        title={editing ? 'Chỉnh sửa kênh' : 'Thêm kênh thông báo'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Lưu' : 'Thêm'}
        cancelText="Hủy"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Tên kênh" rules={[{ required: true, message: 'Nhập tên kênh' }]}>
            <Input placeholder="VD: Nhóm kho, Nhóm marketing..." />
          </Form.Item>

          <Form.Item name="type" label="Loại kênh" rules={[{ required: true }]}>
            <Select
              options={Object.entries(TYPE_CFG).map(([k, v]) => ({ value: k, label: v.label }))}
              onChange={v => setSelectedType(v as ChannelType)}
            />
          </Form.Item>

          {TYPE_CFG[selectedType]?.fields.map(f => (
            <Form.Item
              key={f.key} name={f.key} label={f.label}
              rules={editing ? [] : [{ required: true, message: `Nhập ${f.label}` }]}
            >
              {f.secret
                ? <Input.Password placeholder={f.placeholder} autoComplete="off" />
                : <Input placeholder={f.placeholder} />
              }
            </Form.Item>
          ))}

          <Form.Item
            name="events"
            label="Nhận thông báo khi"
            rules={[{ required: true, message: 'Chọn ít nhất một loại' }]}
          >
            <Checkbox.Group className="flex flex-col gap-2">
              {EVENTS.map(e => (
                <Checkbox key={e.value} value={e.value}>{e.label}</Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked" label="Kích hoạt">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" defaultChecked />
          </Form.Item>

          {selectedType === 'telegram' && (
            <div className="bg-blue-50 rounded p-3 text-xs text-blue-700 space-y-1">
              <div><b>Hướng dẫn lấy Chat ID của nhóm:</b></div>
              <div>1. Thêm bot vào nhóm Telegram</div>
              <div>2. Nhắn bất kỳ tin nhắn trong nhóm</div>
              <div>3. Truy cập: <code>https://api.telegram.org/bot&#123;TOKEN&#125;/getUpdates</code></div>
              <div>4. Tìm <code>"chat":&#123;"id": -100xxxxx&#125;</code></div>
            </div>
          )}

          {selectedType === 'email' && (
            <div className="bg-amber-50 rounded p-3 text-xs text-amber-800 space-y-1">
              <div><b>Lưu ý về email:</b></div>
              <div>• Máy chủ phải có <code>RESEND_API_KEY</code>; thiếu thì nút Gửi thử sẽ báo lỗi.</div>
              <div>• Chưa xác thực tên miền thì thư gửi từ địa chỉ mặc định của Resend và dễ rơi vào Spam — kiểm tra cả hộp thư rác.</div>
              <div>• Email đến chậm hơn Telegram vài giây, cần báo tức thì thì nên dùng kèm Telegram.</div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
