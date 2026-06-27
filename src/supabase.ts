/**
 * Client-side Database Adapter for Rekha Garments.
 * Routes all requests securely through our Express server backend.
 * Completely eliminates any direct use of secret keys or Supabase clients in the browser.
 */

import { Product, Coupon, User, Order, OrderItem } from './types';

const url = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabaseConfigured = (() => {
  try {
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();
    if (trimmedUrl === '' || trimmedKey === '') return false;
    if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('http://')) return false;
    if (trimmedUrl.includes('MY_SUPABASE') || trimmedKey.includes('MY_KEY')) return false;
    if (trimmedUrl.includes('your-') || trimmedKey.includes('your-')) return false;
    if (trimmedUrl.includes('placeholder') || trimmedKey.includes('placeholder')) return false;
    if (!trimmedUrl.includes('.')) return false;
    
    // Check if the key looks like a real Supabase JWT anon key (always starts with eyJ)
    if (!trimmedKey.startsWith('eyJ')) return false;
    
    new URL(trimmedUrl);
    return true;
  } catch (e) {
    return false;
  }
})();

// Helper to store session changes local listeners
type AuthCallback = (event: string, session: any) => void;
const authListeners = new Set<AuthCallback>();

const getStoredSession = () => {
  const userStr = localStorage.getItem('rekha_current_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return {
        session: {
          user: {
            id: user.id,
            phone: user.mobile,
            user_metadata: {
              full_name: user.name,
              phone: user.mobile
            }
          }
        }
      };
    } catch (e) {}
  }
  return { session: null };
};

// Mock Supabase client for client-side Auth lifecycle compatibility
export const supabase = {
  auth: {
    async getSession() {
      return { data: getStoredSession(), error: null };
    },
    onAuthStateChange(callback: AuthCallback) {
      authListeners.add(callback);
      const sessionData = getStoredSession().session;
      // Trigger initial callback
      setTimeout(() => callback(sessionData ? 'SIGNED_IN' : 'SIGNED_OUT', sessionData), 50);
      
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            }
          }
        }
      };
    }
  }
} as any;

// Trigger state change helper
function triggerAuthStateChange(event: 'SIGNED_IN' | 'SIGNED_OUT') {
  const sessionData = getStoredSession().session;
  authListeners.forEach(listener => {
    try {
      listener(event, sessionData);
    } catch (e) {}
  });
}

// Realtime subscription simulation via polling
type RealtimeCallback = (payload: any) => void;
export function subscribeToTable(table: string, callback: RealtimeCallback): () => void {
  // Poll every 8 seconds to fetch fresh datasets
  const intervalId = setInterval(() => {
    callback({
      eventType: 'UPDATE',
      table,
      new: {},
      old: {}
    });
  }, 8000);

  return () => {
    clearInterval(intervalId);
  };
}

// -----------------------------------------------------------------
// PRODUCTS SERVICE
// -----------------------------------------------------------------
export async function dbGetProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch products');
  }
  return res.json();
}


function getAuthHeaders(existingHeaders: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('rekha_admin_token') : null;
  if (token) {
    return {
      ...existingHeaders,
      'Authorization': `Bearer ${token}`
    };
  }
  return existingHeaders;
}

export async function dbAddProduct(p: Partial<Product>): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(p)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add product');
  }
  return res.json();
}

export async function dbUpdateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update product');
  }
  return res.json();
}

export async function dbDeleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete product');
  }
}

// -----------------------------------------------------------------
// CUSTOMERS SERVICE
// -----------------------------------------------------------------
export async function dbGetCustomers(): Promise<User[]> {
  const res = await fetch('/api/customers', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch customers');
  }
  return res.json();
}

export async function dbGetCustomerByMobile(mobileNumber: string): Promise<User | null> {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const res = await fetch(`/api/customers/by-mobile/${cleanMobile}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch customer by mobile');
  }
  return res.json();
}

export async function dbRegisterOrUpdateCustomer(id: string, fullName: string, mobileNumber: string): Promise<User> {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name: fullName, mobile: mobileNumber })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to register/update customer');
  }
  return res.json();
}

// -----------------------------------------------------------------
// ORDERS SERVICE
// -----------------------------------------------------------------
export async function dbGetOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders', {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch orders');
  }
  return res.json();
}

export async function dbGetCustomerOrders(customerId: string, mobileNumber: string): Promise<Order[]> {
  const query = new URLSearchParams();
  if (customerId) query.append('customerId', customerId);
  if (mobileNumber) query.append('mobile', mobileNumber);
  
  const res = await fetch(`/api/orders/customer?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch customer orders');
  }
  return res.json();
}

export async function dbCreateOrder(o: Partial<Order>): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(o)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create order');
  }
  return res.json();
}

export async function dbUpdateOrderStatus(orderId: string, status: string, timelineOrNote: any): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status, timeline: timelineOrNote })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update order status');
  }
  return res.json();
}

// -----------------------------------------------------------------
// COUPONS SERVICE
// -----------------------------------------------------------------
export async function dbGetCoupons(): Promise<Coupon[]> {
  const res = await fetch('/api/coupons');
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch coupons');
  }
  return res.json();
}

export async function dbCreateCoupon(c: Partial<Coupon>): Promise<Coupon> {
  const res = await fetch('/api/coupons', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(c)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create coupon');
  }
  return res.json();
}

export async function dbUpdateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
  const res = await fetch(`/api/coupons/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update coupon');
  }
  return res.json();
}

export async function dbDeleteCoupon(id: string): Promise<void> {
  const res = await fetch(`/api/coupons/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete coupon');
  }
}

// -----------------------------------------------------------------
// AUTHENTICATION SERVICES
// -----------------------------------------------------------------
export async function dbSignInWithOtp(mobileNumber: string): Promise<{ success: boolean; message: string; mockOtp?: string }> {
  const res = await fetch('/api/auth/otp-send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: mobileNumber })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send OTP');
  }
  return res.json();
}

export async function dbVerifyOtp(mobileNumber: string, otp: string): Promise<{ user: { id: string; phone: string } }> {
  const res = await fetch('/api/auth/otp-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: mobileNumber, otp })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to verify OTP');
  }
  
  const data = await res.json();
  // Store session in localStorage for standard state persistence
  const mockUser: User = {
    id: data.user.id,
    name: 'Valued Boutique Customer',
    mobile: mobileNumber.replace(/\D/g, ''),
    registrationDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    totalOrders: 0,
    totalSpending: 0
  };
  localStorage.setItem('rekha_current_user', JSON.stringify(mockUser));
  
  // Trigger listener update
  triggerAuthStateChange('SIGNED_IN');
  
  return data;
}

export async function dbSignOut(): Promise<void> {
  await fetch('/api/auth/signout', {
    method: 'POST'
  });
  localStorage.removeItem('rekha_current_user');
  triggerAuthStateChange('SIGNED_OUT');
}
