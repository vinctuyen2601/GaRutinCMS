import { useState, useMemo } from 'react';
import {
  Card, Form, Input, Select, Button, Typography, Space, Alert, Table, Tag, message,
} from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import { getProducts } from '@/features/products/services';
import { NGUON, chuanHoa, taoLink } from '../lib';

const { Title, Text, Paragraph } = Typography;

/** Các đích đến hay dùng, để khỏi phải gõ đường dẫn tay. */
const DICH_CO_DINH = [
  { value: '/', label: 'Trang chủ' },
  { value: '/san-pham', label: 'Tất cả sản phẩm' },
  { value: '/blog', label: 'Bài viết' },
  { value: '/video', label: 'Video' },
  { value: '/lien-he', label: 'Liên hệ' },
];

export default function UtmBuilderPage() {
  const [source, setSource] = useState<string>('facebook');
  const [dich, setDich] = useState<string>('/');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');

  const { data: products = [] } = useSWR('admin-products', getProducts);

  const nguon = NGUON.find((n) => n.value === source) ?? NGUON[0];
  const campaignSach = chuanHoa(campaign);
  const contentSach = chuanHoa(content);

  const link = useMemo(
    () => taoLink({
      duongDan: dich,
      source: nguon.value,
      medium: nguon.medium,
      campaign: campaignSach,
      content: contentSach || undefined,
    }),
    [dich, nguon, campaignSach, contentSach],
  );

  const sao = async () => {
    try {
      await navigator.clipboard.writeText(link);
      message.success('Đã sao chép link');
    } catch {
      // clipboard bị chặn khi trang không chạy trên https
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      message.success('Đã sao chép link');
    }
  };

  const dichOptions = [
    { label: 'Trang chung', options: DICH_CO_DINH },
    {
      label: 'Sản phẩm',
      options: (products as { slug: string; name: string }[]).map((p) => ({
        value: `/san-pham/${p.slug}`,
        label: p.name,
      })),
    },
  ];

  return (
    <div className="space-y-4">
      <Title level={4} className="!mb-0">Tạo link chạy quảng cáo</Title>
      <Text type="secondary" className="text-sm block">
        Link có gắn mã theo dõi. Dùng đúng link này khi đăng bài hoặc chạy quảng
        cáo thì bảng <b>Nguồn truy cập</b> ở trang Phân tích mới biết khách đến
        từ đâu và chiến dịch nào hiệu quả.
      </Text>

      <Card size="small">
        <Form layout="vertical">
          <Form.Item
            label="Chạy ở đâu"
            tooltip="Quyết định giá trị utm_source — cột Nguồn trong báo cáo."
          >
            <Select
              value={source}
              onChange={setSource}
              options={NGUON.map((n) => ({ value: n.value, label: n.label }))}
              style={{ maxWidth: 320 }}
            />
            <Text type="secondary" className="text-xs block mt-1">{nguon.goiY}</Text>
            {'ngoaiDanhSach' in nguon && nguon.ngoaiDanhSach && (
              <Text type="warning" className="text-xs block mt-1">
                Nguồn này vẫn đo được đầy đủ ở bảng Nguồn truy cập, nhưng ở các
                biểu đồ cũ gom theo nền tảng thì nó nằm trong nhóm “Khác”.
              </Text>
            )}
          </Form.Item>

          <Form.Item label="Khách bấm vào sẽ tới trang nào">
            <Select
              value={dich}
              onChange={setDich}
              options={dichOptions}
              showSearch
              optionFilterProp="label"
              style={{ maxWidth: 520 }}
              placeholder="Chọn trang đích"
            />
          </Form.Item>

          <Form.Item
            label="Tên chiến dịch"
            tooltip="Đặt tên để sau này nhìn báo cáo là nhớ ra. Ví dụ: sale-thang-9, video-ga-con, bai-dang-15-09"
            required
          >
            <Input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="VD: Sale tháng 9"
              style={{ maxWidth: 420 }}
            />
            {campaign && campaignSach !== campaign && (
              <Text type="secondary" className="text-xs block mt-1">
                Sẽ dùng thành: <code>{campaignSach}</code> — bỏ dấu và viết thường
                để báo cáo dễ đọc, và để cùng một chiến dịch không bị tách thành
                nhiều dòng.
              </Text>
            )}
          </Form.Item>

          <Form.Item
            label="Phân biệt nhiều mẫu quảng cáo (không bắt buộc)"
            tooltip="Chạy 3 mẫu ảnh khác nhau cho cùng một chiến dịch thì điền vào đây để biết mẫu nào hiệu quả."
          >
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="VD: anh-1, video-ngan, banner-do"
              style={{ maxWidth: 420 }}
            />
          </Form.Item>
        </Form>

        {!campaignSach ? (
          <Alert
            type="warning"
            showIcon
            message="Chưa đặt tên chiến dịch"
            description="Thiếu tên chiến dịch thì báo cáo chỉ biết khách đến từ Facebook, không biết từ bài nào hay quảng cáo nào — mất hẳn phần đáng giá nhất."
          />
        ) : (
          <>
            <Text strong className="block mb-2">Link để dùng:</Text>
            <div
              style={{
                background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8,
                padding: 12, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 13,
              }}
            >
              {link}
            </div>
            <Space className="mt-3">
              <Button type="primary" icon={<CopyOutlined />} onClick={sao}>
                Sao chép link
              </Button>
              <Button icon={<LinkOutlined />} href={link} target="_blank" rel="noreferrer">
                Mở thử
              </Button>
            </Space>
          </>
        )}
      </Card>

      <Card size="small" title="Link này ghi lại những gì">
        <Table
          size="small"
          pagination={false}
          rowKey="ts"
          dataSource={[
            { ts: 'utm_source', gt: nguon.value, y: 'Nền tảng — hiện ở cột Nguồn' },
            { ts: 'utm_medium', gt: nguon.medium, y: 'Loại hình: cpc là quảng cáo trả tiền, social là bài đăng thường' },
            { ts: 'utm_campaign', gt: campaignSach || '(chưa đặt)', y: 'Tên chiến dịch — hiện ở cột Chiến dịch' },
            ...(contentSach ? [{ ts: 'utm_content', gt: contentSach, y: 'Phân biệt các mẫu quảng cáo trong cùng chiến dịch' }] : []),
          ]}
          columns={[
            { title: 'Tham số', dataIndex: 'ts', width: 150, render: (v: string) => <code>{v}</code> },
            { title: 'Giá trị', dataIndex: 'gt', width: 180, render: (v: string) => <Tag color="blue">{v}</Tag> },
            { title: 'Dùng để làm gì', dataIndex: 'y' },
          ]}
        />
      </Card>

      <Card size="small" title="Vài điều nên biết">
        <Paragraph className="!mb-2 text-sm">
          <b>Đặt tên chiến dịch theo thói quen cố định</b> thì báo cáo mới gom được.
          Ví dụ <code>sale-thang-9</code>, <code>video-ga-con</code>,{' '}
          <code>bai-dang-15-09</code>. Mỗi lần gõ một kiểu là mỗi lần thành một
          dòng riêng.
        </Paragraph>
        <Paragraph className="!mb-2 text-sm">
          <b>Nguồn được nhớ 30 ngày.</b> Khách bấm quảng cáo hôm nay, ba hôm sau gõ
          thẳng địa chỉ vào mua thì đơn đó vẫn được ghi công cho quảng cáo. Không
          có quy tắc này thì gần như đơn nào cũng thành “trực tiếp”.
        </Paragraph>
        <Paragraph className="!mb-0 text-sm">
          <b>Đọc kết quả ở đâu:</b> trang <b>Phân tích</b>, bảng “Nguồn truy cập”.
          Số liệu về sau vài phút kể từ lượt bấm đầu tiên.
        </Paragraph>
      </Card>
    </div>
  );
}
