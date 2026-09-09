import { useState, useEffect } from 'react';
import { Modal, Button, Input, Steps, Alert, Typography, Space, message } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { getApiError } from '@/lib/error';

const { Paragraph, Text } = Typography;

/**
 * Chạy AI bằng tay: lấy prompt ra, tự dán sang chat AI bên ngoài, dán kết quả về.
 *
 * Có để dùng khi gọi LLM qua API hỏng hoặc hết hạn mức — thay vì mất hẳn chức
 * năng thì chỉ mất phần tự động. Prompt và phần đọc kết quả đều do MÁY CHỦ cấp,
 * đúng bộ mà đường tự động dùng, nên kết quả cuối cùng không khác gì.
 *
 * Nhận `layPrompt` và `apDung` từ bên ngoài thay vì tự biết mình đang làm SEO
 * hay cải thiện nội dung: hai việc chỉ khác nhau ở hai lời gọi đó, còn toàn bộ
 * các bước thao tác thì giống hệt.
 */
export default function AiThuCongModal<T>({
  mo,
  onDong,
  tieuDe,
  layPrompt,
  apDung,
  onXong,
  moTaKetQua,
}: {
  mo: boolean;
  onDong: () => void;
  tieuDe: string;
  layPrompt: () => Promise<{ prompt: string }>;
  apDung: (text: string) => Promise<T>;
  onXong: (ketQua: T) => void;
  moTaKetQua: string;
}) {
  const [prompt, setPrompt] = useState('');
  const [dangTai, setDangTai] = useState(false);
  const [ketQua, setKetQua] = useState('');
  const [dangApDung, setDangApDung] = useState(false);
  const [daSao, setDaSao] = useState(false);

  useEffect(() => {
    if (!mo) return;
    setKetQua('');
    setDaSao(false);
    setDangTai(true);
    layPrompt()
      .then((r) => setPrompt(r.prompt))
      .catch((e) => message.error(getApiError(e, 'Không lấy được prompt')))
      .finally(() => setDangTai(false));
    // layPrompt đổi mỗi lần render vì nó đóng gói giá trị form hiện tại; đưa vào
    // deps sẽ gọi lại vô hạn. Chỉ cần chạy đúng lúc mở hộp thoại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mo]);

  const sao = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // clipboard bị chặn ngoài https — rơi về cách cũ
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setDaSao(true);
    message.success('Đã sao chép prompt');
  };

  const xuLy = async () => {
    if (!ketQua.trim()) {
      message.warning('Chưa dán kết quả từ AI vào ô bên dưới');
      return;
    }
    setDangApDung(true);
    try {
      const r = await apDung(ketQua);
      onXong(r);
      onDong();
    } catch (e) {
      // Máy chủ dùng đúng bộ kiểm tra của đường tự động, nên lỗi ở đây nghĩa là
      // AI trả về sai định dạng thật — giữ nguyên ô kết quả để sửa rồi thử lại.
      message.error(getApiError(e, 'Kết quả dán vào không đúng định dạng'));
    } finally {
      setDangApDung(false);
    }
  };

  return (
    <Modal
      open={mo}
      onCancel={onDong}
      title={tieuDe}
      width={760}
      okText="Áp dụng kết quả"
      onOk={xuLy}
      confirmLoading={dangApDung}
      okButtonProps={{ disabled: !ketQua.trim() }}
    >
      <Steps
        size="small"
        current={ketQua.trim() ? 2 : daSao ? 1 : 0}
        className="mb-4"
        items={[
          { title: 'Sao chép prompt' },
          { title: 'Dán vào chat AI' },
          { title: 'Dán kết quả về' },
        ]}
      />

      <Alert
        type="info"
        showIcon
        className="mb-3"
        message="Dùng khi không muốn tốn hạn mức AI"
        description="Prompt dưới đây đúng bằng prompt mà hệ thống gửi cho AI. Dán nó vào ChatGPT, Claude hay Gemini, rồi copy nguyên văn câu trả lời về ô bên dưới."
      />

      <Space className="mb-2">
        <Button
          icon={daSao ? <CheckOutlined /> : <CopyOutlined />}
          type={daSao ? 'default' : 'primary'}
          onClick={sao}
          loading={dangTai}
          disabled={!prompt}
        >
          {daSao ? 'Đã sao chép' : 'Sao chép prompt'}
        </Button>
        <Text type="secondary" className="text-xs">
          {prompt ? `${prompt.length.toLocaleString('vi-VN')} ký tự` : 'đang lấy prompt…'}
        </Text>
      </Space>

      <Input.TextArea
        value={prompt}
        readOnly
        rows={6}
        className="mb-4"
        style={{ fontFamily: 'monospace', fontSize: 12, background: '#fafafa' }}
      />

      <Paragraph className="!mb-1 text-sm">
        <b>Dán câu trả lời của AI vào đây</b> — {moTaKetQua}
      </Paragraph>
      <Input.TextArea
        value={ketQua}
        onChange={(e) => setKetQua(e.target.value)}
        rows={8}
        placeholder="Dán nguyên văn phần AI trả lời, không cần cắt bớt"
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      <Text type="secondary" className="text-xs block mt-1">
        Dán cả phần chữ thừa quanh kết quả cũng được — hệ thống tự tìm phần cần lấy.
      </Text>
    </Modal>
  );
}
