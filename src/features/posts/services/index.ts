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
  PostTemplate,
} from '../types';

export const getPosts = () => api.get<Post[]>('/admin/posts').then((r) => r.data);
export const getPostTemplates = () => api.get<PostTemplate[]>('/admin/posts/templates').then((r) => r.data);
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

/*
 * Đường LÀM TAY, dùng khi gọi LLM qua API bị lỗi hoặc muốn tiết kiệm hạn mức.
 *
 * Máy chủ trả về đúng bộ prompt mà nó sẽ gửi cho LLM, và đọc kết quả dán về
 * bằng đúng bộ kiểm tra của đường tự động — nên kết quả cuối cùng giống hệt.
 */
export const layPromptSeo = (p: OptimizeSeoPayload) =>
  api.post<{ system: string; user: string; prompt: string }>(
    '/admin/posts/ai/optimize-seo/prompt', p).then((r) => r.data);

export const apDungTextSeo = (text: string) =>
  api.post<OptimizeSeoResult>('/admin/posts/ai/optimize-seo/apply', { text }).then((r) => r.data);

export const layPromptImprove = (p: ImproveContentPayload) =>
  api.post<{ system: string; user: string; prompt: string }>(
    '/admin/posts/ai/improve/prompt', p).then((r) => r.data);

export const apDungTextImprove = (text: string) =>
  api.post<ImproveContentResult>('/admin/posts/ai/improve/apply', { text }).then((r) => r.data);
