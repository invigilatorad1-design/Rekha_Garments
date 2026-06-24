/**
 * SettingsManager.tsx
 * Coupon & Promotion Desk powered by Supabase Database.
 * Features the Royal AI Campaign Planner powered securely by Gemini server-side.
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  EyeOff, 
  Eye, 
  Percent, 
  Gift, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Award, 
  PartyPopper 
} from 'lucide-react';
import { Coupon } from '../types';
import { 
  dbGetCoupons, 
  dbCreateCoupon, 
  dbUpdateCoupon, 
  dbDeleteCoupon 
} from '../supabase';

interface SettingsManagerProps {
  onRefresh: () => void;
}

export default function SettingsManager({ onRefresh }: SettingsManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Form Coupon states
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<Coupon['type']>('percentage');
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(1000);
  const [expiry, setExpiry] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState(500);
  const [currentId, setCurrentId] = useState('');

  // AI Campaign Assistant states
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [aiTheme, setAiTheme] = useState('Diwali Temple Collection Launch');
  const [aiDiscountLevel, setAiDiscountLevel] = useState('Moderate (15-20% value)');
  const [aiMaxSpend, setAiMaxSpend] = useState('₹2000 minimum spend');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProposals, setAiProposals] = useState<any[]>([]);
  const [activatedProposals, setActivatedProposals] = useState<string[]>([]);

  // Fetch Coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const list = await dbGetCoupons();
      setCoupons(list);
    } catch (err: any) {
      setError('Failed to fetch coupons: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAdd = () => {
    setCode('');
    setType('percentage');
    setValue(15);
    setMinOrder(2000);
    setExpiry('2026-12-31');
    setUsageLimit(500);
    setCurrentId('coup_' + Date.now());
    setShowModal('add');
  };

  const handleOpenEdit = (c: Coupon) => {
    setCode(c.code);
    setType(c.type);
    setValue(c.value);
    setMinOrder(c.minOrderValue);
    setExpiry(c.expiryDate);
    setUsageLimit(c.usageLimit);
    setCurrentId(c.id);
    setShowModal('edit');
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid coupon code.');
      return;
    }

    try {
      const newCoup: Partial<Coupon> = {
        id: currentId,
        code: cleanCode,
        type,
        value: Number(value),
        minOrderValue: Number(minOrder),
        expiryDate: expiry,
        usageLimit: Number(usageLimit),
        usedCount: showModal === 'edit' ? coupons.find(c => c.id === currentId)?.usedCount || 0 : 0,
        active: true
      };

      if (showModal === 'add') {
        await dbCreateCoupon(newCoup);
        setSuccess(`Coupon '${cleanCode}' successfully created in Supabase.`);
      } else {
        await dbUpdateCoupon(currentId, newCoup);
        setSuccess(`Coupon '${cleanCode}' successfully updated in Supabase.`);
      }

      setShowModal(null);
      fetchCoupons();
      onRefresh();
    } catch (err: any) {
      setError('Failed to save coupon: ' + err.message);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    try {
      await dbDeleteCoupon(id);
      setSuccess(`Coupon code '${code}' deleted permanently.`);
      fetchCoupons();
      onRefresh();
    } catch (err: any) {
      setError('Failed to delete coupon: ' + err.message);
    }
  };

  const handleToggleCouponActive = async (id: string, currentActive: boolean, code: string) => {
    try {
      await dbUpdateCoupon(id, {
        active: !currentActive
      });
      setSuccess(`Coupon '${code}' has been ${!currentActive ? 'Enabled' : 'Disabled'}.`);
      fetchCoupons();
      onRefresh();
    } catch (err: any) {
      setError('Failed to toggle active state: ' + err.message);
    }
  };

  // Generate Coupon proposals via Gemini backend API proxy
  const handleGenerateAiProposals = async () => {
    setAiLoading(true);
    setError(null);
    setAiProposals([]);
    setActivatedProposals([]);
    try {
      const res = await fetch('/api/gemini/generate-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignTheme: aiTheme,
          targetDiscountLevel: aiDiscountLevel,
          maxSpend: aiMaxSpend
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to design campaign proposals.');
      }

      setAiProposals(data.proposals || []);
    } catch (err: any) {
      setError('AI Generator Failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Activate single proposal in DB
  const handleActivateProposal = async (p: any, index: number) => {
    try {
      const isExist = coupons.some(c => c.code === p.code.toUpperCase().trim());
      if (isExist) {
        alert(`A coupon with code '${p.code}' already exists.`);
        return;
      }

      const payload: Partial<Coupon> = {
        id: 'coup_ai_' + Math.random().toString(36).substr(2, 9),
        code: p.code.toUpperCase().trim(),
        type: p.type as any,
        value: Number(p.value),
        minOrderValue: Number(p.minOrderValue),
        expiryDate: p.expiryDate,
        usageLimit: 1000,
        usedCount: 0,
        active: true
      };

      await dbCreateCoupon(payload);
      setActivatedProposals(prev => [...prev, p.code]);
      setSuccess(`AI-Designed Campaign Coupon '${p.code}' is now live!`);
      fetchCoupons();
      onRefresh();
    } catch (err: any) {
      setError('Activation failed: ' + err.message);
    }
  };

  // Activate all generated proposals at once
  const handleActivateAllProposals = async () => {
    let count = 0;
    setError(null);
    for (const p of aiProposals) {
      if (activatedProposals.includes(p.code)) continue;
      try {
        const isExist = coupons.some(c => c.code === p.code.toUpperCase().trim());
        if (isExist) continue;

        const payload: Partial<Coupon> = {
          id: 'coup_ai_' + Math.random().toString(36).substr(2, 9),
          code: p.code.toUpperCase().trim(),
          type: p.type as any,
          value: Number(p.value),
          minOrderValue: Number(p.minOrderValue),
          expiryDate: p.expiryDate,
          usageLimit: 1000,
          usedCount: 0,
          active: true
        };
        await dbCreateCoupon(payload);
        setActivatedProposals(prev => [...prev, p.code]);
        count++;
      } catch (err: any) {
        console.error("Failed to activate proposal", p.code, err);
      }
    }
    if (count > 0) {
      setSuccess(`Successfully activated ${count} elite campaign coupons simultaneously!`);
      fetchCoupons();
      onRefresh();
    }
  };

  return (
    <div className="space-y-6" id="settings-manager">
      {/* Messages */}
      {success && (
        <div className="bg-emerald-deep text-gold-champagne text-xs p-4 rounded-xl flex items-center justify-between font-mono animate-fade-in border border-gold-champagne/15">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gold-champagne" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-gold-champagne hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs p-4 rounded-xl flex items-center justify-between font-sans border border-red-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-950 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Royal AI Promotion Campaign Bento Grid Banner */}
      <div className="bg-gradient-to-br from-emerald-luxury via-emerald-deep to-slate-900 p-6 rounded-2xl border border-gold-champagne/20 text-white shadow-md relative overflow-hidden">
        {/* Backdrop Luxury Overlay pattern */}
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
          <Gift className="w-64 h-64 text-gold-champagne" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-gold-champagne/20 text-gold-champagne font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-gold-champagne/25 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold-champagne" />
                Gemini AI Engine
              </span>
              <span className="bg-white/10 text-white/90 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Full-Stack Secure
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-gold-champagne">Royal AI Campaign Designer</h3>
            <p className="text-white/80 text-xs max-w-xl leading-relaxed">
              Generate elite, boutique-themed discount campaigns with high-converting, Indian-heritage inspired names (e.g. DIWALIGOLD, KANJEEVARAM15) with descriptions and parameters drafted automatically by AI.
            </p>
          </div>
          
          <button
            onClick={() => setShowAiPlanner(true)}
            className="self-start md:self-center bg-gold-champagne hover:bg-gold-light text-emerald-luxury px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            id="ai-campaign-planner-btn"
          >
            <Sparkles className="w-4 h-4 text-emerald-luxury" />
            <span>Launch Campaign Planner</span>
          </button>
        </div>
      </div>

      {/* Control row */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-dark flex justify-between items-center shadow-xs">
        <div>
          <h3 className="font-serif text-sm font-bold text-gray-800">Boutique Coupon Desk</h3>
          <p className="text-[10px] text-gray-400 font-sans mt-0.5">Active coupon offerings and system-wide campaign tracking console.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-gold-champagne hover:bg-gold-light text-emerald-luxury px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
          id="create-coupon-btn"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Coupons List Table */}
      <div className="bg-white rounded-2xl border border-ivory-dark overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 font-sans">
            <thead className="bg-ivory border-b border-ivory-dark text-gray-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Promo Code</th>
                <th className="p-4">Discount Value</th>
                <th className="p-4">Offer Type</th>
                <th className="p-4 font-mono">Min Order</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4 text-center">Usage Progress</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No promo coupons found. Click 'New Coupon' or generate campaign codes with the Royal AI.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-ivory/50 transition-colors">
                      {/* Code */}
                      <td className="p-4 font-mono font-bold text-emerald-luxury">
                        <span className="bg-gold-champagne/15 text-emerald-luxury px-2 py-0.5 rounded border border-gold-champagne/25">
                          {c.code}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="p-4 font-bold text-gray-900">
                        {c.type === 'percentage' || c.type === 'first_purchase' 
                          ? `${c.value}% OFF` 
                          : `₹${c.value.toLocaleString('en-IN')} OFF`}
                      </td>

                      {/* Type Label */}
                      <td className="p-4 font-medium uppercase text-[10px] tracking-wider">
                        {c.type.replace('_', ' ')}
                      </td>

                      {/* Minimum Order */}
                      <td className="p-4 font-mono font-bold text-gray-700">
                        ₹{c.minOrderValue.toLocaleString('en-IN')}
                      </td>

                      {/* Expiration */}
                      <td className="p-4">
                        <span className={`font-medium ${isExpired ? 'text-red-500 line-through' : 'text-gray-600'}`}>
                          {c.expiryDate}
                        </span>
                      </td>

                      {/* Progress bar */}
                      <td className="p-4 text-center">
                        <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden inline-block border">
                          <div 
                            className="bg-emerald-luxury h-full" 
                            style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">{c.usedCount} / {c.usageLimit} Redeemed</p>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isExpired 
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : c.active 
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : 'bg-gray-100 text-gray-400 border'
                        }`}>
                          {isExpired ? 'Expired' : c.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleCouponActive(c.id, c.active, c.code)}
                            className="p-1.5 text-gray-400 hover:text-emerald-luxury rounded cursor-pointer"
                            title={c.active ? 'Disable' : 'Enable'}
                          >
                            {c.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-gray-400 hover:text-emerald-luxury rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4 text-gold-champagne" />
                          </button>
                          <button
                            onClick={() => setCouponToDelete(c)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI PLANNER DIALOG MODAL */}
      {showAiPlanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-gold-champagne/20 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emerald-luxury text-white p-5 flex justify-between items-center border-b border-gold-champagne/20 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-champagne animate-pulse" />
                <h3 className="font-serif text-base font-bold text-gold-champagne">Royal AI Campaign & Coupon Planner</h3>
              </div>
              <button onClick={() => setShowAiPlanner(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Form Input Deck */}
              <div className="bg-ivory rounded-xl p-5 border border-ivory-dark grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* Theme */}
                <div className="space-y-1.5">
                  <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Campaign Theme / Holiday</label>
                  <input
                    type="text"
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-white text-gray-800 font-medium"
                    placeholder="e.g. Royal Wedding Season, Dussehra Sale"
                  />
                </div>

                {/* Discount Level */}
                <div className="space-y-1.5">
                  <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Discount Level / Vibe</label>
                  <select
                    value={aiDiscountLevel}
                    onChange={(e) => setAiDiscountLevel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-white text-gray-800"
                  >
                    <option value="Generous (25-30% high-conversion values)">Generous (25-30% off)</option>
                    <option value="Moderate (15-20% standard values)">Moderate (15-20% off)</option>
                    <option value="Exclusive Premium (10% VIP caps)">Exclusive Premium (10% off)</option>
                  </select>
                </div>

                {/* Minimum spend constraint */}
                <div className="space-y-1.5">
                  <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px] block">Minimum Basket Value</label>
                  <select
                    value={aiMaxSpend}
                    onChange={(e) => setAiMaxSpend(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-white text-gray-800"
                  >
                    <option value="₹1000 minimum spend">₹1,000 Minimum Spend</option>
                    <option value="₹2500 minimum spend">₹2,500 Minimum Spend</option>
                    <option value="₹5000 premium luxury constraint">₹5,000 High-Value Spend</option>
                    <option value="No minimum spend constraints">No Minimum Basket Value</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleGenerateAiProposals}
                  disabled={aiLoading}
                  className="bg-emerald-luxury hover:bg-emerald-light text-gold-champagne px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-champagne" />
                      <span>Designing Campaigns...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-gold-champagne" />
                      <span>Formulate Royal Proposals</span>
                    </>
                  )}
                </button>
              </div>

              {/* Proposals Output Grid */}
              {aiProposals.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-ivory-dark pb-2">
                    <h4 className="font-serif text-sm font-bold text-emerald-luxury flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-gold-champagne" />
                      AI Campaign Proposals
                    </h4>
                    
                    {activatedProposals.length < aiProposals.length && (
                      <button
                        onClick={handleActivateAllProposals}
                        className="bg-gold-champagne hover:bg-gold-light text-emerald-luxury px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <PartyPopper className="w-3.5 h-3.5" />
                        <span>Activate All 3 Proposals</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiProposals.map((p, index) => {
                      const isActivated = activatedProposals.includes(p.code);
                      return (
                        <div 
                          key={p.code + index} 
                          className={`relative border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                            isActivated 
                              ? 'border-green-500 bg-green-50/20' 
                              : 'border-gold-champagne/30 bg-white hover:border-emerald-luxury'
                          }`}
                        >
                          {/* Card Body */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm font-bold bg-gold-champagne/30 text-emerald-luxury px-3 py-1 rounded border border-gold-champagne/50">
                                {p.code}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">Min: ₹{p.minOrderValue}</span>
                            </div>

                            <div className="space-y-1">
                              <p className="font-serif text-sm font-bold text-gray-900">
                                {p.type === 'percentage' ? `${p.value}% Discount` : `₹${p.value} Flat Off`}
                              </p>
                              <p className="text-[10px] text-gray-400 font-sans">Expiry: {p.expiryDate}</p>
                            </div>

                            <p className="text-[11px] text-gray-600 leading-relaxed font-sans bg-ivory p-3 rounded-lg border border-ivory-dark">
                              "{p.description}"
                            </p>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end">
                            {isActivated ? (
                              <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Active & Live
                              </span>
                            ) : (
                              <button
                                onClick={() => handleActivateProposal(p, index)}
                                className="bg-emerald-luxury hover:bg-emerald-light text-gold-champagne px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-ivory border-t border-ivory-dark p-4 flex justify-end shrink-0">
              <button
                onClick={() => setShowAiPlanner(false)}
                className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
              >
                Close Planner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT COUPON FORM OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-ivory-dark flex flex-col max-h-[85vh]">
            <div className="bg-emerald-luxury text-white p-5 flex justify-between items-center border-b border-gold-champagne/20 shrink-0">
              <h3 className="font-serif text-base font-bold text-gold-champagne">
                {showModal === 'add' ? 'Create Promo Coupon' : 'Modify Coupon Settings'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Promo Coupon Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury font-mono font-bold tracking-widest bg-ivory text-gray-800 text-sm uppercase"
                  placeholder="e.g. FESTIVAL500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-ivory text-gray-800 text-xs"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Flat Amount Discount (₹)</option>
                    <option value="first_purchase">First Purchase Offer</option>
                    <option value="festival">Festival Special Discount</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-ivory text-gray-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Min Order Value (INR)</label>
                  <input
                    type="number"
                    required
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-ivory text-gray-800 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Redeem Limit (Qty)</label>
                  <input
                    type="number"
                    required
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-ivory text-gray-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Expiry Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-emerald-luxury bg-ivory text-gray-800 text-xs"
                />
              </div>

              {/* Submit Row */}
              <div className="pt-3 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-4 py-2 border rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer font-bold uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-luxury hover:bg-emerald-light text-gold-champagne px-5 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM COUPON DELETE CONFIRMATION MODAL */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-red-200 flex flex-col">
            <div className="bg-red-50 text-red-700 p-5 flex items-center gap-3 border-b border-red-100">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm">Confirm Permanent Deletion</h3>
                <p className="text-[10px] text-red-600 font-mono mt-0.5">Permanent Database Action</p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you absolutely sure you want to permanently delete coupon code <strong className="text-gray-900">'{couponToDelete.code}'</strong>? This action will disable checkout validation for this code immediately.
              </p>
              <div className="bg-red-50/50 p-3 rounded-lg border border-red-100 text-[10px] text-red-700 font-mono flex gap-2">
                <Trash2 className="w-4 h-4 shrink-0 text-red-600" />
                <span>Active discount validation campaigns for this promotion will be fully terminated.</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-2.5 border-t border-gray-100">
              <button
                onClick={() => setCouponToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const c = couponToDelete;
                  setCouponToDelete(null);
                  await handleDeleteCoupon(c.id, c.code);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
              >
                Delete Promo Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
