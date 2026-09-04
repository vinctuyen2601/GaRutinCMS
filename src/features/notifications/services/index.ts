import api from '@/lib/axios';
import type { NotificationChannel } from '../types';

const BASE = '/admin/notification-channels';

export const getChannels = () =>
  api.get<NotificationChannel[]>(BASE).then(r => r.data);

export const createChannel = (data: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>) =>
  api.post<NotificationChannel>(BASE, data).then(r => r.data);

export const updateChannel = (id: string, data: Partial<NotificationChannel>) =>
  api.patch<NotificationChannel>(`${BASE}/${id}`, data).then(r => r.data);

export const deleteChannel = (id: string) =>
  api.delete(`${BASE}/${id}`).then(r => r.data);

export const testChannel = (id: string) =>
  api.post<{ ok: boolean; error?: string }>(`${BASE}/${id}/test`).then(r => r.data);
