export interface Customer {
  id: string;
  phone: string;
  name?: string;
  address?: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeletedCustomer {
  id: string;
  phone: string;
  name?: string;
  address?: string;
  createdAt: string;
  deletedAt: string;
}
