import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { Product, Coupon, User, Order, OrderItem } from './types';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const getCleanSupabaseUrl = (rawUrl: string): string => {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch (e) {
    return '';
  }
};

export const isRealSupabaseConfigured = (() => {
  try {
    const url = (SUPABASE_URL || '').trim();
    const key = (SUPABASE_ANON_KEY || '').trim();
    if (url === '' || key === '') return false;
    if (!url.startsWith('https://') && !url.startsWith('http://')) return false;
    if (url.includes('MY_SUPABASE') || key.includes('MY_KEY')) return false;
    if (url.includes('your-') || key.includes('your-')) return false;
    if (url.includes('placeholder') || key.includes('placeholder')) return false;
    if (!url.includes('.')) return false;
    
    // Check if the key looks like a real Supabase JWT anon key (always starts with eyJ)
    if (!key.startsWith('eyJ')) return false;
    
    // Test parsing the URL to ensure it is valid
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
})();

export const supabase = isRealSupabaseConfigured
  ? createClient(getCleanSupabaseUrl(SUPABASE_URL), SUPABASE_ANON_KEY)
  : null;

// JSON file fallback persistence
const DB_FILE = path.join(process.cwd(), 'database.json');

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: "Royal Kanjeevaram Pure Silk Saree",
    description: "A masterwork of timeless luxury. Handwoven pure mulberry silk adorned with pure gold zari borders, featuring intricate temple motifs. Perfect for bridal elegance and grand celebrations.",
    price: 8499,
    category: 'garments',
    subCategory: 'Saree',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'],
    stock: 12,
    sizes: ['Free Size'],
    fabric: 'Kanjeevaram Pure Silk',
    availability: true,
    views: 245,
    salesCount: 14,
    createdTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_2',
    name: "Ivory & Gold Floral Banarasi Georgette Saree",
    description: "Exquisite ivory georgette drape woven with magnificent champagne-gold floral creepers (Bel). Light on the shoulders, rich in aesthetics, capturing historical royal elegance.",
    price: 6999,
    category: 'garments',
    subCategory: 'Saree',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800'],
    stock: 8,
    sizes: ['Free Size'],
    fabric: 'Banarasi Georgette Silk',
    availability: true,
    views: 189,
    salesCount: 8,
    createdTime: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_3',
    name: "Emerald Green Chanderi Palazzo Gown Set",
    description: "Modern elegance fused with classical royalty. Features a pure Chanderi silk gown with hand-embroidered golden thread borders, paired with comfortable matching palazzo pants.",
    price: 3200,
    category: 'garments',
    subCategory: 'Gown',
    images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800'],
    stock: 20,
    sizes: ['M', 'L', 'XL', 'XXL'],
    fabric: 'Chanderi Silk',
    availability: true,
    views: 156,
    salesCount: 19,
    createdTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_4',
    name: "Rose Gold Hand-Woven Organza Lehenga Set",
    description: "An ethereal silhouette for the contemporary bridesmaid. Tailored in heavy organza silk, detailed with sequin work and rose-gold thread embroidery. Complete with a soft net dupatta.",
    price: 12500,
    category: 'garments',
    subCategory: 'Lehenga',
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'],
    stock: 5,
    sizes: ['S', 'M', 'L'],
    fabric: 'Organza Silk',
    availability: true,
    views: 312,
    salesCount: 4,
    createdTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_5',
    name: "Elegant Ruby Red Anarkali Velvet Suit",
    description: "Regal ruby-red flared velvet kurta with detailed dabka embroidery, matching slim trousers, and an organza dupatta. Velvet provides a rich drape and heavy warm texture.",
    price: 4500,
    category: 'garments',
    subCategory: 'Kurti',
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800'],
    stock: 15,
    sizes: ['M', 'L', 'XL'],
    fabric: 'Premium Velvet',
    availability: true,
    views: 134,
    salesCount: 11,
    createdTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_6',
    name: "1-Gram Gold Antique Laxmi Choker Set",
    description: "Stunning 1-Gram gold plated choker featuring an exquisite Laxmi coin centerpiece with ruby red drop beads. Set comes with matching antique jhumkas.",
    price: 3800,
    category: 'jewellery',
    subCategory: 'Necklace',
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800'],
    stock: 10,
    collection: 'Antique',
    availability: true,
    views: 420,
    salesCount: 22,
    createdTime: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_7',
    name: "Premium Kundan Polki Bridal Necklace Set",
    description: "Handcrafted luxury Kundan set inlaid with precious white Polki crystals, emerald-colored beads, and a 24K gold foil setting. Includes elegant drop earrings.",
    price: 6500,
    category: 'jewellery',
    subCategory: 'Necklace',
    images: ['https://images.unsplash.com/photo-1611085583191-a3b1a3a35541?auto=format&fit=crop&q=80&w=800'],
    stock: 4,
    collection: 'Kundan',
    availability: true,
    views: 290,
    salesCount: 5,
    createdTime: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_8',
    name: "Temple Matte Gold Jhumka Earrings",
    description: "Traditional south-Indian temple jewellery. Masterfully carved peacock design layered with premium matte gold plating and tiny ivory pearl hangings.",
    price: 1500,
    category: 'jewellery',
    subCategory: 'Earrings',
    images: ['https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&q=80&w=800'],
    stock: 25,
    collection: 'Temple',
    availability: true,
    views: 340,
    salesCount: 35,
    createdTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coup_1',
    code: 'REKHA15',
    type: 'percentage',
    value: 15,
    minOrderValue: 2000,
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 0,
    active: true
  },
  {
    id: 'coup_2',
    code: 'FESTIVAL500',
    type: 'flat',
    value: 500,
    minOrderValue: 4000,
    expiryDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 0,
    active: true
  }
];

