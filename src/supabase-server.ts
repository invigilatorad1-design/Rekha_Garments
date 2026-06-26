import { Product, Coupon, User, Order, OrderItem } from './types.ts';
import { db } from './db/index.ts';
import { products, customers, orders, coupons, notifications } from './db/schema.ts';
import { eq } from 'drizzle-orm';

export const isRealSupabaseConfigured = false;
export const supabase = null;

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

const simulatedOtps: Record<string, string> = {};

// Seeding products & coupons helper
export async function seedDatabase() {
  try {
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0) {
      await db.insert(products).values(DEFAULT_PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        subCategory: p.subCategory,
        images: p.images,
        stock: p.stock,
        sizes: p.sizes || [],
        fabric: p.fabric || null,
        collection: p.collection || null,
        availability: p.availability,
        views: p.views,
        salesCount: p.salesCount,
        createdTime: p.createdTime,
        archived: p.archived || false
      })));
      console.log('Seeded default products into Cloud SQL successfully!');
    }

    const existingCoupons = await db.select().from(coupons);
    if (existingCoupons.length === 0) {
      await db.insert(coupons).values(DEFAULT_COUPONS);
      console.log('Seeded default coupons into Cloud SQL successfully!');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}

export async function initLocalDatabase() {
  await seedDatabase();
}

// -----------------------------------------------------------------
// PRODUCTS SERVICE
// -----------------------------------------------------------------
export async function dbGetProducts(): Promise<Product[]> {
  try {
    const data = await db.select().from(products);
    return data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category as 'garments' | 'jewellery',
      subCategory: p.subCategory,
      images: p.images || [],
      stock: p.stock,
      sizes: p.sizes || [],
      fabric: p.fabric || '',
      collection: p.collection || '',
      availability: p.availability,
      views: p.views,
      salesCount: p.salesCount,
      createdTime: p.createdTime,
      archived: p.archived
    }));
  } catch (error) {
    console.error('Failed to get products:', error);
    throw new Error('Failed to fetch products', { cause: error });
  }
}

export async function dbAddProduct(p: Partial<Product>): Promise<Product> {
  const newProduct: Product = {
    id: p.id || 'prod_' + Math.random().toString(36).substring(2, 11),
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

  try {
    await db.insert(products).values({
      id: newProduct.id,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      category: newProduct.category,
      subCategory: newProduct.subCategory,
      images: newProduct.images,
      stock: newProduct.stock,
      sizes: newProduct.sizes,
      fabric: newProduct.fabric || null,
      collection: newProduct.collection || null,
      availability: newProduct.availability,
      views: newProduct.views,
      salesCount: newProduct.salesCount,
      createdTime: newProduct.createdTime,
      archived: newProduct.archived
    });
    return newProduct;
  } catch (error) {
    console.error('Failed to add product:', error);
    throw new Error('Failed to add product', { cause: error });
  }
}

export async function dbUpdateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  try {
    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.description !== undefined) mappedUpdates.description = updates.description;
    if (updates.price !== undefined) mappedUpdates.price = updates.price;
    if (updates.category !== undefined) mappedUpdates.category = updates.category;
    if (updates.subCategory !== undefined) mappedUpdates.subCategory = updates.subCategory;
    if (updates.images !== undefined) mappedUpdates.images = updates.images;
    if (updates.stock !== undefined) mappedUpdates.stock = updates.stock;
    if (updates.sizes !== undefined) mappedUpdates.sizes = updates.sizes;
    if (updates.fabric !== undefined) mappedUpdates.fabric = updates.fabric;
    if (updates.collection !== undefined) mappedUpdates.collection = updates.collection;
    if (updates.availability !== undefined) mappedUpdates.availability = updates.availability;
    if (updates.views !== undefined) mappedUpdates.views = updates.views;
    if (updates.salesCount !== undefined) mappedUpdates.salesCount = updates.salesCount;
    if (updates.archived !== undefined) mappedUpdates.archived = updates.archived;

    await db.update(products).set(mappedUpdates).where(eq(products.id, id));
    
    const prods = await dbGetProducts();
    const updated = prods.find(p => p.id === id);
    if (updated) return updated;
    throw new Error('Product not found');
  } catch (error) {
    console.error('Failed to update product:', error);
    throw new Error('Failed to update product', { cause: error });
  }
}

