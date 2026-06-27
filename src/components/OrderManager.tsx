/**
 * OrderManager.tsx
 * Secure Order Desk powered by Supabase.
 * Allows tracking timelines, viewing itemized invoices, and updating order fulfillment states.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, ClipboardList, Clock, Truck, CheckCircle2, XCircle, ArrowRight, X, Edit2, AlertCircle, Printer } from 'lucide-react';
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
  const [tempStatus, setTempStatus] = useState<Order['status'] | null>(null);

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
        setTempStatus(updatedOrder.status);
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    window.print();
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
                            setTempStatus(o.status);
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
                  {(selectedOrder.timeline || []).map((tl, idx) => (
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

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Target Order Status</label>
                        <select
                          id="admin-status-select"
                          value={tempStatus || selectedOrder.status}
                          onChange={(e) => setTempStatus(e.target.value as Order['status'])}
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs text-gray-800 focus:outline-none focus:border-emerald-luxury font-medium"
                        >
                          <option value="Pending">Pending Verification</option>
                          <option value="Processing">Processing / Packing</option>
                          <option value="Shipped">In-Transit / Shipped</option>
                          <option value="Delivered">Delivered Successful</option>
                          <option value="Cancelled">Cancelled / Terminated</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Log Detail Note</label>
                        <input
                          type="text"
                          placeholder={`e.g. Order moved to ${tempStatus || selectedOrder.status}`}
                          value={timelineNote}
                          onChange={(e) => setTimelineNote(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white text-xs text-gray-800 focus:outline-none focus:border-emerald-luxury"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => handleUpdateStatus(selectedOrder.id, tempStatus || selectedOrder.status)}
                        className="bg-emerald-luxury hover:bg-emerald-deep text-gold-champagne px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-sm font-sans"
                      >
                        {updating ? 'Updating...' : 'Apply Status Change'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-ivory border-t flex justify-end gap-3">
              <button
                onClick={handlePrintInvoice}
                className="px-5 py-2 bg-white hover:bg-ivory border border-emerald-luxury/30 text-emerald-luxury rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-2 transition-all shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
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

      {selectedOrder && createPortal(
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
                <p><strong>Invoice Number:</strong> {selectedOrder.id}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Status:</strong> <span className="text-emerald-luxury font-bold">PAID (Secure Gate)</span></p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Dossier</h3>
              <p className="font-serif text-base font-bold text-gray-900">{selectedOrder.customerName}</p>
              <p className="text-xs text-gray-600 mt-1">Phone: +91 {selectedOrder.customerMobile}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-2">ID: {selectedOrder.customerId}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Insured Shipping Destination</h3>
              <p className="font-serif text-base font-bold text-gray-900">{selectedOrder.shippingAddress.fullName}</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {selectedOrder.shippingAddress.addressLine}<br />
                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - <strong>{selectedOrder.shippingAddress.pinCode}</strong>
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
              {selectedOrder.items.map((it, idx) => (
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
              <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {selectedOrder.discount > 0 && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Loyalty Discount ({selectedOrder.couponApplied || 'DIRECT'}):</span>
                <span>-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-gray-600">
              <span>Insured Courier & Packaging:</span>
              <span>₹{selectedOrder.shipping.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-emerald-luxury border-t border-emerald-luxury pt-3 mt-2">
              <span>Grand Paid Total:</span>
              <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Logs */}
          <div className="page-break-inside-avoid">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Order Audit & Transit Log</h3>
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
              {(selectedOrder.timeline || []).map((tl, idx) => (
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
          <div className="text-center mt-12 border-t border-gray-100 pt-6 text-gray-400 text-[10px] leading-relaxed">
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
