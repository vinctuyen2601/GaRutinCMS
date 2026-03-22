import { useState } from 'react';
import { Form, Input, Button, Alert, Card, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '../services';
import { getApiError } from '@/lib/error';

const { Title } = Typography;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      const res = await login(values);
      authLogin(res.access_token, res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiError(err, 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <Card style={{ width: 380 }}>
        <div className="text-center mb-6">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐦</div>
          <Title level={3} className="!mb-1">GaRutin CMS</Title>
          <p className="text-gray-500 text-sm">Đăng nhập quản trị</p>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" showIcon />}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="admin@garutin.vn" size="large" />
          </Form.Item>

          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}
