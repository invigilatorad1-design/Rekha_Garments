/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, Heart, ShieldCheck, LogIn, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { User } from '../types';

interface CustomerHeaderProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  wishlistCount: number;
  cartCount: number;
  activeCategory: 'all' | 'garments' | 'jewellery';
  setActiveCategory: (category: 'all' | 'garments' | 'jewellery') => void;
  onNavigateToAdmin: () => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

export default function CustomerHeader({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenCart,
  onOpenWishlist,
  wishlistCount,
  cartCount,
  activeCategory,
  setActiveCategory,
  onNavigateToAdmin,
  isAdmin,
  onToggleAdmin,
}: CustomerHeaderProps) {
  return (
    <header className="relative z-40 bg-emerald-luxury text-white shadow-md">
      {/* Top Banner */}
      <div className="bg-emerald-deep text-center py-1.5 text-xs tracking-widest text-gold-champagne font-medium border-b border-emerald-luxury/30 px-4 flex justify-between items-center max-w-7xl mx-auto">
        <span>✨ FESTIVAL SPECIAL: FLAT 15% OFF ON JEWELLERY (CODE: REKHA15) ✨</span>
        <button 
          onClick={onToggleAdmin}
          className="hover:text-white transition-colors flex items-center gap-1.5 font-sans cursor-pointer text-[10px] md:text-xs bg-emerald-light/50 px-2 py-0.5 rounded border border-gold-champagne/30"
          id="toggle-admin-role-btn"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>System Admin Mode</span>
        </button>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        {/* Left: Brand Name with Editorial Serif font */}
        <div className="flex flex-col cursor-pointer select-none" onClick={() => setActiveCategory('all')}>
          <h1 className="font-serif text-2xl md:text-3.5xl tracking-wide font-bold text-gold-champagne hover:opacity-90 transition-opacity">
            REKHA GARMENTS
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/70 -mt-1 font-sans">
            Women's Apparel & 1-Gram Jewellery
          </p>
        </div>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium">
          <button
            onClick={() => setActiveCategory('all')}
            className={`cursor-pointer pb-1 border-b-2 transition-all ${
              activeCategory === 'all'
                ? 'border-gold-champagne text-gold-champagne'
                : 'border-transparent text-white/80 hover:text-white hover:border-white/50'
            }`}
          >
            All Boutique
          </button>
          <button
            onClick={() => setActiveCategory('garments')}
            className={`cursor-pointer pb-1 border-b-2 transition-all ${
              activeCategory === 'garments'
                ? 'border-gold-champagne text-gold-champagne'
                : 'border-transparent text-white/80 hover:text-white hover:border-white/50'
            }`}
          >
            Women's Garments
          </button>
          <button
            onClick={() => setActiveCategory('jewellery')}
            className={`cursor-pointer pb-1 border-b-2 transition-all ${
              activeCategory === 'jewellery'
                ? 'border-gold-champagne text-gold-champagne'
                : 'border-transparent text-white/80 hover:text-white hover:border-white/50'
            }`}
          >
            1-Gram Jewellery
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Admin Navigation Button if current role is Admin */}
          {isAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="bg-gold-champagne hover:bg-gold-light text-emerald-luxury px-3 py-1.5 rounded font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow cursor-pointer"
              id="header-admin-dashboard-btn"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 text-white/80 hover:text-gold-champagne transition-colors cursor-pointer"
            title="Wishlist"
            id="wishlist-trigger"
          >
            <Heart className={`w-5 md:w-6 h-5 md:h-6 ${wishlistCount > 0 ? 'fill-gold-rose stroke-gold-rose' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 bg-gold-rose text-white text-[10px] w-4 md:w-4.5 h-4 md:h-4.5 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-white/80 hover:text-gold-champagne transition-colors cursor-pointer"
            title="Cart"
            id="cart-trigger"
          >
            <ShoppingBag className="w-5 md:w-6 h-5 md:h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-gold-champagne text-emerald-luxury text-[10px] w-4 md:w-4.5 h-4 md:h-4.5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Section / Login */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-gold-champagne">{currentUser.name}</span>
                <span className="text-[10px] text-white/60 font-mono">{currentUser.mobile}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-white/80 hover:text-gold-rose transition-colors cursor-pointer"
                title="Log Out"
                id="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-emerald-light hover:bg-emerald-deep hover:border-gold-champagne border border-transparent text-white text-xs px-3 md:px-4 py-2 rounded flex items-center gap-1.5 transition-all cursor-pointer font-medium"
              id="login-trigger-btn"
            >
              <LogIn className="w-4 h-4 text-gold-champagne" />
              <span>Login / OTP</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Bar (Mobile) */}
      <div className="md:hidden flex justify-around items-center py-2.5 bg-emerald-light/30 border-t border-emerald-light/40 text-xs tracking-widest uppercase font-medium">
        <button
          onClick={() => setActiveCategory('all')}
          className={`cursor-pointer px-2 py-1 rounded transition-colors ${
            activeCategory === 'all' ? 'text-gold-champagne font-bold bg-emerald-deep/40' : 'text-white/80'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveCategory('garments')}
          className={`cursor-pointer px-2 py-1 rounded transition-colors ${
            activeCategory === 'garments' ? 'text-gold-champagne font-bold bg-emerald-deep/40' : 'text-white/80'
          }`}
        >
          Garments
        </button>
        <button
          onClick={() => setActiveCategory('jewellery')}
          className={`cursor-pointer px-2 py-1 rounded transition-colors ${
            activeCategory === 'jewellery' ? 'text-gold-champagne font-bold bg-emerald-deep/40' : 'text-white/80'
          }`}
        >
          Jewellery
        </button>
      </div>
    </header>
  );
}
