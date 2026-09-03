import api from '@/lib/axios';
import type { GalleryItem, CreateGalleryPayload, UpdateGalleryPayload } from '../types';

export const getGalleryItems = () =>
  api.get<GalleryItem[]>('/admin/gallery').then((r) => r.data);

export const createGalleryItem = (p: CreateGalleryPayload) =>
  api.post<GalleryItem>('/admin/gallery', p).then((r) => r.data);

export const updateGalleryItem = (id: string, p: UpdateGalleryPayload) =>
  api.patch<GalleryItem>(`/admin/gallery/${id}`, p).then((r) => r.data);

export const deleteGalleryItem = (id: string) => api.delete(`/admin/gallery/${id}`);
