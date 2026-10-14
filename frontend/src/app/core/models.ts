export interface Message { message: string; }

export interface LoginResponse { token: string; role: 'admin' | 'user'; name: string; }

export interface User {
  id: number;
  name: string;
  email: string;
  contactNumber: string;
  status: boolean;
  role: string;
}

export interface Category { id: number; name: string; }

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  status: boolean;
  categoryId: number;
  categoryName: string;
}

export interface BillLine {
  productId: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Bill {
  id: number;
  uuid: string;
  name: string;
  email: string | null;
  contactNumber: string | null;
  paymentMethod: string;
  total: number;
  items: BillLine[];
  createdBy: string;
  createdAt: string;
}

export interface GenerateBillRequest {
  name: string;
  email?: string;
  contactNumber?: string;
  paymentMethod: string;
  items: { productId: number; quantity: number }[];
}

export interface Dashboard { category: number; product: number; bill: number; user: number; pendingOnlineOrders: number; }

// ---------------------------------------------------------------- online ordering
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'PICKUP' | 'DELIVERY';

export interface MenuProduct { id: number; name: string; description: string | null; price: number; }
export interface MenuCategory { id: number; name: string; products: MenuProduct[]; }

export interface PlaceOrderRequest {
  customerName: string;
  contactNumber: string;
  email?: string;
  orderType: OrderType;
  address?: string;
  note?: string;
  items: { productId: number; quantity: number }[];
}

export interface PlaceOrderResponse { code: string; total: number; status: OrderStatus; }

export interface TrackedOrder {
  code: string;
  customerName: string;
  orderType: OrderType;
  status: OrderStatus;
  total: number;
  items: BillLine[];
  createdAt: string;
  updatedAt: string;
}

export interface OnlineOrder {
  id: number;
  code: string;
  customerName: string;
  contactNumber: string;
  email: string | null;
  orderType: OrderType;
  address: string | null;
  note: string | null;
  total: number;
  items: BillLine[];
  status: OrderStatus;
  nextStatuses: OrderStatus[];
  billUuid: string | null;
  handledBy: string | null;
  createdAt: string;
  updatedAt: string;
}
