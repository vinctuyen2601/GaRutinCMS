import { useState, useEffect } from 'react';
import {
  Card, Button, Input, Typography, Space, Tag, Alert, Popconfirm, Spin, message, Collapse,
} from 'antd';
import { SaveOutlined, UndoOutlined, RobotOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import { getPrompts, luuPrompt, datLaiPrompt, type PromptItem } from '../services';
import { getApiError } from '@/lib/error';

const { Title, Text, Paragraph } = Typography;

/**
 * Sửa prompt AI mà không phải deploy lại máy chủ.
 *
 * Bản mặc định luôn nằm trong mã nguồn; CSDL chỉ giữ bản ghi đè. Nên nút "Đặt
 * lại" luôn đưa về được nguyên trạng, kể cả khi đã sửa hỏng và không nhớ nội
 * dung cũ — đây là lý do đáng kể nhất để làm theo hướng ghi đè thay vì chép cả
 * bản mặc định vào CSDL.
 */
function MotPrompt({ p, onXong }: { p: PromptItem; onXong: () => void }) {
  const [noiDung, setNoiDung] = useState(p.noiDung);
  const [dangLuu, setDangLuu] = useState(false);

  // Danh sách tải lại sau khi lưu/đặt lại; đồng bộ ô nhập theo dữ liệu mới.
  useEffect(() => setNoiDung(p.noiDung), [p.noiDung]);

  const doi = noiDung !== p.noiDung;
  const thieuBien = p.bien.filter((b) => !noiDung.includes(`{{${b.ten}}}`));

  const luu = async () => {
    setDangLuu(true);
    try {
      await luuPrompt(p.key, noiDung);
      message.success('Đã lưu prompt — có hiệu lực ngay, không cần khởi động lại');
      onXong();
    } catch (e) {
      message.error(getApiError(e, 'Lưu prompt thất bại'));
    } finally {
      setDangLuu(false);
    }
  };

  const datLai = async () => {
    try {
      await datLaiPrompt(p.key);
      message.success('Đã đưa về prompt mặc định');
      onXong();
    } catch (e) {
      message.error(getApiError(e, 'Đặt lại thất bại'));
    }
  };

  return (
    <div className="space-y-3">
      <Text type="secondary" className="text-sm block">{p.moTa}</Text>

      {p.bien.length > 0 && (
        <Alert
          type="info"
          showIcon
          message="Biến dùng được trong prompt này"
          description={
            <div className="space-y-1">
              {p.bien.map((b) => (
                <div key={b.ten} className="text-xs">
                  <Tag color="blue" className="font-mono">{`{{${b.ten}}}`}</Tag>
                  {b.giaiThich}
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-1">
                Hệ thống thay các biến này lúc gửi cho AI. Chỉ dùng đúng dạng
                <code> {'{{ten}}'} </code> — cú pháp khác sẽ được gửi nguyên văn cho AI đọc.
              </div>
            </div>
          }
        />
      )}

      {thieuBien.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`Prompt đang thiếu biến: ${thieuBien.map((b) => `{{${b.ten}}}`).join(', ')}`}
          description="Vẫn lưu được, nhưng AI sẽ không nhận được phần thông tin đó. Bỏ hẳn nếu bạn cố ý."
        />
      )}

      <Input.TextArea
        value={noiDung}
        onChange={(e) => setNoiDung(e.target.value)}
        rows={16}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />

      <Space wrap>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={luu}
          loading={dangLuu}
          disabled={!doi}
        >
          Lưu
        </Button>
        {doi && (
          <Button onClick={() => setNoiDung(p.noiDung)}>Huỷ thay đổi</Button>
        )}
        {p.daSua && (
          <Popconfirm
            title="Đưa về prompt mặc định?"
            description="Bản bạn đang sửa sẽ bị xoá. Bản mặc định nằm trong mã nguồn nên luôn khôi phục được."
            onConfirm={datLai}
            okText="Đặt lại"
            cancelText="Thôi"
          >
            <Button danger icon={<UndoOutlined />}>Đặt lại về mặc định</Button>
          </Popconfirm>
        )}
        <Text type="secondary" className="text-xs">
          {noiDung.length.toLocaleString('vi-VN')} ký tự
          {p.daSua && p.suaLuc ? ` · đã sửa ${new Date(p.suaLuc).toLocaleString('vi-VN')}` : ''}
        </Text>
      </Space>
    </div>
  );
}

export default function AiPromptsPage() {
  const { data: prompts = [], isLoading, mutate } = useSWR('ai-prompts', getPrompts);

  return (
    <div className="space-y-4">
      <Title level={4} className="!mb-0">
        <RobotOutlined className="mr-2" />Prompt AI
      </Title>
      <Paragraph type="secondary" className="text-sm !mb-0">
        Sửa cách AI làm việc mà không cần deploy lại. Thay đổi có hiệu lực ngay
        cho cả nút tự động lẫn phần chạy thủ công, vì hai đường dùng chung một
        bộ prompt.
      </Paragraph>

      <Spin spinning={isLoading}>
        <Collapse
          accordion
          items={prompts.map((p) => ({
            key: p.key,
            label: (
              <Space>
                <b>{p.nhan}</b>
                {p.daSua
                  ? <Tag color="orange">đã sửa</Tag>
                  : <Tag>mặc định</Tag>}
                <Text type="secondary" className="text-xs font-mono">{p.key}</Text>
              </Space>
            ),
            children: <MotPrompt p={p} onXong={() => mutate()} />,
          }))}
        />
      </Spin>

      <Card size="small" title="Nên biết trước khi sửa">
        <Paragraph className="!mb-2 text-sm">
          <b>Phần định dạng đầu ra là bắt buộc.</b> Prompt SEO phải yêu cầu trả về
          JSON; prompt cải thiện phải yêu cầu đúng ba dòng phân cách
          <code> SUMMARY: </code>, <code> ===EXCERPT=== </code>, <code> ===HTML=== </code>.
          Xoá mấy dòng đó thì hệ thống không đọc được kết quả và báo lỗi
          “AI trả về dữ liệu không hợp lệ”.
        </Paragraph>
        <Paragraph className="!mb-0 text-sm">
          <b>Sai thì không mất gì.</b> Bản mặc định luôn nằm trong mã nguồn, bấm
          “Đặt lại về mặc định” là quay về nguyên trạng.
        </Paragraph>
      </Card>
    </div>
  );
}
