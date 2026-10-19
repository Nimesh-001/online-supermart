import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  MapPin, 
  CreditCard, 
  Calendar,
  XCircle,
  FileText,
  Filter
} from 'lucide-react';

export default function OrdersTab({ currentUser, notify }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [eventResult, setEventResult] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/all', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrders(json.data);
        }
      }
    } catch (e) {
      notify('Failed to load orders.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, newPaymentStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: newPaymentStatus
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        notify(`Order #${orderId} updated to ${newStatus}!`);
        fetchOrders();
      } else {
        notify(json.message || 'Failed to update order status.', true);
      }
    } catch (e) {
      notify('Error updating order.', true);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTriggerCancelExpired = async () => {
    try {
      const res = await fetch('/api/orders/cancel-expired', {
        method: 'POST',
        credentials: 'include'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEventResult(json.data);
        notify('Expired orders cleanup routine completed (evt_cancel_expired_orders).');
        fetchOrders();
      }
    } catch (e) {
      notify('Error running expired orders cleanup.', true);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.deliveryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.deliveryCity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span>Order Fulfillment & Operations</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time customer order processing, delivery management, and invoice tracking from <code>v_order_invoices</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerCancelExpired}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Simulate Scheduled Event evt_cancel_expired_orders"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Simulate evt_cancel_expired_orders</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs cursor-pointer transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {eventResult && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between shadow-xs">
          <span>Scheduled event processed: <strong>{eventResult.cancelledOrdersCount}</strong> expired pending orders cancelled.</span>
          <button onClick={() => setEventResult(null)} className="text-amber-700 hover:text-amber-950 font-bold cursor-pointer">×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, customer name, or delivery city..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {['ALL', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Fetching orders from database...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <PackageCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No orders found</h3>
          <p className="text-xs text-slate-400">No customer orders matching the current filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.orderId}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-lg">
                    {ord.orderNumber}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                    ord.orderStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    ord.orderStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    ord.orderStatus === 'CONFIRMED' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {ord.orderStatus}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    ord.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {ord.paymentMethod === 'CARD_TEST' ? 'CARD' : 'COD'} • {ord.paymentStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {ord.placedAt ? new Date(ord.placedAt).toLocaleString() : 'Recent'}
                </div>
              </div>

              {/* Delivery and Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer / Recipient</span>
                  <span className="font-bold text-slate-900">{ord.deliveryName}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Destination</span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {ord.deliveryCity}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Transaction Reference</span>
                  <span className="font-mono text-slate-600 truncate block">
                    {ord.transactionReference || 'N/A (Cash On Delivery)'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              {ord.items && ord.items.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                      {ord.items.map((it) => (
                        <tr key={it.orderItemId} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-sans font-medium text-slate-900">{it.productName}</td>
                          <td className="py-2 px-3 uppercase text-[10px] text-slate-500">{it.sellingUnit}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">{it.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-600">LKR {it.unitPrice?.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">LKR {it.lineTotal?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals & Status Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>Subtotal: LKR {ord.subtotal?.toFixed(2)}</span>
                  {ord.discountAmount > 0 && (
                    <span className="text-emerald-700 font-bold">
                      Discount: -LKR {ord.discountAmount?.toFixed(2)}
                    </span>
                  )}
                  <span>Delivery: LKR {ord.deliveryFee?.toFixed(2)}</span>
                  <span className="text-sm font-black text-slate-950">
                    Grand Total: LKR {ord.totalAmount?.toFixed(2)}
                  </span>
                </div>

                {/* Status Changer Actions */}
                <div className="flex items-center gap-2">
                  {ord.orderStatus !== 'PROCESSING' && ord.orderStatus !== 'COMPLETED' && ord.orderStatus !== 'CANCELLED' && (
                    <button
                      disabled={updatingId === ord.orderId}
                      onClick={() => handleUpdateStatus(ord.orderId, 'PROCESSING', ord.paymentStatus)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Set Processing
                    </button>
                  )}

                  {ord.orderStatus !== 'COMPLETED' && ord.orderStatus !== 'CANCELLED' && (
                    <button
                      disabled={updatingId === ord.orderId}
                      onClick={() => handleUpdateStatus(ord.orderId, 'COMPLETED', 'PAID')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Complete & Deliver
                    </button>
                  )}

                  {ord.orderStatus !== 'CANCELLED' && ord.orderStatus !== 'COMPLETED' && (
                    <button
                      disabled={updatingId === ord.orderId}
                      onClick={() => handleUpdateStatus(ord.orderId, 'CANCELLED', ord.paymentStatus)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
