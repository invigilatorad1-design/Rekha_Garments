/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Heart } from 'lucide-react';
import { OrderItem, Product } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  onUpdateQuantity: (productId: string, quantity: number, size?: string) => void;
  onRemoveItem: (productId: string, size?: string) => void;
  onSaveForLater: (item: OrderItem) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = subtotal > 500 || subtotal === 0;
  const shippingCost = isFreeShipping ? 0 : 100;
  const grandTotal = subtotal + shippingCost;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-overlay">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-2xl border-l border-ivory-dark">
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-emerald-luxury text-white flex items-center justify-between rounded-tl-2xl">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-gold-champagne" />
              <h2 className="font-serif text-lg font-bold tracking-wide">Your Luxury Cart</h2>
              <span className="bg-gold-champagne/20 text-gold-champagne text-[11px] px-2 py-0.5 rounded-full font-mono">
                {cartItems.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              id="close-cart-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gold-champagne/35 mb-4 animate-bounce" />
                <h3 className="font-serif text-base font-bold text-gray-800">Your Cart is Empty</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1.5 font-sans">
                  Treat yourself to our majestic silk garments or premium hand-polished 1-Gram antique jewellery.
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest px-5 py-2.5 rounded transition-all cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div 
                  key={`${item.productId}-${item.selectedSize || 'nosize'}-${index}`}
                  className="flex gap-4 p-3 bg-ivory rounded-xl border border-ivory-dark relative group"
                  id={`cart-item-${item.productId}`}
                >
                  {/* Item Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shrink-0 border border-ivory-dark">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Item Specs */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-gray-900 truncate pr-6">
                        {item.name}
                      </h4>
                      {item.selectedSize && (
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          Size: <span className="text-emerald-luxury font-bold">{item.selectedSize}</span>
                        </p>
                      )}
                      <p className="text-xs text-emerald-luxury font-bold font-mono mt-1">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-gray-200 bg-white rounded-lg px-1 py-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.selectedSize)}
                          disabled={item.quantity <= 1}
                          className="p-1 text-gray-500 hover:text-emerald-luxury hover:bg-gray-100 rounded disabled:opacity-45 cursor-pointer"
                          title="Decrease Quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold font-mono text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.selectedSize)}
                          className="p-1 text-gray-500 hover:text-emerald-luxury hover:bg-gray-100 rounded cursor-pointer"
                          title="Increase Quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onSaveForLater(item)}
                          className="text-[10px] text-gold-rose hover:text-red-700 font-sans font-semibold flex items-center gap-1 cursor-pointer"
                          title="Save for Later (Move to Wishlist)"
                        >
                          <Heart className="w-3 h-3 fill-gold-rose text-gold-rose" />
                          <span className="hidden sm:inline">Save</span>
                        </button>
                        <button
                          onClick={() => onRemoveItem(item.productId, item.selectedSize)}
                          className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Calculations & Footer Summary */}
          {cartItems.length > 0 && (
            <div className="border-t border-ivory-dark bg-ivory px-6 py-5 space-y-4 rounded-bl-2xl">
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs text-gray-500 font-sans">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-gray-950">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-sans">
                  <span>Delivery Charges</span>
                  <span className="font-mono font-medium text-gray-950">
                    {isFreeShipping ? (
                      <span className="text-green-600 font-semibold uppercase tracking-wider text-[10px]">Free Delivery</span>
                    ) : (
                      `₹${shippingCost}`
                    )}
                  </span>
                </div>
                {/* Free Shipping Progress Indicator */}
                {!isFreeShipping && (
                  <div className="bg-amber-50 text-amber-800 border border-amber-200/40 rounded-lg p-2 text-[10px] text-center font-sans">
                    Add <span className="font-bold">₹{(500 - subtotal).toLocaleString('en-IN')}</span> more to unlock <span className="font-bold uppercase">Free Delivery</span>!
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between text-sm text-gray-950 font-bold">
                  <span className="font-serif">Grand Total</span>
                  <span className="font-mono text-base text-emerald-luxury">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Secure Checkout Proceed Button */}
              <button
                onClick={onCheckout}
                className="w-full bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg cursor-pointer"
                id="cart-checkout-btn"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-gray-400 text-center font-sans mt-2">
                🔒 Safe, secure checkout encrypted with SSL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
