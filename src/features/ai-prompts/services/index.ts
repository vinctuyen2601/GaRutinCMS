import api from '@/lib/axios';

export type BienChoPhep = { ten: string; giaiThich: string };

export type PromptItem = {
  key: string;
  nhan: string;
  moTa: string;
  bien: BienChoPhep[];
  /** Bản gốc trong mã nguồn — luôn có, để đối chiếu và đặt lại. */
  macDinh: string;
  /** Bản đang có hiệu lực (đã sửa nếu có, không thì bằng macDinh). */
  noiDung: string;
  daSua: boolean;
  suaLuc: string | null;
};

export const getPrompts = () =>
  api.get<PromptItem[]>('/admin/ai-prompts').then((r) => r.data);

export const luuPrompt = (key: string, content: string) =>
  api.put(`/admin/ai-prompts/${encodeURIComponent(key)}`, { content }).then((r) => r.data);

export const datLaiPrompt = (key: string) =>
  api.delete(`/admin/ai-prompts/${encodeURIComponent(key)}`).then((r) => r.data);
