import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Alert, Select, message, Progress } from 'antd';
import { SearchOutlined, LinkOutlined } from '@ant-design/icons';
import { doiThu, tuKhoaHangDau, type KetQuaSerp, type DongSerp } from '../services/tro-ly';

const { Text, Paragraph } = Typography;

/**
 * Ai đang đứng trên mình — thứ Search Console không bao giờ cho biết.
 *
 * Search Console nói mình hạng mấy, không nói hạng đó là hạng GIỮA NHỮNG AI.
 * Hai trang một khác nhau cho cùng một con số hạng mà dẫn tới hai kế hoạch
 * ngược nhau, nên không có bảng này thì mọi đề xuất đều là đoán:
 *
 *   - trang một toàn Shopee, TikTok, Facebook → Google xếp theo LOẠI TRANG,
 *     không theo chất lượng bài. Viết thêm nội dung không kéo được hạng.
 *   - trang một toàn blog và shop nhỏ → với tới được, đáng đầu tư.
 *
 * Một phát hiện nữa chỉ bảng này mới thấy: trang một của ngách hẹp thường chỉ
 * có 7–9 vị trí tự nhiên chứ không phải 10, phần còn lại là băng video và mua
 * sắm. Nên "hạng 9,5" của Search Console rất hay là TRANG HAI.
 */

const LOAI: Record<DongSerp['loai'], { nhan: string; mau: string }> = {
  'cua-minh': { nhan: 'Của mình', mau: 'green' },
  san: { nhan: 'Sàn TMĐT', mau: 'red' },
  'mang-xa-hoi': { nhan: 'Mạng xã hội', mau: 'orange' },
  khac: { nhan: 'Trang thường', mau: 'blue' },
};

