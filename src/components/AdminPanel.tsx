/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  ShieldCheck, 
  Menu, 
  X, 
  Sparkles, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

import { Product, Order, User, Notification } from '../types';

import AnalyticsDashboard from './AnalyticsDashboard';
import InventoryManager from './InventoryManager';
import CustomerManager from './CustomerManager';
import OrderManager from './OrderManager';
import SettingsManager from './SettingsManager';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  users: User[];
  notifications: Notification[];
  onRefreshAll: () => void;
  onExitAdmin: () => void;
}

type TabType = 'insights' | 'inventory' | 'customers' | 'orders' | 'settings';

export default function AdminPanel({
  products,
  orders,
  users,
  notifications,
  onRefreshAll,
  onExitAdmin,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('insights');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  // Mark notification as read helper
  const handleMarkAsRead = (id: string) => {
    setReadNotifIds(prev => [...prev, id]);
  };

  const processedNotifications = notifications.map(n => ({
    ...n,
    read: n.read || readNotifIds.includes(n.id)
  }));

  const unreadCount = processedNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-ivory flex text-gray-800" id="admin-panel-root">
      
      {/* 1. SIDEBAR (Desktop - Deep Emerald Green with Rounded corners) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-emerald-deep text-white shrink-0 border-r border-gold-champagne/15 p-5 relative">
        <div className="space-y-8">
          {/* Brand block */}
          <div className="border-b border-gold-champagne/15 pb-5">
            <h2 className="font-serif text-lg font-bold tracking-widest text-gold-champagne flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-champagne" />
              <span>REKHA GARMENTS</span>
            </h2>
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/50 font-sans mt-1">
              Admin Control Center
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2 text-xs font-semibold uppercase tracking-widest">
            {[
              { id: 'insights', label: 'Market Insights', icon: BarChart3 },
              { id: 'inventory', label: 'Inventory (Stock)', icon: Package },
              { id: 'customers', label: 'Customers DB', icon: Users },
              { id: 'orders', label: 'Orders Console', icon: FileText },
              { id: 'settings', label: 'Coupons (Promo)', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gold-champagne text-emerald-luxury font-bold shadow-lg ring-1 ring-gold-champagne/30' 
                      : 'text-white/70 hover:text-white hover:bg-emerald-luxury/45'
                  }`}
                  id={`sidebar-tab-${tab.id}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exit panel footer */}
        <div className="border-t border-gold-champagne/15 pt-5 space-y-3">
          <div className="flex items-center gap-2 px-3 text-white/50 text-[10px]">
            <ShieldCheck className="w-4 h-4 text-gold-champagne" />
            <span>Encrypted Session</span>
          </div>
          <button
            onClick={onExitAdmin}
            className="w-full bg-emerald-light hover:bg-red-900 border border-gold-champagne/25 text-white/90 hover:text-white text-xs uppercase tracking-wider font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            id="admin-logout-btn"
          >
            <LogOut className="w-4 h-4 text-gold-champagne" />
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={() => setShowMobileSidebar(false)}
          />
          
          <div className="relative flex flex-col justify-between w-64 bg-emerald-deep text-white p-5 h-full">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gold-champagne/15 pb-4">
                <h2 className="font-serif text-base font-bold tracking-widest text-gold-champagne">
                  REKHA GARMENTS
                </h2>
                <button onClick={() => setShowMobileSidebar(false)} className="text-white/75 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-2 text-xs font-semibold uppercase tracking-widest">
                {[
                  { id: 'insights', label: 'Market Insights', icon: BarChart3 },
                  { id: 'inventory', label: 'Inventory (Stock)', icon: Package },
                  { id: 'customers', label: 'Customers DB', icon: Users },
                  { id: 'orders', label: 'Orders Console', icon: FileText },
                  { id: 'settings', label: 'Coupons (Promo)', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setShowMobileSidebar(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-gold-champagne text-emerald-luxury font-bold' 
                          : 'text-white/70 hover:text-white hover:bg-emerald-luxury/45'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={() => {
                setShowMobileSidebar(false);
                onExitAdmin();
              }}
              className="w-full bg-emerald-light border border-gold-champagne/25 text-white text-xs uppercase py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-gold-champagne" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Workspace Top Bar */}
        <header className="bg-white border-b border-ivory-dark py-4 px-6 md:px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-1.5 hover:bg-ivory rounded-lg text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-serif text-lg font-bold text-emerald-luxury uppercase tracking-wider">
                {activeTab === 'insights' && 'Market Insights Dashboard'}
                {activeTab === 'inventory' && 'Inventory Warehouse Manager'}
                {activeTab === 'customers' && 'Boutique Customers Records'}
                {activeTab === 'orders' && 'Secure Orders Desk'}
                {activeTab === 'settings' && 'Boutique Coupons Desk'}
              </h2>
              <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                Real-time active database updates synchronized with Google Cloud Services
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            {/* Real-time sync reload */}
            <button
              onClick={onRefreshAll}
              className="p-1.5 hover:bg-ivory rounded-full text-gray-500 hover:text-emerald-luxury transition-colors cursor-pointer"
              title="Synchronize Database"
              id="admin-sync-btn"
            >
              <CheckCircle className="w-5 h-5 text-emerald-luxury animate-pulse" />
            </button>

            {/* Notifications Alert Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 hover:bg-ivory rounded-full text-gray-500 hover:text-emerald-luxury transition-colors cursor-pointer"
                title="Notifications Desk"
                id="admin-notifications-trigger"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-gold-rose text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification drop center */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-ivory-dark shadow-2xl rounded-xl overflow-hidden z-50 animate-fade-in font-sans">
                  <div className="bg-emerald-luxury text-white p-3.5 flex justify-between items-center border-b">
                    <p className="font-bold text-xs">Admin Notification Desk</p>
                    <button onClick={() => setShowNotifications(false)} className="text-white/80 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto">
                    {processedNotifications.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">No recent alarms or alerts logged.</p>
                    ) : (
                      processedNotifications.map((n) => (
                        <div key={n.id} className={`p-3 text-xs flex gap-2 items-start ${n.read ? 'bg-white' : 'bg-ivory'}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'stock' ? 'bg-amber-500' : 'bg-emerald-luxury'}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800">{n.title}</p>
                            <p className="text-gray-500 text-[11px] mt-0.5">{n.message}</p>
                            <p className="text-[9px] text-gray-400 font-mono mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                          </div>
                          {!n.read && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-[10px] text-emerald-luxury font-bold uppercase shrink-0"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin identity */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-emerald-luxury">Karthik Jadhav</span>
              <span className="text-[10px] text-gold-dark font-semibold">Store Master</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-luxury text-gold-champagne font-bold text-xs flex items-center justify-center border border-gold-champagne/30">
              KJ
            </div>
          </div>
        </header>

        {/* Tab workspace content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'insights' && (
            <AnalyticsDashboard orders={orders} products={products} users={users} />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager products={products} onRefresh={onRefreshAll} />
          )}

          {activeTab === 'customers' && (
            <CustomerManager users={users} orders={orders} />
          )}

          {activeTab === 'orders' && (
            <OrderManager orders={orders} onRefresh={onRefreshAll} />
          )}

          {activeTab === 'settings' && (
            <SettingsManager onRefresh={onRefreshAll} />
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-ivory-dark py-4 text-center text-xs text-gray-400 font-sans shrink-0">
          Made with ♥ by Karthik Jadhav in Bangalore
        </footer>
      </main>
    </div>
  );
}
