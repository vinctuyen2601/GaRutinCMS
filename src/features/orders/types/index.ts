export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
export type OrderSource = 'web' | 'zalo' | 'phone' | 'other';

export type OrderItem = {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  source: OrderSource;
  createdAt: string;
  updatedAt: string;
};
