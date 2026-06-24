/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Download, User as UserIcon, Calendar, Coins, ShoppingBag, Eye, X, CheckCircle, Smartphone } from 'lucide-react';
import { User, Order } from '../types';

interface CustomerManagerProps {
  users: User[];
  orders: Order[];
}

export default function CustomerManager({ users, orders }: CustomerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [spendingFilter, setSpendingFilter] = useState<'all' | 'high' | 'loyal'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.mobile.includes(searchTerm);
    const matchesSpending = spendingFilter === 'all' ||
                            (spendingFilter === 'high' && u.totalSpending >= 10000) ||
                            (spendingFilter === 'loyal' && u.totalOrders >= 2);
    return matchesSearch && matchesSpending;
  });

  // Get user's order history
  const getUserOrders = (userId: string) => {
    return orders.filter((o) => o.customerId === userId);
  };

  // High fidelity export customer database to CSV
  const handleExportData = () => {
    try {
      const headers = ['Customer Name', 'Mobile Number', 'Registration Date', 'Last Login', 'Total Orders', 'Total Spending (INR)'];
      const csvRows = [headers.join(',')];

      filteredUsers.forEach((u) => {
        const row = [
          `"${u.name}"`,
          `"${u.mobile}"`,
          `"${u.registrationDate.split('T')[0]}"`,
          `"${u.lastLogin.split('T')[0]}"`,
          u.totalOrders,
          u.totalSpending
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `rekha_garments_customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMsg('Successfully compiled and exported customer dataset to local downloads.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-5" id="customer-manager">
      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-deep text-gold-champagne text-xs p-4 rounded-xl flex items-center justify-between font-mono animate-fade-in border border-gold-champagne/15">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gold-champagne" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-gold-champagne hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-dark flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-xs text-gray-800 bg-ivory"
          />
        </div>

        {/* Filter & Export */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={spendingFilter}
            onChange={(e: any) => setSpendingFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium focus:outline-none"
          >
            <option value="all">All Customer Ranges</option>
            <option value="high">High Spenders (₹10k+)</option>
            <option value="loyal">Loyal Shoppers (2+ Orders)</option>
          </select>

          <button
            onClick={handleExportData}
            className="border border-ivory-dark bg-white hover:bg-gray-50 hover:text-emerald-luxury text-gray-600 px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            id="export-customers-btn"
          >
            <Download className="w-4 h-4 text-gold-champagne" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Customer list table */}
      <div className="bg-white rounded-2xl border border-ivory-dark overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-ivory border-b border-ivory-dark font-sans text-gray-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Mobile Number</th>
                <th className="p-4">Registration Date</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4">Orders Count</th>
                <th className="p-4">Lifetime Spending</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No registered boutique shoppers matching query found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-ivory/50 transition-colors">
                    {/* Customer Info */}
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-luxury/5 border text-emerald-luxury flex items-center justify-center font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-serif font-bold text-gray-900">{u.name}</span>
                    </td>

                    {/* Mobile */}
                    <td className="p-4 font-mono font-medium text-gray-700">
                      +91 {u.mobile}
                    </td>

                    {/* Registration Date */}
                    <td className="p-4 text-gray-500">
                      {new Date(u.registrationDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Last active log */}
                    <td className="p-4 text-gray-500 font-mono text-[11px]">
                      {new Date(u.lastLogin).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })} at {new Date(u.lastLogin).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Total orders */}
                    <td className="p-4 font-mono font-bold text-gray-900">
                      {u.totalOrders} Purchases
                    </td>

                    {/* Spendings */}
                    <td className="p-4 font-mono font-bold text-emerald-luxury">
                      ₹{u.totalSpending.toLocaleString('en-IN')}
                    </td>

                    {/* View Profile */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="bg-emerald-luxury/5 hover:bg-emerald-luxury/10 border border-emerald-luxury/20 text-emerald-luxury text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded cursor-pointer flex items-center gap-1 mx-auto"
                        id={`view-profile-btn-${u.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-gold-champagne" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PROFILE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-ivory-dark flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-emerald-luxury text-white p-5 flex justify-between items-center border-b border-gold-champagne/20 shrink-0">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-gold-champagne" />
                <h3 className="font-serif text-base font-bold text-gold-champagne">Customer Dossier & History</h3>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* Profile Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ivory border rounded-xl p-4 flex gap-3">
                  <Smartphone className="w-5 h-5 text-gold-champagne shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Contact Phone</p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">+91 {selectedUser.mobile}</p>
                    <p className="text-[9px] text-gray-400 mt-1">Join date: {new Date(selectedUser.registrationDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-ivory border rounded-xl p-4 flex gap-3">
                  <Coins className="w-5 h-5 text-emerald-luxury shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">Total Value (LTV)</p>
                    <p className="text-sm font-mono font-bold text-emerald-luxury mt-1">₹{selectedUser.totalSpending.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-gray-400 mt-1">Across {selectedUser.totalOrders} successful checkouts</p>
                  </div>
                </div>
              </div>

              {/* Order History Timeline */}
              <div className="space-y-3">
                <h4 className="font-serif text-sm font-bold text-gray-800 border-b pb-1">Order History Log ({getUserOrders(selectedUser.id).length})</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {getUserOrders(selectedUser.id).length === 0 ? (
                    <p className="text-gray-400 text-center py-6">This customer has not completed any orders yet.</p>
                  ) : (
                    getUserOrders(selectedUser.id).map((ord) => (
                      <div key={ord.id} className="bg-ivory border border-ivory-dark p-3.5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-mono font-bold text-emerald-luxury">{ord.id}</span>
                          <span className="text-gray-400">{new Date(ord.orderDate).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-1">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-gray-700">
                              <span className="font-medium line-clamp-1 flex-1">{it.name} (x{it.quantity})</span>
                              <span className="font-mono font-bold ml-4">₹{it.price.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-gray-200/50">
                          <span className="font-sans font-semibold text-gray-500 uppercase tracking-wider">Status: <span className="text-emerald-luxury">{ord.status}</span></span>
                          <span className="font-mono font-bold text-gray-900">Total Charged: ₹{ord.total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-ivory border-t flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 bg-emerald-luxury hover:bg-emerald-light text-gold-champagne rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
