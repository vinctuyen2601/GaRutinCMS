import api from '@/lib/axios';
import type { Post, CreatePostPayload, UpdatePostPayload } from '../types';

export const getPosts = () => api.get<Post[]>('/admin/posts').then((r) => r.data);
export const createPost = (p: CreatePostPayload) => api.post<Post>('/admin/posts', p).then((r) => r.data);
export const updatePost = (id: string, p: UpdatePostPayload) => api.patch<Post>(`/admin/posts/${id}`, p).then((r) => r.data);
export const deletePost = (id: string) => api.delete(`/admin/posts/${id}`);
