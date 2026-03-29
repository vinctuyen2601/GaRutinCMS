import api from '@/lib/axios';
import type { Keyword, CreateKeywordPayload, UpdateKeywordPayload, CrawlToDraftsResult } from '../types';

export const getKeywords = () =>
  api.get<Keyword[]>('/admin/keywords').then((r) => r.data);

export const getActiveKeyword = () =>
  api.get<Keyword | null>('/admin/keywords/active').then((r) => r.data);

export const createKeyword = (p: CreateKeywordPayload) =>
  api.post<Keyword>('/admin/keywords', p).then((r) => r.data);

export const updateKeyword = (id: string, p: UpdateKeywordPayload) =>
  api.patch<Keyword>(`/admin/keywords/${id}`, p).then((r) => r.data);

export const activateKeyword = (id: string) =>
  api.patch<Keyword>(`/admin/keywords/${id}/activate`).then((r) => r.data);

export const deactivateKeyword = (id: string) =>
  api.patch<Keyword>(`/admin/keywords/${id}/deactivate`).then((r) => r.data);

export const deleteKeyword = (id: string) =>
  api.delete(`/admin/keywords/${id}`);

export const crawlToDrafts = (limit = 3) =>
  api.post<CrawlToDraftsResult>('/admin/posts/ai/crawl-to-drafts', { limit }).then((r) => r.data);
