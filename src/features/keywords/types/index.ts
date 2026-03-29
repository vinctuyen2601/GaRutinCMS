export type Keyword = {
  id: string;
  keyword: string;
  category?: string;
  isActive: boolean;
  crawlCount: number;
  lastCrawledAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateKeywordPayload = {
  keyword: string;
  category?: string;
};

export type UpdateKeywordPayload = {
  keyword?: string;
  category?: string;
};

export type CrawlToDraftsResult = {
  keyword: string;
  created: {
    id: string;
    title: string;
    slug: string;
    status: string;
  }[];
  errors: { url: string; reason: string }[];
};
