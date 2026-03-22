import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/components/layouts/MainLayout';
import PrivateRoute from '@/routes/PrivateRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

const LoginPage           = lazy(() => import('@/features/auth/components/LoginPage'));
const DashboardPage       = lazy(() => import('@/features/dashboard/components/DashboardPage'));
const ProductsPage        = lazy(() => import('@/features/products/components/ProductsPage'));
const ProductFormPage     = lazy(() => import('@/features/products/components/ProductFormPage'));
const PostsPage           = lazy(() => import('@/features/posts/components/PostsPage'));
const PostFormPage        = lazy(() => import('@/features/posts/components/PostFormPage'));
const CategoriesPage      = lazy(() => import('@/features/categories/components/CategoriesPage'));
const OrdersPage          = lazy(() => import('@/features/orders/components/OrdersPage'));
const OrderDetailPage     = lazy(() => import('@/features/orders/components/OrderDetailPage'));
const MediaPage           = lazy(() => import('@/features/media/components/MediaPage'));
const SiteConfigPage      = lazy(() => import('@/features/site-config/components/SiteConfigPage'));

const Loader = () => (
  <div className="flex justify-center items-center h-64">
    <Spin size="large" />
  </div>
);

function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <MainLayout>{children}</MainLayout>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"         element={<PrivateLayout><DashboardPage /></PrivateLayout>} />
          <Route path="/products"          element={<PrivateLayout><ProductsPage /></PrivateLayout>} />
          <Route path="/products/new"      element={<PrivateLayout><ProductFormPage /></PrivateLayout>} />
          <Route path="/products/:id/edit" element={<PrivateLayout><ProductFormPage /></PrivateLayout>} />
          <Route path="/posts"             element={<PrivateLayout><PostsPage /></PrivateLayout>} />
          <Route path="/posts/new"         element={<PrivateLayout><PostFormPage /></PrivateLayout>} />
          <Route path="/posts/:id/edit"    element={<PrivateLayout><PostFormPage /></PrivateLayout>} />
          <Route path="/categories"        element={<PrivateLayout><CategoriesPage /></PrivateLayout>} />
          <Route path="/orders"            element={<PrivateLayout><OrdersPage /></PrivateLayout>} />
          <Route path="/orders/:id"        element={<PrivateLayout><OrderDetailPage /></PrivateLayout>} />
          <Route path="/media"             element={<PrivateLayout><MediaPage /></PrivateLayout>} />
          <Route path="/site-config"       element={<PrivateLayout><SiteConfigPage /></PrivateLayout>} />
          <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
