export type PostStatus = 'draft' | 'published' | 'archived';

export type Post = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  tags: string[];
  status: PostStatus;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoScore?: number;
  contentScore?: number;
  seoDetails?: Record<string, any>;
  keywordId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePostPayload = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePostPayload = Partial<CreatePostPayload>;

// AI types
export type GenerateFromUrlPayload = {
  url: string;
  category?: string;
};

export type GenerateFromUrlResult = {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  sourceUrl: string;
};

export type GenerateContentPayload = {
  topic: string;
  category?: string;
  keywords?: string[];
};

export type GenerateContentResult = {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
};

export type OptimizeSeoPayload = {
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  tags?: string[];
};

export type OptimizeSeoResult = {
  seoTitle: string;
  seoDescription: string;
  slug: string;
  tags: string[];
  suggestions: string[];
  manualSuggestions: string[];
};

export type ImproveContentPayload = {
  title: string;
  content: string;
  category?: string;
  contentScore?: number;
  issues?: string[];
};

export type ImproveContentResult = {
  content: string;
  excerpt: string;
  summary: string;
};
