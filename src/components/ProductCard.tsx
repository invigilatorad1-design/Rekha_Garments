/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, ShoppingCart, Sparkles, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  onViewProduct?: () => void;
}

export default function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onViewProduct,
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-ivory-dark flex flex-col justify-between"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square overflow-hidden bg-ivory cursor-pointer" onClick={onViewProduct}>
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
          className="absolute top-3.5 right-3.5 bg-white/95 hover:bg-white text-emerald-luxury p-2 rounded-full shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          id={`wishlist-btn-${product.id}`}
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isWishlisted ? 'fill-gold-rose text-gold-rose scale-110' : 'text-gray-400 group-hover:text-emerald-luxury'
            }`}
          />
        </button>

        {/* Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start">
          {product.category === 'jewellery' && (
            <span className="bg-gold-champagne text-emerald-luxury text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded shadow">
              1-Gram Gold
            </span>
          )}
          {product.collection && (
            <span className="bg-emerald-luxury text-gold-champagne text-[9px] uppercase tracking-wider font-sans font-medium px-2 py-0.5 rounded shadow">
              {product.collection} Coll.
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500 text-white text-[9px] uppercase tracking-wider font-sans font-bold px-2 py-0.5 rounded shadow">
              Only {product.stock} Left!
            </span>
          ) : null}
        </div>

        {/* View Details Quick Link */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-emerald-luxury/90 text-gold-champagne font-sans font-semibold tracking-wider text-[11px] uppercase px-3 py-1.5 rounded shadow-lg backdrop-blur-xs">
            Quick View
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 md:p-5 flex-grow flex flex-col justify-between">
        <div>
          {/* Subcategory & Stats */}
          <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-mono mb-1">
            <span>{product.subCategory}</span>
            <span>Views: {product.views}</span>
          </div>

          {/* Product Name */}
          <h3 
            className="font-serif text-sm md:text-base font-bold text-gray-900 group-hover:text-emerald-luxury transition-colors line-clamp-1 mb-1.5 cursor-pointer"
            onClick={onViewProduct}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Fabric or Collections Spec */}
          {product.fabric && (
            <p className="text-xs text-gray-500 font-sans line-clamp-1 mb-2">
              Fabric: <span className="text-gray-700 font-medium">{product.fabric}</span>
            </p>
          )}
          {product.category === 'jewellery' && (
            <p className="text-xs text-gray-500 font-sans line-clamp-1 mb-2">
              Style: <span className="text-gray-700 font-medium">{product.collection} Artistry</span>
            </p>
          )}

          {/* Size details */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.sizes.map((s) => (
                <span key={s} className="border border-ivory-dark text-[9px] font-mono text-gray-500 px-1 rounded">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          {/* Price Tag */}
          <div className="flex items-baseline justify-between pt-1 mb-4 border-t border-ivory-dark">
            <span className="text-xs text-gray-400 font-sans">Price</span>
            <span className="font-mono text-base md:text-lg font-bold text-emerald-luxury">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Add To Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            disabled={isOutOfStock}
            className={`w-full font-sans font-semibold text-xs uppercase tracking-widest py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-emerald-luxury hover:bg-emerald-light text-gold-champagne border border-emerald-luxury hover:border-gold-champagne/45'
            }`}
            id={`add-to-cart-btn-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add To Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