export function readJsonDb(): any {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb = {
      products: DEFAULT_PRODUCTS,
      coupons: DEFAULT_COUPONS,
      customers: [],
      orders: [],
      notifications: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return {
      products: DEFAULT_PRODUCTS,
      coupons: DEFAULT_COUPONS,
      customers: [],
      orders: [],
      notifications: []
    };
  }
}

export function writeJsonDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Seeding products & coupons helper
export function initLocalDatabase() {
  readJsonDb();
}

// -----------------------------------------------------------------
// PRODUCTS SERVICE
// -----------------------------------------------------------------
export async function dbGetProducts(): Promise<Product[]> {
  if (isRealSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      category: p.category,
      subCategory: p.sub_category,
      images: p.images || [p.image_url],
      stock: p.stock,
      sizes: p.sizes,
      fabric: p.fabric,
      collection: p.collection,
      availability: p.availability,
      views: p.views || 0,
      salesCount: p.sales_count || 0,
      createdTime: p.created_at,
      archived: p.archived
    }));
  } else {
    const db = readJsonDb();
    return db.products;
  }
}

export async function dbAddProduct(p: Partial<Product>): Promise<Product> {
  const newProduct: Product = {
    id: p.id || 'prod_' + Math.random().toString(36).substr(2, 9),
    name: p.name || 'Unnamed Product',
    description: p.description || '',
    price: p.price || 0,
    category: p.category || 'garments',
    subCategory: p.subCategory || 'Other',
    images: p.images || [],
    stock: p.stock || 0,
    sizes: p.sizes || [],
    fabric: p.fabric || '',
    collection: p.collection || '',
    availability: p.availability !== undefined ? p.availability : true,
    views: 0,
    salesCount: 0,
    createdTime: new Date().toISOString(),
    archived: false
  };

  if (isRealSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('products')
      .insert([{
        id: newProduct.id,
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        category: newProduct.category,
        sub_category: newProduct.subCategory,
        image_url: newProduct.images[0] || '',
        images: newProduct.images,
        stock: newProduct.stock,
        sizes: newProduct.sizes,
        fabric: newProduct.fabric,
        collection: newProduct.collection,
        availability: newProduct.availability,
        views: 0,
        sales_count: 0,
        archived: false
      }]);

    if (error) throw error;
    return newProduct;
  } else {
    const db = readJsonDb();
    db.products.unshift(newProduct);
    writeJsonDb(db);
    return newProduct;
  }
}

