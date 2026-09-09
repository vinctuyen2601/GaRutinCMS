import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography, theme, Drawer, Grid, Space } from 'antd';
import {
  DashboardOutlined,
  BellOutlined,
  StarOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  LinkOutlined,
  RobotOutlined,
  LayoutOutlined,
  FundOutlined,
  KeyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const { Sider, Header, Content, Footer } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

// Flat list — used for the collapsed/mobile sidebar and for selectedKey lookup
const LEAF_ITEMS = [
  { key: '/dashboard',   icon: <DashboardOutlined />,     label: 'Dashboard' },
  { key: '/analytics',   icon: <BarChartOutlined />,      label: 'Phân tích' },
  { key: '/reports',     icon: <FundOutlined />,          label: 'Báo cáo' },
  { key: '/utm-builder', icon: <LinkOutlined />,          label: 'Link quảng cáo' },
  { key: '/orders',      icon: <UnorderedListOutlined />, label: 'Đơn hàng' },
  { key: '/customers',   icon: <TeamOutlined />,          label: 'Khách hàng' },
  { key: '/products',    icon: <ShoppingOutlined />,      label: 'Sản phẩm' },
  { key: '/categories',  icon: <AppstoreOutlined />,      label: 'Danh mục' },
  { key: '/posts',       icon: <FileTextOutlined />,      label: 'Bài viết' },
  { key: '/keywords',    icon: <KeyOutlined />,           label: 'Từ khoá & SEO' },
  { key: '/media',       icon: <PictureOutlined />,       label: 'Media' },
  { key: '/gallery',     icon: <VideoCameraOutlined />,   label: 'Ảnh & video' },
  { key: '/reviews',     icon: <StarOutlined />,          label: 'Đánh giá' },
  { key: '/notifications', icon: <BellOutlined />,        label: 'Thông báo' },
  { key: '/post-templates', icon: <LayoutOutlined />,      label: 'Cấu trúc bài' },
  { key: '/ai-prompts',  icon: <RobotOutlined />,         label: 'Prompt AI' },
  { key: '/site-config', icon: <SettingOutlined />,       label: 'Cài đặt' },
];

// Grouped list — used for the expanded sidebar
const MENU_GROUPED = [
  {
    type: 'group' as const,
    label: 'Tổng quan',
    children: [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/analytics', icon: <BarChartOutlined />,  label: 'Phân tích' },
      { key: '/reports',   icon: <FundOutlined />,      label: 'Báo cáo' },
      { key: '/utm-builder', icon: <LinkOutlined />,    label: 'Link quảng cáo' },
    ],
  },
  {
    type: 'group' as const,
    label: 'Bán hàng',
    children: [
      { key: '/orders',    icon: <UnorderedListOutlined />, label: 'Đơn hàng' },
      { key: '/customers', icon: <TeamOutlined />,          label: 'Khách hàng' },
      { key: '/reviews',   icon: <StarOutlined />,         label: 'Đánh giá' },
    ],
  },
  {
    type: 'group' as const,
    label: 'Nội dung',
    children: [
      { key: '/products',   icon: <ShoppingOutlined />, label: 'Sản phẩm' },
      { key: '/categories', icon: <AppstoreOutlined />, label: 'Danh mục' },
      { key: '/posts',      icon: <FileTextOutlined />, label: 'Bài viết' },
      { key: '/keywords',   icon: <KeyOutlined />,      label: 'Từ khoá & SEO' },
      { key: '/media',      icon: <PictureOutlined />,  label: 'Media' },
      { key: '/gallery',    icon: <VideoCameraOutlined />, label: 'Ảnh & video' },
    ],
  },
  {
    type: 'group' as const,
    label: 'Hệ thống',
    children: [
      { key: '/notifications', icon: <BellOutlined />, label: 'Thông báo' },
      { key: '/post-templates', icon: <LayoutOutlined />, label: 'Cấu trúc bài' },
      { key: '/ai-prompts',  icon: <RobotOutlined />,   label: 'Prompt AI' },
      { key: '/site-config', icon: <SettingOutlined />, label: 'Cài đặt' },
    ],
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { token } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedKey =
    LEAF_ITEMS.find((i) => location.pathname.startsWith(i.key))?.key ?? '/dashboard';

  const menuContent = (showFull: boolean) => (
    <>
      <div
        className="flex items-center justify-center py-4 px-3 cursor-pointer"
        onClick={() => {
          navigate('/dashboard');
          if (isMobile) setMobileOpen(false);
        }}
      >
        {showFull ? (
          <img src="/logo.svg" alt="GaRutin" style={{ height: 38, maxWidth: 180 }} />
        ) : (
          <img src="/favicon.svg" alt="GaRutin" style={{ width: 32, height: 32 }} />
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          navigate(key);
          if (isMobile) setMobileOpen(false);
        }}
        items={showFull ? MENU_GROUPED : LEAF_ITEMS}
        style={{ background: '#14532d', borderRight: 0 }}
      />

    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          placement="left"
          width={220}
          styles={{
            body: { padding: 0, background: '#14532d', position: 'relative' },
            header: { display: 'none' },
          }}
        >
          {menuContent(true)}
        </Drawer>
      ) : (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={220}
          style={{
            background: '#14532d',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
            overflow: 'auto',
          }}
        >
          {menuContent(!collapsed)}
        </Sider>
      )}

      <Layout>
        <Header
          className="flex items-center justify-between"
          style={{
            background: '#fff',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuUnfoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() => (isMobile ? setMobileOpen(true) : setCollapsed(!collapsed))}
          />
          {/* Profile chuyển từ thanh bên lên đây.
              Ở thanh bên nó dùng `absolute bottom-4`, tức nằm ngoài luồng bố
              cục — menu dài thêm một mục là nó đè lên mục cuối, và lỗi chỉ lộ
              ra khi danh sách menu đủ dài. Trên header thì nó nằm trong luồng
              flex, không bao giờ chồng lên gì. */}
          <Space size={12}>
            <Space size={8}>
              <Avatar size="small" style={{ background: token.colorPrimary }}>
                {user?.email?.[0]?.toUpperCase()}
              </Avatar>
              {/* Ẩn email trên điện thoại: header hẹp, để lại thì tên bị cắt
                  cụt giữa chừng, xấu hơn là không hiện. Avatar vẫn còn để biết
                  đang đăng nhập bằng tài khoản nào. */}
              {!isMobile && (
                <Text className="text-sm" style={{ maxWidth: 220 }} ellipsis>
                  {user?.email}
                </Text>
              )}
            </Space>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger>
              {!isMobile && 'Đăng xuất'}
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: isMobile ? 12 : 24, minWidth: 0 }}>{children}</Content>

        <Footer className="text-center text-gray-400 text-sm py-3">
          GaRutin CMS © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
