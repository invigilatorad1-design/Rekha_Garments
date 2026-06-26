import React, { useState } from 'react';
import { X, Lock, ShieldAlert, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('rekha_admin_token', data.token);
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Incorrect System Admin Password.');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" id="admin-login-modal-overlay">
      <div 
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-scale-up"
        id="admin-login-modal-card"
      >
        {/* Banner/Header */}
        <div className="bg-emerald-luxury p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer"
            id="close-admin-login-btn"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex p-3 bg-white/10 rounded-full text-gold-champagne mb-3">
            <Lock className="w-6 h-6 text-gold-champagne" />
          </div>
          
          <h2 className="font-serif text-xl font-bold text-gold-champagne tracking-wide">
            System Admin Access
          </h2>
          <p className="text-white/75 text-[11px] uppercase tracking-widest mt-1 font-sans">
            Authorized Personnel Only
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 bg-ivory">
          <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3.5 flex gap-3 text-amber-800">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Restricted Gateway</p>
              <p className="leading-relaxed opacity-90">
                This panel controls boutique orders, inventory settings, and payments. Please verify your administrative credentials to continue.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg text-center font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 block">
                Enter Admin Password / Passcode
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury font-sans text-sm text-gray-800 bg-white"
                  id="admin-password-input"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-gray-400 italic">
                * Default passcode is configured securely. If you are signed in with your registered Google account, you are automatically authorized.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow hover:shadow-md"
              id="admin-login-submit-btn"
            >
              <span>{loading ? 'Verifying...' : 'Authorize Access'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
