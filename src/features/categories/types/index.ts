export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type CreateCategoryPayload = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
