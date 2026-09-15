import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Alert, Segmented, message, Input, Progress } from 'antd';
import { SyncOutlined, RadarChartOutlined } from '@ant-design/icons';
import { getVungTrang, moRong, type DongVungTrang } from '../services/tro-ly';

const { Text, Paragraph } = Typography;

/**
 * Vùng trắng — chỗ chưa đặt chân tới.
 *
 * VÌ SAO CẦN: Search Console chỉ thấy truy vấn mà website ĐÃ có mặt. Từ khoá
 * chưa xếp hạng ở đâu cả thì hoàn toàn vô hình với nó — mà đó đúng là chỗ đáng
 * tìm. Google Autocomplete không phụ thuộc website nên bù được đúng điểm mù
 * này, và không cần khoá API nào.
 *
 * Ba loại, ba việc khác nhau:
 *   - "Vùng trắng"          → chưa có bài, chưa xếp hạng. Cân nhắc viết.
 *   - "Có bài, chưa hạng"   → đã có bài mà chưa lên. Sửa bài đang có, ĐỪNG
 *     viết bài mới — thêm một bài nữa cùng chủ đề chỉ tự tranh chỗ.
 *   - "Đã xếp hạng"         → không phải làm gì.
 */

const LOAI: Record<string, { nhan: string; mau: string; viec: string }> = {
  'vung-trang': { nhan: 'Vùng trắng', mau: 'green', viec: 'Chưa có bài — cân nhắc viết' },
  'co-bai-chua-hang': { nhan: 'Có bài, chưa hạng', mau: 'orange', viec: 'Sửa bài đang có, đừng viết bài mới' },
  'da-xep-hang': { nhan: 'Đã xếp hạng', mau: 'blue', viec: 'Không phải làm gì' },
};

