/**
 * App.tsx
 * Main Boutique Controller for Rekha Garments, powered by Supabase.
 * Connects the elite customer storefront and royal administrative panels in real-time.
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShoppingCart, 
  X, 
  Filter, 
  Sparkles, 
  SlidersHorizontal, 
  CheckCircle, 
  ChevronRight, 
  ArrowRight,
  RotateCcw,
  Star,
  Eye,
  AlertCircle,
  MessageCircle
} from 'lucide-react';

import { 
  dbGetProducts, 
  dbGetOrders, 
  dbGetCustomers, 
  dbGetCoupons, 
  dbUpdateProduct, 
  dbSignOut,
  subscribeToTable, 
  isRealSupabaseConfigured,
  supabase 
} from './supabase';
import { Product, Order, User, Coupon, Notification, OrderItem } from './types';

// Components
import CustomerHeader from './components/CustomerHeader';
import HeroCarousel from './components/HeroCarousel';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import FloatingCartWishlist from './components/FloatingCartWishlist';

export default function App() {
  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Navigation & Core States
  const [currentRoute, setCurrentRoute] = useState<'shop' | 'admin'>('shop');
  const [isAdmin, setIsAdmin] = useState(true); // Default enabled so they can access dashboard immediately
  const [activeCategory, setActiveCategory] = useState<'all' | 'garments' | 'jewellery'>('all');

  // Customer Persistent Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Modals Visibility
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');

  // Interactive Alerts / Confirms
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<Order | null>(null);

  // Filters for shop front
  // Garments Filters
  const [garmentSize, setGarmentSize] = useState<string>('all');
  const [garmentFabric, setGarmentFabric] = useState<string>('all');
  const [garmentSubCategory, setGarmentSubCategory] = useState<string>('all');
  
  // Jewellery Filters
  const [jewelleryCollection, setJewelleryCollection] = useState<string>('all');
  const [jewellerySubCategory, setJewellerySubCategory] = useState<string>('all');
  const [jewellerySort, setJewellerySort] = useState<'new' | 'popular' | 'default'>('default');

  // Price Range slider
  const [maxPrice, setMaxPrice] = useState<number>(15000);

  // Load and refresh initial datasets
  const loadAllData = async () => {
    try {
      const [prods, ords, custs, coups] = await Promise.all([
        dbGetProducts(),
        dbGetOrders(),
        dbGetCustomers(),
        dbGetCoupons()
      ]);
      setProducts(prods);
      setOrders(ords);
      setUsers(custs);
      setCoupons(coups);

      // Construct dynamic system notifications based on latest orders & stocks
      const customNotes: Notification[] = [];
      ords.slice(0, 5).forEach(o => {
        customNotes.push({
          id: `notif_order_${o.id}`,
          title: `New Checkout Order: ${o.id}`,
          message: `${o.customerName} checked out ${o.items.reduce((sum, i) => sum + i.quantity, 0)} items for ₹${o.total.toLocaleString('en-IN')}.`,
          type: 'order',
          timestamp: o.orderDate,
          read: false
        });
      });

      prods.filter(p => p.stock > 0 && p.stock <= 5).forEach(p => {
        customNotes.push({
          id: `notif_stock_${p.id}`,
          title: `Low Stock Advisory: ${p.name}`,
          message: `Only ${p.stock} units remaining in boutique inventory. Consider replenishing.`,
          type: 'stock',
          timestamp: p.createdTime,
          read: false
        });
      });

      setNotifications(customNotes);
    } catch (err: any) {
      console.error('Failed to sync boutique data:', err);
    }
  };

  useEffect(() => {
    loadAllData();

    // Subscribe to real-time table modifications
    const unsubProducts = subscribeToTable('products', () => {
      dbGetProducts().then(setProducts);
    });

    const unsubOrders = subscribeToTable('orders', () => {
      dbGetOrders().then(ords => {
        setOrders(ords);
        // Customer total metrics are derived from orders, so refresh customers as well
        dbGetCustomers().then(setUsers);
      });
    });

    const unsubCoupons = subscribeToTable('coupons', () => {
      dbGetCoupons().then(setCoupons);
    });

    // Sync Auth session
    if (isRealSupabaseConfigured && supabase) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          const uMobile = session.user.phone || session.user.user_metadata?.phone || '';
          const uName = session.user.user_metadata?.full_name || 'Valued Boutique Customer';
          
          dbGetCustomers().then(allUsers => {
            const found = allUsers.find(u => u.id === session.user.id);
            if (found) {
              setCurrentUser(found);
              localStorage.setItem('rekha_current_user', JSON.stringify(found));
            } else {
              import('./supabase').then(({ dbRegisterOrUpdateCustomer }) => {
                dbRegisterOrUpdateCustomer(session.user.id, uName, uMobile).then(newUser => {
                  setCurrentUser(newUser);
                  localStorage.setItem('rekha_current_user', JSON.stringify(newUser));
                });
              });
            }
          });
        }
      });

      // 2. Auth changes listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          const uMobile = session.user.phone || session.user.user_metadata?.phone || '';
          const uName = session.user.user_metadata?.full_name || 'Valued Boutique Customer';
          
          dbGetCustomers().then(allUsers => {
            const found = allUsers.find(u => u.id === session.user.id);
            if (found) {
              setCurrentUser(found);
              localStorage.setItem('rekha_current_user', JSON.stringify(found));
            } else {
              import('./supabase').then(({ dbRegisterOrUpdateCustomer }) => {
                dbRegisterOrUpdateCustomer(session.user.id, uName, uMobile).then(newUser => {
                  setCurrentUser(newUser);
                  localStorage.setItem('rekha_current_user', JSON.stringify(newUser));
                });
              });
            }
          });
        } else {
          setCurrentUser(null);
          localStorage.removeItem('rekha_current_user');
        }
      });

      return () => {
        unsubProducts();
        unsubOrders();
        unsubCoupons();
        subscription.unsubscribe();
      };
    } else {
      // preview/mock auth persistence fallback
      const savedUser = localStorage.getItem('rekha_current_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('rekha_current_user');
        }
      }

      return () => {
        unsubProducts();
        unsubOrders();
        unsubCoupons();
      };
    }
  }, []);

  // Sync state helpers
  const triggerToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Auth Callbacks
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('rekha_current_user', JSON.stringify(user));
    triggerToast(`Welcome back, ${user.name}! Secure session synchronized.`);
    loadAllData(); // reload users lists
  };

  const handleLogout = async () => {
    try {
      await dbSignOut();
      setCurrentUser(null);
      localStorage.removeItem('rekha_current_user');
      triggerToast('Logged out of secure session successfully.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Wishlist actions
  const handleToggleWishlist = (productId: string) => {
    let updated: string[] = [];
    if (wishlist.includes(productId)) {
      updated = wishlist.filter(id => id !== productId);
      triggerToast('Removed item from your boutique wishlist.', 'info');
    } else {
      updated = [...wishlist, productId];
      triggerToast('Added luxury item to your boutique wishlist!');
    }
    setWishlist(updated);
    localStorage.setItem('rekha_wishlist', JSON.stringify(updated));
  };

  // Cart actions
  const handleAddToCart = (product: Product, sizeToUse?: string) => {
    const finalSize = sizeToUse || (product.sizes && product.sizes[0]) || undefined;
    
    // Check if stock exists
    if (product.stock <= 0) {
      triggerToast('We apologize, this luxury item is currently sold out.', 'info');
      return;
    }

    const existingIndex = cart.findIndex(
      item => item.productId === product.id && item.selectedSize === finalSize
    );

    let updated: OrderItem[] = [];
    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images[0],
          selectedSize: finalSize
        }
      ];
    }
    setCart(updated);
    localStorage.setItem('rekha_cart', JSON.stringify(updated));
    triggerToast(`Added '${product.name}' to your luxury cart!`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number, size?: string) => {
    const updated = cart.map(item => {
      if (item.productId === productId && item.selectedSize === size) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    setCart(updated);
    localStorage.setItem('rekha_cart', JSON.stringify(updated));
  };

  const handleRemoveItem = (productId: string, size?: string) => {
    const updated = cart.filter(item => !(item.productId === productId && item.selectedSize === size));
    setCart(updated);
    localStorage.setItem('rekha_cart', JSON.stringify(updated));
    triggerToast('Removed item from your cart.', 'info');
  };

  const handleSaveForLater = (item: OrderItem) => {
    // Remove from cart
    handleRemoveItem(item.productId, item.selectedSize);
    // Add to wishlist if not already there
    if (!wishlist.includes(item.productId)) {
      handleToggleWishlist(item.productId);
    } else {
      triggerToast('Item saved in your boutique wishlist!');
    }
  };

  // Clear Cart
  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('rekha_cart');
  };

  // Filter calculations
  const garmentsSubcategories = Array.from(new Set(products.filter(p => p.category === 'garments').map(p => p.subCategory)));
  const garmentsFabrics = Array.from(new Set(products.filter(p => p.category === 'garments' && p.fabric).map(p => p.fabric as string)));
  
  const jewelleryCollections = Array.from(new Set(products.filter(p => p.category === 'jewellery' && p.collection).map(p => p.collection as string)));
  const jewellerySubcategories = Array.from(new Set(products.filter(p => p.category === 'jewellery').map(p => p.subCategory)));

  // Filtered Boutique Product list
  let displayedProducts = products.filter((p) => {
    // Hide archived products from customer display
    if (p.archived) return false;

    // Global max price slider
    if (p.price > maxPrice) return false;

    if (activeCategory === 'garments') {
      if (p.category !== 'garments') return false;
      if (garmentSubCategory !== 'all' && p.subCategory !== garmentSubCategory) return false;
      if (garmentFabric !== 'all' && p.fabric !== garmentFabric) return false;
      if (garmentSize !== 'all' && p.sizes && !p.sizes.includes(garmentSize)) return false;
    } else if (activeCategory === 'jewellery') {
      if (p.category !== 'jewellery') return false;
      if (jewellerySubCategory !== 'all' && p.subCategory !== jewellerySubCategory) return false;
      if (jewelleryCollection !== 'all' && p.collection !== jewelleryCollection) return false;
    } else {
      // All boutique view
      return true;
    }
    return true;
  });

  // Sorting for jewellery
  if (activeCategory === 'jewellery' && jewellerySort !== 'default') {
    displayedProducts = [...displayedProducts].sort((a, b) => {
      if (jewellerySort === 'new') {
        return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
      } else {
        // Popular
        return b.views - a.views;
      }
    });
  }

  const handleResetFilters = () => {
    setGarmentSize('all');
    setGarmentFabric('all');
    setGarmentSubCategory('all');
    setJewelleryCollection('all');
    setJewellerySubCategory('all');
    setJewellerySort('default');
    setMaxPrice(15000);
  };

  // Increment views on detail click
  const handleViewProduct = (p: Product) => {
    setSelectedProduct(p);
    setSelectedSize(p.sizes?.[0] || 'M');
    // Increment view count in Supabase asynchronously
    try {
      dbUpdateProduct(p.id, { views: p.views + 1 });
    } catch (err) {
      console.error('Failed to increment views:', err);
    }
  };

  // Render main routing
  if (currentRoute === 'admin') {
    return (
      <AdminPanel
        products={products}
        orders={orders}
        users={users}
        notifications={notifications}
        onRefreshAll={loadAllData}
        onExitAdmin={() => {
          setCurrentRoute('shop');
          triggerToast('Returned to Customer Boutique front.');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between" id="customer-shop-root">
      {/* 1. SCROLLABLE HEADER */}
      <CustomerHeader
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        wishlistCount={wishlist.length}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onNavigateToAdmin={() => setCurrentRoute('admin')}
        isAdmin={isAdmin}
        onToggleAdmin={() => {
          setIsAdmin(!isAdmin);
          triggerToast(`System Admin Access is now ${!isAdmin ? 'Enabled (Check header button!)' : 'Disabled'}.`);
        }}
      />

      {/* Floating Cart & Wishlist Trigger (Pops up when scrolling stops or scrolling up) */}
      <FloatingCartWishlist
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        wishlistCount={wishlist.length}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
      />

      {/* Real-time system toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-luxury text-gold-champagne font-mono text-xs p-4 rounded-xl border border-gold-champagne/20 shadow-2xl flex items-center gap-2.5 max-w-sm animate-fade-in">
          <Sparkles className="w-4.5 h-4.5 text-gold-champagne shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 2. AUTO-SLIDING PREMIUM CAROUSEL */}
      {activeCategory === 'all' && (
        <HeroCarousel onCategorySelect={setActiveCategory} />
      )}

      {/* 3. MAIN BOUTIQUE SECTION */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-grow w-full">
        
        {/* Dynamic header title */}
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs uppercase tracking-[0.3em] font-sans text-gold-dark font-bold">
            {activeCategory === 'all' ? 'The Whole Boutique' : activeCategory === 'garments' ? "Women's Royal Apparel" : "1-Gram Antique Jewellery"}
          </span>
          <h2 className="font-serif text-3xl md:text-4.5xl font-bold text-emerald-luxury tracking-wide">
            {activeCategory === 'all' && 'Handcrafted Royal Collections'}
            {activeCategory === 'garments' && "The Saree, Kurta & Lehenga Legacy"}
            {activeCategory === 'jewellery' && 'Imperial Gold & Polki Artistry'}
          </h2>
          <div className="w-16 h-0.5 bg-gold-champagne mx-auto"></div>
        </div>

        {/* Filter Drawer / Sidebar Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* FILTER CONSOLE PANEL (Left sidebar) */}
          <div className="bg-white p-5 rounded-2xl border border-ivory-dark shadow-xs space-y-6 h-fit shrink-0">
            <div className="flex justify-between items-center border-b border-ivory-dark pb-3">
              <span className="font-serif font-bold text-gray-800 flex items-center gap-2 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-gold-champagne" />
                Filter Collections
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-[10px] text-gray-400 hover:text-emerald-luxury font-sans font-semibold flex items-center gap-1 cursor-pointer"
                title="Reset active selections"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Price range filter */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-sans">
                <span>Maximum Price</span>
                <span className="font-mono font-bold text-emerald-luxury">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={15000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-luxury bg-ivory h-1 rounded cursor-pointer"
              />
            </div>

            {/* Dynamic filters based on active category selection */}
            {activeCategory === 'garments' && (
              <div className="space-y-4">
                {/* Garments Subcategory */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Garment Type</label>
                  <select
                    value={garmentSubCategory}
                    onChange={(e) => setGarmentSubCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-ivory text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Garments</option>
                    {garmentsSubcategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Garment Fabric */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Silk / Fabric Family</label>
                  <select
                    value={garmentFabric}
                    onChange={(e) => setGarmentFabric(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-ivory text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Fabrics</option>
                    {garmentsFabrics.map(fab => <option key={fab} value={fab}>{fab}</option>)}
                  </select>
                </div>

                {/* Sizes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Available Sizes</label>
                  <select
                    value={garmentSize}
                    onChange={(e) => setGarmentSize(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-ivory text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Sizes</option>
                    <option value="S">Small (S)</option>
                    <option value="M">Medium (M)</option>
                    <option value="L">Large (L)</option>
                    <option value="XL">Extra Large (XL)</option>
                    <option value="XXL">Double Extra Large (XXL)</option>
                    <option value="Free Size">Free Size (Saree)</option>
                  </select>
                </div>
              </div>
            )}

            {activeCategory === 'jewellery' && (
              <div className="space-y-4">
                {/* Jewellery Subcategory */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Jewellery Type</label>
                  <select
                    value={jewellerySubCategory}
                    onChange={(e) => setJewellerySubCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-ivory text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Ornaments</option>
                    {jewellerySubcategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Jewellery Collections */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Artisanal Style</label>
                  <select
                    value={jewelleryCollection}
                    onChange={(e) => setJewelleryCollection(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-ivory text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Styles</option>
                    {jewelleryCollections.map(coll => <option key={coll} value={coll}>{coll} Collection</option>)}
                  </select>
                </div>

                {/* Jewellery Sorts */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Sort Parameters</label>
                  <select
                    value={jewellerySort}
                    onChange={(e: any) => setJewellerySort(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-ivory text-gray-700 cursor-pointer"
                  >
                    <option value="default">Default Boutique Sort</option>
                    <option value="new">New Arrivals First</option>
                    <option value="popular">Most Viewed Popular</option>
                  </select>
                </div>
              </div>
            )}

            {activeCategory === 'all' && (
              <p className="text-[10px] text-gray-400 font-sans italic text-center">
                Select 'Women's Garments' or '1-Gram Jewellery' tabs above to access specialized luxury filters.
              </p>
            )}
          </div>

          {/* PRODUCT DISPLAY GRID FRONT */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center text-xs text-gray-400 font-sans border-b border-ivory-dark pb-3">
              <span>Showing <span className="font-bold text-gray-800">{displayedProducts.length}</span> luxury drapes & sets</span>
              <span>Secure verified boutique drapes</span>
            </div>

            {displayedProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-ivory-dark">
                <AlertCircle className="w-12 h-12 text-gold-champagne/45 mx-auto mb-3" />
                <h3 className="font-serif text-base font-bold text-gray-800">No Matching Crafts Found</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 font-sans">
                  Try adjusting your budget price filters or choosing other fabric families.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 bg-emerald-luxury hover:bg-emerald-light text-gold-champagne px-4 py-2 rounded font-sans text-xs uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    isWishlisted={wishlist.includes(prod.id)}
                    onToggleWishlist={() => handleToggleWishlist(prod.id)}
                    onAddToCart={() => handleAddToCart(prod)}
                    onViewProduct={() => handleViewProduct(prod)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. ORDER RECEIPT CONFIRMATION POPUP */}
      {orderReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-gold-champagne/30 animate-scale-up">
            <div className="bg-emerald-luxury text-center py-6 text-white px-6">
              <CheckCircle className="w-12 h-12 text-gold-champagne mx-auto mb-2.5" />
              <h3 className="font-serif text-lg md:text-xl font-bold text-gold-champagne">Order Confirmed Successfully!</h3>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">Invoice ID: {orderReceipt.id}</p>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <p className="text-gray-600 text-center">
                Thank you for shopping at <strong>Rekha Garments</strong>. Your order is secured on Supabase PostgreSQL and ready for processing.
              </p>

              <div className="bg-ivory border rounded-xl p-4 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer Name</span>
                  <span className="font-bold text-gray-800">{orderReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mobile Alerts</span>
                  <span className="text-gray-800">+91 {orderReceipt.customerMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Destination</span>
                  <span className="text-gray-800 text-right truncate max-w-[200px]">{orderReceipt.shippingAddress.addressLine}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/50 pt-2 text-emerald-luxury font-bold">
                  <span>Grand Total Paid</span>
                  <span>₹{orderReceipt.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => setOrderReceipt(null)}
                className="w-full bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-bold text-xs uppercase tracking-widest py-3 rounded-lg cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. WISHLIST PANEL DRAW-OVER */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-fade-in" id="wishlist-overlay">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer" onClick={() => setIsWishlistOpen(false)} />
          <div className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-2xl border-l border-ivory-dark z-10">
            <div className="px-6 py-5 bg-emerald-luxury text-white flex items-center justify-between rounded-tl-2xl">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-gold-rose fill-gold-rose" />
                <h3 className="font-serif text-lg font-bold">My Boutique Wishlist</h3>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="text-white hover:text-gold-champagne cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Heart className="w-12 h-12 text-gold-rose/35 mx-auto animate-pulse" />
                  <p className="font-serif text-sm font-bold text-gray-800">Your Wishlist is Empty</p>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">Click the heart icon on boutique clothing or antique sets to save your luxury favorites.</p>
                </div>
              ) : (
                products.filter(p => wishlist.includes(p.id)).map(p => (
                  <div key={p.id} className="flex gap-4 p-3 bg-ivory rounded-xl border relative">
                     <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded-md border" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-xs font-bold text-gray-900 truncate">{p.name}</h4>
                        <p className="font-mono text-emerald-luxury font-bold text-xs mt-1">₹{p.price.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => {
                            handleAddToCart(p);
                            setIsWishlistOpen(false);
                            setIsCartOpen(true);
                          }}
                          className="bg-emerald-luxury hover:bg-emerald-light text-gold-champagne text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer"
                        >
                          Add To Cart
                        </button>
                        <button
                          onClick={() => handleToggleWishlist(p.id)}
                          className="text-[10px] text-red-500 hover:text-red-700 cursor-pointer font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. PRODUCT QUICK VIEW MODAL DETAIL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-ivory-dark flex flex-col md:flex-row max-h-[85vh]">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute md:relative top-4 right-4 md:top-auto md:right-auto bg-white/90 hover:bg-white text-gray-500 p-2 rounded-full cursor-pointer md:hidden z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left image stage */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-ivory relative">
              <img 
                src={selectedProduct.images[0]} 
                alt={selectedProduct.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-4 left-4 bg-emerald-luxury text-gold-champagne text-[9px] uppercase tracking-widest px-3 py-1 rounded font-bold font-sans">
                {selectedProduct.category === 'garments' ? "Pure Silk" : "1-Gram Antique"}
              </span>

              {/* Floating Enquire on WhatsApp Button */}
              <a
                href={`https://wa.me/918197980187?text=${encodeURIComponent(`Hello Rekha Garments, I would like to enquire about the product: ${selectedProduct.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 bg-[#25D366] hover:bg-[#128C7E] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-full shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 z-10 border border-white/20"
                id="whatsapp-product-enquiry"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>Enquire on WhatsApp</span>
              </a>
            </div>

            {/* Right info stage */}
            <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                  <span>{selectedProduct.subCategory}</span>
                  <span className="flex items-center gap-0.5"><Eye className="w-3.5 h-3.5 text-gold-champagne" /> {selectedProduct.views} Views</span>
                </div>

                <h3 className="font-serif text-lg md:text-xl font-bold text-gray-900 mt-1.5">{selectedProduct.name}</h3>
                
                <div className="flex items-center gap-1.5 my-2.5">
                  <div className="flex text-gold-champagne">
                    <Star className="w-3.5 h-3.5 fill-gold-champagne" />
                    <Star className="w-3.5 h-3.5 fill-gold-champagne" />
                    <Star className="w-3.5 h-3.5 fill-gold-champagne" />
                    <Star className="w-3.5 h-3.5 fill-gold-champagne" />
                    <Star className="w-3.5 h-3.5 fill-gold-champagne" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-sans">Handcrafted Rating</span>
                </div>

                <p className="text-xs text-gray-600 font-sans leading-relaxed mt-2 italic">
                  "{selectedProduct.description}"
                </p>

                {/* Sizes selections for garments */}
                {selectedProduct.category === 'garments' && selectedProduct.sizes && (
                  <div className="space-y-1.5 mt-4">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Select Size Option</p>
                    <div className="flex gap-2">
                      {selectedProduct.sizes.map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                            selectedSize === s 
                              ? 'border-emerald-luxury bg-emerald-luxury text-gold-champagne ring-1 ring-gold-champagne' 
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.fabric && (
                  <p className="text-xs text-gray-500 font-sans mt-4">
                    Fabric structure: <span className="font-bold text-gray-800">{selectedProduct.fabric}</span>
                  </p>
                )}
                {selectedProduct.collection && (
                  <p className="text-xs text-gray-500 font-sans mt-4">
                    Imperial Style: <span className="font-bold text-gray-800">{selectedProduct.collection} Artistry</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-baseline py-2.5 border-t border-ivory-dark">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Pricing</span>
                  <span className="font-mono text-lg font-bold text-emerald-luxury">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct, selectedSize);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ShoppingCart className="w-4.5 h-4.5" />
                    <span>Add To Cart</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleWishlist(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                    className="p-3 border border-ivory-dark rounded-xl hover:bg-gray-50 text-gray-500 cursor-pointer"
                    title="Add to Wishlist"
                  >
                    <Heart className={`w-4.5 h-4.5 ${wishlist.includes(selectedProduct.id) ? 'fill-gold-rose text-gold-rose' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. REUSABLE CART SIDEBAR DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onSaveForLater={handleSaveForLater}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* 8. AUTH OTP LOGIN MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* 9. SECURE MULTI-STEP CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        currentUser={currentUser}
        onClearCart={handleClearCart}
        onOrderSuccess={(ord) => setOrderReceipt(ord)}
      />

      {/* 10. LUXURY FOOTER BRANDING */}
      <footer className="bg-emerald-luxury text-white pt-10 pb-6 border-t border-gold-champagne/15 mt-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-gold-champagne tracking-wider">REKHA GARMENTS</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Serving unmatched elegance in Women's Apparel, Pure Kanjeevaram Silks, and 1-Gram Antique Gold Jewellery with pride. Inspired by Indian royal lineage.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-gold-champagne font-bold">Secure Boutiques</h4>
            <ul className="space-y-2 text-xs text-white/75">
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>Hospet Flagship Home Shop</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🛡️</span>
                <span>Insured Transit Guarantee</span>
              </li>
              <li className="flex items-start gap-2">
                <span>⭐</span>
                <span>100% Customer Satisfaction</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🏆</span>
                <span>Since 10+ years in Hospet Home Shop Business</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-gold-champagne font-bold">Contact & Alarms</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              Customer support lines verified under Supabase PostgreSQL and SMS alerts. For assistance, reach out at info@rekhagarments.com.
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-white/50 pt-5">
          Made with ♥ by Karthik Jadhav in Bangalore
        </p>
      </footer>
    </div>
  );
}
