import api from '@/lib/axios';
import type { MediaFile } from '../types';

export const uploadMedia = (file: File, name?: string) => {
  const form = new FormData();
  form.append('file', file);
  const url = name
    ? `/admin/media/upload?name=${encodeURIComponent(name)}`
    : '/admin/media/upload';
  return api
    .post<MediaFile>(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const getMediaFiles = () =>
  api.get<MediaFile[]>('/admin/media').then((r) => r.data);

export const deleteMediaFile = (id: string) =>
  api.delete(`/admin/media/${id}`);
