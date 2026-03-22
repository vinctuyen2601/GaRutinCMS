import { useEffect, useState } from 'react';
import {
  Card, Form, Input, InputNumber, Select, Switch, Button, Space,
  message, Typography, Divider, Alert, Tag, Tooltip, Upload, Row, Col,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, ThunderboltOutlined,
  RocketOutlined, BulbOutlined, CheckCircleOutlined, UploadOutlined, StarOutlined,
} from '@ant-design/icons';
import { analyzeProduct } from '@/lib/content-analyzer';
import type { AnalysisResult } from '@/lib/content-analyzer';
import ScorePanel from '@/components/ScorePanel';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import type { CreateProductPayload } from '../types';
import {
  getProducts, createProduct, updateProduct,
  aiGenerateDescription, aiOptimizeProductSeo, aiImproveDescription,
} from '../services';
import { uploadMedia } from '../../media/services';
import MediaPicker from '../../media/components/MediaPicker';
import { getApiError } from '@/lib/error';
import api from '@/lib/axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const fetchCategories = () => api.get('/categories').then((r) => r.data);

export default function ProductFormPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [aiLoading, setAiLoading] = useState<'generate' | 'seo' | 'improve' | null>(null);
  const [seoSuggestions, setSeoSuggestions] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [scoreResult, setScoreResult] = useState<AnalysisResult | null>(null);

  const handleScore = () => {
    const values = form.getFieldsValue();
    setScoreResult(analyzeProduct(values));
  };

  const { data: products = [] } = useSWR(isEdit ? 'admin-products' : null, getProducts);
  const { data: categories = [] } = useSWR('categories', fetchCategories);

  useEffect(() => {
    if (isEdit && products.length > 0) {
      const target = products.find((p: { id: string }) => p.id === id);
      if (target) form.setFieldsValue(target);
    }
  }, [isEdit, products, id, form]);

  const onFinish = async (values: CreateProductPayload) => {
    try {
      if (isEdit && id) {
        await updateProduct(id, values);
        message.success('Đã cập nhật sản phẩm');
      } else {
        await createProduct(values);
        message.success('Đã tạo sản phẩm mới');
      }
      navigate('/products');
    } catch (err) {
      message.error(getApiError(err, 'Có lỗi xảy ra'));
    }
  };

  const handleGenerate = async () => {
    const values = form.getFieldsValue();
    if (!values.name) {
      message.warning('Nhập tên sản phẩm trước');
      return;
    }
    setAiLoading('generate');
    try {
      const catName = categories.find((c: { id: string; name: string }) => c.id === values.categoryId)?.name;
      const result = await aiGenerateDescription({
        name: values.name,
        category: catName,
        price: values.price,
        weightPerUnit: values.weightPerUnit,
        unit: values.unit,
      });
      form.setFieldsValue({
        description: result.description,
        slug: result.slug,
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
      });
      message.success('AI đã tạo mô tả xong!');
    } catch (err) {
      message.error(getApiError(err, 'AI tạo mô tả thất bại'));
    } finally {
      setAiLoading(null);
    }
  };

  const handleOptimizeSeo = async () => {
    const values = form.getFieldsValue();
    if (!values.name) {
      message.warning('Cần có tên sản phẩm trước khi tối ưu SEO');
      return;
    }
    setAiLoading('seo');
    setSeoSuggestions([]);
    try {
      const result = await aiOptimizeProductSeo({
        name: values.name,
        description: values.description,
        seoTitle: values.seoTitle,
        seoDescription: values.seoDescription,
        slug: values.slug,
      });
      form.setFieldsValue({
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        slug: result.slug,
      });
      setSeoSuggestions(result.suggestions ?? []);
      message.success('Đã tối ưu SEO!');
    } catch (err) {
      message.error(getApiError(err, 'Tối ưu SEO thất bại'));
    } finally {
      setAiLoading(null);
    }
  };

  const handleImprove = async () => {
    const values = form.getFieldsValue();
    if (!values.name || !values.description) {
      message.warning('Cần có tên và mô tả sản phẩm trước khi cải thiện');
      return;
    }
    setAiLoading('improve');
    setImprovements([]);
    try {
      const catName = categories.find((c: { id: string; name: string }) => c.id === values.categoryId)?.name;
      const result = await aiImproveDescription({
        name: values.name,
        description: values.description,
        category: catName,
      });
      form.setFieldsValue({ description: result.description });
      setImprovements(result.improvements ?? []);
      message.success('Đã cải thiện mô tả!');
    } catch (err) {
      message.error(getApiError(err, 'Cải thiện mô tả thất bại'));
    } finally {
      setAiLoading(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const res = await uploadMedia(file);
      const current: string[] = form.getFieldValue('images') ?? [];
      form.setFieldValue('images', [...current, res.url]);
      message.success('Đã upload ảnh');
    } catch (err) {
      message.error(getApiError(err, 'Upload thất bại'));
    } finally {
      setImageUploading(false);
    }
    return false;
  };

  const handlePickImage = (url: string) => {
    const current: string[] = form.getFieldValue('images') ?? [];
    if (!current.includes(url)) {
      form.setFieldValue('images', [...current, url]);
    } else {
      message.info('Ảnh này đã có trong danh sách');
    }
  };

  const categoryOptions = Array.isArray(categories)
    ? categories.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>Quay lại</Button>
        <Title level={4} className="!mb-0">{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</Title>
      </div>

      {/* AI Toolbar */}
      <Card size="small" className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
        <div className="flex flex-wrap items-center gap-2">
          <Text strong className="text-green-700">
            <ThunderboltOutlined /> AI Hỗ trợ:
          </Text>
          <Tooltip title="Tạo mô tả, slug và SEO từ tên sản phẩm">
            <Button
              type="primary"
              size="small"
              icon={<RocketOutlined />}
              loading={aiLoading === 'generate'}
              onClick={handleGenerate}
            >
              Tạo mô tả
            </Button>
          </Tooltip>
          <Tooltip title="Tối ưu SEO title, description, slug">
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              loading={aiLoading === 'seo'}
              onClick={handleOptimizeSeo}
            >
              Tối ưu SEO
            </Button>
          </Tooltip>
          <Tooltip title="Cải thiện mô tả hiện có">
            <Button
              size="small"
              icon={<BulbOutlined />}
              loading={aiLoading === 'improve'}
              onClick={handleImprove}
            >
              Cải thiện mô tả
            </Button>
          </Tooltip>
          <div className="ml-auto">
            <Button
              size="small"
              icon={<StarOutlined />}
              onClick={handleScore}
            >
              Tính điểm
            </Button>
          </div>
        </div>
      </Card>

      {/* SEO Suggestions */}
      {seoSuggestions.length > 0 && (
        <Alert
          type="info"
          icon={<CheckCircleOutlined />}
          message="Gợi ý SEO từ AI"
          description={
            <ul className="mt-1 list-disc pl-4 space-y-1">
              {seoSuggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          }
          closable
          onClose={() => setSeoSuggestions([])}
        />
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <Alert
          type="success"
          icon={<CheckCircleOutlined />}
          message="Cải thiện đã thực hiện"
          description={
            <div className="mt-1 flex flex-wrap gap-1">
              {improvements.map((imp, i) => <Tag key={i} color="green">{imp}</Tag>)}
            </div>
          }
          closable
          onClose={() => setImprovements([])}
        />
      )}

      <Row gutter={16} align="top">
      <Col xs={24} lg={scoreResult ? 17 : 24}>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ unit: 'con', stockStatus: 'in_stock', isActive: true, isFeatured: false, sortOrder: 0, images: [] }}
        >
          <Divider titlePlacement="left">Thông tin cơ bản</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}>
              <Input
                placeholder="Gà Rutin đực trưởng thành"
                onChange={(e) => {
                  if (!isEdit) form.setFieldValue('slug', slugify(e.target.value));
                }}
              />
            </Form.Item>
            <Form.Item label="Slug (URL)" name="slug" rules={[{ required: true }]}>
              <Input placeholder="ga-rutin-duc-truong-thanh" />
            </Form.Item>
            <Form.Item label="Giá gốc (₫)" name="price" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={1000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
            </Form.Item>
            <Form.Item label="Giá sale (₫)" name="salePrice">
              <InputNumber style={{ width: '100%' }} min={0} step={1000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
            </Form.Item>
            <Form.Item label="Danh mục" name="categoryId">
              <Select options={categoryOptions} placeholder="Chọn danh mục" allowClear />
            </Form.Item>
            <Form.Item label="Đơn vị" name="unit">
              <Input placeholder="con" />
            </Form.Item>
            <Form.Item label="Trọng lượng/đơn vị" name="weightPerUnit">
              <Input placeholder="150-180g" />
            </Form.Item>
            <Form.Item label="Tình trạng kho" name="stockStatus">
              <Select options={[
                { value: 'in_stock',     label: 'Còn hàng'  },
                { value: 'out_of_stock', label: 'Hết hàng'  },
                { value: 'pre_order',    label: 'Đặt trước' },
              ]} />
            </Form.Item>
          </div>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={5} placeholder="Mô tả chi tiết sản phẩm..." />
          </Form.Item>

          {/* Images */}
          <Form.Item label="Ảnh sản phẩm" name="images">
            <Form.Item noStyle shouldUpdate>
              {() => {
                const images: string[] = form.getFieldValue('images') ?? [];
                return (
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {images.map((url: string, i: number) => (
                        <div key={i} className="relative group" style={{ width: 90, height: 90 }}>
                          <img
                            src={url}
                            alt={`img-${i}`}
                            style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
                          />
                          <Button
                            danger
                            size="small"
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"
                            style={{ padding: '0 4px', minWidth: 'auto', lineHeight: 1 }}
                            onClick={() => {
                              const next = images.filter((_, idx) => idx !== i);
                              form.setFieldValue('images', next);
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Space>
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={handleImageUpload}
                        disabled={imageUploading}
                      >
                        <Button size="small" icon={<UploadOutlined />} loading={imageUploading}>
                          Upload ảnh
                        </Button>
                      </Upload>
                      <MediaPicker onSelect={handlePickImage} />
                    </Space>
                  </div>
                );
              }}
            </Form.Item>
          </Form.Item>

          <Divider titlePlacement="left">SEO</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item label="SEO Title" name="seoTitle" help="Tối ưu 50–60 ký tự">
              <Input showCount maxLength={70} />
            </Form.Item>
            <Form.Item label="SEO Description" name="seoDescription" help="Tối ưu 150–160 ký tự">
              <TextArea rows={2} showCount maxLength={180} />
            </Form.Item>
          </div>

          <Divider titlePlacement="left">Cài đặt</Divider>
          <div className="flex gap-6">
            <Form.Item label="Hiển thị" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Nổi bật" name="isFeatured" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Thứ tự" name="sortOrder">
              <InputNumber min={0} />
            </Form.Item>
          </div>

          <Form.Item className="mt-4">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              </Button>
              <Button onClick={() => navigate('/products')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      </Col>
      {scoreResult && (
        <Col xs={24} lg={7}>
          <div className="sticky top-4">
            <ScorePanel result={scoreResult} title="Điểm sản phẩm" />
          </div>
        </Col>
      )}
      </Row>
    </div>
  );
}
