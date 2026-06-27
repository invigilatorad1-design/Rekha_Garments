/**
 * CheckoutModal.tsx
 * Secure Checkout and Promo Engine using Supabase Database Service.
 * Ensures order details are written correctly, stock updated, and coupon code applied cleanly as null/string.
 */

import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, MapPin, ClipboardList, CheckCircle, Percent, Gift, ArrowLeft, ArrowRight, ShieldCheck, Copy, Check, ExternalLink, QrCode, Smartphone, BellRing } from 'lucide-react';
import { Order, OrderItem, User, Coupon } from '../types';
import { 
  dbGetCoupons, 
  dbCreateOrder, 
  dbRegisterOrUpdateCustomer, 
  isRealSupabaseConfigured 
} from '../supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
  onClearCart: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onOrderSuccess,
  onClearCart,
}: CheckoutModalProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // UPI states
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<'qr' | 'upi'>('qr');

  // Form states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Available Coupons list (fetched or default)
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    if (currentUser) {
      setCustName(currentUser.name);
      setCustPhone(currentUser.mobile);
    }
  }, [currentUser]);

  useEffect(() => {
    // Fetch active coupons from Supabase
    const fetchCoupons = async () => {
      try {
        const couponsList = await dbGetCoupons();
        setAvailableCoupons(couponsList.filter(c => c.active));
      } catch (err) {
        console.error('Failed to fetch coupons:', err);
      }
    };
    if (isOpen) {
      fetchCoupons();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Coupon Calculation
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage' || appliedCoupon.type === 'first_purchase') {
      discount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else {
      discount = appliedCoupon.value;
    }
    // Limit discount to subtotal
    if (discount > subtotal) discount = subtotal;
  }

  const taxableAmount = subtotal - discount;
  const tax = 0; // GST removed as requested
  const isFreeShipping = taxableAmount > 500;
  const shipping = taxableAmount === 0 ? 0 : isFreeShipping ? 0 : 100;
  const grandTotal = taxableAmount + tax + shipping;

  const handleApplyCoupon = () => {
    setError(null);
    setCouponSuccess(null);
    setAppliedCoupon(null);

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setError('Please enter a coupon code.');
      return;
    }

    const foundCoupon = availableCoupons.find((c) => c.code === code && c.active);
    if (!foundCoupon) {
      setError('Invalid coupon code or coupon is inactive.');
      return;
    }

    // Validation checks
    if (subtotal < foundCoupon.minOrderValue) {
      setError(`Minimum order value to apply this coupon is ₹${foundCoupon.minOrderValue.toLocaleString('en-IN')}.`);
      return;
    }

    const expiry = new Date(foundCoupon.expiryDate);
    if (expiry < new Date()) {
      setError('This coupon code has expired.');
      return;
    }

    if (foundCoupon.usedCount >= foundCoupon.usageLimit) {
      setError('This coupon usage limit has been reached.');
      return;
    }

    setAppliedCoupon(foundCoupon);
    setCouponSuccess(`Success! '${code}' applied successfully.`);
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!custName.trim() || custPhone.replace(/\D/g, '').length !== 10) {
        setError('Please enter a valid Name and 10-digit Phone number.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!addressLine.trim() || !city.trim() || pinCode.replace(/\D/g, '').length !== 6) {
        setError('Please fill in complete address line, city, and a 6-digit Pincode.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitOrder = async () => {
    setError(null);
    setLoading(true);
    try {
      const cleanPhone = custPhone.replace(/\D/g, '');
      const customerId = currentUser ? currentUser.id : cleanPhone;

      // Prepare order details. Note the fix for couponApplied - never save undefined, save null if empty!
      const orderPayload: Partial<Order> = {
        customerId,
        customerName: custName.trim(),
        customerMobile: cleanPhone,
        items: cartItems,
        subtotal,
        discount,
        tax,
        shipping,
        total: grandTotal,
        couponApplied: appliedCoupon ? appliedCoupon.code : null,
        shippingAddress: {
          fullName: custName.trim(),
          phone: cleanPhone,
          addressLine: addressLine.trim(),
          city: city.trim(),
          state,
          pinCode: pinCode.replace(/\D/g, '')
        },
        paymentStatus: 'Pending'
      };

      // 1. Save Order (updates order, stock, and coupon usage atomically)
      const createdOrder = await dbCreateOrder(orderPayload);

      // 2. Register or update customer metrics
      await dbRegisterOrUpdateCustomer(customerId, custName.trim(), cleanPhone);

      // Clear the local cart items and callback success
      onClearCart();
      onOrderSuccess(createdOrder);
      onClose();
    } catch (err: any) {
      setError('Checkout failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="checkout-modal-overlay">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-ivory-dark flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-luxury text-white p-5 flex items-center justify-between border-b border-gold-champagne/15 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold-champagne" />
            <h2 className="font-serif text-lg font-bold tracking-wide">Premium Secure Checkout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cancel Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper progress indicator */}
        <div className="bg-ivory border-b border-ivory-dark px-6 py-4 flex justify-between items-center text-xs text-gray-500 font-sans shrink-0 overflow-x-auto">
          {[
            { n: 1, l: 'Customer Info', icon: UserIcon },
            { n: 2, l: 'Delivery Address', icon: MapPin },
            { n: 3, l: 'Order Summary', icon: ClipboardList },
            { n: 4, l: 'Coupons & Promos', icon: Percent },
            { n: 5, l: 'Payment Gate', icon: CheckCircle }
          ].map((st) => (
            <div key={st.n} className="flex items-center gap-2 whitespace-nowrap min-w-max">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                step === st.n 
                  ? 'bg-emerald-luxury text-gold-champagne ring-2 ring-gold-champagne/45' 
                  : step > st.n 
                    ? 'bg-emerald-deep text-gold-champagne' 
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {st.n}
              </span>
              <span className={`font-semibold hidden md:inline ${step === st.n ? 'text-emerald-luxury' : 'text-gray-400'}`}>
                {st.l}
              </span>
              {st.n < 5 && <span className="text-gray-300 mx-1 hidden md:inline">➔</span>}
            </div>
          ))}
        </div>

        {/* Form Body - scrollable */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-100 flex gap-2 items-center">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CUSTOMER DETAILS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="font-serif text-base font-bold text-gray-800">Step 1: Who is placing the order?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Please provide contact details for delivery updates & SMS alerts.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm text-gray-800 bg-ivory"
                    id="checkout-cust-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Mobile Number (OTP-enabled)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm font-semibold">+91</span>
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm font-mono tracking-wider text-gray-800 bg-ivory"
                      id="checkout-cust-phone"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING ADDRESS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="font-serif text-base font-bold text-gray-800">Step 2: Shipping Destination</h3>
                <p className="text-xs text-gray-500 mt-0.5">We deliver across India with premium secure transit packaging.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Flat / House No. / Street Address</label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="e.g. #14, 2nd Floor, Royal Enclave"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm text-gray-800 bg-ivory"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm text-gray-800 bg-ivory"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm text-gray-800 bg-ivory"
                    >
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 block">Postal Pin Code</label>
                  <input
                    type="text"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 560001"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm font-mono tracking-widest text-gray-800 bg-ivory"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER SUMMARY */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="font-serif text-base font-bold text-gray-800">Step 3: Review Your Order</h3>
                <p className="text-xs text-gray-500 mt-0.5">Review items and verify details before proceeding to checkout invoice generation.</p>
              </div>

              <div className="border border-ivory-dark rounded-xl overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {cartItems.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex items-center gap-4 p-3 bg-ivory">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Qty: <span className="font-bold text-gray-800">{item.quantity}</span> 
                        {item.selectedSize && ` | Size: ${item.selectedSize}`}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-luxury shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-ivory rounded-xl p-4 border border-ivory-dark space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-sans">
                  <span>Shipping Destination</span>
                  <span className="font-semibold text-gray-800 text-right">{addressLine}, {city}, {pinCode}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-sans border-t border-gray-200/50 pt-2">
                  <span>Customer Contact</span>
                  <span className="font-semibold text-gray-800">{custName} (+91 {custPhone})</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COUPON & DISCOUNT ENGINE */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="font-serif text-base font-bold text-gray-800">Step 4: Exclusive Offers & Coupons</h3>
                <p className="text-xs text-gray-500 mt-0.5">Apply coupon codes to unlock premium festival and loyalty discounts.</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER COUPON CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-luxury text-sm font-mono font-bold tracking-widest text-gray-800 bg-ivory uppercase"
                  id="coupon-input-field"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-bold text-xs uppercase tracking-widest px-5 rounded-lg cursor-pointer animate-pulse"
                  id="apply-coupon-btn"
                >
                  Apply
                </button>
              </div>

              {couponSuccess && (
                <div className="bg-emerald-deep text-gold-champagne text-xs p-3 rounded-lg flex items-center gap-2 font-mono">
                  <Percent className="w-4 h-4 shrink-0" />
                  <span>{couponSuccess}</span>
                </div>
              )}

              {/* Active coupon offerings display */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Available Boutique Offers</p>
                {availableCoupons.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No coupons available at this time.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableCoupons.map((c) => (
                      <div 
                        key={c.id} 
                        className={`border p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                          appliedCoupon?.code === c.code 
                            ? 'border-emerald-luxury bg-emerald-luxury/5 ring-1 ring-emerald-luxury' 
                            : 'border-ivory-dark bg-white hover:border-gold-champagne'
                        }`}
                        onClick={() => {
                          setCouponCode(c.code);
                          setTimeout(() => handleApplyCoupon(), 50);
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-bold bg-gold-champagne/25 text-emerald-luxury px-2 py-0.5 rounded border border-gold-champagne/40">
                              {c.code}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">Min: ₹{c.minOrderValue}</span>
                          </div>
                          <p className="font-serif text-xs font-bold text-gray-800">
                            {c.type === 'percentage' || c.type === 'first_purchase' 
                              ? `Flat ${c.value}% Off Your Order` 
                              : `Save Flat ₹${c.value} Instantly`}
                          </p>
                        </div>
                        <p className="text-[9px] text-gray-400 font-sans mt-2">Expires: {c.expiryDate}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: FINAL PAYMENT & BILLING */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="font-serif text-base font-bold text-gray-800">Step 5: Luxury Order Summary & Payment</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select a payment mode below to complete your secure transaction.</p>
              </div>

              {/* Invoice Table */}
              <div className="bg-ivory border border-ivory-dark rounded-xl p-5 space-y-3 font-sans">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Product Subtotal</span>
                  <span className="font-mono font-semibold text-gray-950">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-gold-rose font-medium">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      Discount Applied ({appliedCoupon.code})
                    </span>
                    <span className="font-mono font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-gray-600">
                  <span>Insured Shipping Fee</span>
                  <span className="font-mono font-semibold text-gray-950">
                    {shipping === 0 ? (
                      <span className="text-green-600 font-bold uppercase tracking-wider text-[10px]">Free Delivery</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-3 flex justify-between items-baseline">
                  <span className="font-serif text-sm font-bold text-gray-900">Grand Total Invoice</span>
                  <span className="font-mono text-xl font-bold text-emerald-luxury">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-3" id="payment-mode-tabs">
                <button
                  type="button"
                  onClick={() => setPaymentType('qr')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentType === 'qr'
                      ? 'border-emerald-luxury bg-emerald-luxury/5 text-emerald-luxury ring-1 ring-emerald-luxury font-bold'
                      : 'border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  id="tab-payment-qr"
                >
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <span>Payment QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('upi')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentType === 'upi'
                      ? 'border-emerald-luxury bg-emerald-luxury/5 text-emerald-luxury ring-1 ring-emerald-luxury font-bold'
                      : 'border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  id="tab-payment-upi"
                >
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>UPI ID / App</span>
                </button>
              </div>

              {/* UPI & QR Code Payment Portal Section */}
              <div className="bg-gradient-to-br from-indigo-900/5 via-purple-900/5 to-indigo-950/5 border border-indigo-200 rounded-2xl p-5 space-y-4">
                {paymentType === 'qr' ? (
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-1">
                      <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-indigo-950">Scan QR to Redirect & Pay</h4>
                      <p className="text-[11px] text-gray-500">Scan using GPay, PhonePe, Paytm, or tap the QR to auto-launch UPI apps.</p>
                    </div>

                    {/* Dynamic QR Code Frame */}
                    <a
                      href={`upi://pay?pa=8197980187@ybl&pn=Rekha%20Garments&am=${grandTotal}&tn=RekhaGarmentsOrder&cu=INR`}
                      className="relative bg-white p-3.5 rounded-xl border border-indigo-100 shadow-md max-w-[190px] w-full flex flex-col items-center hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                      title="Tap to pay via any UPI app"
                      id="upi-payment-qr-link"
                    >
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=8197980187@ybl&pn=Rekha Garments&am=${grandTotal}&tn=RekhaGarmentsOrder&cu=INR`)}`} 
                        alt="Payment QR Code" 
                        className="w-full h-auto aspect-square object-contain"
                        id="upi-payment-qr"
                      />
                      <div className="mt-2.5 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-indigo-600 animate-pulse" />
                        <span className="text-[9px] font-sans text-indigo-600 font-bold uppercase tracking-wider block">Tap to Open UPI App</span>
                      </div>
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-1">
                      <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-indigo-950">Pay using UPI ID</h4>
                      <p className="text-[11px] text-gray-500">Copy our beneficiary UPI ID below or launch any available payment app directly.</p>
                    </div>

                    <div className="bg-white rounded-xl border border-indigo-100 p-4 max-w-sm w-full space-y-3.5">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Beneficiary Name</p>
                        <p className="text-xs font-bold text-gray-800">Rekha Garments</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">UPI ID</p>
                        <div className="flex items-center justify-center gap-2 mt-1 bg-ivory py-1.5 px-3 rounded-lg border">
                          <span className="font-mono text-xs font-bold text-indigo-700">8197980187@ybl</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('8197980187@ybl');
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {copiedUpi && <span className="text-[9px] text-green-600 font-bold block mt-1">✓ Copied to clipboard!</span>}
                      </div>
                    </div>

                    <div className="pt-1.5 w-full max-w-xs">
                      <a 
                        href={`upi://pay?pa=8197980187@ybl&pn=Rekha%20Garments&am=${grandTotal}&tn=RekhaGarmentsOrder&cu=INR`}
                        className="inline-flex items-center justify-center gap-1.5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]"
                        id="direct-upi-pay-btn"
                      >
                        <Smartphone className="w-4 h-4 animate-bounce" />
                        <span>Launch UPI App / Redirect</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 flex gap-2 items-start leading-relaxed">
                  <span className="font-bold text-base select-none leading-none mt-0.5">💡</span>
                  <div>
                    <span className="font-bold">Device Redirect Instructions:</span> After tapping the button or scanning the QR, you will be redirected to available UPI apps on your device. Once successful, return here to complete checkout.
                  </div>
                </div>
              </div>

              {/* Payment Info Callout */}
              <div className="bg-emerald-luxury/5 border border-emerald-luxury/10 rounded-xl p-4 flex gap-3 items-start text-xs text-emerald-luxury">
                <ShieldCheck className="w-5 h-5 text-gold-champagne shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Payment Notification & Process:</p>
                  <p className="mt-0.5 text-gray-600 leading-normal">
                    Your order will be registered in a pending verification state. You will get the order confirmation after Rekha Garments verifies the payment receipt in their PhonePe statement.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-ivory border-t border-ivory-dark px-6 py-4 flex justify-between items-center shrink-0">
          {step > 1 ? (
            <button
              onClick={handlePrevStep}
              className="px-4 py-2.5 border border-ivory-dark bg-white hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={handleNextStep}
              className="bg-emerald-luxury hover:bg-emerald-light text-gold-champagne font-sans font-semibold text-xs uppercase tracking-widest py-2.5 px-5 rounded-lg flex items-center gap-1 cursor-pointer ml-auto"
              id="checkout-next-step-btn"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitOrder}
              disabled={loading}
              className="bg-gold-champagne hover:bg-gold-light text-emerald-luxury font-sans font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-lg flex items-center gap-1.5 cursor-pointer ml-auto shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              id="checkout-confirm-order-btn"
            >
              <CheckCircle className="w-4 h-4 animate-bounce" />
              <span>{loading ? 'Processing Order...' : 'Confirm & Notify Rekha Garments'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
