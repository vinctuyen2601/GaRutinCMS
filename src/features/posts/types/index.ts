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
  createdAt: string;
  updatedAt: string;
};

export type CreatePostPayload = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePostPayload = Partial<CreatePostPayload>;
