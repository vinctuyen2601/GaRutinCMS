import { useEffect, useState } from 'react';
import {
  Card, Form, Input, InputNumber, Select, Switch, Button, Space,
  message, Typography, Divider, Alert, Tag, Tooltip, Upload, Row, Col,
  Table, Rate, Popconfirm, Modal, Image,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, ThunderboltOutlined,
  RocketOutlined, BulbOutlined, CheckCircleOutlined, UploadOutlined, PlayCircleFilled, StarOutlined,
  PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { analyzeProduct } from '@/lib/content-analyzer';
import type { AnalysisResult } from '@/lib/content-analyzer';
import ScorePanel from '@/components/ScorePanel';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import type { CreateProductPayload } from '../types';
import {
  getProducts, createProduct, updateProduct,
  aiGenerateDescription, aiOptimizeProductSeo, aiImproveDescription,
} from '../services';
import { uploadMedia } from '../../media/services';
import {
  getReviewsByProduct, createReview, updateReview, deleteReview,
} from '@/features/reviews/services';
import type { Review } from '@/features/reviews/services';
import MediaPicker from '../../media/components/MediaPicker';
import { getApiError } from '@/lib/error';
import api from '@/lib/axios';
import { UPLOAD_MAX_MB, quaLon } from '@/lib/upload';
import { youtubeId } from '@/features/gallery/lib';

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
  const { hash } = useLocation();
  const isEdit = Boolean(id);

  const [aiLoading, setAiLoading] = useState<'generate' | 'seo' | 'improve' | null>(null);
  const [seoSuggestions, setSeoSuggestions] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [linkVideo, setLinkVideo] = useState('');
  const [scoreResult, setScoreResult] = useState<AnalysisResult | null>(null);

  const handleScore = () => {
    const values = form.getFieldsValue();
    setScoreResult(analyzeProduct(values));
  };

  const { data: products = [] } = useSWR(isEdit ? 'admin-products' : null, getProducts);

  // ── Đánh giá của sản phẩm này ──────────────────────────────────────────
  const { data: danhGia = [], mutate: napLaiDanhGia, isLoading: dangTaiDanhGia } = useSWR(
    isEdit && id ? ['product-reviews', id] : null,
    () => getReviewsByProduct(id!),
  );
  const [formDanhGia] = Form.useForm();
  const [moFormDanhGia, setMoFormDanhGia] = useState(false);
  const [dangLuuDanhGia, setDangLuuDanhGia] = useState(false);

  const luuDanhGia = async () => {
    const v = await formDanhGia.validateFields();
    setDangLuuDanhGia(true);
    try {
      await createReview({ productId: id!, ...v });
      message.success('Đã thêm đánh giá');
      setMoFormDanhGia(false);
      formDanhGia.resetFields();
      napLaiDanhGia();
    } catch (e) {
      message.error(getApiError(e, 'Thêm thất bại'));
    } finally {
      setDangLuuDanhGia(false);
    }
  };

  const doiTrangThaiDanhGia = async (r: Review, duyet: boolean) => {
    try {
      await updateReview(r.id, { isApproved: duyet });
      napLaiDanhGia();
    } catch (e) {
      message.error(getApiError(e, 'Không cập nhật được'));
    }
  };

  /**
   * Mở bằng đường dẫn kết thúc bằng #reviews thì cuộn thẳng tới mục Đánh giá.
   *
   * Trình duyệt tự cuộn tới neo ngay lúc tải, nhưng lúc đó bảng đánh giá còn
   * đang tải nên nó chưa chiếm chỗ — cuộn xong thì nội dung bên trên đẩy neo
   * đi mất. Chờ tới khi có dữ liệu rồi mới cuộn.
   */
  useEffect(() => {
    if (hash !== '#reviews' || !isEdit || dangTaiDanhGia) return;
    const el = document.getElementById('reviews');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, isEdit, dangTaiDanhGia, danhGia.length]);

  const xoaDanhGia = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      napLaiDanhGia();
    } catch (e) {
      message.error(getApiError(e, 'Xoá thất bại'));
    }
  };
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


  /**
   * Tải clip ngắn lên thẳng từ form sản phẩm.
   *
   * Chặn dung lượng ngay tại trình duyệt thay vì để máy chủ từ chối: video là
   * tệp nặng, để người dùng chờ tải xong vài chục megabyte rồi mới báo "quá
   * lớn" là phí thời gian của họ và phí băng thông.
   */
  /**
   * Thêm một video vào danh sách, bỏ qua nếu đã có.
   *
   * Trùng lặp không báo lỗi mà chỉ lặng lẽ không thêm: chủ trại dán nhầm hai
   * lần cùng một link là chuyện thường, mà một video hiện hai lần trong
   * gallery thì trông như lỗi.
   */
  const themVideo = (url: string) => {
    const sach = url.trim();
    if (!sach) return;
    const hienCo: string[] = form.getFieldValue('videos') ?? [];
    if (hienCo.includes(sach)) return;
    form.setFieldValue('videos', [...hienCo, sach]);
  };

  const handleVideoUpload = async (file: File) => {
    const loiKichThuoc = quaLon(file);
    if (loiKichThuoc) {
      message.error(loiKichThuoc);
      return false;
    }
    setVideoUploading(true);
    try {
      const res = await uploadMedia(file);
      themVideo(res.url);
      message.success('Đã upload video');
    } catch (err) {
      message.error(getApiError(err, 'Upload thất bại'));
    } finally {
      setVideoUploading(false);
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
              <InputNumber style={{ width: '100%' }} min={0} step={10000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => (Number(v?.replace(/\./g, '') ?? 0) as 0)} />
            </Form.Item>
            <Form.Item label="Giá sale (₫)" name="salePrice">
              <InputNumber style={{ width: '100%' }} min={0} step={10000} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => (Number(v?.replace(/\./g, '') ?? 0) as 0)} />
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

          {/* Videos */}
          <Form.Item
            label="Video sản phẩm"
            name="videos"
            extra="Video hiện TRƯỚC ảnh ở trang sản phẩm. Dán link YouTube hoặc tải clip ngắn lên."
          >
            <Form.Item noStyle shouldUpdate>
              {() => {
                const videos: string[] = form.getFieldValue('videos') ?? [];
                return (
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {videos.map((url: string, i: number) => {
                        const yt = youtubeId(url);
                        return (
                          <div key={i} className="relative group" style={{ width: 90, height: 90 }}>
                            {/* YouTube có ảnh đại diện sẵn; tệp tự lưu thì để trình duyệt
                                dựng khung hình đầu, preload="metadata" nên không tải cả tệp. */}
                            {yt ? (
                              <img
                                src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`}
                                alt={`video-${i}`}
                                style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
                              />
                            ) : (
                              <video
                                src={url}
                                muted
                                preload="metadata"
                                style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', background: '#000' }}
                              />
                            )}
                            <PlayCircleFilled
                              className="absolute text-white pointer-events-none"
                              style={{ left: 33, top: 33, fontSize: 24, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }}
                            />
                            <Button
                              danger
                              size="small"
                              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100"
                              style={{ padding: '0 4px', minWidth: 'auto', lineHeight: 1 }}
                              onClick={() => form.setFieldValue('videos', videos.filter((_, idx) => idx !== i))}
                            >
                              ✕
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <Space.Compact style={{ width: '100%', maxWidth: 460 }}>
                      <Input
                        value={linkVideo}
                        onChange={(e) => setLinkVideo(e.target.value)}
                        onPressEnter={() => { themVideo(linkVideo); setLinkVideo(''); }}
                        placeholder="Dán link YouTube rồi bấm Thêm"
                      />
                      <Button onClick={() => { themVideo(linkVideo); setLinkVideo(''); }}>Thêm</Button>
                    </Space.Compact>
                    <div>
                      <Space>
                        <Upload accept="video/*" showUploadList={false} beforeUpload={handleVideoUpload} disabled={videoUploading}>
                          <Button size="small" icon={<UploadOutlined />} loading={videoUploading}>
                            Upload video
                          </Button>
                        </Upload>
                        <MediaPicker kind="video" onSelect={themVideo} name={form.getFieldValue('name')} />
                      </Space>
                    </div>
                  </div>
                );
              }}
            </Form.Item>
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
                      <MediaPicker onSelect={handlePickImage} name={form.getFieldValue('name')} />
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
            <Form.Item label="Thứ tự" name="sortOrder" extra="Số càng lớn, sản phẩm càng hiển thị lên đầu">
              <InputNumber min={0} />
            </Form.Item>
          </div>

          {/* Đánh giá — chỉ khi đang sửa sản phẩm đã tồn tại; sản phẩm chưa lưu
              thì chưa có id để gắn đánh giá vào. Neo #reviews để thông báo
              "đánh giá mới" mở thẳng tới đây. */}
          {isEdit && (
            <>
              <div id="reviews" style={{ scrollMarginTop: 72 }} />
              <Divider titlePlacement="left">
                <StarOutlined className="mr-1" />
                Đánh giá ({danhGia.length})
              </Divider>
              <div className="mb-3">
                <Button icon={<PlusOutlined />} type="dashed" onClick={() => setMoFormDanhGia(true)}>
                  Thêm đánh giá
                </Button>
                <span className="text-xs text-gray-400 ml-3">
                  Dùng để chép lại lời khen khách nhắn qua Zalo hoặc điện thoại — đánh giá nhập ở đây được duyệt luôn.
                </span>
              </div>
              <Table<Review>
                dataSource={danhGia}
                rowKey="id"
                loading={dangTaiDanhGia}
                size="small"
                scroll={{ x: 700 }}
                pagination={{ pageSize: 10, showTotal: t => `${t} đánh giá` }}
                locale={{ emptyText: 'Sản phẩm này chưa có đánh giá nào' }}
                columns={[
                  {
                    title: 'Khách hàng',
                    dataIndex: 'customerName',
                    width: 140,
                    render: (v: string, r: Review) => (
                      <div>
                        <div className="font-semibold text-sm">{v}</div>
                        {r.phone && <div className="text-xs text-gray-400">{r.phone}</div>}
                      </div>
                    ),
                  },
                  {
                    title: 'Sao',
                    dataIndex: 'rating',
                    width: 120,
                    render: (v: number) => <Rate disabled value={v} style={{ fontSize: 13 }} />,
                  },
                  {
                    title: 'Nội dung',
                    dataIndex: 'comment',
                    render: (v: string, r: Review) => (
                      <div>
                        <div className="text-sm whitespace-pre-line">{v || <span className="text-gray-400">—</span>}</div>
                        {(r.images?.length || r.video) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.images?.map((u, i) => (
                              <Image key={i} src={u} width={44} height={44} style={{ objectFit: 'cover', borderRadius: 4 }} />
                            ))}
                            {r.video && (
                              <video src={r.video} controls preload="metadata"
                                     style={{ width: 72, height: 44, borderRadius: 4, background: '#000' }} />
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: 'Ngày',
                    dataIndex: 'createdAt',
                    width: 100,
                    render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'isApproved',
                    width: 110,
                    render: (v: boolean) => <Tag color={v ? 'green' : 'gold'}>{v ? 'Đã duyệt' : 'Chờ duyệt'}</Tag>,
                  },
                  {
                    title: '',
                    key: 'thao-tac',
                    width: 110,
                    render: (_: unknown, r: Review) => (
                      <Space size={4}>
                        {r.isApproved ? (
                          <Tooltip title="Gỡ khỏi web">
                            <Button size="small" onClick={() => doiTrangThaiDanhGia(r, false)}>Gỡ</Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Duyệt để hiện trên web">
                            <Button size="small" type="primary" onClick={() => doiTrangThaiDanhGia(r, true)}>Duyệt</Button>
                          </Tooltip>
                        )}
                        <Popconfirm title="Xoá đánh giá này?" okText="Xoá" cancelText="Hủy"
                                    okButtonProps={{ danger: true }} onConfirm={() => xoaDanhGia(r.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            </>
          )}

          <Form.Item className="mt-4">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              </Button>
              <Button onClick={() => navigate('/products')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>

        <Modal
          title="Thêm đánh giá"
          open={moFormDanhGia}
          onCancel={() => setMoFormDanhGia(false)}
          onOk={luuDanhGia}
          confirmLoading={dangLuuDanhGia}
          okText="Thêm"
          cancelText="Hủy"
        >
          <Form form={formDanhGia} layout="vertical" initialValues={{ rating: 5 }}>
            <Form.Item label="Tên khách" name="customerName"
                       rules={[{ required: true, message: 'Nhập tên khách' }]}>
              <Input placeholder="VD: Anh Tuấn" />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone">
              <Input placeholder="Không bắt buộc" />
            </Form.Item>
            <Form.Item label="Số sao" name="rating" rules={[{ required: true }]}>
              <Rate />
            </Form.Item>
            <Form.Item label="Nội dung" name="comment"
                       rules={[{ required: true, min: 10, message: 'Nhận xét cần ít nhất 10 ký tự' }]}>
              <Input.TextArea rows={4} placeholder="Chép lại nguyên văn lời khách nhắn" />
            </Form.Item>
          </Form>
        </Modal>
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
