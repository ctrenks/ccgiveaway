"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string | null;
  tax: string;
  shipping: string;
  total: string;
  creditsEarned: number;
  shippingAddress: string | null;
  paymentProvider: string | null;
  paymentId: string | null;
  notes: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null };
  items: Array<{
    id: string;
    quantity: number;
    price: string;
    product: { name: string; image: string | null };
  }>;
}

const statuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          setNewStatus(data.order.status);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          notes: trackingNumber ? `Tracking: ${trackingNumber}` : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Order not found</h1>
        <Link href="/admin/orders" className="text-purple-400 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const shippingAddress = order.shippingAddress
    ? JSON.parse(order.shippingAddress)
    : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/orders"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">
          Order {order.orderNumber.slice(0, 8)}...
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-slate-800 rounded overflow-hidden">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🃏
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-white">{item.product.name}</div>
                      <div className="text-slate-500 text-sm">
                        Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-white font-medium">
                    ${(item.quantity * Number(item.price)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              {order.subtotal && (
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span>
                  {Number(order.shipping) === 0
                    ? "Free"
                    : `$${Number(order.shipping).toFixed(2)}`}
                </span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Tax</span>
                  <span>${Number(order.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {shippingAddress && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Shipping Address
              </h2>
              <div className="text-slate-300">
                <p className="font-medium">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                <p>{shippingAddress.address1}</p>
                {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state}{" "}
                  {shippingAddress.zip}
                </p>
                <p>{shippingAddress.country}</p>
                {shippingAddress.phone && (
                  <p className="mt-2 text-slate-500">📞 {shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Update Status</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {newStatus === "SHIPPED" && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Tracking Number (optional)
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === order.status}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Order Info</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Order Number</dt>
                <dd className="text-white font-mono">{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Date</dt>
                <dd className="text-white">
                  {new Date(order.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Customer</dt>
                <dd className="text-white">{order.user.name || "Guest"}</dd>
                <dd className="text-slate-400">{order.user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Payment</dt>
                <dd className="text-white capitalize">
                  {order.paymentProvider || "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Credits Earned</dt>
                <dd className="text-amber-400">🎁 {order.creditsEarned}</dd>
              </div>
              {order.notes && (
                <div>
                  <dt className="text-slate-500">Notes</dt>
                  <dd className="text-white">{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

