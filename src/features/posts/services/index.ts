import api from '@/lib/axios';
import type {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  GenerateFromUrlPayload,
  GenerateFromUrlResult,
  GenerateContentPayload,
  GenerateContentResult,
  OptimizeSeoPayload,
  OptimizeSeoResult,
  ImproveContentPayload,
  ImproveContentResult,
} from '../types';

export const getPosts = () => api.get<Post[]>('/admin/posts').then((r) => r.data);
export const createPost = (p: CreatePostPayload) => api.post<Post>('/admin/posts', p).then((r) => r.data);
export const updatePost = (id: string, p: UpdatePostPayload) => api.patch<Post>(`/admin/posts/${id}`, p).then((r) => r.data);
export const deletePost = (id: string) => api.delete(`/admin/posts/${id}`);

export const aiGenerateFromUrl = (p: GenerateFromUrlPayload) =>
  api.post<GenerateFromUrlResult>('/admin/posts/ai/generate-from-url', p).then((r) => r.data);

export const aiGenerateContent = (p: GenerateContentPayload) =>
  api.post<GenerateContentResult>('/admin/posts/ai/generate', p).then((r) => r.data);

export const aiOptimizeSeo = (p: OptimizeSeoPayload) =>
  api.post<OptimizeSeoResult>('/admin/posts/ai/optimize-seo', p).then((r) => r.data);

export const aiImproveContent = (p: ImproveContentPayload) =>
  api.post<ImproveContentResult>('/admin/posts/ai/improve', p).then((r) => r.data);
