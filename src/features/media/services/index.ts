import api from '@/lib/axios';
import type { MediaFile } from '../types';

export const uploadMedia = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<MediaFile>('/admin/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const getMediaFiles = () =>
  api.get<MediaFile[]>('/admin/media').then((r) => r.data);

export const deleteMediaFile = (id: string) =>
  api.delete(`/admin/media/${id}`);
