// OrdersPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateOrderModal from "./CreateOrderModal";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";

const INR = (n = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function OrdersPage() {
  const navigate = useNavigate();
  const api = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);

  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState("");
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlanBlocked, setIsPlanBlocked] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState("");

  const statusWeight = {
    accepted: 1,
    packed: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 0,
  };

  const fetchMyStore = async () => {
    const res = await fetch(`${api}/store/me`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    const store = data?.data?.[0] || data?.data;
    if (!store?._id) throw new Error(data?.message || "Store not found.");
    return store._id;
  };

  const fetchOrders = async (sid) => {
    const res = await fetch(`${api}/order/store/${sid}`, {
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    // ✅ backend now uses 403 for ownership too
    // treat BOTH plan-block and not-owner the same UX if you want
    if (res.status === 403) {
      setIsPlanBlocked(true);
      setErrorMsg(
        data?.message || "Access denied. Upgrade plan or check store.",
      );
      alert(data?.message || "Access denied.");
      navigate("/");
      return;
    }

    if (res.ok && data?.success)
      setOrders(Array.isArray(data.data) ? data.data : []);
    else setErrorMsg(data?.message || "Failed to load orders");
  };

  const handleUpdateStatus = async (orderId, currentStatus, newStatus) => {
    if (currentStatus === "delivered" || currentStatus === "cancelled") return;

    if (
      statusWeight[newStatus] < statusWeight[currentStatus] &&
      newStatus !== "cancelled"
    ) {
      alert("Cannot move order to a previous stage.");
      return;
    }

    if (newStatus === "cancelled") {
      if (!window.confirm("Confirm CANCEL? This cannot be undone.")) return;
    }

    if (newStatus === "delivered") {
      if (!window.confirm("Mark as DELIVERED? This locks the order.")) return;
    }

    try {
      const res = await fetch(`${api}/order/${orderId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        // ✅ backend updates timeline, but card doesn't need it
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o,
          ),
        );
        return;
      }

      alert(data?.message || "Status update failed.");
    } catch {
      alert("Status update failed.");
    }
  };

  // ✅ toggle payment status (pending <-> paid) — backend blocks if cancelled
  const handleTogglePayment = async (
    orderId,
    currentPaymentStatus,
    isCancelled,
  ) => {
    if (!orderId) return;
    if (isCancelled) return;

    const nextStatus = currentPaymentStatus === "paid" ? "pending" : "paid";

    setUpdatingPaymentId(orderId);
    try {
      const res = await fetch(`${api}/order/${orderId}/payment`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  payment: {
                    ...(o.payment || {}),
                    paymentStatus: nextStatus,
                  },
                }
              : o,
          ),
        );
        return;
      }

      alert(data?.message || "Payment update failed.");
    } catch {
      alert("Payment update failed.");
    } finally {
      setUpdatingPaymentId("");
    }
  };

  const refresh = async () => {
    setLoading(true);
    setErrorMsg("");
    setIsPlanBlocked(false);
    try {
      const sid = await fetchMyStore();
      setStoreId(sid);
      await fetchOrders(sid);
    } catch (e) {
      setErrorMsg(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NavbarLayout />

      <div className="ord-page">
        <div className="ord-header">
          <div>
            <h1 className="ord-title">Orders</h1>
            <p className="ord-subtitle">Fulfillment dashboard.</p>
            {errorMsg ? <div className="ord-error">{errorMsg}</div> : null}
          </div>

          <div className="ord-actions">
            <button className="ord-btn" onClick={refresh}>
              Refresh
            </button>
            <button
              className="ord-btn ord-btn-primary"
              onClick={() => setIsModalOpen(true)}
              disabled={isPlanBlocked}
            >
              + New Order
            </button>
          </div>
        </div>

        {loading ? (
          <div className="ord-loading">Loading...</div>
        ) : (
          <div className="ord-grid">
            {orders.map((o) => {
              const isLocked =
                o.status === "delivered" || o.status === "cancelled";

              const custName = o.customer?.name?.trim() || "Walk-in";
              const custPhone = o.customer?.phone?.trim() || "";
              const paymentStatus = o.payment?.paymentStatus || "pending";

              return (
                <div key={o._id} className="ord-card-v2">
                  <div className="ord-card-v2-header">
                    <div className="ord-id-badge">#{o.orderId}</div>

                    <div className="ord-chip-row">
                      <div className={`ord-status-chip ${o.status}`}>
                        {o.status}
                      </div>

                      <button
                        type="button"
                        className={`ord-pay-chip ${paymentStatus}`}
                        disabled={
                          o.status === "cancelled" ||
                          updatingPaymentId === o._id ||
                          o.status === "delivered"
                        }
                        onClick={() =>
                          handleTogglePayment(
                            o._id,
                            paymentStatus,
                            o.status === "cancelled",
                          )
                        }
                        title={
                          o.status === "cancelled"
                            ? "Cancelled orders cannot change payment"
                            : "Click to toggle payment status"
                        }
                      >
                        {updatingPaymentId === o._id
                          ? "Updating..."
                          : paymentStatus}
                      </button>
                    </div>
                  </div>

                  <div className="ord-card-v2-content">
                    <div className="ord-customer-sect">
                      <div className="ord-avatar">{custName?.[0] || "C"}</div>
                      <div>
                        <div className="ord-cust-name">{custName}</div>
                        <div className="ord-cust-phone">{custPhone}</div>
                      </div>
                    </div>

                    <div className="ord-items-preview">
                      {o.products?.slice(0, 2).map((p, i) => (
                        <div key={i} className="ord-item-row">
                          <span>
                            {p.quantity}x {p.name}(
                            {p.variantName ? (
                              <span className="ord-variant-pill">
                                {p.variantName}
                              </span>
                            ) : (
                              <span className="ord-variant-pill">Regular</span>
                            )}
                            )
                          </span>

                          <span className="ord-item-price">
                            {INR(
                              Number(p.price || 0) * Number(p.quantity || 0),
                            )}
                          </span>
                        </div>
                      ))}

                      {o.products?.length > 2 && (
                        <div className="ord-more-items">
                          +{o.products.length - 2} more items
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ord-card-v2-footer">
                    <div className="ord-total-box">
                      <span className="label">Total Amount</span>
                      <span className="value">{INR(o.totalAmount)}</span>
                    </div>

                    <div className="ord-actions-v2">
                      <button
                        className="ord-view-link"
                        onClick={() => navigate(`/orders/${o._id}`)}
                      >
                        View Details
                      </button>

                      <select
                        className="ord-status-dropdown"
                        value={o.status}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdateStatus(o._id, o.status, e.target.value)
                        }
                      >
                        <option value="accepted">Accept</option>
                        <option value="packed">Pack</option>
                        <option value="shipped">Ship</option>
                        <option value="delivered">Deliver</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <CreateOrderModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          storeId={storeId}
          onCreated={refresh}
        />
      </div>
    </>
  );
}
