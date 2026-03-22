export type ScoreItem = {
  label: string;
  passed: boolean;
  points: number;
  earned: number;
  tip?: string;
};

export type AnalysisResult = {
  score: number;
  maxScore: number;
  grade: 'poor' | 'fair' | 'good' | 'great';
  color: string;
  items: ScoreItem[];
};

function countWords(html: string): number {
  return (html ?? '').replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length;
}

function hasTag(html: string, tag: string): boolean {
  return new RegExp(`<${tag}[\\s>]`, 'i').test(html ?? '');
}

function getGrade(score: number, max: number): AnalysisResult['grade'] {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'great';
  if (pct >= 60) return 'good';
  if (pct >= 40) return 'fair';
  return 'poor';
}

function getColor(grade: AnalysisResult['grade']): string {
  return { great: '#22c55e', good: '#84cc16', fair: '#f59e0b', poor: '#ef4444' }[grade];
}

export function analyzePost(values: {
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
}): AnalysisResult {
  const items: ScoreItem[] = [];

  // Title
  const titleLen = (values.title ?? '').length;
  const titleOk = titleLen >= 10 && titleLen <= 70;
  items.push({
    label: 'Tiêu đề (10–70 ký tự)',
    passed: titleOk,
    points: 10,
    earned: titleOk ? 10 : titleLen > 0 ? 5 : 0,
    tip: !titleOk ? (titleLen < 10 ? 'Tiêu đề quá ngắn' : 'Tiêu đề quá dài (>70 ký tự)') : undefined,
  });

  // Content word count
  const words = countWords(values.content ?? '');
  const words600 = words >= 600;
  const words300 = words >= 300;
  items.push({
    label: 'Nội dung ≥ 300 từ',
    passed: words300,
    points: 15,
    earned: words600 ? 15 : words300 ? 10 : words > 100 ? 5 : 0,
    tip: !words300 ? `Hiện có ${words} từ, nên có ít nhất 300 từ` : undefined,
  });

  // Headings
  const hasH2 = hasTag(values.content ?? '', 'h2');
  items.push({
    label: 'Có thẻ <h2> phân đoạn',
    passed: hasH2,
    points: 10,
    earned: hasH2 ? 10 : 0,
    tip: !hasH2 ? 'Thêm tiêu đề <h2> để cấu trúc bài viết' : undefined,
  });

  // Lists
  const hasList = hasTag(values.content ?? '', 'ul') || hasTag(values.content ?? '', 'ol');
  items.push({
    label: 'Có danh sách <ul>/<ol>',
    passed: hasList,
    points: 5,
    earned: hasList ? 5 : 0,
    tip: !hasList ? 'Thêm danh sách để dễ đọc hơn' : undefined,
  });

  // Excerpt
  const excerptOk = (values.excerpt ?? '').trim().length >= 20;
  items.push({
    label: 'Tóm tắt (≥ 20 ký tự)',
    passed: excerptOk,
    points: 10,
    earned: excerptOk ? 10 : 0,
    tip: !excerptOk ? 'Điền tóm tắt để hiển thị trong danh sách bài viết' : undefined,
  });

  // Slug
  const slugOk = /^[a-z0-9-]+$/.test(values.slug ?? '');
  items.push({
    label: 'Slug URL hợp lệ',
    passed: slugOk,
    points: 5,
    earned: slugOk ? 5 : 0,
    tip: !slugOk ? 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang' : undefined,
  });

  // SEO Title
  const seoTitleLen = (values.seoTitle ?? '').length;
  const seoTitleOk = seoTitleLen >= 50 && seoTitleLen <= 60;
  const seoTitlePartial = seoTitleLen >= 30 && seoTitleLen < 50;
  items.push({
    label: 'SEO Title (50–60 ký tự)',
    passed: seoTitleOk,
    points: 20,
    earned: seoTitleOk ? 20 : seoTitlePartial ? 10 : seoTitleLen > 0 ? 5 : 0,
    tip: !seoTitleOk
      ? seoTitleLen === 0 ? 'Chưa điền SEO Title'
      : seoTitleLen < 50 ? `Quá ngắn (${seoTitleLen}/50–60 ký tự)`
      : `Quá dài (${seoTitleLen}/60 ký tự)`
      : undefined,
  });

  // SEO Description
  const seoDescLen = (values.seoDescription ?? '').length;
  const seoDescOk = seoDescLen >= 150 && seoDescLen <= 160;
  const seoDescPartial = seoDescLen >= 100 && seoDescLen < 150;
  items.push({
    label: 'SEO Description (150–160 ký tự)',
    passed: seoDescOk,
    points: 20,
    earned: seoDescOk ? 20 : seoDescPartial ? 10 : seoDescLen > 0 ? 5 : 0,
    tip: !seoDescOk
      ? seoDescLen === 0 ? 'Chưa điền SEO Description'
      : seoDescLen < 150 ? `Quá ngắn (${seoDescLen}/150–160 ký tự)`
      : `Quá dài (${seoDescLen}/160 ký tự)`
      : undefined,
  });

  // Tags
  const tagCount = (values.tags ?? []).length;
  const tagsOk = tagCount >= 3;
  items.push({
    label: 'Tags (≥ 3)',
    passed: tagsOk,
    points: 5,
    earned: tagsOk ? 5 : tagCount > 0 ? 2 : 0,
    tip: !tagsOk ? `Có ${tagCount} tag, nên có ít nhất 3` : undefined,
  });

  const score = items.reduce((s, i) => s + i.earned, 0);
  const maxScore = items.reduce((s, i) => s + i.points, 0);
  const grade = getGrade(score, maxScore);

  return { score, maxScore, grade, color: getColor(grade), items };
}

