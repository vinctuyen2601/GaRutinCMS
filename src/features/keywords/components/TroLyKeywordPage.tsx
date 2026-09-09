import { useState } from 'react';
import {
  Card, Table, Tag, Button, Input, Modal, Space, Typography, Alert, message, Tooltip, Empty,
} from 'antd';
import {
  ImportOutlined, BulbOutlined, CheckOutlined, CloseOutlined, SearchOutlined, SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import useSWR from 'swr';
import {
  getPhanTich, nhapSearchConsole, docDanSearchConsole,
  getGoiY, timGoiY, nhanGoiY, boQuaGoiY, gscSanSang, dongBoSearchConsole,
  type DongPhanTich, type ViecNenLam,
} from '../services/tro-ly';
import { getApiError } from '@/lib/error';

const { Title, Text, Paragraph } = Typography;
const WEB_URL = 'https://garutin.com';

/**
 * Nhãn cho từng việc nên làm.
 *
 * Màu theo mức cấp bách chứ không theo thẩm mỹ: đỏ và cam là chỗ đang MẤT
 * (bài trùng nhau, nhu cầu bỏ không), xanh là chỗ đang chạy tốt.
 */
const VIEC: Record<ViecNenLam, { nhan: string; mau: string }> = {
  'gop-bai':      { nhan: 'Gộp bài trùng', mau: 'red' },
  'viet-moi':     { nhan: 'Viết bài mới',  mau: 'orange' },
  'sua-tieu-de':  { nhan: 'Sửa tiêu đề',   mau: 'gold' },
  'chua-du-lieu': { nhan: 'Thiếu số liệu', mau: 'default' },
  'da-tot':       { nhan: 'Đang tốt',      mau: 'green' },
  'bo-qua':       { nhan: 'Bỏ qua',        mau: 'default' },
};

export default function TroLyKeywordPage() {
  const { data: rows = [], isLoading, mutate } = useSWR('kw-phan-tich', getPhanTich);
  const { data: goiY = [], mutate: mutateGoiY } = useSWR('kw-goi-y', getGoiY);
  const [moNhap, setMoNhap] = useState(false);
  const [danText, setDanText] = useState('');
  const [dangNhap, setDangNhap] = useState(false);
  const [tuKhoaTim, setTuKhoaTim] = useState('');
  const [dangTim, setDangTim] = useState(false);
  const [dangDongBo, setDangDongBo] = useState(false);
  const { data: gsc } = useSWR('gsc-san-sang', gscSanSang);

  const dongBo = async () => {
    setDangDongBo(true);
    try {
      const r = await dongBoSearchConsole(90);
      message.success(
        `Đã lấy ${r.tong} truy vấn của ${r.soNgay} ngày — thêm mới ${r.them}, cập nhật ${r.capNhat}`,
      );
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Đồng bộ thất bại'));
    } finally {
      setDangDongBo(false);
    }
  };

  const xemTruoc = docDanSearchConsole(danText);

  const nhap = async () => {
    if (!xemTruoc.length) {
      message.warning('Không đọc được dòng nào — dán cả phần tiêu đề cột cũng được');
      return;
    }
    setDangNhap(true);
    try {
      const r = await nhapSearchConsole(xemTruoc);
      message.success(`Đã nhập ${r.tong} từ khoá — thêm mới ${r.them}, cập nhật ${r.capNhat}`);
      setMoNhap(false);
      setDanText('');
      mutate();
    } catch (e) {
      message.error(getApiError(e, 'Nhập thất bại'));
    } finally {
      setDangNhap(false);
    }
  };

  const tim = async () => {
    if (!tuKhoaTim.trim()) return;
    setDangTim(true);
    try {
      const r = await timGoiY(tuKhoaTim.trim());
      message.success(
        r.them
          ? `Tìm được ${r.them} từ khoá mới (${r.cauHoi} câu hỏi, ${r.lienQuan} liên quan)`
          : 'Không có gợi ý mới — có thể đã có hết trong danh sách',
      );
      mutateGoiY();
    } catch (e) {
      message.error(getApiError(e, 'Không lấy được gợi ý'));
    } finally {
      setDangTim(false);
    }
  };

  const columns: ColumnsType<DongPhanTich> = [
    {
      title: 'Việc nên làm',
      dataIndex: 'viec',
      width: 140,
      render: (v: ViecNenLam) => <Tag color={VIEC[v].mau}>{VIEC[v].nhan}</Tag>,
    },
    {
      title: 'Từ khoá',
      dataIndex: 'keyword',
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{v}</Text>
          <Text type="secondary" className="text-xs">{r.lyDo}</Text>
          {r.baiKhop.length > 0 && (
            <div className="mt-1">
              {r.baiKhop.slice(0, 4).map((b) => (
                <div key={b.slug} className="text-xs">
                  <Tag color={b.nguoiDoc > 0 ? 'blue' : 'default'} className="mr-1">
                    {b.nguoiDoc} đọc
                  </Tag>
                  <a href={`${WEB_URL}/blog/${b.slug}`} target="_blank" rel="noreferrer">
                    {b.title}
                  </a>
                </div>
              ))}
              {r.baiKhop.length > 4 && (
                <Text type="secondary" className="text-xs">
                  …và {r.baiKhop.length - 4} bài nữa
                </Text>
              )}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Nhu cầu',
      dataIndex: 'impressions',
      width: 110,
      align: 'right' as const,
      sorter: (a, b) => (a.impressions ?? -1) - (b.impressions ?? -1),
      render: (v: number | null) =>
        v == null ? <Text type="secondary">—</Text> : <b>{v.toLocaleString('vi-VN')}</b>,
    },
    {
      title: 'Nhấp',
      dataIndex: 'clicks',
      width: 90,
      align: 'right' as const,
      render: (v: number | null, r) =>
        v == null ? '—' : (
          <Tooltip title={r.ctr != null ? `CTR ${(r.ctr * 100).toFixed(1)}%` : ''}>
            {v}
          </Tooltip>
        ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'position',
      width: 80,
      align: 'right' as const,
      render: (v: string | null) => (v ? Number(v).toFixed(1) : '—'),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="!mb-0">
          <SearchOutlined className="mr-2" />Từ khoá &amp; SEO
        </Title>
        <Space>
          {gsc?.sanSang && (
            <Button type="primary" icon={<SyncOutlined />} onClick={dongBo} loading={dangDongBo}>
              Đồng bộ Search Console
            </Button>
          )}
          {/* Nhập tay vẫn giữ: dùng khi chưa cấu hình service account, hoặc khi
              muốn nhập số liệu của một khoảng thời gian khác 90 ngày. */}
          <Button
            type={gsc?.sanSang ? 'default' : 'primary'}
            icon={<ImportOutlined />}
            onClick={() => setMoNhap(true)}
          >
            Nhập tay
          </Button>
        </Space>
      </div>

      {rows.every((r) => r.impressions == null) && (
        <Alert
          type="warning"
          showIcon
          message="Chưa có số liệu nhu cầu"
          description={gsc?.sanSang
            ? 'Bấm "Đồng bộ Search Console" để lấy số liệu 90 ngày gần nhất.'
            : 'Không có lượt hiển thị thì bảng này chỉ là danh sách gõ tay, không quyết định được gì. Mở Search Console → Hiệu suất → Truy vấn, chọn hết rồi dán vào đây.'}
        />
      )}

      <Table<DongPhanTich>
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        columns={columns}
        size="small"
        pagination={false}
      />

      <Card
        size="small"
        title={<><BulbOutlined className="mr-2" />Gợi ý từ khoá từ Google</>}
        extra={
          <Space.Compact>
            <Input
              placeholder="Nhập một từ khoá để tìm gợi ý quanh nó"
              value={tuKhoaTim}
              onChange={(e) => setTuKhoaTim(e.target.value)}
              onPressEnter={tim}
              style={{ width: 280 }}
            />
            <Button onClick={tim} loading={dangTim}>Tìm</Button>
          </Space.Compact>
        }
      >
        <Paragraph type="secondary" className="text-xs !mb-3">
          Lấy từ “Mọi người cũng hỏi” và “Tìm kiếm liên quan” của chính Google —
          đây là câu hỏi <b>thật</b> người dùng gõ, nên mỗi câu là một tiêu đề bài
          viết đã có sẵn nhu cầu.
        </Paragraph>
        {goiY.length === 0 ? (
          <Empty description="Chưa có gợi ý nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space wrap>
            {goiY.map((g) => (
              <Tag
                key={g.id}
                color={g.loai === 'cau-hoi' ? 'purple' : 'blue'}
                className="py-1 px-2"
              >
                {g.keyword}
                <Button
                  type="text" size="small" icon={<CheckOutlined />}
                  title="Nhận vào danh sách"
                  onClick={async () => { await nhanGoiY(g.id); mutateGoiY(); mutate(); }}
                />
                <Button
                  type="text" size="small" icon={<CloseOutlined />}
                  title="Bỏ qua, đừng gợi ý lại"
                  onClick={async () => { await boQuaGoiY(g.id); mutateGoiY(); }}
                />
              </Tag>
            ))}
          </Space>
        )}
      </Card>

      <Card size="small" title="Bảng này đọc thế nào">
        <Paragraph className="!mb-2 text-sm">
          <Tag color="red">Gộp bài trùng</Tag> Nhiều bài cùng nhắm một từ khoá.
          Google phải chọn một và tín hiệu bị chia nhỏ — đây là chỗ mất mát lặng lẽ
          nhất, nên xếp lên đầu.
        </Paragraph>
        <Paragraph className="!mb-2 text-sm">
          <Tag color="orange">Viết bài mới</Tag> Có người tìm mà chưa có bài nào
          nhắm vào — nhu cầu đang bỏ không, và là việc dễ nhất.
        </Paragraph>
        <Paragraph className="!mb-2 text-sm">
          <Tag color="gold">Sửa tiêu đề</Tag> Đã có hạng trên trang 1 nhưng ít người
          bấm. Sửa tiêu đề và mô tả SEO rẻ hơn viết lại bài rất nhiều.
        </Paragraph>
        <Paragraph className="!mb-0 text-sm">
          <Tag>Bỏ qua</Tag> Không ai tìm từ khoá này. Đừng mở rộng thêm chủ đề đó —
          bài viết ra sẽ nhập vào nhóm chưa ai đọc.
        </Paragraph>
      </Card>

      <Modal
        open={moNhap}
        onCancel={() => setMoNhap(false)}
        onOk={nhap}
        confirmLoading={dangNhap}
        okText={xemTruoc.length ? `Nhập ${xemTruoc.length} từ khoá` : 'Nhập'}
        okButtonProps={{ disabled: !xemTruoc.length }}
        title="Nhập số liệu từ Search Console"
        width={720}
      >
        <Alert
          type="info"
          showIcon
          className="mb-3"
          message="Cách lấy"
          description="Search Console → Hiệu suất → thẻ Truy vấn → bôi đen cả bảng rồi copy, hoặc bấm Xuất → CSV rồi mở ra copy. Dán thẳng vào ô dưới, cả dòng tiêu đề cũng được."
        />
        <Input.TextArea
          rows={10}
          value={danText}
          onChange={(e) => setDanText(e.target.value)}
          placeholder={'Truy vấn\tLượt nhấp\tLượt hiển thị\tCTR\tVị trí\nmua gà rutin ở tphcm\t10\t114\t8,8%\t4,7'}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        {danText && (
          <div className="mt-2">
            <Text type={xemTruoc.length ? 'success' : 'danger'} className="text-sm">
              Đọc được {xemTruoc.length} dòng
            </Text>
            {xemTruoc.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Ví dụ: <b>{xemTruoc[0].keyword}</b> — {xemTruoc[0].impressions} hiển thị,{' '}
                {xemTruoc[0].clicks} nhấp
                {xemTruoc[0].position ? `, vị trí ${xemTruoc[0].position}` : ''}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
