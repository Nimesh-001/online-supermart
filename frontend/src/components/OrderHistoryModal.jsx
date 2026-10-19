import React, { useState, useEffect } from 'react';
import { 
  X, 
  Receipt, 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

export default function OrderHistoryModal({ isOpen, onClose, currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/my-orders', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(json.data);
        }
      }
    } catch (e) {
      console.error('Failed to load customer orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      setSelectedOrder(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">My Orders & Invoices</h2>
              <p className="text-xs text-slate-500">
                Rendered from Database View <code>v_order_invoices</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Loading your orders...</span>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No orders placed yet</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Once you place an order, your official invoices and transaction receipts will appear here.
              </p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                        {ord.orderNumber}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        ord.orderStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        ord.orderStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        ord.orderStatus === 'CONFIRMED' ? 'bg-teal-100 text-teal-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ord.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ord.paymentMethod === 'CARD_TEST' ? 'CARD' : 'COD'} • {ord.paymentStatus}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {ord.placedAt ? new Date(ord.placedAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Delivery: <strong>{ord.deliveryName}</strong>, {ord.deliveryCity}</span>
                    </div>
                    {ord.transactionReference && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ref: {ord.transactionReference}</span>
                      </div>
                    )}
                  </div>

                  {/* Item snapshot list */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1.5 text-xs">
                      {ord.items.map((it) => (
                        <div key={it.orderItemId} className="flex justify-between items-center text-slate-700">
                          <span>
                            {it.productName} <span className="text-slate-400">× {it.quantity} {it.sellingUnit}</span>
                          </span>
                          <span className="font-semibold text-slate-900">
                            LKR {it.lineTotal?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <div className="text-slate-500 space-x-3">
                      <span>Subtotal: LKR {ord.subtotal?.toFixed(2)}</span>
                      {ord.discountAmount > 0 && (
                        <span className="text-emerald-700 font-semibold">
                          Discount: -LKR {ord.discountAmount?.toFixed(2)}
                        </span>
                      )}
                      <span>Delivery: LKR {ord.deliveryFee?.toFixed(2)}</span>
                    </div>
                    <div className="text-sm font-black text-slate-950">
                      Total: LKR {ord.totalAmount?.toFixed(2)}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
