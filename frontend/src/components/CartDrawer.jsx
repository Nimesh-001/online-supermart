import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Lock,
  Clock,
  Database,
  Tag,
  CreditCard,
  MapPin,
  Receipt,
  FileText
} from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  currentUser,
  onNavigateLogin,
  onCartUpdated
}) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showSandbox, setShowSandbox] = useState(false);

  // Checkout State
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [addressLine, setAddressLine] = useState('124 Galle Road');
  const [city, setCity] = useState('Colombo');
  const [postalCode, setPostalCode] = useState('00300');
  const [couponCode, setCouponCode] = useState('SAVE10PLUS');
  const [couponResult, setCouponResult] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD_TEST'); // 'CARD_TEST' | 'COD'
  const [lockStatus, setLockStatus] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  // Concurrency Savepoint Reservation Sandbox state
  const [reserveProductId, setReserveProductId] = useState('1');
  const [reserveQuantity, setReserveQuantity] = useState('2');
  const [reserveResult, setReserveResult] = useState(null);
  const [reserveLoading, setReserveLoading] = useState(false);

  // Event trigger simulation state
  const [eventTriggerResult, setEventTriggerResult] = useState(null);

  // Fetch cart details
  const fetchCart = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include',
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          setCart(res.data);
          if (onCartUpdated) {
            onCartUpdated(res.data.totalItemCount || 0);
          }
        }
      } else if (response.status === 401) {
        setCart(null);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
      setFeedback(null);
      setIsCheckoutStep(false);
      setCouponResult(null);
      setLockStatus(null);
      setCreatedInvoice(null);
    }
  }, [isOpen, currentUser]);

  const showToast = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Update item quantity
  const handleUpdateQuantity = async (cartItemId, newQty) => {
    if (newQty < 1) {
      handleRemoveItem(cartItemId);
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty })
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setCart(res.data);
        if (onCartUpdated) onCartUpdated(res.data.totalItemCount || 0);
        showToast('Cart quantity updated.', 'success');
      } else {
        showToast(res.message || 'Failed to update quantity.', 'error');
      }
    } catch (err) {
      showToast('Error updating item quantity.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove single item
  const handleRemoveItem = async (cartItemId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setCart(res.data);
        if (onCartUpdated) onCartUpdated(res.data.totalItemCount || 0);
        showToast('Item removed from cart.', 'info');
      } else {
        showToast(res.message || 'Failed to remove item.', 'error');
      }
    } catch (err) {
      showToast('Error removing cart item.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear entire cart
  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear all items from your cart?')) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        credentials: 'include'
      });
      const res = await response.json();
      if (response.ok && res.success) {
        setCart(res.data);
        if (onCartUpdated) onCartUpdated(0);
        showToast('Your cart has been cleared.', 'info');
      } else {
        showToast(res.message || 'Failed to clear cart.', 'error');
      }
    } catch (err) {
      showToast('Error clearing cart.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Validate coupon code via fn_calculate_coupon_discount
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      showToast('Please enter a coupon code.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/orders/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ couponCode: couponCode.trim() })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCouponResult(json.data);
      }
    } catch (e) {
      showToast('Failed to validate coupon code.', 'error');
    }
  };

  // Test Concurrency Lock check via sp_test_checkout_concurrency_lock
  const handleTestLock = async () => {
    try {
      const res = await fetch('/api/orders/test-lock', {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLockStatus(json.data);
      }
    } catch (e) {
      showToast('Failed to verify concurrency lock.', 'error');
    }
  };

  // Place Order via ACID Multi-Step Stored Procedure sp_place_order
  const handlePlaceOrder = async () => {
    if (!addressLine.trim() || !city.trim()) {
      showToast('Please enter a delivery address and city.', 'error');
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          addressLine: addressLine.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          couponCode: couponResult?.valid ? couponCode.trim() : null,
          paymentMethod
        })
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setCreatedInvoice(json.data);
        setIsCheckoutStep(false);
        fetchCart();
        if (onCartUpdated) onCartUpdated(0);
      } else {
        showToast(json.message || 'Checkout failed.', 'error');
      }
    } catch (e) {
      showToast('Network error processing checkout.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Test Concurrency Savepoint Reservation Procedure: sp_reserve_cart_with_savepoint
  const handleTestSavepointReservation = async () => {
    setReserveLoading(true);
    setReserveResult(null);
    try {
      const response = await fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: parseInt(reserveProductId, 10),
          quantity: parseFloat(reserveQuantity)
        })
      });
      const res = await response.json();
      setReserveResult(res);
      if (res.success && res.data?.reserveStatus === 'SUCCESS_RESERVED') {
        fetchCart();
      }
    } catch (err) {
      setReserveResult({
        success: false,
        message: 'Network error invoking sp_reserve_cart_with_savepoint'
      });
    } finally {
      setReserveLoading(false);
    }
  };

  // Test Event Scheduler cleanup logic
  const handleTriggerAbandonedCleanup = async () => {
    try {
      const response = await fetch('/api/cart/cleanup-abandoned', {
        method: 'POST',
        credentials: 'include'
      });
      const res = await response.json();
      setEventTriggerResult(res);
    } catch (err) {
      setEventTriggerResult({
        success: false,
        message: 'Failed to trigger abandoned cart cleanup'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Shopping Cart
                  {cart && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      ID #{cart.cartId}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Powered by MySQL Views, Triggers & ACID Procedures
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close Cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'error' ? 'bg-rose-50 text-rose-800 border-b border-rose-200' :
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' :
              'bg-blue-50 text-blue-800 border-b border-blue-200'
            }`}>
              {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Guest State Notice */}
            {!currentUser && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-2">
                <p className="text-xs font-bold">Please sign in to view and manage your shopping cart.</p>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateLogin('Please sign in to view your cart.');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Sign In Now
                </button>
              </div>
            )}

            {/* Created Order Invoice Popup */}
            {createdInvoice && (
              <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-slate-900 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Order Placed Successfully!</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                    {createdInvoice.orderNumber}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-700 bg-white p-3 rounded-xl border border-emerald-200">
                  <p><strong>Recipient:</strong> {createdInvoice.deliveryName}</p>
                  <p><strong>Destination:</strong> {createdInvoice.deliveryCity}</p>
                  <p><strong>Subtotal:</strong> LKR {createdInvoice.subtotal?.toFixed(2)}</p>
                  {createdInvoice.discountAmount > 0 && (
                    <p className="text-emerald-700 font-bold">
                      <strong>Coupon Discount:</strong> -LKR {createdInvoice.discountAmount?.toFixed(2)}
                    </p>
                  )}
                  <p><strong>Delivery Fee:</strong> LKR {createdInvoice.deliveryFee?.toFixed(2)}</p>
                  <p className="text-sm font-black text-slate-950 pt-1 border-t border-slate-100">
                    Total Paid: LKR {createdInvoice.totalAmount?.toFixed(2)}
                  </p>
                  {createdInvoice.transactionReference && (
                    <p className="font-mono text-[10px] text-slate-500 pt-1">
                      Txn Ref: {createdInvoice.transactionReference}
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-emerald-800 font-semibold">
                  Executed by <code>sp_place_order</code> with stock decrement and sales movement trigger!
                </p>

                <button
                  onClick={() => setCreatedInvoice(null)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Dismiss Invoice
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-medium">Loading cart from database...</span>
              </div>
            )}

            {/* Empty Cart State */}
            {!loading && currentUser && !createdInvoice && (!cart?.items || cart.items.length === 0) && (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Your cart is currently empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Explore fresh farm produce, dairy, bakery, and pantry essentials to start shopping.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            )}

            {/* Item List (from v_cart_details) */}
            {!loading && currentUser && !isCheckoutStep && cart?.items && cart.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                  <span>Line Items ({cart.items.length})</span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Calculated by View `v_cart_details`
                  </span>
                </div>

                {cart.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.productName}
                        </h4>
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {item.sellingUnit}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        LKR {item.pricePerUnit?.toFixed(2)} / {item.sellingUnit}
                      </p>
                      <p className="text-xs font-black text-emerald-700 mt-1">
                        Line Total: LKR {item.lineTotal?.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-xs">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 transition-colors disabled:opacity-40 cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 transition-colors disabled:opacity-40 cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        disabled={actionLoading}
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    disabled={actionLoading}
                    onClick={handleClearCart}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Entire Cart
                  </button>
                </div>
              </div>
            )}

            {/* Member 5 Checkout Form Step */}
            {!loading && currentUser && isCheckoutStep && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Checkout Details (Member 5)
                  </span>
                  <button
                    onClick={() => setIsCheckoutStep(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ← Back to Cart
                  </button>
                </div>

                {/* Delivery Address */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Delivery Address</label>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Address Line (e.g. 124 Galle Road)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City (e.g. Colombo)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                    />
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Postal Code"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                {/* Coupon Evaluation (fn_calculate_coupon_discount) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Coupon Code (fn_calculate_coupon_discount)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE10PLUS"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold uppercase"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponResult && (
                    <p className={`text-[11px] font-semibold p-2 rounded-lg ${
                      couponResult.valid ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {couponResult.message}
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD_TEST')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        paymentMethod === 'CARD_TEST'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Card Simulation</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Instant PAID status with TXN Ref</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        paymentMethod === 'COD'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Cash On Delivery</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Pay on arrival (PENDING)</p>
                    </button>
                  </div>
                </div>

                {/* Concurrency Lock Check Test */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestLock}
                    className="w-full py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Verify Stock Lock (sp_test_checkout_concurrency_lock)
                  </button>
                  {lockStatus && (
                    <p className={`mt-2 text-[10px] font-mono p-2 rounded-lg ${
                      lockStatus.canCheckout ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}>
                      Lock Status: {lockStatus.status}
                    </p>
                  )}
                </div>

                {/* Complete Order Button */}
                <button
                  disabled={placingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {placingOrder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Place Order with ACID Procedure (sp_place_order)
                </button>
              </div>
            )}

            {/* ADBMS Concept Sandbox Section (Accordion) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 mt-6">
              <button
                onClick={() => setShowSandbox(!showSandbox)}
                className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-emerald-800">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>ADBMS Engine Sandbox (Members 4 & 5 Artifacts)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {showSandbox ? 'Hide ▲' : 'Show ▼'}
                </span>
              </button>

              {showSandbox && (
                <div className="p-4 space-y-4 border-t border-slate-200 bg-white text-xs">
                  
                  {/* Test 1: Concurrency Savepoint Reservation */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        sp_reserve_cart_with_savepoint
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        FOR UPDATE + SAVEPOINT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tests row locking & savepoint rollback: If stock is insufficient, rolls back to savepoint and returns <code>INSUFFICIENT_STOCK_ROLLED_BACK</code>.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Product ID</label>
                        <select
                          value={reserveProductId}
                          onChange={(e) => setReserveProductId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                        >
                          <option value="1">1 - Fresh Strawberries (KG)</option>
                          <option value="2">2 - Organic Broccoli (KG)</option>
                          <option value="3">3 - Fresh Whole Milk (EACH)</option>
                          <option value="4">4 - Farm Eggs 12pk (EACH)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Reservation Qty</label>
                        <input
                          type="number"
                          value={reserveQuantity}
                          onChange={(e) => setReserveQuantity(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                          placeholder="e.g. 5 or 9999"
                        />
                      </div>
                    </div>
                    <button
                      disabled={reserveLoading}
                      onClick={handleTestSavepointReservation}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {reserveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      Execute Stored Procedure with Savepoint
                    </button>

                    {reserveResult && (
                      <div className={`p-2 rounded-lg font-mono text-[11px] ${
                        reserveResult.data?.reserveStatus === 'SUCCESS_RESERVED' 
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        <p className="font-bold">Result: {reserveResult.data?.reserveStatus || 'FAILED'}</p>
                        <p className="text-[10px] mt-0.5">{reserveResult.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Test 2: Trigger Validation */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Trigger trg_validate_cart_qty & trg_after_order_item_sale
                    </span>
                    <p className="text-[11px] text-slate-500">
                      MySQL Triggers reject <code>quantity &lt;= 0</code> and auto-record <code>SALE</code> movements into <code>stock_movements</code> table upon checkout!
                    </p>
                  </div>

                  {/* Test 3: Event Scheduler */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        evt_cleanup_abandoned_carts & evt_cancel_expired_orders
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                        SCHEDULED EVENTS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Automated background maintenance jobs cleaning up abandoned carts and cancelled unconfirmed orders.
                    </p>
                    <button
                      onClick={handleTriggerAbandonedCleanup}
                      className="w-full py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                      Simulate Abandoned Cart Cleanup
                    </button>
                    {eventTriggerResult && (
                      <p className="text-[10px] font-mono text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        {eventTriggerResult.message}
                      </p>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* Footer with Subtotal & Proceed to Checkout */}
          {currentUser && !isCheckoutStep && !createdInvoice && cart && cart.items && cart.items.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subtotal from Function:</span>
                  <span className="font-mono text-slate-700">fn_get_cart_subtotal()</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Total Due:</span>
                  <span className="text-xl font-black text-slate-950">
                    LKR {cart.subtotal?.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                disabled={actionLoading}
                onClick={() => setIsCheckoutStep(true)}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
