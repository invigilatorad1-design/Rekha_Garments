/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'garments' | 'jewellery';
  subCategory: string; // Saree, Lehenga, Kurti, Gown / Necklace, Earrings, Bangles, Choker
  images: string[];
  stock: number;
  sizes?: string[]; // S, M, L, XL, XXL
  fabric?: string;  // Silk, Cotton, Georgette, Organza
  collection?: string; // Temple, Kundan, Antique, Polki
  availability: boolean;
  views: number;
  salesCount: number;
  createdTime: string;
  archived?: boolean;
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  registrationDate: string;
  lastLogin: string;
  totalOrders: number;
  totalSpending: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedSize?: string | null;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponApplied?: string | null;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pinCode: string;
  };
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderDate: string;
  timeline: {
    status: string;
    timestamp: string;
    note: string;
  }[];
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat' | 'first_purchase' | 'festival';
  value: number; // percentage (e.g. 15) or flat amount (e.g. 500)
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'sales' | 'system';
  read: boolean;
  timestamp: string;
}

export interface AdminActivity {
  id: string;
  adminEmail: string;
  activity: string;
  timestamp: string;
  details?: string;
}