export async function dbUpdateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  if (isRealSupabaseConfigured && supabase) {
    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.description !== undefined) mappedUpdates.description = updates.description;
    if (updates.price !== undefined) mappedUpdates.price = updates.price;
    if (updates.category !== undefined) mappedUpdates.category = updates.category;
    if (updates.subCategory !== undefined) mappedUpdates.sub_category = updates.subCategory;
    if (updates.images !== undefined) {
      mappedUpdates.images = updates.images;
      mappedUpdates.image_url = updates.images[0] || '';
    }
    if (updates.stock !== undefined) mappedUpdates.stock = updates.stock;
    if (updates.sizes !== undefined) mappedUpdates.sizes = updates.sizes;
    if (updates.fabric !== undefined) mappedUpdates.fabric = updates.fabric;
    if (updates.collection !== undefined) mappedUpdates.collection = updates.collection;
    if (updates.availability !== undefined) mappedUpdates.availability = updates.availability;
    if (updates.views !== undefined) mappedUpdates.views = updates.views;
    if (updates.salesCount !== undefined) mappedUpdates.sales_count = updates.salesCount;
    if (updates.archived !== undefined) mappedUpdates.archived = updates.archived;
    mappedUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('products')
      .update(mappedUpdates)
      .eq('id', id);

    if (error) throw error;
    const prods = await dbGetProducts();
    const updated = prods.find(p => p.id === id);
    if (updated) return updated;
  }

  const db = readJsonDb();
  const idx = db.products.findIndex((p: any) => p.id === id);
  if (idx !== -1) {
    db.products[idx] = { ...db.products[idx], ...updates };
    writeJsonDb(db);
    return db.products[idx];
  }
  throw new Error('Product not found');
}

export async function dbDeleteProduct(id: string): Promise<void> {
  if (isRealSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return;
  } else {
    const db = readJsonDb();
    db.products = db.products.filter((p: any) => p.id !== id);
    writeJsonDb(db);
  }
}

// -----------------------------------------------------------------
// CUSTOMERS SERVICE
// -----------------------------------------------------------------
export async function dbGetCustomers(): Promise<User[]> {
  if (isRealSupabaseConfigured && supabase) {
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*');

    if (custError) throw custError;

    const { data: orders, error: ordError } = await supabase
      .from('orders')
      .select('customer_id, grand_total, status');

    if (ordError) throw ordError;

    return (customers || []).map(c => {
      const custOrders = (orders || []).filter(o => o.customer_id === c.id && o.status !== 'Cancelled');
      const lifetimeSpending = custOrders.reduce((sum, o) => sum + Number(o.grand_total), 0);
      return {
        id: c.id,
        name: c.full_name,
        mobile: c.mobile_number,
        registrationDate: c.registration_date,
        lastLogin: c.last_login,
        totalOrders: custOrders.length,
        totalSpending: lifetimeSpending
      };
    });
  } else {
    const db = readJsonDb();
    const customers = db.customers || [];
    const orders = db.orders || [];
    
    return customers.map((c: any) => {
      const custOrders = orders.filter((o: any) => o.customerId === c.id && o.status !== 'Cancelled');
      const totalSpending = custOrders.reduce((acc: number, o: any) => acc + o.total, 0);
      return {
        ...c,
        totalOrders: custOrders.length,
        totalSpending
      };
    });
  }
}

