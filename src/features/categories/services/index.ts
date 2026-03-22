import api from '@/lib/axios';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '../types';

export const getCategories = () => api.get<Category[]>('/admin/categories').then((r) => r.data);
export const createCategory = (p: CreateCategoryPayload) => api.post<Category>('/admin/categories', p).then((r) => r.data);
export const updateCategory = (id: string, p: UpdateCategoryPayload) => api.patch<Category>(`/admin/categories/${id}`, p).then((r) => r.data);
export const deleteCategory = (id: string) => api.delete(`/admin/categories/${id}`);
