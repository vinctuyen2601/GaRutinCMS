import api from '@/lib/axios';
import type { Order, OrderStatus } from '../types';

export const getOrders = (params?: Record<string, unknown>) =>
  api.get<Order[]>('/admin/orders', { params }).then((r) => r.data);

export const getOrder = (id: string) =>
  api.get<Order>(`/admin/orders/${id}`).then((r) => r.data);

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data);
