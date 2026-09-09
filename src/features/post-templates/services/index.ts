import api from '@/lib/axios';

export type PostTemplateRow = {
  id: string;
  name: string;
  description: string;
  brief: string;
  sortOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
};

export const getTemplates = () =>
  api.get<PostTemplateRow[]>('/admin/post-templates').then((r) => r.data);

export const themTemplate = (d: {
  id: string; name: string; description?: string; brief: string; sortOrder?: number;
}) => api.post('/admin/post-templates', d).then((r) => r.data);

export const suaTemplate = (id: string, d: Partial<PostTemplateRow>) =>
  api.patch(`/admin/post-templates/${encodeURIComponent(id)}`, d).then((r) => r.data);

export const xoaTemplate = (id: string) =>
  api.delete(`/admin/post-templates/${encodeURIComponent(id)}`).then((r) => r.data);

export const khoiPhucTemplate = (id: string) =>
  api.post(`/admin/post-templates/${encodeURIComponent(id)}/khoi-phuc`).then((r) => r.data);