export function analyzeProduct(values: {
  name?: string;
  description?: string;
  images?: string[];
  slug?: string;
  categoryId?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: number;
}): AnalysisResult {
  const items: ScoreItem[] = [];

  // Name
  const nameLen = (values.name ?? '').length;
  const nameOk = nameLen >= 5 && nameLen <= 80;
  items.push({
    label: 'Tên sản phẩm (5–80 ký tự)',
    passed: nameOk,
    points: 10,
    earned: nameOk ? 10 : nameLen > 0 ? 5 : 0,
    tip: !nameOk ? (nameLen < 5 ? 'Tên quá ngắn' : 'Tên quá dài') : undefined,
  });

  // Description
  const words = countWords(values.description ?? '');
  const descOk = words >= 100;
  const descPartial = words >= 50;
  items.push({
    label: 'Mô tả ≥ 100 từ',
    passed: descOk,
    points: 20,
    earned: descOk ? 20 : descPartial ? 12 : words > 20 ? 5 : 0,
    tip: !descOk ? `Hiện có ${words} từ, nên có ít nhất 100 từ` : undefined,
  });

  // Description HTML structure
  const hasHtml = hasTag(values.description ?? '', 'p') || hasTag(values.description ?? '', 'ul');
  items.push({
    label: 'Mô tả có cấu trúc HTML',
    passed: hasHtml,
    points: 5,
    earned: hasHtml ? 5 : 0,
    tip: !hasHtml ? 'Dùng <p>, <ul>, <strong> để định dạng mô tả' : undefined,
  });

  // Images
  const imgCount = (values.images ?? []).length;
  const imagesOk = imgCount >= 3;
  const imagesPartial = imgCount >= 1;
  items.push({
    label: 'Ảnh sản phẩm (≥ 3)',
    passed: imagesOk,
    points: 15,
    earned: imagesOk ? 15 : imagesPartial ? 8 : 0,
    tip: !imagesOk ? `Có ${imgCount} ảnh, nên có ít nhất 3 ảnh` : undefined,
  });

  // Category
  const hasCategory = Boolean(values.categoryId);
  items.push({
    label: 'Đã chọn danh mục',
    passed: hasCategory,
    points: 5,
    earned: hasCategory ? 5 : 0,
    tip: !hasCategory ? 'Chọn danh mục để dễ tìm kiếm hơn' : undefined,
  });

  // Slug
  const slugOk = /^[a-z0-9-]+$/.test(values.slug ?? '');
  items.push({
    label: 'Slug URL hợp lệ',
    passed: slugOk,
    points: 5,
    earned: slugOk ? 5 : 0,
  });

  // SEO Title
  const seoTitleLen = (values.seoTitle ?? '').length;
  const seoTitleOk = seoTitleLen >= 50 && seoTitleLen <= 60;
  const seoTitlePartial = seoTitleLen >= 30;
  items.push({
    label: 'SEO Title (50–60 ký tự)',
    passed: seoTitleOk,
    points: 20,
    earned: seoTitleOk ? 20 : seoTitlePartial ? 10 : seoTitleLen > 0 ? 5 : 0,
    tip: !seoTitleOk
      ? seoTitleLen === 0 ? 'Chưa điền SEO Title'
      : seoTitleLen < 50 ? `Quá ngắn (${seoTitleLen}/50–60 ký tự)`
      : `Quá dài (${seoTitleLen}/60 ký tự)`
      : undefined,
  });

  // SEO Description
  const seoDescLen = (values.seoDescription ?? '').length;
  const seoDescOk = seoDescLen >= 150 && seoDescLen <= 160;
  const seoDescPartial = seoDescLen >= 100;
  items.push({
    label: 'SEO Description (150–160 ký tự)',
    passed: seoDescOk,
    points: 20,
    earned: seoDescOk ? 20 : seoDescPartial ? 10 : seoDescLen > 0 ? 5 : 0,
    tip: !seoDescOk
      ? seoDescLen === 0 ? 'Chưa điền SEO Description'
      : seoDescLen < 150 ? `Quá ngắn (${seoDescLen}/150–160 ký tự)`
      : `Quá dài (${seoDescLen}/160 ký tự)`
      : undefined,
  });

  const score = items.reduce((s, i) => s + i.earned, 0);
  const maxScore = items.reduce((s, i) => s + i.points, 0);
  const grade = getGrade(score, maxScore);

  return { score, maxScore, grade, color: getColor(grade), items };
}