export default function DoiThuSerp() {
  const [tu, setTu] = useState<string[]>([]);
  const [kq, setKq] = useState<KetQuaSerp[]>([]);
  const [dang, setDang] = useState(false);
  const [tienDo, setTienDo] = useState<[number, number]>([0, 0]);

  async function napGoiY() {
    try {
      setTu(await tuKhoaHangDau(20));
      message.success('Đã nạp 20 từ khoá nhiều hiển thị nhất — bỏ bớt từ nào không cần rồi bấm Đọc');
    } catch (e) { message.error((e as Error).message); }
  }

  async function chay() {
    if (!tu.length) return message.warning('Chọn ít nhất một từ khoá');
    setDang(true); setKq([]);
    const ra: KetQuaSerp[] = [];
    try {
      // Chia lô 10: mỗi từ khoá là một lời gọi ra Google, mà API bị CloudFront
      // cắt cứng ở 30 giây và khi đó trả HTML 504 không kèm log nào.
      for (let i = 0; i < tu.length; i += 10) {
        ra.push(...(await doiThu(tu.slice(i, i + 10))));
        setTienDo([Math.min(i + 10, tu.length), tu.length]);
        setKq([...ra]);
      }
    } catch (e) { message.error((e as Error).message); }
    finally { setDang(false); }
  }

  const kho = kq.filter((k) => k.ketLuan === 'kho-voi-toi').length;
  const coMat = kq.filter((k) => k.hangCuaMinh != null).length;

  return (
    <Space direction="vertical" size="middle" className="w-full">
      <Alert
        type="info" showIcon
        message="Search Console cho biết mình hạng mấy, không cho biết hạng đó là giữa những ai"
        description={
          <Paragraph className="!mb-0">
            Mỗi từ khoá tốn 1 lượt gọi tới Google (hạn mức 2.500). Chú ý cột{' '}
            <strong>số vị trí tự nhiên</strong>: trang một của ngách hẹp thường chỉ có 7–9 chỗ chứ
            không phải 10 — phần còn lại là băng video, ảnh, mua sắm. Nên "hạng 9,5" trong Search
            Console rất hay là <strong>trang hai</strong>.
          </Paragraph>
        }
      />

      {/*
        Select ĐỨNG NGOÀI Space, không nằm trong.
        `.ant-space-item` có min-width:auto nên phần tử bên trong không bóp lại
        được — một Select rộng 420px trong Space là tràn ngang chắc chắn ở khổ
        390px. Bẫy này đã làm hỏng đúng trang "Từ khoá & SEO" một lần rồi.
        Và `Space wrap` chỉ xuống dòng GIỮA các con, không thu nhỏ con nào.
      */}
      <Select
        mode="tags" value={tu} onChange={setTu}
        className="w-full" style={{ maxWidth: 620 }}
        placeholder="Gõ từ khoá rồi Enter, hoặc bấm Nạp từ khoá hàng đầu"
        maxTagCount="responsive"
      />
      <Space wrap>
        <Button onClick={napGoiY}>Nạp từ khoá hàng đầu</Button>
        <Button type="primary" icon={<SearchOutlined />} loading={dang} onClick={chay}>
          Đọc trang một ({tu.length})
        </Button>
        {dang && tienDo[1] > 0 && (
          <Progress percent={Math.round((tienDo[0] / tienDo[1]) * 100)} size="small" style={{ width: 160 }} />
        )}
      </Space>

      {!!kq.length && (
        <Alert
          type={kho * 2 > kq.length ? 'warning' : 'success'} showIcon
          message={`${kho}/${kq.length} truy vấn bị sàn và mạng xã hội chiếm quá nửa trang một · mình có mặt trên trang một ở ${coMat}/${kq.length}`}
          description={
            kho * 2 > kq.length
              ? 'Phần lớn truy vấn đang do nền tảng giữ chỗ. Với những từ đó, viết thêm bài không kéo được hạng — nên dồn sang nhóm truy vấn mà trang thường còn chiếm đa số.'
              : 'Phần lớn trang một do trang thường giữ. Đây là nhóm truy vấn đáng đầu tư nội dung.'
          }
        />
      )}

      <Table<KetQuaSerp>
        rowKey="tuKhoa" size="small" dataSource={kq} pagination={false}
        scroll={{ x: 'max-content' }}
        expandable={{
          expandedRowRender: (r) => (
            <Table<DongSerp>
              rowKey="url" size="small" pagination={false} dataSource={r.ketQua}
              columns={[
                { title: '#', dataIndex: 'hang', width: 50 },
                {
                  title: 'Tên miền', dataIndex: 'tenMien', width: 220,
                  render: (d: string, x) => (
                    <Space size={4}>
                      <a href={x.url} target="_blank" rel="noreferrer"><LinkOutlined /></a>
                      <Text strong={x.loai === 'cua-minh'}>{d}</Text>
                    </Space>
                  ),
                },
                {
                  title: 'Loại', dataIndex: 'loai', width: 120,
                  render: (l: DongSerp['loai']) => <Tag color={LOAI[l].mau}>{LOAI[l].nhan}</Tag>,
                },
                { title: 'Tiêu đề', dataIndex: 'tieuDe', ellipsis: true },
              ]}
            />
          ),
        }}
        columns={[
          { title: 'Từ khoá', dataIndex: 'tuKhoa', width: 260 },
          {
            title: 'Vị trí tự nhiên', width: 130, align: 'right',
            render: (_, r) => r.ketQua.length,
            sorter: (a, b) => a.ketQua.length - b.ketQua.length,
          },
          {
            title: 'Hạng của mình', dataIndex: 'hangCuaMinh', width: 130, align: 'right',
            render: (v: number | null) => v ?? <Text type="secondary">không có mặt</Text>,
          },
          { title: 'Sàn', dataIndex: 'soSan', width: 70, align: 'right' },
          { title: 'Mạng XH', dataIndex: 'soMangXaHoi', width: 90, align: 'right' },
          {
            title: 'Kết luận', dataIndex: 'ketLuan', width: 150,
            render: (v: KetQuaSerp['ketLuan']) =>
              v === 'kho-voi-toi'
                ? <Tag color="red">Khó với tới</Tag>
                : <Tag color="green">Với tới được</Tag>,
          },
          {
            title: '', dataIndex: 'loi', ellipsis: true,
            render: (v?: string) => v ? <Text type="danger">{v}</Text> : null,
          },
        ]}
      />

      {!!kq.length && (
        <Card size="small" title="Tên miền hay gặp nhất trên trang một">
          <Space wrap>
            {Object.entries(
              kq.flatMap((k) => k.ketQua).filter((r) => r.loai !== 'cua-minh')
                .reduce<Record<string, number>>((a, r) => ({ ...a, [r.tenMien]: (a[r.tenMien] || 0) + 1 }), {}),
            ).sort((a, b) => b[1] - a[1]).slice(0, 15)
              .map(([d, n]) => <Tag key={d}>{d} · {n}</Tag>)}
          </Space>
        </Card>
      )}
    </Space>
  );
}