export async function dbRegisterOrUpdateCustomer(id: string, fullName: string, mobileNumber: string): Promise<User> {
  const now = new Date().toISOString();
  const cleanMobile = mobileNumber.replace(/\D/g, '');

  if (isRealSupabaseConfigured && supabase) {
    const { data: existing, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError) console.error('Find customer error:', findError);

    let customerData;
    if (existing) {
      const { data, error } = await supabase
        .from('customers')
        .update({
          full_name: fullName,
          last_login: now
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      customerData = data;
    } else {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          id,
          full_name: fullName,
          mobile_number: cleanMobile,
          registration_date: now,
          last_login: now
        }])
        .select()
        .single();
      if (error) throw error;
      customerData = data;
    }

    return {
      id: customerData.id,
      name: customerData.full_name,
      mobile: customerData.mobile_number,
      registrationDate: customerData.registration_date,
      lastLogin: customerData.last_login,
      totalOrders: 0,
      totalSpending: 0
    };
  } else {
    const db = readJsonDb();
    if (!db.customers) db.customers = [];
    const idx = db.customers.findIndex((c: any) => c.id === id);

    let finalUser: User;
    if (idx !== -1) {
      db.customers[idx] = {
        ...db.customers[idx],
        name: fullName,
        lastLogin: now
      };
      finalUser = db.customers[idx];
    } else {
      const newUser: User = {
        id,
        name: fullName,
        mobile: cleanMobile,
        registrationDate: now,
        lastLogin: now,
        totalOrders: 0,
        totalSpending: 0
      };
      db.customers.push(newUser);
      finalUser = newUser;
    }

    writeJsonDb(db);
    return finalUser;
  }
}

// -----------------------------------------------------------------
// ORDERS SERVICE
// -----------------------------------------------------------------
export async function dbGetOrders(): Promise<Order[]> {
  if (isRealSupabaseConfigured && supabase) {
    const { data: orders, error: ordError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordError) throw ordError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*');

    if (itemsError) throw itemsError;

    const products = await dbGetProducts();

    return (orders || []).map(o => {
      const oItems = (items || []).filter(i => i.order_id === o.id).map(i => {
        const product = products.find(p => p.id === i.product_id);
        return {
          productId: i.product_id,
          name: product?.name || 'Unknown Product',
          price: Number(i.price),
          quantity: i.quantity,
          image: product?.images[0] || '',
          selectedSize: null
        };
      });

      return {
        id: o.id,
        customerId: o.customer_id,
        customerName: o.customer_name || 'Anonymous Customer',
        customerMobile: o.customer_mobile || '',
        items: oItems,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        tax: Number(o.tax),
        shipping: Number(o.shipping),
        total: Number(o.grand_total),
        couponApplied: o.coupon_applied || null,
        status: o.status,
        shippingAddress: o.shipping_address,
        paymentStatus: o.payment_status || 'Pending',
        orderDate: o.created_at,
        timeline: o.timeline || []
      };
    });
  } else {
    const db = readJsonDb();
    return db.orders || [];
  }
}

