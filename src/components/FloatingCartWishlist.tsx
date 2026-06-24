/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';

interface FloatingCartWishlistProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  wishlistCount: number;
  cartCount: number;
}

export default function FloatingCartWishlist({
  onOpenCart,
  onOpenWishlist,
  wishlistCount,
  cartCount,
}: FloatingCartWishlistProps) {
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // If user is near the very top of the page, keep the floating panel hidden
      // as the main header is fully visible there.
      if (currentScrollY < 150) {
        setVisible(false);
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        lastScrollY.current = currentScrollY;
        return;
      }

      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isScrollingDown) {
        // Hide immediately when scrolling down
        setVisible(false);
      } else {
        // Show immediately when scrolling up
        setVisible(true);
      }

      // Clear the previous idle check timer
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set a timer to show the controls when the user stops scrolling
      scrollTimeout.current = setTimeout(() => {
        if (window.scrollY >= 150) {
          setVisible(true);
        }
      }, 250);

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 transition-all duration-300 transform ${
        visible 
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
          : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
      }`}
    >
      <div className="bg-emerald-luxury/95 backdrop-blur-md border border-gold-champagne/40 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-4">
        {/* Wishlist Button */}
        <button
          onClick={onOpenWishlist}
          className="relative p-2 text-white/90 hover:text-gold-champagne transition-all active:scale-90 cursor-pointer flex items-center justify-center group"
          title="Wishlist"
          id="floating-wishlist-trigger"
        >
          <Heart className={`w-5.5 h-5.5 transition-transform group-hover:scale-110 ${wishlistCount > 0 ? 'fill-gold-rose stroke-gold-rose' : ''}`} />
          {wishlistCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-gold-rose text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-md">
              {wishlistCount}
            </span>
          )}
        </button>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-gold-champagne/30"></div>

        {/* Cart Button */}
        <button
          onClick={onOpenCart}
          className="relative p-2 text-white/90 hover:text-gold-champagne transition-all active:scale-90 cursor-pointer flex items-center justify-center group"
          title="Cart"
          id="floating-cart-trigger"
        >
          <ShoppingBag className="w-5.5 h-5.5 text-gold-champagne transition-transform group-hover:scale-110" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-white text-emerald-luxury text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-md">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
