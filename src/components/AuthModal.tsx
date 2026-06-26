/**
 * AuthModal.tsx
 * Authenticates users using Supabase Phone OTP Authentication.
 * Includes graceful fallback and live SMS integration instructions.
 */

import React, { useState } from 'react';
import { X, Smartphone, CheckCircle, ShieldCheck, User as UserIcon, Send, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { 
  dbSignInWithOtp, 
  dbVerifyOtp, 
  dbRegisterOrUpdateCustomer, 
  dbGetCustomers, 
  isRealSupabaseConfigured 
} from '../supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp' | 'register'>('mobile');
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
  const [mockOtpToDisplay, setMockOtpToDisplay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  // Listen for Google OAuth callback message
  React.useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1') && origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.user) {
        const loggedUser = event.data.user;
        localStorage.setItem('rekha_current_user', JSON.stringify(loggedUser));
        onAuthSuccess(loggedUser);
        onClose();
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onAuthSuccess, onClose]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initialize Google login session.');
      }
      const { url } = await response.json();
      
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
      );

      if (!authWindow) {
        setError('Popup was blocked by your browser. Please allow popups to sign in with Google.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start Google login.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handle Mobile Number Submission
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpSentMessage(null);
    setMockOtpToDisplay(null);

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await dbSignInWithOtp(cleanMobile);
      setOtpSentMessage(res.message);
      if (res.mockOtp) {
        setMockOtpToDisplay(res.mockOtp);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to trigger Supabase OTP service.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Code Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const { user } = await dbVerifyOtp(cleanMobile, otp);

      // Verify if customer exists
      const customers = await dbGetCustomers();
      const existingUser = customers.find(c => c.id === user.id || c.mobile === cleanMobile);

      if (existingUser) {
        // Update login timestamp
        const updated = await dbRegisterOrUpdateCustomer(existingUser.id, existingUser.name, cleanMobile);
        onAuthSuccess(updated);
        onClose();
      } else {
        // Direct to registration to input Name
        setTempUserId(user.id);
        setStep('register');
      }
    } catch (err: any) {
      setError('Authentication failed: ' + (err.message || 'Invalid verification code.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register (New User Name Entry)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name to create a profile.');
      return;
    }

    if (!tempUserId) return;

    setLoading(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const registered = await dbRegisterOrUpdateCustomer(tempUserId, name.trim(), cleanMobile);
      onAuthSuccess(registered);
      onClose();
    } catch (err: any) {
      setError('Profile registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="auth-modal-overlay">
      <div className="relative bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-ivory-dark flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-emerald-luxury hover:bg-ivory transition-colors cursor-pointer z-10"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand identity header */}
        <div className="bg-emerald-luxury text-center py-6 text-white px-6">
          <h2 className="font-serif text-xl md:text-2xl font-bold tracking-wide text-gold-champagne">
            REKHA GARMENTS
          </h2>
          <p className="text-[10px] text-white/75 font-sans tracking-widest uppercase mt-0.5">
            {isRealSupabaseConfigured ? 'Supabase Secure Phone Auth' : 'Supabase Sandboxed Auth'}
          </p>
        </div>

        {/* Notification Hub */}
        {otpSentMessage && (
          <div className="bg-emerald-deep text-gold-champagne p-3 text-xs font-mono border-y border-gold-champagne/20 flex flex-col gap-1.5 animate-fade-in">
            <div className="flex gap-2 items-start">
              <CheckCircle className="w-4 h-4 text-gold-champagne shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Supabase Authentication Services:</p>
                <p className="mt-0.5 opacity-90 text-[11px]">{otpSentMessage}</p>
              </div>
            </div>
            {mockOtpToDisplay && (
              <div className="bg-gold-champagne/10 border border-gold-champagne/30 rounded p-2 text-center text-xs text-gold-champagne font-bold mt-1">
                🔑 DEVELOPMENT BYPASS OTP CODE: <span className="text-white text-sm font-mono tracking-widest bg-emerald-luxury px-2 py-0.5 rounded ml-1">{mockOtpToDisplay}</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Form Contents */}
        <div className="p-6 md:p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100 flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: MOBILE NUMBER ENTRY */}
          {step === 'mobile' && (
            <div className="space-y-4">
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="text-center space-y-1.5 mb-5">
                  <div className="inline-flex p-3 bg-emerald-luxury/5 rounded-full text-emerald-luxury">
                    <Smartphone className="w-6 h-6 text-gold-champagne" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-gray-800">Verify Mobile OTP</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Log in securely using Phone OTP services. No password required.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Mobile Number (India)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm font-mono">+91</span>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury font-mono text-sm tracking-widest text-gray-800 bg-ivory"
                      id="mobile-input-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  id="send-otp-btn"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Processing...' : 'Send Verification OTP'}</span>
                </button>
              </form>

              <div className="relative my-4 flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-sans font-bold tracking-widest text-gray-400 uppercase">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-ivory text-gray-700 font-sans font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl border border-gray-200 flex items-center justify-center gap-3 transition-all duration-200 shadow-sm cursor-pointer hover:shadow hover:scale-[1.01] active:scale-[0.99]"
                id="google-signin-btn"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION CODE */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1.5 mb-5">
                <div className="inline-flex p-3 bg-emerald-luxury/5 rounded-full text-emerald-luxury">
                  <ShieldCheck className="w-6 h-6 text-gold-champagne" />
                </div>
                <h3 className="font-serif text-base font-bold text-gray-800">Verification Code</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Enter the 6-digit verification code sent to your mobile <span className="font-mono text-gray-800 font-bold">+91 {mobile}</span>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 block">Verification OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full text-center py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury font-mono text-lg tracking-[0.6em] text-gray-800 bg-ivory font-bold"
                  id="otp-input-field"
                  autoFocus
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setStep('mobile')}
                  className="text-gray-500 hover:text-emerald-luxury cursor-pointer font-medium"
                >
                  Edit Number
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-gold-champagne hover:text-gold-dark cursor-pointer font-semibold"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="verify-otp-btn"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
              </button>
            </form>
          )}

          {/* STEP 3: NEW USER PROFILE REGISTRATION */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center space-y-1.5 mb-5">
                <div className="inline-flex p-3 bg-emerald-luxury/5 rounded-full text-emerald-luxury">
                  <UserIcon className="w-6 h-6 text-gold-champagne" />
                </div>
                <h3 className="font-serif text-base font-bold text-gray-800">Welcome to Rekha Garments</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Create a secure user profile to save your wishlist, address details, and order timelines.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm text-gray-800 bg-ivory"
                    id="register-name-field"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Mobile Number</label>
                  <input
                    type="text"
                    disabled
                    value={`+91 ${mobile}`}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="complete-register-btn"
              >
                <span>Complete Registration</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
