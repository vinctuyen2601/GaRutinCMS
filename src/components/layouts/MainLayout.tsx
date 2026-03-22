import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography, theme } from 'antd';
import {
  DashboardOutlined, ShoppingOutlined, FileTextOutlined,
  AppstoreOutlined, UnorderedListOutlined, PictureOutlined,
  SettingOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const { Sider, Header, Content, Footer } = Layout;
const { Text } = Typography;

const MENU_ITEMS = [
  { key: '/dashboard',   icon: <DashboardOutlined />,     label: 'Dashboard' },
  { key: '/products',    icon: <ShoppingOutlined />,      label: 'Sản phẩm' },
  { key: '/posts',       icon: <FileTextOutlined />,      label: 'Bài viết' },
  { key: '/categories',  icon: <AppstoreOutlined />,      label: 'Danh mục' },
  { key: '/orders',      icon: <UnorderedListOutlined />, label: 'Đơn hàng' },
  { key: '/media',       icon: <PictureOutlined />,       label: 'Media' },
  { key: '/site-config', icon: <SettingOutlined />,       label: 'Cài đặt' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { token } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedKey = MENU_ITEMS.find((i) => location.pathname.startsWith(i.key))?.key ?? '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: '#14532d', height: '100vh', position: 'sticky', top: 0, left: 0, overflow: 'auto' }}
      >
        <div
          className="flex items-center justify-center py-4 px-3 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          {collapsed ? (
            <img src="/favicon.svg" alt="GaRutin" style={{ width: 32, height: 32 }} />
          ) : (
            <img src="/logo.svg" alt="GaRutin" style={{ height: 38, maxWidth: 180 }} />
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          items={MENU_ITEMS}
          style={{ background: '#14532d', borderRight: 0 }}
        />

        {!collapsed && (
          <div className="absolute bottom-4 left-0 right-0 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2">
              <Avatar style={{ background: token.colorPrimary }}>{user?.email?.[0]?.toUpperCase()}</Avatar>
              <Text className="text-white text-sm truncate">{user?.email}</Text>
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        <Header
          className="flex items-center justify-between"
          style={{ background: '#fff', borderBottom: `1px solid ${token.colorBorderSecondary}`, padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger>
            Đăng xuất
          </Button>
        </Header>

        <Content style={{ padding: 24, minWidth: 0 }}>
          {children}
        </Content>

        <Footer className="text-center text-gray-400 text-sm py-3">
          GaRutin CMS © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
