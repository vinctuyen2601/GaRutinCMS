import { useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Typography, message, Popconfirm, Radio, Image, Rate, Badge, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StarOutlined, CheckOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { getReviews, updateReview, deleteReview } from '../services';
import type { Review } from '../services';
import { getApiError } from '@/lib/error';

const { Title, Text } = Typography;

// Cùng cách làm với trang Phân tích của dự án này — CMS chưa có tệp cấu hình
// dùng chung, thêm một tệp mới chỉ cho một hằng số thì rối hơn là giúp.
const WEB_URL = 'https://garutin.com';

const LOC = [
  { value: 'pending',  label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'all',      label: 'Tất cả' },
] as const;

type Loc = (typeof LOC)[number]['value'];

export default function ReviewsPage() {
  const [loc, setLoc] = useState<Loc>('pending');
  const [dangXuLy, setDangXuLy] = useState<string | null>(null);

  const { data: danhSach = [], isLoading, mutate } = useSWR(
    ['reviews', loc],
    () => getReviews(loc === 'all' ? undefined : loc),
  );

  const doiTrangThai = async (r: Review, duyet: boolean) => {
    setDangXuLy(r.id);
    try {
      await updateReview(r.id, { isApproved: duyet });
      message.success(duyet ? 'Đã duyệt — đánh giá hiện trên web' : 'Đã gỡ khỏi web');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Không cập nhật được'));
    } finally {
      setDangXuLy(null);
    }
  };

  const xoa = async (id: string) => {
    try {
      await deleteReview(id);
      message.success('Đã xoá đánh giá');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Xoá thất bại'));
    }
  };

  const columns: ColumnsType<Review> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 200,
      render: (_, r) =>
        r.productSlug ? (
          <a href={`${WEB_URL}/san-pham/${r.productSlug}`} target="_blank" rel="noreferrer"
             className="text-blue-600 hover:underline text-sm">
            {r.productName || r.productSlug}
          </a>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
    {
      title: 'Đánh giá',
      key: 'noi-dung',
      render: (_, r) => (
        <div>
          <Space size={8} wrap>
            <b>{r.customerName}</b>
            <Rate disabled value={r.rating} style={{ fontSize: 13 }} />
            <Text type="secondary" className="text-xs">
              {dayjs(r.createdAt).format('DD/MM/YYYY HH:mm')}
            </Text>
          </Space>
          {r.comment && <div className="text-sm text-gray-700 mt-1 whitespace-pre-line">{r.comment}</div>}
          {(r.images?.length || r.video) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {r.images?.map((u, i) => (
                <Image key={i} src={u} width={56} height={56} style={{ objectFit: 'cover', borderRadius: 6 }} />
              ))}
              {r.video && (
                <video src={r.video} controls preload="metadata"
                       style={{ width: 96, height: 56, borderRadius: 6, background: '#000' }} />
              )}
            </div>
          )}
          {r.ip && <div className="text-[11px] text-gray-400 mt-1">IP: {r.ip}</div>}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'trang-thai',
      width: 110,
      render: (_, r) =>
        r.isApproved
          ? <Tag color="green">Đã duyệt</Tag>
          : <Tag color="orange">Chờ duyệt</Tag>,
    },
    {
      title: '',
      key: 'thao-tac',
      width: 150,
      render: (_, r) => (
        <Space>
          {r.isApproved ? (
            <Button size="small" icon={<StopOutlined />} loading={dangXuLy === r.id}
                    onClick={() => doiTrangThai(r, false)}>
              Gỡ
            </Button>
          ) : (
            <Button size="small" type="primary" icon={<CheckOutlined />} loading={dangXuLy === r.id}
                    onClick={() => doiTrangThai(r, true)}>
              Duyệt
            </Button>
          )}
          <Popconfirm title="Xoá đánh giá này?" okText="Xoá" okButtonProps={{ danger: true }}
                      cancelText="Hủy" onConfirm={() => xoa(r.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const soChoDuyet = danhSach.filter(r => !r.isApproved).length;

  return (
    <div className="space-y-5">
      <Title level={4} className="!mb-0">
        <StarOutlined className="mr-2" />
        Đánh giá sản phẩm
        {loc !== 'approved' && soChoDuyet > 0 && (
          <Badge count={soChoDuyet} className="ml-3" />
        )}
      </Title>

      <Card size="small">
        <Radio.Group value={loc} onChange={e => setLoc(e.target.value)} optionType="button" buttonStyle="solid">
          {LOC.map(o => (
            <Radio.Button key={o.value} value={o.value}>{o.label}</Radio.Button>
          ))}
        </Radio.Group>
        <div className="text-xs text-gray-400 mt-2">
          Khách gửi đánh giá không cần đăng nhập, mỗi IP một lần cho mỗi sản phẩm.
          Đánh giá chỉ hiện trên web sau khi được duyệt.
        </div>
      </Card>

      <Card>
        <Table<Review>
          dataSource={danhSach}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: 700 }}
          pagination={{ pageSize: 20, showTotal: t => `${t} đánh giá` }}
          locale={{
            emptyText: (
              <Empty description={loc === 'pending' ? 'Không có đánh giá nào chờ duyệt' : 'Chưa có đánh giá'} />
            ),
          }}
        />
      </Card>
    </div>
  );
}
