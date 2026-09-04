import api from '@/lib/axios';

export const getVisitStats = (from?: string, to?: string) =>
  api.get('/admin/analytics/visits', { params: { from, to } }).then(r => r.data);

export const getVisitTable = (params: { from?: string; to?: string; path?: string }) =>
  api.get('/admin/analytics/table', { params }).then(r => r.data);

export const getOrderStats = (from?: string, to?: string) =>
  api.get('/admin/analytics/orders', { params: { from, to } }).then(r => r.data);

export const getTopProducts = (from: string, to: string, limit = 20) =>
  api.get('/admin/analytics/top-products', { params: { from, to, limit } }).then(r => r.data);

export const getMonthlyCompare = () =>
  api.get('/admin/analytics/monthly-compare').then(r => r.data);

export const getProductConversion = (from: string, to: string) =>
  api.get('/admin/analytics/product-conversion', { params: { from, to } }).then(r => r.data);

export const getHourStats = (from?: string, to?: string) =>
  api.get('/admin/analytics/hours', { params: { from, to } }).then(r => r.data);
