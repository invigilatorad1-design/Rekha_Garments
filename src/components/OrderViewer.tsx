/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  MessageCircle, 
  ArrowLeft, 
  Clock, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Package,
  FileText
} from 'lucide-react';
import { Order, User } from '../types';

interface OrderViewerProps {
  orders: Order[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onBackToShop: () => void;
}

export default function OrderViewer({
  orders,
  currentUser,
  onOpenAuth,
  onBackToShop,
}: OrderViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Filter orders by current customer (mobile or ID match)
  const customerOrders = currentUser
    ? orders.filter(o => {
        const cleanUserMobile = currentUser.mobile.replace(/\D/g, '');
        const cleanOrderMobile = o.customerMobile.replace(/\D/g, '');
        return o.customerId === currentUser.id || cleanUserMobile === cleanOrderMobile;
      })
    : [];

  // Apply search query and status category filters
  const filteredOrders = customerOrders.filter(o => {
    // Search query
    const idMatch = o.id.toLowerCase().includes(searchQuery.toLowerCase());
    const itemMatch = o.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const addressMatch = o.shippingAddress.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = idMatch || itemMatch || addressMatch;

    // Status category
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return o.status === 'Pending';
    if (statusFilter === 'active') return o.status === 'Processing' || o.status === 'Shipped';
    if (statusFilter === 'completed') return o.status === 'Delivered';
    if (statusFilter === 'cancelled') return o.status === 'Cancelled';
    return true;
  });

  // Sort by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
  });

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', icon: Clock };
      case 'Processing':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', icon: Package };
      case 'Shipped':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700', icon: Truck };
      case 'Delivered':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-800', icon: CheckCircle2 };
      case 'Cancelled':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', icon: AlertCircle };
      default:
        return { bg: 'bg-gray-50 text-gray-700 border-gray-200', text: 'text-gray-700', icon: Clock };
    }
  };

  const steps: { label: string; key: Order['status']; description: string }[] = [
    { label: 'Pending', key: 'Pending', description: 'Placed' },
    { label: 'Processing', key: 'Processing', description: 'Readying' },
    { label: 'Shipped', key: 'Shipped', description: 'In Transit' },
    { label: 'Delivered', key: 'Delivered', description: 'Completed' },
  ];

  return (
    <div className="bg-ivory min-h-screen py-10 px-4 md:px-8 font-sans text-gray-800" id="order-viewer-page">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button
              onClick={onBackToShop}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-luxury hover:text-emerald-light transition-colors mb-2 cursor-pointer"
              id="back-to-boutique-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Boutique</span>
            </button>
            <h2 className="font-serif text-3xl font-bold text-emerald-luxury">My Order History</h2>
            <p className="text-xs text-gray-500 mt-1">Track status, download invoices, and enquire about past bookings.</p>
          </div>

          {currentUser && (
            <div className="bg-white/80 border border-emerald-luxury/10 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-gold-champagne/20 flex items-center justify-center text-emerald-luxury font-serif font-bold text-sm">
                {currentUser.name[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{currentUser.name}</p>
                <p className="text-[10px] text-gray-500 font-mono">+91 {currentUser.mobile}</p>
              </div>
            </div>
          )}
        </div>

        {/* If customer is NOT logged in */}
        {!currentUser ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-ivory-dark p-8 md:p-12 text-center shadow-md max-w-lg mx-auto mt-10"
            id="not-logged-in-state"
          >
            <div className="w-16 h-16 rounded-full bg-gold-champagne/20 flex items-center justify-center text-emerald-luxury mx-auto mb-6">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Secure Authentication Required</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              To view or track your beautiful sarees, lehengas, or antique gold temple jewellery order, please sign in using your mobile number.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans py-3 px-6 rounded-xl text-sm font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
              id="order-viewer-login-btn"
            >
              Sign In with OTP
            </button>
            <button
              onClick={onBackToShop}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-emerald-luxury/70 hover:text-emerald-luxury transition-colors cursor-pointer"
            >
              Or Continue Browsing
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl border border-ivory-dark p-4 md:p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, item name, or billing..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-luxury/50 focus:border-emerald-luxury transition-all"
                    id="order-search-input"
                  />
                </div>
                
                {/* Filter segments */}
                <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {(['all', 'pending', 'active', 'completed', 'cancelled'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        statusFilter === filter
                          ? 'bg-emerald-luxury text-gold-champagne shadow-xs'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Listing */}
            {sortedOrders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-ivory-dark p-12 text-center shadow-xs"
                id="empty-orders-state"
              >
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-4 border border-gray-100">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-1">No Orders Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? "We couldn't find any orders matching your criteria. Try resetting filters." 
                    : "You haven't placed any bookings on our boutique store yet. Explore our exquisite designer collections."}
                </p>
                {searchQuery || statusFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="px-5 py-2 border border-emerald-luxury text-emerald-luxury text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-luxury/5 transition-all cursor-pointer"
                  >
                    Clear Search & Filters
                  </button>
                ) : (
                  <button
                    onClick={onBackToShop}
                    className="px-6 py-2.5 bg-emerald-luxury hover:bg-emerald-light text-gold-champagne text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-md"
                  >
                    Explore Boutique Collections
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {sortedOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const statusConf = getStatusColor(order.status);
                  const StatusIcon = statusConf.icon;

                  return (
                    <div 
                      key={order.id} 
                      className="bg-white rounded-2xl border border-ivory-dark shadow-xs overflow-hidden transition-all duration-200"
                    >
                      {/* Summary Card Header */}
                      <div 
                        onClick={() => toggleExpandOrder(order.id)}
                        className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-ivory/20 transition-all select-none"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-400 uppercase">ORDER ID:</span>
                            <span className="font-mono text-xs font-bold text-emerald-luxury bg-emerald-luxury/5 border border-emerald-luxury/10 px-2 py-0.5 rounded-md">{order.id}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {new Date(order.orderDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span>•</span>
                            <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)} Items</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Paid Total</p>
                            <p className="font-mono text-sm md:text-base font-bold text-emerald-luxury">₹{order.total.toLocaleString('en-IN')}</p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConf.bg}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {order.status}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Order Details Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-100 bg-gray-50/50"
                          >
                            <div className="p-5 md:p-6 space-y-6">
                              {/* 1. Live Interactive Progress Bar Tracker */}
                              {order.status !== 'Cancelled' && (
                                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-2xs">
                                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-4">Live Dispatch Tracker</h4>
                                  
                                  <div className="relative flex justify-between items-center max-w-xl mx-auto py-2">
                                    {/* Progress background line */}
                                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
                                    
                                    {/* Active line width depending on status */}
                                    <div 
                                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-luxury rounded-full z-0 transition-all duration-500" 
                                      style={{
                                        width: 
                                          order.status === 'Pending' ? '0%' :
                                          order.status === 'Processing' ? '33.33%' :
                                          order.status === 'Shipped' ? '66.66%' :
                                          order.status === 'Delivered' ? '100%' : '0%'
                                      }}
                                    />

                                    {/* Circles */}
                                    {steps.map((step, idx) => {
                                      const isCurrent = order.status === step.key;
                                      const isPassed = steps.findIndex(s => s.key === order.status) >= idx;
                                      
                                      return (
                                        <div key={idx} className="flex flex-col items-center relative z-10 text-center">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                            isCurrent 
                                              ? 'bg-emerald-luxury text-gold-champagne ring-4 ring-emerald-luxury/15 font-bold' 
                                              : isPassed 
                                                ? 'bg-emerald-luxury text-gold-champagne' 
                                                : 'bg-white text-gray-300 border-2 border-gray-200'
                                          }`}>
                                            {isPassed ? (
                                              <CheckCircle2 className="w-4 h-4 text-gold-champagne" />
                                            ) : (
                                              <span className="text-xs font-mono">{idx + 1}</span>
                                            )}
                                          </div>
                                          <p className={`text-[10px] font-bold mt-2 uppercase tracking-wide ${isCurrent ? 'text-emerald-luxury' : isPassed ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {step.label}
                                          </p>
                                          <p className="text-[9px] text-gray-400 mt-0.5">{step.description}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* 2. Order items details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left/Middle Col: Items purchased */}
                                <div className="md:col-span-2 space-y-3.5">
                                  <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Line Items Summary</h4>
                                  <div className="space-y-2.5">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 hover:border-ivory-dark transition-all">
                                        <div className="w-12 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                          <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover object-top"
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-serif font-bold text-gray-900 truncate">{item.name}</p>
                                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            <span>Qty: <strong className="text-gray-800 font-semibold">{item.quantity}</strong></span>
                                            {item.selectedSize && (
                                              <>
                                                <span>•</span>
                                                <span className="text-amber-700 font-bold font-mono">Size: {item.selectedSize}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <p className="text-xs text-gray-400">₹{item.price.toLocaleString('en-IN')} ea</p>
                                          <p className="text-sm font-bold text-gray-900 font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Transit History Timeline logs */}
                                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-3xs mt-4">
                                    <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3 flex items-center gap-1.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-emerald-luxury" />
                                      Detailed Tracking Status
                                    </h4>
                                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                      {(order.timeline || []).map((tl, index) => (
                                        <div key={index} className="pl-6 relative">
                                          <div className="absolute left-0.5 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-luxury flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-luxury" />
                                          </div>
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide font-mono bg-emerald-luxury/5 border border-emerald-luxury/10 px-1.5 py-0.5 rounded">{tl.status}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                              {new Date(tl.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(tl.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-600 italic mt-1 font-medium">"{tl.note}"</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Col: Pricing & Shipping address */}
                                <div className="space-y-4">
                                  {/* Shipping Address */}
                                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-3xs space-y-2">
                                    <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-emerald-luxury" />
                                      Delivery Details
                                    </h4>
                                    <div className="text-xs text-gray-700 space-y-1 font-medium">
                                      <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
                                      <p className="text-gray-500 font-mono text-[11px]">Phone: +91 {order.shippingAddress.phone}</p>
                                      <div className="border-t border-gray-100 pt-1.5 mt-1 text-gray-600 leading-relaxed">
                                        <p>{order.shippingAddress.addressLine}</p>
                                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} - <strong className="font-mono text-gray-900">{order.shippingAddress.pinCode}</strong></p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Pricing Breakdown */}
                                  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-3xs space-y-2.5">
                                    <h4 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Billing Breakdown</h4>
                                    <div className="text-xs space-y-1.5 font-medium">
                                      <div className="flex justify-between text-gray-500">
                                        <span>Items Subtotal:</span>
                                        <span className="font-mono">₹{order.subtotal.toLocaleString('en-IN')}</span>
                                      </div>
                                      {order.discount > 0 && (
                                        <div className="flex justify-between text-amber-700 font-semibold">
                                          <span>Loyalty Coupon Discount:</span>
                                          <span className="font-mono">-₹{order.discount.toLocaleString('en-IN')}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between text-gray-500">
                                        <span>GST Integrated (5%):</span>
                                        <span className="font-mono">₹{order.tax.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between text-gray-500">
                                        <span>Packaging & Transit:</span>
                                        <span className="font-mono">₹{order.shipping.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-sm text-emerald-luxury border-t border-gray-100 pt-2 mt-1.5">
                                        <span>Grand Paid Total:</span>
                                        <span className="font-mono">₹{order.total.toLocaleString('en-IN')}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Customer Actions */}
                                  <div className="flex flex-col gap-2 pt-2">
                                    <a
                                      href={`https://wa.me/918197980187?text=${encodeURIComponent(`Hello Rekha Garments, I would like to enquire about my Order ID: ${order.id}. Could you please share the shipping status? Thanks!`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-2 hover:scale-[1.01]"
                                    >
                                      <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                                      Enquire on WhatsApp
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Invoice Printing Portal Rendering */}
      {printOrder && createPortal(
        <div id="printable-invoice-area" className="bg-white text-gray-900 p-8 font-sans leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-emerald-luxury pb-6 mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-emerald-luxury tracking-wide uppercase">REKHA GARMENTS</h1>
              <p className="text-[10px] tracking-wider text-gray-600 uppercase font-medium mt-1">Women's Apparel & 1-Gram Jewellery</p>
              <p className="text-xs text-gray-600 mt-2 font-medium">📍 Hospet Flagship Home Shop, Hospet</p>
            </div>
            <div className="text-right">
              <h2 className="font-serif text-4xl font-bold text-emerald-luxury tracking-wide">INVOICE</h2>
              <div className="text-xs text-gray-600 mt-3 space-y-1">
                <p><strong>Invoice Number:</strong> {printOrder.id}</p>
                <p><strong>Date:</strong> {new Date(printOrder.orderDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Status:</strong> <span className="text-emerald-luxury font-bold">PAID (Secure Gate)</span></p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Dossier</h3>
              <p className="font-serif text-base font-bold text-gray-900">{printOrder.customerName}</p>
              <p className="text-xs text-gray-600 mt-1">Phone: +91 {printOrder.customerMobile}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-2">ID: {printOrder.customerId}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Insured Shipping Destination</h3>
              <p className="font-serif text-base font-bold text-gray-900">{printOrder.shippingAddress.fullName}</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {printOrder.shippingAddress.addressLine}<br />
                {printOrder.shippingAddress.city}, {printOrder.shippingAddress.state} - <strong>{printOrder.shippingAddress.pinCode}</strong>
              </p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full border-collapse mb-8 text-xs">
            <thead>
              <tr className="bg-emerald-luxury text-gold-champagne text-[10px] uppercase tracking-wider font-semibold">
                <th className="p-3 text-left rounded-l-lg text-gold-champagne">Item Description</th>
                <th className="p-3 text-center text-gold-champagne">Qty</th>
                <th className="p-3 text-right text-gold-champagne">Unit Price</th>
                <th className="p-3 text-right rounded-r-lg text-gold-champagne">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {printOrder.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30">
                  <td className="p-3">
                    <p className="font-bold font-serif text-gray-900 text-sm">{it.name}</p>
                    {it.selectedSize && (
                      <p className="text-[10px] text-amber-700 font-mono mt-0.5">Size: {it.selectedSize}</p>
                    )}
                  </td>
                  <td className="p-3 text-center font-semibold">{it.quantity}</td>
                  <td className="p-3 text-right">₹{it.price.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-gray-900">₹{(it.price * it.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="w-80 ml-auto border-t border-gray-200 pt-4 mb-10 text-xs space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Item Subtotal:</span>
              <span>₹{printOrder.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {printOrder.discount > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Loyalty Discount ({printOrder.couponApplied || 'DIRECT'}):</span>
                <span>-₹{printOrder.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>GST Integrated Tax (5%):</span>
              <span>₹{printOrder.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Insured Courier & Packaging:</span>
              <span>₹{printOrder.shipping.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-emerald-luxury border-t border-emerald-luxury pt-3 mt-2">
              <span>Grand Paid Total:</span>
              <span>₹{printOrder.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Logs */}
          <div className="page-break-inside-avoid">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Order Audit & Transit Log</h3>
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
              {(printOrder.timeline || []).map((tl, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[9px] uppercase tracking-wider bg-emerald-luxury/5 border border-emerald-luxury/10 text-emerald-luxury px-2 py-0.5 rounded font-mono">
                      {tl.status}
                    </span>
                    <span className="text-gray-400 text-[10px] font-mono">
                      {new Date(tl.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(tl.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600 italic mt-1 pl-1">"{tl.note}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 border-t border-gray-100 pt-6 text-gray-400 text-[10px] leading-relaxed animate-fade-in">
            <p className="font-semibold text-gray-600 text-xs">Thank you for choosing Rekha Garments</p>
            <p className="mt-1">Exquisite Handcrafted Sarees, Lehengas, & 1-Gram Gold Temple Jewellery</p>
            <p className="font-mono mt-3 text-[9px]">This is a computer-generated proof of sales. Since 10+ years in Hospet Home Shop Business.</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