export async function dbDeleteProduct(id: string): Promise<void> {
  try {
    await db.delete(products).where(eq(products.id, id));
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw new Error('Failed to delete product', { cause: error });
  }
}

// -----------------------------------------------------------------
// CUSTOMERS SERVICE
// -----------------------------------------------------------------
export async function dbGetCustomers(): Promise<User[]> {
  try {
    const custs = await db.select().from(customers);
    const ords = await db.select().from(orders);

    return custs.map(c => {
      const custOrders = ords.filter(o => o.customerId === c.id && o.status !== 'Cancelled');
      const totalSpending = custOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        registrationDate: c.registrationDate,
        lastLogin: c.lastLogin,
        totalOrders: custOrders.length,
        totalSpending: totalSpending
      };
    });
  } catch (error) {
    console.error('Failed to get customers:', error);
    throw new Error('Failed to fetch customers', { cause: error });
  }
}

export async function dbGetCustomerByMobile(mobileNumber: string): Promise<User | null> {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  try {
    const custs = await db.select().from(customers).where(eq(customers.mobile, cleanMobile));
    if (custs.length === 0) return null;
    
    // Fetch orders to calculate totals
    const ords = await db.select().from(orders).where(eq(orders.customerId, custs[0].id));
    const activeOrders = ords.filter(o => o.status !== 'Cancelled');
    const totalSpending = activeOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      id: custs[0].id,
      name: custs[0].name,
      mobile: custs[0].mobile,
      registrationDate: custs[0].registrationDate,
      lastLogin: custs[0].lastLogin,
      totalOrders: activeOrders.length,
      totalSpending: totalSpending
    };
  } catch (error) {
    console.error('Failed to get customer by mobile:', error);
    throw new Error('Failed to fetch customer by mobile', { cause: error });
  }
}

export async function dbRegisterOrUpdateCustomer(id: string, fullName: string, mobileNumber: string): Promise<User> {
  const now = new Date().toISOString();
  const cleanMobile = mobileNumber.replace(/\D/g, '');

  try {
    const existing = await db.select().from(customers).where(eq(customers.id, id));
    if (existing.length > 0) {
      await db.update(customers).set({
        name: fullName,
        lastLogin: now
      }).where(eq(customers.id, id));
    } else {
      await db.insert(customers).values({
        id,
        name: fullName,
        mobile: cleanMobile,
        registrationDate: now,
        lastLogin: now,
        totalOrders: 0,
        totalSpending: 0
      });
    }

    const updated = await db.select().from(customers).where(eq(customers.id, id));
    const u = updated[0];
    return {
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      registrationDate: u.registrationDate,
      lastLogin: u.lastLogin,
      totalOrders: u.totalOrders,
      totalSpending: u.totalSpending
    };
  } catch (error) {
    console.error('Failed to register/update customer:', error);
    throw new Error('Failed to register/update customer', { cause: error });
  }
}

export async function dbRegisterOrUpdateGoogleCustomer(id: string, fullName: string, email: string): Promise<User> {
  const now = new Date().toISOString();
  try {
    const existing = await db.select().from(customers).where(eq(customers.id, id));
    if (existing.length > 0) {
      await db.update(customers).set({
        name: fullName,
        lastLogin: now,
        mobile: email
      }).where(eq(customers.id, id));
    } else {
      await db.insert(customers).values({
        id,
        name: fullName,
        mobile: email,
        registrationDate: now,
        lastLogin: now,
        totalOrders: 0,
        totalSpending: 0
      });
    }

    const updated = await db.select().from(customers).where(eq(customers.id, id));
    const u = updated[0];
    return {
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      registrationDate: u.registrationDate,
      lastLogin: u.lastLogin,
      totalOrders: u.totalOrders,
      totalSpending: u.totalSpending
    };
  } catch (error) {
    console.error('Failed to register/update Google customer:', error);
    throw new Error('Failed to register/update Google customer', { cause: error });
  }
}

