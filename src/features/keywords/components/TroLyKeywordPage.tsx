import { useState } from 'react';
import {
  Card, Table, Tag, Button, Input, Modal, Space, Typography, Alert, message, Tooltip, Empty,
  Segmented, Select,
} from 'antd';
import {
  ImportOutlined, BulbOutlined, CheckOutlined, CloseOutlined, SearchOutlined, SyncOutlined,
  StopOutlined, UndoOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import {
  getPhanTich, nhapSearchConsole, docDanSearchConsole,
  getGoiY, timGoiY, nhanGoiY, boQuaGoiY, gscSanSang, dongBoSearchConsole, quetSau, gopBai, doiBoQua,
  type BaiKhop,
  type DongPhanTich, type ViecNenLam,
} from '../services/tro-ly';
import { getApiError } from '@/lib/error';

const { Title, Text, Paragraph } = Typography;

/**
 * Nhãn cho từng việc nên làm.
 *
 * Màu theo mức cấp bách chứ không theo thẩm mỹ: đỏ và cam là chỗ đang MẤT
 * (bài trùng nhau, nhu cầu bỏ không), xanh là chỗ đang chạy tốt.
 */
const VIEC: Record<ViecNenLam, { nhan: string; mau: string }> = {
  'gop-bai':      { nhan: 'Gộp bài trùng', mau: 'red' },
  // Bổ sung màu xanh dương chứ không phải cam như viết mới: nó là việc NHẸ hơn
  // — sửa một bài đã có, không phải đẻ thêm bài. Cùng màu sẽ khiến người dùng
  // coi hai việc nặng như nhau và ngại làm.
  'bo-sung':      { nhan: 'Bổ sung bài cũ', mau: 'blue' },
  'viet-moi':     { nhan: 'Viết bài mới',  mau: 'orange' },
  'sua-tieu-de':  { nhan: 'Sửa tiêu đề',   mau: 'gold' },
  'chua-du-lieu': { nhan: 'Thiếu số liệu', mau: 'default' },
  'da-tot':       { nhan: 'Đang tốt',      mau: 'green' },
  'bo-qua':       { nhan: 'Bỏ qua',        mau: 'default' },
};

export default function TroLyKeywordPage() {
  const navigate = useNavigate();
  const [xemBoQua, setXemBoQua] = useState(false);
  const { data: rows = [], isLoading, mutate } = useSWR(
    ['kw-phan-tich', xemBoQua],
    () => getPhanTich(xemBoQua),
  );
  const [gop, setGop] = useState<DongPhanTich | null>(null);
  const [giuLai, setGiuLai] = useState<string>('');
  const [dangGop, setDangGop] = useState(false);
  const { data: goiY = [], mutate: mutateGoiY } = useSWR('kw-goi-y', getGoiY);
  const [moNhap, setMoNhap] = useState(false);
  const [danText, setDanText] = useState('');
  const [dangNhap, setDangNhap] = useState(false);
  const [tuKhoaTim, setTuKhoaTim] = useState('');
  const [dangTim, setDangTim] = useState(false);
  const [dangDongBo, setDangDongBo] = useState(false);
  const [dangQuet, setDangQuet] = useState(false);
  const [locViec, setLocViec] = useState<ViecNenLam | 'tat-ca'>('tat-ca');
  const [timBang, setTimBang] = useState('');
  /*
   * Ngưỡng lượt hiển thị, mặc định 5.
   *
   * Bảng có 195 từ khoá nhưng chỉ 34 cái đạt từ 20 lượt hiển thị — phần còn lại
   * là đuôi dài một hai lượt, đọc hết chỉ tốn thời gian mà không đổi quyết định
   * gì. Mặc định cắt ở 5 (còn 73 dòng), và LUÔN hiện rõ đang ẩn bao nhiêu để
   * không ai tưởng đó là toàn bộ dữ liệu.
   */
  const [nguong, setNguong] = useState(5);

  const quet = async () => {
    setDangQuet(true);
    try {
      const r = await quetSau(12);
      message.success(
        r.them
          ? `Tìm được ${r.them} từ khoá còn thiếu, quét từ ${r.soTuGoc} từ khoá đang có`
          : 'Không tìm thêm được từ khoá nào mới',
      );
      mutateGoiY();
    } catch (e) {
      message.error(getApiError(e, 'Quét thất bại'));
    } finally {
      setDangQuet(false);
    }
  };
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

  // Giữ nguyên thứ tự ưu tiên từ máy chủ — nó đã xếp việc đáng làm lên đầu.
  const khongDau = (x: string) =>
    x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const loc = rows.filter(
    (r) =>
      (locViec === 'tat-ca' || r.viec === locViec) &&
      (r.impressions ?? 0) >= nguong &&
      (!timBang.trim() || khongDau(r.keyword).includes(khongDau(timBang.trim()))),
  );

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
                  {/* Trỏ vào trang sửa bài trong CMS, không phải bài trên web:
                      từ bảng này người ta đi tới để SỬA, không phải để đọc. */}
                  <a onClick={() => navigate(`/posts/${b.id}/edit`)}>{b.title}</a>
                </div>
              ))}
              {r.baiKhop.length > 4 && (
                <Text type="secondary" className="text-xs">
                  …và {r.baiKhop.length - 4} bài nữa
                </Text>
              )}
              {/* Chỉ hiện nút gộp ở dòng thật sự có bài trùng — các dòng khác
                  không có gì để gộp, thêm nút chỉ làm rối. */}
              {r.viec === 'gop-bai' && (
                <Button
                  size="small"
                  type="primary"
                  className="mt-2"
                  onClick={() => {
                    // Mặc định giữ bài nhiều người đọc nhất: nó đang có thứ hạng
                    // và độc giả, gộp ngược lại là vứt đi thứ đang chạy được.
                    const tot = [...r.baiKhop].sort((a, b) => b.nguoiDoc - a.nguoiDoc)[0];
                    setGiuLai(tot?.slug ?? '');
                    setGop(r);
                  }}
                >
                  Gộp {r.baiKhop.length} bài này
                </Button>
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
      title: '',
      key: 'boQua',
      width: 46,
      render: (_: unknown, r: DongPhanTich) =>
        r.daBoQua ? (
          <Tooltip title={`Đã bỏ qua${r.lyDoBoQua ? `: ${r.lyDoBoQua}` : ''} — bấm để nhận lại`}>
            <Button
              size="small"
              type="text"
              icon={<UndoOutlined />}
              onClick={async () => { await doiBoQua(r.id, false); mutate(); }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Bỏ qua từ khoá này — không liên quan tới việc kinh doanh">
            <Button
              size="small"
              type="text"
              icon={<StopOutlined />}
              onClick={async () => {
                await doiBoQua(r.id, true);
                message.success(`Đã bỏ qua "${r.keyword}"`);
                mutate();
              }}
            />
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

      <Space wrap className="w-full">
        <Segmented
          value={locViec}
          onChange={(v) => setLocViec(v as ViecNenLam | 'tat-ca')}
          options={[
            { label: `Tất cả (${rows.length})`, value: 'tat-ca' },
            // Chỉ hiện nhóm có dòng: nút "Gộp bài (0)" bấm vào ra bảng trống
            // chỉ làm người dùng tưởng hỏng.
            ...(Object.keys(VIEC) as ViecNenLam[])
              .filter((v) => rows.some((r) => r.viec === v))
              .map((v) => ({
                label: `${VIEC[v].nhan} (${rows.filter((r) => r.viec === v).length})`,
                value: v,
              })),
          ]}
        />
        <Input.Search
          placeholder="Tìm từ khoá"
          allowClear
          value={timBang}
          onChange={(e) => setTimBang(e.target.value)}
          style={{ width: 220 }}
        />
        <Button
          size="small"
          type={xemBoQua ? 'primary' : 'default'}
          icon={<StopOutlined />}
          onClick={() => setXemBoQua(!xemBoQua)}
        >
          {xemBoQua ? 'Đang hiện cả từ khoá đã bỏ qua' : 'Xem từ khoá đã bỏ qua'}
        </Button>
        <Space size={4}>
          <Text type="secondary" className="text-xs">Từ</Text>
          <Select
            size="small"
            value={nguong}
            onChange={setNguong}
            style={{ width: 92 }}
            options={[0, 3, 5, 10, 20, 50].map((n) => ({
              value: n,
              label: n === 0 ? 'tất cả' : `${n} lượt`,
            }))}
          />
          <Text type="secondary" className="text-xs">hiển thị trở lên</Text>
        </Space>
      </Space>

      {rows.length > loc.length && (
        <Text type="secondary" className="text-xs block">
          Đang ẩn {rows.length - loc.length} từ khoá không khớp bộ lọc
          {nguong > 0 && ` (phần lớn là đuôi dài dưới ${nguong} lượt hiển thị)`}.
        </Text>
      )}

      <Table<DongPhanTich>
        rowKey="id"
        loading={isLoading}
        dataSource={loc}
        columns={columns}
        size="small"
        pagination={loc.length > 25 ? { pageSize: 25, showSizeChanger: false } : false}
      />

      <Card
        size="small"
        title={<><BulbOutlined className="mr-2" />Gợi ý từ khoá từ Google</>}
        extra={
          <Space>
            <Button onClick={quet} loading={dangQuet}>
              Quét từ danh sách hiện có
            </Button>
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
          </Space>
        }
      >
        <Paragraph type="secondary" className="text-xs !mb-3">
          Lấy từ <b>Google Autocomplete</b>, “Mọi người cũng hỏi” và “Tìm kiếm liên
          quan” — đều là truy vấn <b>thật</b> người dùng gõ. Đây là chỗ Search
          Console không trả lời được: nó chỉ thấy từ khoá website đã có mặt, còn
          từ khoá bạn chưa xếp hạng ở đâu cả thì hoàn toàn vô hình với nó.
          <br />
          Danh sách dưới đây <b>đã lọc bỏ</b> những từ khoá đã có bài nhắm vào —
          chỉ còn chỗ đang thiếu.
        </Paragraph>
        {goiY.length === 0 ? (
          <Empty description="Chưa có gợi ý nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space wrap>
            {goiY.map((g) => (
              <Tag
                key={g.id}
                color={
                  g.loai === 'cau-hoi' ? 'purple'
                    : g.loai === 'tu-dong' ? 'cyan'
                    : 'blue'
                }
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
          <Tag color="blue">Bổ sung bài cũ</Tag> Nội dung đã nằm sẵn trong thân một
          bài, chỉ là tiêu đề chưa nhắm vào từ khoá. Thêm một mục và đưa cụm từ vào
          tiêu đề hoặc H2 — rẻ hơn và ít rủi ro hơn viết bài mới rất nhiều.
        </Paragraph>
        <Paragraph className="!mb-2 text-sm">
          <Tag color="orange">Viết bài mới</Tag> Không bài nào <b>nhắc tới</b> từ
          khoá này. Kiểm lại xem có phải gõ sai chính tả hay truy vấn lạc ngành
          không — phần lớn dòng ở nhóm này là vậy.
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
        open={Boolean(gop)}
        onCancel={() => setGop(null)}
        title={`Gộp bài trùng — "${gop?.keyword ?? ''}"`}
        width={720}
        okText={`Gộp ${Math.max(0, (gop?.baiKhop.length ?? 1) - 1)} bài`}
        confirmLoading={dangGop}
        okButtonProps={{ disabled: !giuLai || (gop?.baiKhop.length ?? 0) < 2 }}
        onOk={async () => {
          if (!gop || !giuLai) return;
          setDangGop(true);
          try {
            const bo = gop.baiKhop.filter((b) => b.slug !== giuLai).map((b) => b.slug);
            const kq = await gopBai(giuLai, bo);
            if (kq.loi.length) {
              message.warning(
                `Gộp được ${kq.daGop.length} bài, ${kq.loi.length} bài không được: ` +
                  kq.loi.map((l) => `${l.slug} (${l.lyDo})`).join('; '),
              );
            } else {
              message.success(`Đã gộp ${kq.daGop.length} bài về "${giuLai}"`);
            }
            setGop(null);
            mutate();
          } catch (e) {
            message.error(getApiError(e, 'Gộp thất bại'));
          } finally {
            setDangGop(false);
          }
        }}
      >
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Các bài được gộp sẽ chuyển hướng 301 về bài giữ lại"
          description="Chúng không còn hiện trên web, nhưng KHÔNG bị xoá — mọi tín hiệu SEO dồn về bài giữ lại, và hoàn tác được bằng cách xoá ô chuyển hướng trong trang sửa bài."
        />
        <Text strong className="block mb-2">Giữ lại bài nào?</Text>
        <div className="space-y-1">
          {[...(gop?.baiKhop ?? [])]
            .sort((a: BaiKhop, b: BaiKhop) => b.nguoiDoc - a.nguoiDoc)
            .map((b: BaiKhop) => (
              <div
                key={b.slug}
                onClick={() => setGiuLai(b.slug)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${giuLai === b.slug ? '#1677ff' : '#f0f0f0'}`,
                  background: giuLai === b.slug ? '#e6f4ff' : '#fff',
                }}
              >
                <Space>
                  <Tag color={b.nguoiDoc > 0 ? 'blue' : 'default'}>{b.nguoiDoc} đọc</Tag>
                  <Text strong={giuLai === b.slug}>{b.title}</Text>
                  {giuLai === b.slug && <Tag color="green">giữ lại</Tag>}
                </Space>
              </div>
            ))}
        </div>
        <Text type="secondary" className="text-xs block mt-2">
          Mặc định chọn bài nhiều người đọc nhất — nó đang có thứ hạng và độc giả,
          gộp ngược lại là vứt đi thứ đang chạy được.
        </Text>
      </Modal>

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
