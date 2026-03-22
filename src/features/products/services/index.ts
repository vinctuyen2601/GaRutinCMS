import api from '@/lib/axios';
import type { Product, CreateProductPayload, UpdateProductPayload } from '../types';

export const getProducts = () => api.get<Product[]>('/admin/products').then((r) => r.data);
export const createProduct = (payload: CreateProductPayload) => api.post<Product>('/admin/products', payload).then((r) => r.data);
export const updateProduct = (id: string, payload: UpdateProductPayload) => api.patch<Product>(`/admin/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id: string) => api.delete(`/admin/products/${id}`);
