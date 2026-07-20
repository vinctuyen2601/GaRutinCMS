import api from '@/lib/axios';
import type { Order } from '@/features/orders/types';
import type { Customer, DeletedCustomer } from '../types';

export const getCustomers = (search?: string) =>
  api.get<Customer[]>('/customers/admin/customers', { params: search ? { search } : {} }).then(r => r.data);

export const getCustomer = (id: string) =>
  api.get<Customer>(`/customers/admin/customers/${id}`).then(r => r.data);

export const updateCustomer = (id: string, data: { name?: string; address?: string; phone?: string }) =>
  api.patch<Customer>(`/customers/admin/customers/${id}`, data).then(r => r.data);

export const createCustomer = (data: { phone: string; name?: string; address?: string }) =>
  api.post<Customer>('/customers/admin/customers', data).then(r => r.data);

export const deleteCustomer = (id: string) =>
  api.delete(`/customers/admin/customers/${id}`).then(r => r.data);

export const getDeletedCustomers = () =>
  api.get<DeletedCustomer[]>('/customers/admin/customers/deleted').then(r => r.data);

export const getCustomerOrders = (phone: string) =>
  api.get<Order[]>(`/admin/orders/by-phone/${phone}`).then(r => r.data);
