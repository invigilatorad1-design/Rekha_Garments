import { pgTable, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  category: text('category').notNull(), // 'garments' | 'jewellery'
  subCategory: text('sub_category').notNull(),
  images: jsonb('images').$type<string[]>().notNull(),
  stock: integer('stock').notNull(),
  sizes: jsonb('sizes').$type<string[]>(),
  fabric: text('fabric'),
  collection: text('collection'),
  availability: boolean('availability').notNull().default(true),
  views: integer('views').notNull().default(0),
  salesCount: integer('sales_count').notNull().default(0),
  createdTime: text('created_time').notNull(),
  archived: boolean('archived').notNull().default(false),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(), // Firebase UID or custom ID
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  registrationDate: text('registration_date').notNull(),
  lastLogin: text('last_login').notNull(),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpending: integer('total_spending').notNull().default(0),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerMobile: text('customer_mobile').notNull(),
  items: jsonb('items').notNull(), // JSON block of OrderItem[]
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull(),
  tax: integer('tax').notNull(),
  shipping: integer('shipping').notNull(),
  total: integer('total').notNull(),
  couponApplied: text('coupon_applied'),
  status: text('status').notNull(), // 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  shippingAddress: jsonb('shipping_address').notNull(), // JSON block of shipping address
  paymentStatus: text('payment_status').notNull(), // 'Pending' | 'Paid' | 'Failed'
  orderDate: text('order_date').notNull(),
  timeline: jsonb('timeline').notNull(), // JSON block of timeline logs
});

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(), // 'percentage' | 'flat' | 'first_purchase' | 'festival'
  value: integer('value').notNull(),
  minOrderValue: integer('min_order_value').notNull(),
  expiryDate: text('expiry_date').notNull(),
  usageLimit: integer('usage_limit').notNull(),
  usedCount: integer('used_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'order' | 'stock' | 'sales' | 'system'
  read: boolean('read').notNull().default(false),
  timestamp: text('timestamp').notNull(),
});
