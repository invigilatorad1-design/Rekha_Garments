/**
 * OrderManager.tsx
 * Secure Order Desk powered by Supabase.
 * Allows tracking timelines, viewing itemized invoices, and updating order fulfillment states.
 */

import React, { useState } from 'react';
import { Search, Filter, ClipboardList, Clock, Truck, CheckCircle2, XCircle, ArrowRight, X, Edit2, AlertCircle } from 'lucide-react';
import { Order, OrderItem } from '../types';
import { dbUpdateOrderStatus } from '../supabase';

interface OrderManagerProps {
  orders: Order[];
  onRefresh: () => void;
}

export default function OrderManager({ orders, onRefresh }: OrderManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [timelineNote, setTimelineNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customerMobile.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status']) => {
    setUpdating(true);
    try {
      const note = timelineNote.trim() || `Status updated to ${nextStatus}.`;
      
      // Update order status in Supabase
      const updatedOrder = await dbUpdateOrderStatus(orderId, nextStatus, note);

      setSuccess(`Order ${orderId} successfully updated to status: ${nextStatus}.`);
      setTimelineNote('');
      onRefresh();

      // Refresh currently selected order modal
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5" id="order-manager">
      {/* Messages */}
      {success && (
        <div className="bg-emerald-deep text-gold-champagne text-xs p-4 rounded-xl flex items-center justify-between font-mono animate-fade-in border border-gold-champagne/15">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gold-champagne" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-gold-champagne hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-dark flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search Order ID, name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-xs text-gray-800 bg-ivory"
          />
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Order Statuses</option>
            <option value="Pending">Pending Verification</option>
            <option value="Processing">Processing / Packing</option>
            <option value="Shipped">In-Transit / Shipped</option>
            <option value="Delivered">Delivered Successful</option>
            <option value="Cancelled">Cancelled / Terminated</option>
          </select>
        </div>
      </div>

      {/* Orders list grid */}
      <div className="bg-white rounded-2xl border border-ivory-dark overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 font-sans">
            <thead className="bg-ivory border-b border-ivory-dark text-gray-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Order Code</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Order Date</th>
                <th className="p-4">Items Count</th>
                <th className="p-4 font-mono">Grand Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No orders registered in system collections matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  return (
                    <tr key={o.id} className="hover:bg-ivory/50 transition-colors">
                      {/* Order Code */}
                      <td className="p-4 font-mono font-bold text-emerald-luxury">
                        {o.id}
                      </td>

                      {/* Customer contact details */}
                      <td className="p-4">
                        <p className="font-serif font-bold text-gray-900">{o.customerName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">+91 {o.customerMobile}</p>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-gray-500 font-mono text-[11px]">
                        {new Date(o.orderDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} at {new Date(o.orderDate).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Items Count */}
                      <td className="p-4 font-semibold text-gray-700">
                        {o.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                      </td>

                      {/* Total */}
                      <td className="p-4 font-mono font-bold text-emerald-luxury text-sm">
                        ₹{o.total.toLocaleString('en-IN')}
                      </td>

                      {/* Order Status Badge */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          o.status === 'Delivered' 
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : o.status === 'Cancelled' 
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : o.status === 'Shipped'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : o.status === 'Processing'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-gray-100 text-gray-600'
                        }`}>
                          {o.status}
                        </span>
                      </td>

                      {/* View & Edit */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setTimelineNote('');
                            setSelectedOrder(o);
                          }}
                          className="bg-emerald-luxury/5 hover:bg-emerald-luxury/10 border border-emerald-luxury/20 text-emerald-luxury text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 mx-auto"
                          id={`view-order-btn-${o.id}`}
                        >
                          <span>Manage Order</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED ORDER MANAGEMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-ivory-dark flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emerald-luxury text-white p-5 flex justify-between items-center border-b border-gold-champagne/20 shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gold-champagne" />
                <h3 className="font-serif text-base font-bold text-gold-champagne">
                  Invoice & Timeline: {selectedOrder.id}
                </h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Contents */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              
              {/* Customer & Address Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ivory border p-4 rounded-xl space-y-1.5">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Customer Dossier</p>
                  <p className="font-serif text-sm font-bold text-gray-900">{selectedOrder.customerName}</p>
                  <p className="font-mono text-gray-500">Phone: +91 {selectedOrder.customerMobile}</p>
                  <p className="font-mono text-gray-500">Payment Status: <span className="text-emerald-luxury font-bold">PAID (Encrypted Gate)</span></p>
                </div>

                <div className="bg-ivory border p-4 rounded-xl space-y-1.5">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Insured Delivery Address</p>
                  <p className="font-medium text-gray-800">{selectedOrder.shippingAddress.fullName}</p>
                  <p className="text-gray-600">{selectedOrder.shippingAddress.addressLine}</p>
                  <p className="text-gray-600">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - <span className="font-mono font-bold">{selectedOrder.shippingAddress.pinCode}</span></p>
                </div>
              </div>

              {/* Products Table list */}
              <div className="border border-ivory-dark rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px] text-gray-600">
                  <thead className="bg-ivory border-b border-ivory-dark font-sans text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 font-mono">Unit Price</th>
                      <th className="p-3 font-mono text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {selectedOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-gray-900 flex items-center gap-2">
                          <img src={it.image} alt={it.name} className="w-8 h-8 object-cover rounded" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold">{it.name}</p>
                            {it.selectedSize && <p className="text-[9px] font-mono text-gold-rose">Size: {it.selectedSize}</p>}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-semibold">{it.quantity}</td>
                        <td className="p-3 font-mono">₹{it.price.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-mono text-right font-bold text-gray-900">₹{(it.price * it.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Math Calculations Grid */}
              <div className="bg-ivory border rounded-xl p-4 space-y-2 font-mono">
                <div className="flex justify-between text-gray-500">
                  <span>Product Subtotal</span>
                  <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-gold-rose">
                    <span>Loyalty / Coupon Discount ({selectedOrder.couponApplied || 'DIRECT'})</span>
                    <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>GST (5% Integrated Tax)</span>
                  <span>₹{selectedOrder.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Express Transit Packaging</span>
                  <span>₹{selectedOrder.shipping.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-luxury font-bold border-t border-gray-300 pt-2 text-sm">
                  <span className="font-serif">Grand Invoice Total</span>
                  <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* ORDER STATUS TIMELINE HISTORY LOGS */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-bold text-gray-800 border-b pb-1">Order Transit Timeline</h4>
                
                {/* Visual Stepper Timeline */}
                <div className="relative pl-6 space-y-4 border-l-2 border-emerald-luxury/20 ml-2">
                  {selectedOrder.timeline.map((tl, idx) => (
                    <div key={idx} className="relative">
                      {/* Node Indicator */}
                      <span className="absolute -left-[31px] top-1 bg-emerald-luxury text-gold-champagne w-5 h-5 rounded-full border border-gold-champagne/45 flex items-center justify-center font-mono text-[9px] font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-950 uppercase text-[10px] tracking-wider bg-emerald-luxury/5 text-emerald-luxury px-2 py-0.5 rounded border border-emerald-luxury/10">
                            {tl.status}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(tl.timestamp).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })} at {new Date(tl.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1 pl-1 italic">"{tl.note}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADMIN ACTIONS: TRANSIT CONTROLS */}
              {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <div className="bg-ivory border rounded-xl p-4 space-y-3">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Administrator Timeline Transit Update</span>
                  </p>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Add specific details (e.g. Dispatched via BlueDart AWB #92401)"
                      value={timelineNote}
                      onChange={(e) => setTimelineNote(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white text-xs text-gray-800"
                    />

                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.status === 'Pending' && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'Processing')}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                        >
                          Mark as Processing
                        </button>
                      )}
                      {selectedOrder.status === 'Processing' && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'Shipped')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                        >
                          Mark as Shipped
                        </button>
                      )}
                      {selectedOrder.status === 'Shipped' && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-semibold cursor-pointer ml-auto"
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-ivory border-t flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-emerald-luxury hover:bg-emerald-light text-gold-champagne rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                Close Order Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