export async function dbCreateOrder(o: Partial<Order>): Promise<Order> {
  const uniqueId = 'RKG_' + Math.floor(10000 + Math.random() * 90000).toString();
  
  const newOrder: Order = {
    id: uniqueId,
    customerId: o.customerId || 'anon',
    customerName: o.customerName || 'Anonymous',
    customerMobile: o.customerMobile || '',
    items: o.items || [],
    subtotal: o.subtotal || 0,
    discount: o.discount || 0,
    tax: o.tax || 0,
    shipping: o.shipping || 0,
    total: o.total || 0,
    couponApplied: o.couponApplied || null,
    status: 'Pending',
    shippingAddress: o.shippingAddress || {
      fullName: o.customerName || 'Anonymous',
      phone: o.customerMobile || '',
      addressLine: '',
      city: '',
      state: '',
      pinCode: ''
    },
    paymentStatus: o.paymentStatus || 'Pending',
    orderDate: new Date().toISOString(),
    timeline: [
      {
        status: 'Pending',
        timestamp: new Date().toISOString(),
        note: 'Order placed successfully by customer.'
      }
    ]
  };

  if (isRealSupabaseConfigured && supabase) {
    const { error: ordError } = await supabase
      .from('orders')
      .insert([{
        id: newOrder.id,
        customer_id: newOrder.customerId,
        customer_name: newOrder.customerName,
        customer_mobile: newOrder.customerMobile,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        tax: newOrder.tax,
        shipping: newOrder.shipping,
        grand_total: newOrder.total,
        coupon_applied: newOrder.couponApplied,
        status: newOrder.status,
        shipping_address: newOrder.shippingAddress,
        payment_status: newOrder.paymentStatus,
        timeline: newOrder.timeline,
        created_at: newOrder.orderDate
      }]);

    if (ordError) throw ordError;

    const itemsToInsert = newOrder.items.map(item => ({
      order_id: newOrder.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) console.error('Error inserting order items:', itemsError);

    // Update stock and sales count
    for (const item of newOrder.items) {
      try {
        const { data: prod } = await supabase
          .from('products')
          .select('stock, sales_count')
          .eq('id', item.productId)
          .single();

        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          const newSales = (prod.sales_count || 0) + item.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock, sales_count: newSales })
            .eq('id', item.productId);
        }
      } catch (err) {
        console.error('Failed to update product stock:', err);
      }
    }

    // Update coupon usage
    if (newOrder.couponApplied) {
      try {
        const { data: coup } = await supabase
          .from('coupons')
          .select('usage_count')
          .eq('code', newOrder.couponApplied)
          .maybeSingle();

        if (coup) {
          await supabase
            .from('coupons')
            .update({ usage_count: (coup.usage_count || 0) + 1 })
            .eq('code', newOrder.couponApplied);
        }
      } catch (err) {
        console.error('Failed to increment coupon usage:', err);
      }
    }

    return newOrder;
  } else {
    const db = readJsonDb();
    if (!db.orders) db.orders = [];
    db.orders.unshift(newOrder);

    // Update product stock and sales
    if (!db.products) db.products = [];
    newOrder.items.forEach(item => {
      const pIdx = db.products.findIndex((p: any) => p.id === item.productId);
      if (pIdx !== -1) {
        db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - item.quantity);
        db.products[pIdx].salesCount = (db.products[pIdx].salesCount || 0) + item.quantity;
      }
    });

    // Update coupon usage
    if (newOrder.couponApplied) {
      if (!db.coupons) db.coupons = [];
      const cIdx = db.coupons.findIndex((c: any) => c.code === newOrder.couponApplied);
      if (cIdx !== -1) {
        db.coupons[cIdx].usedCount = (db.coupons[cIdx].usedCount || 0) + 1;
      }
    }

    writeJsonDb(db);
    return newOrder;
  }
}

export async function dbUpdateOrderStatus(orderId: string, status: string, timeline: any[]): Promise<Order> {
  if (isRealSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('orders')
      .update({ status, timeline })
      .eq('id', orderId);

    if (error) throw error;
    const orders = await dbGetOrders();
    const updated = orders.find(o => o.id === orderId);
    if (updated) return updated;
  }

  const db = readJsonDb();
  const idx = db.orders.findIndex((o: any) => o.id === orderId);
  if (idx !== -1) {
    db.orders[idx].status = status;
    db.orders[idx].timeline = timeline;
    writeJsonDb(db);
    return db.orders[idx];
  }
  throw new Error('Order not found');
}

// -----------------------------------------------------------------
// COUPONS SERVICE
// -----------------------------------------------------------------
export async function dbGetCoupons(): Promise<Coupon[]> {
  if (isRealSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*');

    if (error) throw error;
    return (data || []).map(c => ({
      id: c.id,
      code: c.code,
      type: c.discount_type,
      value: Number(c.discount_value),
      minOrderValue: Number(c.minimum_order),
      expiryDate: c.expiry_date,
      usageLimit: 1000,
      usedCount: c.usage_count,
      active: c.active
    }));
  } else {
    const db = readJsonDb();
    return db.coupons || [];
  }
}

