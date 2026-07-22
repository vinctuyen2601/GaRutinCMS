import api from '@/lib/axios';

export const getSiteConfig = () => api.get<Record<string, string>>('/admin/site-config').then((r) => r.data);
export const updateSiteConfig = (key: string, value: string) =>
  api.patch('/admin/site-config', { key, value }).then((r) => r.data);
