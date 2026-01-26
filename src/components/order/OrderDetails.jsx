// OrderDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";

const INR = (n = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingPay, setUpdatingPay] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchOrder = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${api}/order/${id}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) setOrder(data.data);
      else {
        // ✅ backend may return 403 for not-owner / plan
        setOrder(null);
        setMsg(data?.message || "Order not found or access denied.");
      }
    } catch {
      setOrder(null);
      setMsg("Network error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updatePayment = async (nextStatus) => {
    if (!order?._id) return;
    if (updatingPay) return;

    if (order.status === "cancelled") {
      setMsg("Cannot change payment for a cancelled order.");
      window.setTimeout(() => setMsg(""), 2500);
      return;
    }

    setUpdatingPay(true);
    setMsg("");

    try {
      const res = await fetch(`${api}/order/${order._id}/payment`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setMsg(data?.message || "Payment update failed.");
        return;
      }

      setOrder((p) => ({
        ...p,
        payment: { ...(p.payment || {}), paymentStatus: nextStatus },
      }));
      setMsg("Payment updated.");
    } catch {
      setMsg("Payment update failed.");
    } finally {
      setUpdatingPay(false);
      window.setTimeout(() => setMsg(""), 2500);
    }
  };

  const timelineOrder = [
    "acceptedAt",
    "packedAt",
    "shippedAt",
    "deliveredAt",
    "cancelledAt",
  ];

  const timelineEntries = useMemo(() => {
    const tl = order?.statusTimeline || {};
    return timelineOrder
      .map((k) => [k, tl[k]])
      .filter(([, v]) => !!v)
      .map(([k, v]) => ({
        key: k,
        label: k.replace("At", "").toUpperCase(),
        date: new Date(v),
      }));
  }, [order]);

  if (loading) return <div className="ord-page">Loading details...</div>;

  if (!order)
    return (
      <>
        <NavbarLayout />
        <div className="ord-page">
          <button className="ord-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div style={{ marginTop: 12 }}>{msg || "Order not found."}</div>
        </div>
      </>
    );

  const paymentStatus = order.payment?.paymentStatus || "pending";

  return (
    <>
      <NavbarLayout />

      <div className="ord-page">
        <div className="ord-header">
          <button className="ord-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div>
            <h2 className="ord-title">Order #{order.orderId}</h2>
            {msg ? <div className="ord-msg">{msg}</div> : null}
          </div>
        </div>

        <div className="ord-details-container">
          {/* Left */}
          <div className="ord-details-main">
            <div className="ord-card">
              <h3>Items</h3>

              <div className="ord-table-wrap">
                <table className="ord-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.products || []).map((p, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{p.name}</strong>
                          <div className="muted">
                            {p.variantName || "Regular"}
                          </div>
                        </td>
                        <td>{INR(p.price)}</td>
                        <td>{p.quantity}</td>
                        <td>
                          {INR(Number(p.price || 0) * Number(p.quantity || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ord-summary">
                <div className="ord-sum-row">
                  <span>Subtotal</span>
                  <span>{INR(order.subtotal)}</span>
                </div>
                <div className="ord-sum-row">
                  <span>Discount</span>
                  <span>-{INR(order.discount)}</span>
                </div>
                <div className="ord-sum-row">
                  <span>Tax</span>
                  <span>+{INR(order.tax)}</span>
                </div>
                <div className="ord-sum-row ord-sum-total">
                  <span>Total</span>
                  <span>{INR(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="ord-details-side">
            <div className="ord-card">
              <h3>Customer</h3>
              <div className="ord-customer-info">
                <strong>{order.customer?.name || "Walk-in"}</strong>
                <p>{order.customer?.phone || "-"}</p>
              </div>

              <hr className="ord-divider" />

              <h3>Payment</h3>

              <div className="ord-pay-row">
                <div className={`ord-status-mini ${paymentStatus}`}>
                  {(order.payment?.method || "cash").toUpperCase()} —{" "}
                  {paymentStatus.toUpperCase()}
                </div>
              </div>

              {order.status === "cancelled" ? (
                <div className="muted ord-mini-hint">
                  Payment is locked because this order is cancelled.
                </div>
              ) : null}
            </div>

            <div className="ord-card">
              <h3>Timeline</h3>
              <div className="ord-timeline">
                {timelineEntries.length ? (
                  timelineEntries.map((t) => (
                    <div key={t.key} className="ord-timeline-item">
                      <div className="ord-timeline-dot"></div>
                      <div>
                        <div className="ord-timeline-label">{t.label}</div>
                        <div className="ord-timeline-date">
                          {t.date.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="muted">No timeline yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