export default function VungTrang() {
  const [rows, setRows] = useState<DongVungTrang[]>([]);
  const [loc, setLoc] = useState<string>('vung-trang');
  const [chiTM, setChiTM] = useState(false);
  const [dang, setDang] = useState(false);
  const [cum, setCum] = useState('');
  const [tienDo, setTienDo] = useState<[number, number]>([0, 0]);

  const nap = async () => {
    setDang(true);
    try {
      const r = await getVungTrang();
      setRows(r.dong);
    } catch (e) { message.error((e as Error).message); }
    finally { setDang(false); }
  };
  useEffect(() => { void nap(); }, []);

  /**
   * Mở rộng theo lô. KHÔNG gọi một phát cho cả danh sách: mỗi cụm gốc là một
   * lời gọi ra Google, mà API bị CloudFront cắt ở 30 giây — đã có lần 90 lời
   * gọi tuần tự làm cả yêu cầu trả về HTML 504 mà log ứng dụng không ghi gì.
   */
  async function moRongCum() {
    const goc = cum.split(',').map((s) => s.trim()).filter(Boolean);
    if (!goc.length) return message.warning('Nhập ít nhất một cụm gốc, cách nhau bằng dấu phẩy');
    setDang(true);
    try {
      // `conLai` là SỐ cụm còn lại, không phải danh sách — gọi tiếp bằng cách
      // tăng `dot`, giữ nguyên cụm gốc. Trần 30 lượt để một cụm gốc quá rộng
      // không quay vòng mãi.
      let dot = 0, them = 0, chan = false;
      for (;;) {
        const r = await moRong(goc, dot, 20);
        them += r.them;
        setTienDo([r.tongCum - r.conLai, r.tongCum]);
        if (r.nghiBiChan) { chan = true; break; }
        if (r.conLai <= 0 || ++dot > 30) break;
      }
      if (chan) message.warning(`Thêm ${them} gợi ý rồi dừng: hỏi liên tiếp mà Google trả rỗng, nhiều khả năng đang bị chặn tạm thời. Thử lại sau.`);
      else message.success(`Thêm ${them} gợi ý mới`);
      await nap();
    } catch (e) { message.error((e as Error).message); }
    finally { setDang(false); setTienDo([0, 0]); }
  }

  const hien = rows
    .filter((r) => loc === 'tat-ca' || r.loai === loc)
    .filter((r) => !chiTM || r.thuongMai)
    .sort((a, b) => b.diem - a.diem);

  return (
    <Space direction="vertical" size="middle" className="w-full">
      <Alert
        type="info" showIcon
        message="Search Console chỉ thấy truy vấn mà website đã có mặt"
        description={
          <Paragraph className="!mb-0">
            Từ khoá chưa xếp hạng ở đâu cả thì vô hình với Search Console — mà đó đúng là chỗ đáng
            tìm. Bảng này lấy từ Google Autocomplete, không cần khoá API.
            Cột <strong>cùng cụm</strong> là số gợi ý khác chung một cụm lõi: thay cho số lượt tìm
            mà mình không có, cụm càng đông thì nhu cầu càng rõ.
          </Paragraph>
        }
      />

      <Space wrap>
        <Segmented
          value={loc} onChange={(v) => setLoc(v as string)}
          options={[
            { label: `Vùng trắng (${rows.filter((r) => r.loai === 'vung-trang').length})`, value: 'vung-trang' },
            { label: `Có bài, chưa hạng (${rows.filter((r) => r.loai === 'co-bai-chua-hang').length})`, value: 'co-bai-chua-hang' },
            { label: `Đã xếp hạng (${rows.filter((r) => r.loai === 'da-xep-hang').length})`, value: 'da-xep-hang' },
            { label: `Tất cả (${rows.length})`, value: 'tat-ca' },
          ]}
        />
        <Button type={chiTM ? 'primary' : 'default'} onClick={() => setChiTM(!chiTM)}>
          Chỉ từ khoá có ý định mua
        </Button>
        <Button icon={<SyncOutlined />} loading={dang} onClick={nap}>Nạp lại</Button>
      </Space>

      <Space.Compact className="w-full" style={{ maxWidth: 620 }}>
        <Input
          value={cum} onChange={(e) => setCum(e.target.value)}
          placeholder="Cụm gốc để mở rộng, cách nhau bằng dấu phẩy — vd: gà rutin, chuồng gà rutin"
          onPressEnter={moRongCum}
        />
        <Button icon={<RadarChartOutlined />} loading={dang} onClick={moRongCum}>Mở rộng</Button>
      </Space.Compact>
      {tienDo[1] > 0 && <Progress percent={Math.round((tienDo[0] / tienDo[1]) * 100)} size="small" style={{ maxWidth: 620 }} />}

      <Table<DongVungTrang>
        rowKey="keyword" size="small" dataSource={hien} loading={dang}
        pagination={{ pageSize: 30, showSizeChanger: false }}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Từ khoá', dataIndex: 'keyword', width: 320 },
          {
            title: 'Loại', dataIndex: 'loai', width: 160,
            render: (v: string) => <Tag color={LOAI[v]?.mau}>{LOAI[v]?.nhan ?? v}</Tag>,
          },
          {
            title: 'Ý định mua', dataIndex: 'thuongMai', width: 110, align: 'center',
            render: (v: boolean) => v ? <Tag color="gold">có</Tag> : <Text type="secondary">—</Text>,
          },
          {
            title: 'Cùng cụm', dataIndex: 'coCum', width: 100, align: 'right',
            sorter: (a, b) => a.coCum - b.coCum,
          },
          {
            title: 'Bài đang nhắm', dataIndex: 'baiGan', width: 260,
            render: (v: string | null) => v
              ? <a href={`/posts?slug=${v}`} target="_blank" rel="noreferrer">{v}</a>
              : <Text type="secondary">chưa có</Text>,
          },
          {
            title: 'Nên làm gì', dataIndex: 'loai', width: 280,
            render: (v: string) => <Text type="secondary">{LOAI[v]?.viec}</Text>,
          },
        ]}
      />
    </Space>
  );
}
