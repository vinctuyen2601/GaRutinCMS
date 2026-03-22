import api from '@/lib/axios';

export const uploadMedia = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<{ url: string }>('/admin/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
