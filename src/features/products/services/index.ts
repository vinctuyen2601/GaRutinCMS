import api from '@/lib/axios';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  GenerateProductDescriptionPayload,
  GenerateProductDescriptionResult,
  OptimizeProductSeoPayload,
  OptimizeProductSeoResult,
  ImproveProductDescriptionPayload,
  ImproveProductDescriptionResult,
} from '../types';

export const getProducts = () => api.get<Product[]>('/admin/products').then((r) => r.data);
export const createProduct = (payload: CreateProductPayload) =>
  api.post<Product>('/admin/products', payload).then((r) => r.data);
export const updateProduct = (id: string, payload: UpdateProductPayload) =>
  api.patch<Product>(`/admin/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id: string) => api.delete(`/admin/products/${id}`);

export const aiGenerateDescription = (p: GenerateProductDescriptionPayload) =>
  api.post<GenerateProductDescriptionResult>('/admin/products/ai/generate-description', p).then((r) => r.data);

export const aiOptimizeProductSeo = (p: OptimizeProductSeoPayload) =>
  api.post<OptimizeProductSeoResult>('/admin/products/ai/optimize-seo', p).then((r) => r.data);

export const aiImproveDescription = (p: ImproveProductDescriptionPayload) =>
  api.post<ImproveProductDescriptionResult>('/admin/products/ai/improve-description', p).then((r) => r.data);