// -----------------------------------------------------------------
// ORDERS SERVICE
// -----------------------------------------------------------------
export async function dbGetOrders(): Promise<Order[]> {
  try {
    const data = await db.select().from(orders);
    return data.map(o => {
      let timelineArr: any[] = [];
      if (Array.isArray(o.timeline)) {
        timelineArr = o.timeline;
      } else if (typeof o.timeline === 'string') {
        try {
          const parsed = JSON.parse(o.timeline);
          if (Array.isArray(parsed)) {
            timelineArr = parsed;
          }
        } catch (e) {}
      }
      return {
        id: o.id,
        customerId: o.customerId || 'anon',
        customerName: o.customerName || 'Anonymous Customer',
        customerMobile: o.customerMobile || '',
        items: (o.items || []) as OrderItem[],
        subtotal: o.subtotal,
        discount: o.discount,
        tax: o.tax,
        shipping: o.shipping,
        total: o.total,
        couponApplied: o.couponApplied || null,
        status: o.status as any,
        shippingAddress: o.shippingAddress as any,
        paymentStatus: o.paymentStatus as any,
        orderDate: o.orderDate,
        timeline: timelineArr
      };
    });
  } catch (error) {
    console.error('Failed to get orders:', error);
    throw new Error('Failed to fetch orders', { cause: error });
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

  try {
    if (newOrder.customerId && newOrder.customerId !== 'anon') {
      const existingCust = await db.select().from(customers).where(eq(customers.id, newOrder.customerId));
      if (existingCust.length === 0) {
        await db.insert(customers).values({
          id: newOrder.customerId,
          name: newOrder.customerName,
          mobile: newOrder.customerMobile.replace(/\D/g, '') || '9999999999',
          registrationDate: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          totalOrders: 1,
          totalSpending: newOrder.total
        });
      }
    }

    await db.insert(orders).values({
      id: newOrder.id,
      customerId: newOrder.customerId === 'anon' ? null : newOrder.customerId,
      customerName: newOrder.customerName,
      customerMobile: newOrder.customerMobile,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      discount: newOrder.discount,
      tax: newOrder.tax,
      shipping: newOrder.shipping,
      total: newOrder.total,
      couponApplied: newOrder.couponApplied,
      status: newOrder.status,
      shippingAddress: newOrder.shippingAddress,
      paymentStatus: newOrder.paymentStatus,
      orderDate: newOrder.orderDate,
      timeline: newOrder.timeline
    });

    // Update product stocks
    for (const item of newOrder.items) {
      const prod = await db.select().from(products).where(eq(products.id, item.productId));
      if (prod.length > 0) {
        const p = prod[0];
        const newStock = Math.max(0, p.stock - item.quantity);
        const newSales = p.salesCount + item.quantity;
        await db.update(products).set({
          stock: newStock,
          salesCount: newSales
        }).where(eq(products.id, item.productId));
      }
    }

    // Update coupon usage
    if (newOrder.couponApplied) {
      const coup = await db.select().from(coupons).where(eq(coupons.code, newOrder.couponApplied));
      if (coup.length > 0) {
        const c = coup[0];
        await db.update(coupons).set({
          usedCount: c.usedCount + 1
        }).where(eq(coupons.code, newOrder.couponApplied));
      }
    }

    return newOrder;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw new Error('Failed to create order', { cause: error });
  }
}

export async function dbUpdateOrderStatus(orderId: string, status: string, timelineOrNote: any): Promise<Order> {
  try {
    const existingOrders = await db.select().from(orders).where(eq(orders.id, orderId));
    if (existingOrders.length === 0) {
      throw new Error('Order not found');
    }
    const order = existingOrders[0];
    
    let currentTimeline: any[] = [];
    if (Array.isArray(order.timeline)) {
      currentTimeline = order.timeline;
    } else if (typeof order.timeline === 'string') {
      try {
        const parsed = JSON.parse(order.timeline);
        if (Array.isArray(parsed)) {
          currentTimeline = parsed;
        }
      } catch (e) {}
    }

    let finalTimeline: any[] = [];
    if (Array.isArray(timelineOrNote)) {
      finalTimeline = timelineOrNote;
    } else if (typeof timelineOrNote === 'string') {
      finalTimeline = [
        ...currentTimeline,
        {
          status,
          timestamp: new Date().toISOString(),
          note: timelineOrNote
        }
      ];
    } else {
      finalTimeline = [
        ...currentTimeline,
        {
          status,
          timestamp: new Date().toISOString(),
          note: `Status updated to ${status}.`
        }
      ];
    }

    const updatePayload: any = {
      status,
      timeline: finalTimeline
    };
    
    if (status === 'Processing') {
      updatePayload.paymentStatus = 'Paid';
    } else if (status === 'Cancelled') {
      updatePayload.paymentStatus = 'Failed';
    }

    await db.update(orders).set(updatePayload).where(eq(orders.id, orderId));

    const ords = await dbGetOrders();
    const updated = ords.find(o => o.id === orderId);
    if (updated) return updated;
    throw new Error('Order not found');
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw new Error('Failed to update order status', { cause: error });
  }
}

// -----------------------------------------------------------------
// COUPONS SERVICE
// -----------------------------------------------------------------
export async function dbGetCoupons(): Promise<Coupon[]> {
  try {
    const data = await db.select().from(coupons);
    return data.map(c => ({
      id: c.id,
      code: c.code,
      type: c.type as 'percentage' | 'flat' | 'first_purchase' | 'festival',
      value: c.value,
      minOrderValue: c.minOrderValue,
      expiryDate: c.expiryDate,
      usageLimit: c.usageLimit,
      usedCount: c.usedCount,
      active: c.active
    }));
  } catch (error) {
    console.error('Failed to get coupons:', error);
    throw new Error('Failed to fetch coupons', { cause: error });
  }
}

export async function dbCreateCoupon(c: Partial<Coupon>): Promise<Coupon> {
  const newCoupon: Coupon = {
    id: c.id || 'coup_' + Math.random().toString(36).substring(2, 11),
    code: (c.code || '').toUpperCase().trim(),
    type: c.type || 'percentage',
    value: c.value || 0,
    minOrderValue: c.minOrderValue || 0,
    expiryDate: c.expiryDate || '2026-12-31',
    usageLimit: 1000,
    usedCount: 0,
    active: c.active !== undefined ? c.active : true
  };

  try {
    await db.insert(coupons).values({
      id: newCoupon.id,
      code: newCoupon.code,
      type: newCoupon.type,
      value: newCoupon.value,
      minOrderValue: newCoupon.minOrderValue,
      expiryDate: newCoupon.expiryDate,
      usageLimit: newCoupon.usageLimit,
      usedCount: newCoupon.usedCount,
      active: newCoupon.active
    });
    return newCoupon;
  } catch (error) {
    console.error('Failed to create coupon:', error);
    throw new Error('Failed to create coupon', { cause: error });
  }
}

export async function dbUpdateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
  try {
    const mappedUpdates: any = {};
    if (updates.code !== undefined) mappedUpdates.code = updates.code.toUpperCase().trim();
    if (updates.type !== undefined) mappedUpdates.type = updates.type;
    if (updates.value !== undefined) mappedUpdates.value = updates.value;
    if (updates.minOrderValue !== undefined) mappedUpdates.minOrderValue = updates.minOrderValue;
    if (updates.expiryDate !== undefined) mappedUpdates.expiryDate = updates.expiryDate;
    if (updates.active !== undefined) mappedUpdates.active = updates.active;

    await db.update(coupons).set(mappedUpdates).where(eq(coupons.id, id));

    const coups = await dbGetCoupons();
    const updated = coups.find(c => c.id === id);
    if (updated) return updated;
    throw new Error('Coupon not found');
  } catch (error) {
    console.error('Failed to update coupon:', error);
    throw new Error('Failed to update coupon', { cause: error });
  }
}

export async function dbDeleteCoupon(id: string): Promise<void> {
  try {
    await db.delete(coupons).where(eq(coupons.id, id));
  } catch (error) {
    console.error('Failed to delete coupon:', error);
    throw new Error('Failed to delete coupon', { cause: error });
  }
}

// -----------------------------------------------------------------
// AUTHENTICATION SERVICES
// -----------------------------------------------------------------
export async function dbSignInWithOtp(mobileNumber: string): Promise<{ success: boolean; message: string; mockOtp?: string }> {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const formattedPhone = `+91${cleanMobile}`;

  const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  simulatedOtps[cleanMobile] = simulatedOtp;

  return {
    success: true,
    message: `[PREVIEW MODE] Verification SMS sent.`,
    mockOtp: simulatedOtp
  };
}

export async function dbVerifyOtp(mobileNumber: string, otp: string): Promise<{ user: { id: string; phone: string } }> {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const formattedPhone = `+91${cleanMobile}`;
  const savedOtp = simulatedOtps[cleanMobile];

  if (otp === '123456' || savedOtp === otp) {
    const existingId = 'usr_' + Math.random().toString(36).substring(2, 11);
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

export async function dbSignOut(): Promise<void> {
  // Safe no-op
}