export async function dbCreateCoupon(c: Partial<Coupon>): Promise<Coupon> {
  const newCoupon: Coupon = {
    id: c.id || 'coup_' + Math.random().toString(36).substr(2, 9),
    code: (c.code || '').toUpperCase().trim(),
    type: c.type || 'percentage',
    value: c.value || 0,
    minOrderValue: c.minOrderValue || 0,
    expiryDate: c.expiryDate || '2026-12-31',
    usageLimit: 1000,
    usedCount: 0,
    active: c.active !== undefined ? c.active : true
  };

  if (isRealSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('coupons')
      .insert([{
        id: newCoupon.id,
        code: newCoupon.code,
        discount_type: newCoupon.type,
        discount_value: newCoupon.value,
        minimum_order: newCoupon.minOrderValue,
        expiry_date: newCoupon.expiryDate,
        active: newCoupon.active,
        usage_count: 0
      }]);

    if (error) throw error;
    return newCoupon;
  } else {
    const db = readJsonDb();
    if (!db.coupons) db.coupons = [];
    db.coupons.push(newCoupon);
    writeJsonDb(db);
    return newCoupon;
  }
}

export async function dbUpdateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
  if (isRealSupabaseConfigured && supabase) {
    const mappedUpdates: any = {};
    if (updates.code !== undefined) mappedUpdates.code = updates.code.toUpperCase().trim();
    if (updates.type !== undefined) mappedUpdates.discount_type = updates.type;
    if (updates.value !== undefined) mappedUpdates.discount_value = updates.value;
    if (updates.minOrderValue !== undefined) mappedUpdates.minimum_order = updates.minOrderValue;
    if (updates.expiryDate !== undefined) mappedUpdates.expiry_date = updates.expiryDate;
    if (updates.active !== undefined) mappedUpdates.active = updates.active;

    const { error } = await supabase
      .from('coupons')
      .update(mappedUpdates)
      .eq('id', id);

    if (error) throw error;
    const coupons = await dbGetCoupons();
    const updated = coupons.find(c => c.id === id);
    if (updated) return updated;
  }

  const db = readJsonDb();
  const idx = db.coupons.findIndex((c: any) => c.id === id);
  if (idx !== -1) {
    db.coupons[idx] = { ...db.coupons[idx], ...updates };
    writeJsonDb(db);
    return db.coupons[idx];
  }
  throw new Error('Coupon not found');
}

export async function dbDeleteCoupon(id: string): Promise<void> {
  if (isRealSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return;
  } else {
    const db = readJsonDb();
    db.coupons = db.coupons.filter((c: any) => c.id !== id);
    writeJsonDb(db);
  }
}

// -----------------------------------------------------------------
// AUTHENTICATION SERVICES
// -----------------------------------------------------------------
export async function dbSignInWithOtp(mobileNumber: string): Promise<{ success: boolean; message: string; mockOtp?: string }> {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const formattedPhone = `+91${cleanMobile}`;

  if (isRealSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone
    });

    if (error) throw error;
    return {
      success: true,
      message: `[SUPABASE PHONE AUTH] Verification code successfully dispatched to ${formattedPhone}`
    };
  } else {
    // Generate simulated 6-digit OTP for testing
    const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const db = readJsonDb();
    if (!db.auth_otps) db.auth_otps = {};
    db.auth_otps[cleanMobile] = simulatedOtp;
    writeJsonDb(db);
    return {
      success: true,
      message: `[PREVIEW MODE] Verification SMS sent.`,
      mockOtp: simulatedOtp
    };
  }
}

export async function dbVerifyOtp(mobileNumber: string, otp: string): Promise<{ user: { id: string; phone: string } }> {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const formattedPhone = `+91${cleanMobile}`;

  if (isRealSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms'
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to verify OTP with Supabase Auth.');

    return {
      user: {
        id: data.user.id,
        phone: data.user.phone || mobileNumber
      }
    };
  } else {
    const db = readJsonDb();
    const savedOtp = db.auth_otps ? db.auth_otps[cleanMobile] : null;

    if (otp === '123456' || savedOtp === otp) {
      const existingId = 'usr_' + Math.random().toString(36).substr(2, 9);
      return {
        user: {
          id: existingId,
          phone: formattedPhone
        }
      };
    } else {
      throw new Error('Invalid OTP code. Try entering the code displayed above or 123456 as bypass.');
    }
  }
}

export async function dbSignOut(): Promise<void> {
  if (isRealSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
