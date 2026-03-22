import { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Typography,
  Divider,
  Modal,
  Alert,
  Tag,
  Tooltip,
  Upload,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  StarOutlined,
  LinkOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { analyzePost } from '@/lib/content-analyzer';
import type { AnalysisResult } from '@/lib/content-analyzer';
import ScorePanel from '@/components/ScorePanel';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import type { CreatePostPayload } from '../types';
import {
  getPosts,
  createPost,
  updatePost,
  aiGenerateFromUrl,
  aiGenerateContent,
  aiOptimizeSeo,
  aiImproveContent,
} from '../services';
import { uploadMedia } from '../../media/services';
import MediaPicker from '../../media/components/MediaPicker';
import { getApiError } from '@/lib/error';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CATEGORIES = [
  { value: 'nuoi-ga', label: 'Nuôi gà rutin' },
  { value: 'chia-se', label: 'Chia sẻ kinh nghiệm' },
  { value: 'tin-tuc', label: 'Tin tức' },
  { value: 'san-pham', label: 'Sản phẩm' },
  { value: 'suc-khoe', label: 'Sức khỏe gia cầm' },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PostFormPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateCategory, setGenerateCategory] = useState('');
  const [generateKeywords, setGenerateKeywords] = useState('');
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlCategory, setUrlCategory] = useState('');
  const [aiLoading, setAiLoading] = useState<'generate' | 'seo' | 'improve' | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [scoreResult, setScoreResult] = useState<AnalysisResult | null>(null);

  const handleGenerateFromUrl = async () => {
    if (!urlInput.trim()) {
      message.warning('Nhập URL trang web');
      return;
    }
    try { new URL(urlInput.trim()); } catch {
      message.warning('URL không hợp lệ');
      return;
    }
    setAiLoading('generate');
    try {
      const result = await aiGenerateFromUrl({
        url: urlInput.trim(),
        category: urlCategory || undefined,
      });
      form.setFieldsValue({
        title: result.title,
        content: result.content,
        excerpt: result.excerpt,
        slug: result.slug,
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        tags: result.tags,
        category: urlCategory || form.getFieldValue('category'),
      });
      setUrlModalOpen(false);
      setUrlInput('');
      setUrlCategory('');
      message.success('AI đã tạo bài viết từ URL xong!');
    } catch (err) {
      message.error(getApiError(err, 'Tạo từ URL thất bại'));
    } finally {
      setAiLoading(null);
    }
  };

  const handleScore = () => {
    const values = form.getFieldsValue();
    setScoreResult(analyzePost(values));
  };
  const [seoSuggestions, setSeoSuggestions] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);

  const { data: posts = [] } = useSWR(isEdit ? 'admin-posts' : null, getPosts);

  useEffect(() => {
    if (isEdit && posts.length > 0) {
      const target = posts.find((p: { id: string }) => p.id === id);
      if (target) form.setFieldsValue({ ...target, tags: target.tags ?? [] });
    }
  }, [isEdit, posts, id, form]);

  const onFinish = async (values: CreatePostPayload) => {
    try {
      if (isEdit && id) {
        await updatePost(id, values);
        message.success('Đã cập nhật bài viết');
      } else {
        await createPost(values);
        message.success('Đã tạo bài viết mới');
      }
      navigate('/posts');
    } catch (err) {
      message.error(getApiError(err, 'Có lỗi xảy ra'));
    }
  };

  const handleGenerate = async () => {
    if (!generateTopic.trim()) {
      message.warning('Nhập chủ đề bài viết');
      return;
    }
    setAiLoading('generate');
    try {
      const result = await aiGenerateContent({
        topic: generateTopic.trim(),
        category: generateCategory || undefined,
        keywords: generateKeywords
          ? generateKeywords.split(',').map((k) => k.trim()).filter(Boolean)
          : undefined,
      });
      form.setFieldsValue({
        title: result.title,
        content: result.content,
        excerpt: result.excerpt,
        slug: result.slug,
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        tags: result.tags,
        category: generateCategory || form.getFieldValue('category'),
      });
      setGenerateModalOpen(false);
      setGenerateTopic('');
      setGenerateKeywords('');
      message.success('AI đã tạo nội dung xong!');
    } catch (err) {
      message.error(getApiError(err, 'AI tạo nội dung thất bại'));
    } finally {
      setAiLoading(null);
    }
  };

  const handleOptimizeSeo = async () => {
    const values = form.getFieldsValue();
    if (!values.title || !values.content) {
      message.warning('Cần có tiêu đề và nội dung trước khi tối ưu SEO');
      return;
    }
    setAiLoading('seo');
    setSeoSuggestions([]);
    try {
      const result = await aiOptimizeSeo({
        title: values.title,
        content: values.content,
        seoTitle: values.seoTitle,
        seoDescription: values.seoDescription,
        slug: values.slug,
        tags: values.tags,
      });
      form.setFieldsValue({
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        slug: result.slug,
        tags: result.tags,
      });
      setSeoSuggestions(result.suggestions ?? []);
      message.success('Đã tối ưu SEO!');
    } catch (err) {
      message.error(getApiError(err, 'Tối ưu SEO thất bại'));
    } finally {
      setAiLoading(null);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    try {
      const res = await uploadMedia(file);
      form.setFieldValue('coverImage', res.url);
      message.success('Upload ảnh bìa thành công');
    } catch (err) {
      message.error(getApiError(err, 'Upload thất bại'));
    } finally {
      setCoverUploading(false);
    }
    return false;
  };

  const handleImprove = async () => {
    const values = form.getFieldsValue();
    if (!values.title || !values.content) {
      message.warning('Cần có tiêu đề và nội dung trước khi cải thiện');
      return;
    }
    setAiLoading('improve');
    setImprovements([]);
    try {
      const result = await aiImproveContent({
        title: values.title,
        content: values.content,
        category: values.category,
      });
      form.setFieldsValue({
        content: result.content,
        excerpt: result.excerpt,
      });
      setImprovements(result.improvements ?? []);
      message.success('Đã cải thiện nội dung!');
    } catch (err) {
      message.error(getApiError(err, 'Cải thiện nội dung thất bại'));
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/posts')}>
          Quay lại
        </Button>
        <Title level={4} className="!mb-0">
          {isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
        </Title>
      </div>

      {/* AI Toolbar */}
      <Card size="small" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex flex-wrap items-center gap-2">
          <Text strong className="text-blue-700">
            <ThunderboltOutlined /> AI Hỗ trợ:
          </Text>
          <Tooltip title="Tạo bài viết hoàn chỉnh từ chủ đề">
            <Button
              type="primary"
              size="small"
              icon={<RocketOutlined />}
              loading={aiLoading === 'generate'}
              onClick={() => setGenerateModalOpen(true)}
            >
              Tạo nội dung
            </Button>
          </Tooltip>
          <Tooltip title="Đọc nội dung từ URL rồi viết lại thành bài viết GaRutin">
            <Button
              size="small"
              icon={<LinkOutlined />}
              loading={aiLoading === 'generate'}
              onClick={() => setUrlModalOpen(true)}
            >
              Tạo từ URL
            </Button>
          </Tooltip>
          <Tooltip title="Tối ưu SEO title, description, slug, tags">
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              loading={aiLoading === 'seo'}
              onClick={handleOptimizeSeo}
            >
              Tối ưu SEO
            </Button>
          </Tooltip>
          <Tooltip title="Cải thiện chất lượng nội dung">
            <Button
              size="small"
              icon={<BulbOutlined />}
              loading={aiLoading === 'improve'}
              onClick={handleImprove}
            >
              Cải thiện nội dung
            </Button>
          </Tooltip>
          <Button
            size="small"
            icon={<StarOutlined />}
            onClick={handleScore}
          >
            Tính điểm
          </Button>
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
              {seoSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
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
              {improvements.map((imp, i) => (
                <Tag key={i} color="green">
                  {imp}
                </Tag>
              ))}
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
          initialValues={{ status: 'draft', tags: [] }}
        >
          <Divider titlePlacement="left">Nội dung</Divider>
          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
            <Input
              placeholder="Hướng dẫn nuôi gà rutin cho người mới bắt đầu"
              onChange={(e) => {
                if (!isEdit) form.setFieldValue('slug', slugify(e.target.value));
              }}
            />
          </Form.Item>
          <Form.Item label="Slug (URL)" name="slug" rules={[{ required: true }]}>
            <Input placeholder="huong-dan-nuoi-ga-rutin" />
          </Form.Item>
          <Form.Item label="Tóm tắt" name="excerpt">
            <TextArea rows={2} placeholder="Tóm tắt ngắn hiển thị trong danh sách..." />
          </Form.Item>
          <Form.Item label="Nội dung" name="content">
            <TextArea rows={14} placeholder="Nội dung bài viết (HTML)..." />
          </Form.Item>
          <Form.Item label="Ảnh bìa" name="coverImage">
            <Input
              placeholder="https://cdn.garutin.com/blog/..."
              addonAfter={
                <Space size={8}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleCoverUpload}
                    disabled={coverUploading}
                  >
                    <Button
                      type="link"
                      size="small"
                      icon={<UploadOutlined />}
                      loading={coverUploading}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      Upload
                    </Button>
                  </Upload>
                  <MediaPicker onSelect={(url) => form.setFieldValue('coverImage', url)} name={form.getFieldValue('title')} />
                </Space>
              }
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.coverImage !== cur.coverImage}>
            {({ getFieldValue }) => {
              const url = getFieldValue('coverImage');
              return url ? (
                <div className="mb-4 -mt-2">
                  <img
                    src={url}
                    alt="cover preview"
                    style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                </div>
              ) : null;
            }}
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <Form.Item label="Danh mục" name="category">
              <Select
                allowClear
                placeholder="Chọn danh mục..."
                options={CATEGORIES}
              />
            </Form.Item>
            <Form.Item label="Tags" name="tags">
              <Select mode="tags" placeholder="gà rutin, nuôi gà, trang trại..." />
            </Form.Item>
            <Form.Item label="Trạng thái" name="status">
              <Select
                options={[
                  { value: 'draft', label: 'Nháp' },
                  { value: 'published', label: 'Đã đăng' },
                  { value: 'archived', label: 'Lưu trữ' },
                ]}
              />
            </Form.Item>
          </div>

          <Divider titlePlacement="left">SEO</Divider>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              label="SEO Title"
              name="seoTitle"
              help="Tối ưu 50–60 ký tự"
            >
              <Input showCount maxLength={70} />
            </Form.Item>
            <Form.Item
              label="SEO Description"
              name="seoDescription"
              help="Tối ưu 150–160 ký tự"
            >
              <TextArea rows={2} showCount maxLength={180} />
            </Form.Item>
          </div>

          <Form.Item className="mt-4">
            <Space wrap>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {isEdit ? 'Lưu thay đổi' : 'Tạo bài viết'}
              </Button>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
                {({ getFieldValue, setFieldValue }) => {
                  const status = getFieldValue('status');
                  if (status === 'published') {
                    return (
                      <Button
                        danger
                        icon={<StopOutlined />}
                        onClick={() => { setFieldValue('status', 'draft'); form.submit(); }}
                      >
                        Hủy đăng
                      </Button>
                    );
                  }
                  return (
                    <Button
                      icon={<SendOutlined />}
                      style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                      onClick={() => { setFieldValue('status', 'published'); form.submit(); }}
                    >
                      Đăng bài
                    </Button>
                  );
                }}
              </Form.Item>
              <Button onClick={() => navigate('/posts')}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      </Col>
      {scoreResult && (
        <Col xs={24} lg={7}>
          <div className="sticky top-4">
            <ScorePanel result={scoreResult} title="Điểm bài viết" />
          </div>
        </Col>
      )}
      </Row>

      {/* Generate Modal */}
      <Modal
        title={
          <span>
            <RocketOutlined className="text-blue-500 mr-2" />
            Tạo nội dung bằng AI
          </span>
        }
        open={generateModalOpen}
        onCancel={() => {
          setGenerateModalOpen(false);
          setGenerateTopic('');
          setGenerateKeywords('');
        }}
        onOk={handleGenerate}
        okText="Tạo nội dung"
        cancelText="Hủy"
        confirmLoading={aiLoading === 'generate'}
        okButtonProps={{ icon: <RocketOutlined /> }}
      >
        <div className="space-y-4 mt-4">
          <div>
            <Text strong>Chủ đề bài viết *</Text>
            <Input
              className="mt-1"
              placeholder="Ví dụ: Kỹ thuật ấp trứng gà rutin tại nhà"
              value={generateTopic}
              onChange={(e) => setGenerateTopic(e.target.value)}
              onPressEnter={handleGenerate}
            />
          </div>
          <div>
            <Text strong>Danh mục</Text>
            <Select
              className="w-full mt-1"
              allowClear
              placeholder="Chọn danh mục..."
              value={generateCategory || undefined}
              onChange={(v) => setGenerateCategory(v ?? '')}
              options={CATEGORIES}
            />
          </div>
          <div>
            <Text strong>Từ khóa cần tích hợp</Text>
            <Input
              className="mt-1"
              placeholder="gà rutin, trứng cút, kỹ thuật nuôi (cách nhau bởi dấu phẩy)"
              value={generateKeywords}
              onChange={(e) => setGenerateKeywords(e.target.value)}
            />
            <Text type="secondary" className="text-xs">
              AI sẽ tích hợp các từ khóa này vào bài viết
            </Text>
          </div>
          <Alert
            type="info"
            message="AI sẽ tạo tiêu đề, nội dung, tóm tắt, SEO và tags hoàn chỉnh. Có thể mất 15–30 giây."
            showIcon
          />
        </div>
      </Modal>

      {/* URL Modal */}
      <Modal
        title={
          <span>
            <LinkOutlined className="text-green-500 mr-2" />
            Tạo bài viết từ URL
          </span>
        }
        open={urlModalOpen}
        onCancel={() => { setUrlModalOpen(false); setUrlInput(''); setUrlCategory(''); }}
        onOk={handleGenerateFromUrl}
        okText="Tạo bài viết"
        cancelText="Hủy"
        confirmLoading={aiLoading === 'generate'}
        okButtonProps={{ icon: <RocketOutlined /> }}
      >
        <div className="space-y-4 mt-4">
          <div>
            <Text strong>URL trang web *</Text>
            <Input
              className="mt-1"
              prefix={<LinkOutlined className="text-gray-400" />}
              placeholder="https://example.com/bai-viet-ve-ga-rutin"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onPressEnter={handleGenerateFromUrl}
            />
          </div>
          <div>
            <Text strong>Danh mục</Text>
            <Select
              className="w-full mt-1"
              allowClear
              placeholder="Chọn danh mục..."
              value={urlCategory || undefined}
              onChange={(v) => setUrlCategory(v ?? '')}
              options={CATEGORIES}
            />
          </div>
          <Alert
            type="warning"
            showIcon
            message="Lưu ý"
            description="AI sẽ đọc nội dung trang web rồi viết lại hoàn toàn theo phong cách GaRutin — không copy nguyên văn. Một số trang có thể chặn truy cập bot. Có thể mất 20–40 giây."
          />
        </div>
      </Modal>
    </div>
  );
}
