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
  HelpCircle,
  AlertTriangle,
  Check,
  ExternalLink,
  Database,
  Info,
  Copy
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

  // Active Pending Order verification state
  const [pendingOrderToVerify, setPendingOrderToVerify] = useState<Order | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<boolean>(false);

  useEffect(() => {
    const firstPending = orders.find(o => o.status === 'Pending');
    if (firstPending) {
      setPendingOrderToVerify(firstPending);
    } else {
      setPendingOrderToVerify(null);
    }
  }, [orders]);

  // Dispatch secure alert notification upon Admin Portal access
  useEffect(() => {
    fetch('/api/admin/notify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('Admin access notification failed:', err));
  }, []);

  const handleAdminVerifyPayment = async (orderId: string, isConfirmed: boolean) => {
    setVerifyingOrder(true);
    try {
      const status = isConfirmed ? 'Processing' : 'Cancelled';
      const timelineNote = isConfirmed 
        ? 'Payment verified in bank statement. Order confirmed by Rekha Garments!' 
        : 'Payment verification failed. Order cancelled by Rekha Garments.';
      
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          timeline: timelineNote
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update order status');
      }

      onRefreshAll(); // Refresh orders state globally
      setPendingOrderToVerify(null);
    } catch (err: any) {
      console.error('Failed to verify payment:', err);
      alert('Failed to complete action: ' + err.message);
    } finally {
      setVerifyingOrder(false);
    }
  };

  // Database Diagnostics States
  const [dbStatus, setDbStatus] = useState<{
    status: 'checking' | 'connected' | 'failed';
    error?: string;
    config?: any;
  }>({ status: 'checking' });
  const [showFixGuide, setShowFixGuide] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/db-test');
      const data = await res.json();
      if (res.ok && data.success) {
        setDbStatus({ status: 'connected', config: data.config });
      } else {
        setDbStatus({
          status: 'failed',
          error: data.error || 'Connection failed',
          config: data.config
        });
      }
    } catch (err: any) {
      setDbStatus({
        status: 'failed',
        error: err.message || String(err)
      });
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

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
            {/* Database status indicator */}
            {dbStatus.status === 'connected' ? (
              <span className="hidden md:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>DB Online</span>
              </span>
            ) : dbStatus.status === 'failed' ? (
              <button
                onClick={() => setShowFixGuide(true)}
                className="hidden md:inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-200 cursor-pointer transition-colors animate-bounce"
              >
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                <span>DB Offline (Fix Guide)</span>
              </button>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1.5 bg-gray-50 text-gray-400 text-[10px] font-medium px-2.5 py-1 rounded-full border border-gray-200">
                <span>Checking DB...</span>
              </span>
            )}

            {/* Real-time sync reload */}
            <button
              onClick={() => {
                checkDbStatus();
                onRefreshAll();
              }}
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
          {dbStatus.status === 'failed' && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-600 rounded-xl p-4 md:p-5 shadow-sm text-gray-800 font-sans animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="font-bold text-red-900 text-sm">Database Connection Error (Production Setup Required)</h3>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    This website was successfully published to Cloud Run, but it is currently unable to communicate with your Google Cloud SQL database. This is expected until you configure the database link in Cloud Run.
                  </p>
                  <p className="text-[11px] text-gray-500 mt-2 font-mono break-all">
                    Error logged: {dbStatus.error}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFixGuide(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Fix in Google Cloud (4 Steps)</span>
              </button>
            </div>
          )}

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

        {/* Database setup instructions modal */}
        {showFixGuide && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 z-[100] animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col font-sans border border-ivory-dark">
              {/* Header */}
              <div className="bg-emerald-luxury text-white px-6 py-5 flex justify-between items-center shrink-0 border-b border-gold-champagne/25">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-gold-champagne" />
                  <div>
                    <h3 className="font-serif text-lg font-bold tracking-wide">Google Cloud Run Connection Guide</h3>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest font-sans mt-0.5">Restore Cloud SQL Access in 4 Steps</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFixGuide(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 text-xs text-amber-950">
                  <span className="font-bold">Why did this happen?</span> When running locally inside Google AI Studio, a special secure DB proxy maps automatically. However, when you publish the application to your own production Cloud Run container (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">rekha-garments</code>), Google Cloud isolates it by default. You just need to tell Cloud Run to connect to your SQL instance.
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="relative pl-8">
                    <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-emerald-luxury text-gold-champagne font-bold text-xs flex items-center justify-center">1</span>
                    <h4 className="font-bold text-gray-900">Link your Cloud SQL to Cloud Run</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      This mounts the secure Unix domain socket directory on your container.
                    </p>
                    <ol className="list-decimal ml-4 mt-2 text-xs text-gray-600 space-y-1">
                      <li>Go to the <a href="https://console.cloud.google.com/run" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold inline-flex items-center gap-0.5">Google Cloud Run Console <ExternalLink className="w-3 h-3" /></a>.</li>
                      <li>Select your service: <span className="font-semibold text-gray-800">rekha-garments</span>.</li>
                      <li>Click <span className="font-semibold text-gray-800">Edit & Deploy New Revision</span>.</li>
                      <li>Go to the <span className="font-semibold text-gray-800">Connections</span> tab, find <span className="font-semibold text-gray-800">Cloud SQL connections</span>, click <span className="font-semibold text-gray-800">Add Connection</span>, and select:</li>
                    </ol>
                    <div className="mt-3 flex items-center justify-between bg-ivory border border-ivory-dark rounded-lg p-2.5 font-mono text-xs text-gray-800">
                      <span className="truncate break-all select-all">project-antigravity-x-deepstn:asia-southeast1:ai-studio-70f7cb01</span>
                      <button 
                        onClick={() => handleCopy('project-antigravity-x-deepstn:asia-southeast1:ai-studio-70f7cb01', 'sqlInstance')}
                        className="p-1 hover:bg-ivory-dark rounded text-gray-500 hover:text-emerald-luxury shrink-0 ml-2"
                        title="Copy to clipboard"
                      >
                        {copiedText === 'sqlInstance' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative pl-8">
                    <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-emerald-luxury text-gold-champagne font-bold text-xs flex items-center justify-center">2</span>
                    <h4 className="font-bold text-gray-900">Set Environment Variables in Cloud Run</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Under the <span className="font-semibold text-gray-800">Variables & Secrets</span> tab, add the following variables so the application knows how to connect:
                    </p>
                    <div className="mt-3 overflow-hidden border rounded-lg divide-y text-xs">
                      {/* SQL_HOST */}
                      <div className="p-2.5 bg-white flex justify-between items-center gap-2">
                        <div className="font-mono shrink-0 w-28 text-gray-500">SQL_HOST</div>
                        <div className="font-mono text-gray-800 truncate select-all">/cloudsql/project-antigravity-x-deepstn:asia-southeast1:ai-studio-70f7cb01</div>
                        <button 
                          onClick={() => handleCopy('/cloudsql/project-antigravity-x-deepstn:asia-southeast1:ai-studio-70f7cb01', 'sqlHost')}
                          className="p-1 hover:bg-ivory-dark rounded text-gray-400 hover:text-gray-700 shrink-0"
                        >
                          {copiedText === 'sqlHost' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {/* SQL_USER */}
                      <div className="p-2.5 bg-ivory flex justify-between items-center gap-2">
                        <div className="font-mono shrink-0 w-28 text-gray-500">SQL_USER</div>
                        <div className="font-mono text-gray-800 truncate select-all">ai_studio_app_user</div>
                        <button 
                          onClick={() => handleCopy('ai_studio_app_user', 'sqlUser')}
                          className="p-1 hover:bg-ivory-dark rounded text-gray-400 hover:text-gray-700 shrink-0"
                        >
                          {copiedText === 'sqlUser' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {/* SQL_DB_NAME */}
                      <div className="p-2.5 bg-white flex justify-between items-center gap-2">
                        <div className="font-mono shrink-0 w-28 text-gray-500">SQL_DB_NAME</div>
                        <div className="font-mono text-gray-800 truncate select-all">cloud_sql_development_database</div>
                        <button 
                          onClick={() => handleCopy('cloud_sql_development_database', 'sqlDbName')}
                          className="p-1 hover:bg-ivory-dark rounded text-gray-400 hover:text-gray-700 shrink-0"
                        >
                          {copiedText === 'sqlDbName' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {/* SQL_PASSWORD */}
                      <div className="p-2.5 bg-ivory flex justify-between items-center gap-2">
                        <div className="font-mono shrink-0 w-28 text-gray-500">SQL_PASSWORD</div>
                        <div className="font-mono text-gray-800 italic">Enter your DB user password here</div>
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-semibold shrink-0">Required</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative pl-8">
                    <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-emerald-luxury text-gold-champagne font-bold text-xs flex items-center justify-center">3</span>
                    <h4 className="font-bold text-gray-900">Grant IAM Service Account Permissions</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Cloud Run needs permission to talk to the SQL database.
                    </p>
                    <ol className="list-decimal ml-4 mt-2 text-xs text-gray-600 space-y-1">
                      <li>Go to the <a href="https://console.cloud.google.com/iam-admin/iam" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold inline-flex items-center gap-0.5">Google Cloud IAM Console <ExternalLink className="w-3 h-3" /></a>.</li>
                      <li>Find the Service Account used by your Cloud Run service (usually looks like <code className="font-mono bg-ivory px-1 rounded text-gray-800">your-project-number-compute@developer.gserviceaccount.com</code>).</li>
                      <li>Click the **Edit** (Pencil) icon on that service account row.</li>
                      <li>Click **Add Another Role**, search for <span className="font-semibold text-emerald-900 bg-emerald-50 px-1 py-0.5 rounded">Cloud SQL Client</span>, and select it.</li>
                      <li>Click **Save** to apply the IAM permission immediately.</li>
                    </ol>
                  </div>

                  {/* Step 4 */}
                  <div className="relative pl-8">
                    <span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-emerald-luxury text-gold-champagne font-bold text-xs flex items-center justify-center">4</span>
                    <h4 className="font-bold text-gray-900">Deploy!</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Click the green **Deploy** button at the bottom of the Cloud Run Edit page.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      When the new revision boots up, our backend will run schema synchronization automatically, build the tables, seed default products, and the coupons desk will be fully functional!
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-ivory px-6 py-4 border-t border-ivory-dark flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info className="w-4 h-4 text-emerald-luxury" />
                  <span>Click sync reload <span className="font-bold">↻</span> after deploying.</span>
                </div>
                <button
                  onClick={() => setShowFixGuide(false)}
                  className="bg-emerald-luxury hover:bg-emerald-deep text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm hover:shadow transition-all"
                >
                  I Understand, Let's Connect It
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white border-t border-ivory-dark py-4 text-center text-xs text-gray-400 font-sans shrink-0">
          Made with ♥ by Karthik Jadhav in Bangalore
        </footer>
      </main>

      {/* MERCHANT AUDIT & UPI VERIFICATION MODAL FOR ADMIN */}
      {pendingOrderToVerify && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" id="admin-payment-verification-popup">
          <div className="bg-slate-900 text-slate-100 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gold-champagne/40 flex flex-col transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 p-4 flex items-center gap-3 border-b border-gold-champagne/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <ShieldCheck className="w-5 h-5 text-gold-champagne shrink-0" />
              <h3 className="font-serif text-sm font-bold tracking-widest text-white uppercase">Merchant Audit Action</h3>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6 space-y-4 text-left">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">🔔 Pending UPI Payment Confirmation</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Customer <span className="text-white font-bold">{pendingOrderToVerify.customerName}</span> has placed an order and initiated a UPI payment. Please verify the transaction receipt:
                </p>
              </div>

              {/* Transaction details card */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="text-white font-bold">{pendingOrderToVerify.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-500">Amount Due:</span>
                  <span className="text-gold-champagne font-bold text-sm">₹{pendingOrderToVerify.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payer Name:</span>
                  <span className="text-slate-200">{pendingOrderToVerify.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="text-slate-200">+91 {pendingOrderToVerify.customerMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination ID:</span>
                  <span className="text-indigo-400 font-bold">8197980187@ybl</span>
                </div>
              </div>

              <div className="space-y-1 bg-red-950/40 border border-red-900/30 p-3.5 rounded-xl text-[11px] text-red-200 leading-normal">
                <p className="font-bold">⚠️ Security Notice for Administrator:</p>
                <p className="text-[10px] text-red-300/95">
                  Please check your bank statements or PhonePe merchant account to verify if <b>₹{pendingOrderToVerify.total.toLocaleString('en-IN')}</b> was received from this customer. 
                </p>
                <p className="font-bold mt-1.5 text-slate-100">Has the payment been successfully verified and confirmed?</p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-950 px-5 py-4 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={verifyingOrder}
                onClick={() => handleAdminVerifyPayment(pendingOrderToVerify.id, false)}
                className="flex-1 px-4 py-2.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50"
              >
                No, Reject
              </button>
              <button
                type="button"
                disabled={verifyingOrder}
                onClick={() => handleAdminVerifyPayment(pendingOrderToVerify.id, true)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                id="admin-confirm-yes-btn"
              >
                {verifyingOrder ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Yes, Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
