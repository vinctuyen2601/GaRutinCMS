import { Card, Col, Row, Statistic, Spin, Alert } from 'antd';
import { ShoppingCartOutlined, ClockCircleOutlined, ShoppingOutlined, FileTextOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import api from '@/lib/axios';

const fetchOrders = () => api.get('/admin/orders?limit=1000').then((r) => r.data);
const fetchProducts = () => api.get('/admin/products').then((r) => r.data);
const fetchPosts = () => api.get('/admin/posts').then((r) => r.data);

export default function DashboardPage() {
  const { data: orders = [], isLoading: ordersLoading } = useSWR('dashboard-orders', fetchOrders);
  const { data: products = [], isLoading: productsLoading } = useSWR('dashboard-products', fetchProducts);
  const { data: posts = [], isLoading: postsLoading } = useSWR('dashboard-posts', fetchPosts);

  const pendingOrders = Array.isArray(orders) ? orders.filter((o: { status: string }) => o.status === 'pending').length : 0;
  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalPosts = Array.isArray(posts) ? posts.length : 0;

  if (ordersLoading || productsLoading || postsLoading) {
    return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn chờ xử lý"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: pendingOrders > 0 ? '#f59e0b' : '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sản phẩm"
              value={totalProducts}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bài viết"
              value={totalPosts}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {pendingOrders > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`Có ${pendingOrders} đơn hàng chờ xử lý`}
          description="Vào mục Đơn hàng để xem và cập nhật trạng thái."
        />
      )}
    </div>
  );
}
