import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateOrderModal from "./CreateOrderModal";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";

export default function OrdersPage() {
  const navigate = useNavigate();
  const api = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);

  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState("");
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlanBlocked, setIsPlanBlocked] = useState(false);

  const statusWeight = {
    accepted: 1,
    packed: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 0,
  };

  const fetchMyStore = async () => {
    const res = await fetch(`${api}/store/me`, { credentials: "include" });
    const data = await res.json();
    const store = data?.data?.[0] || data?.data;
    if (!store?._id) throw new Error("Store not found.");
    return store._id;
  };

  const fetchOrders = async (sid) => {
    const res = await fetch(`${api}/order/${sid}`, {
      credentials: "include",
    });
    const data = await res.json();
    if (res.status === 403) {
      setIsPlanBlocked(true);
      setErrorMsg(data?.message || "Upgrade your plan.");
      alert("Upgrade Your Plan to access Orders");
      navigate("/");
    }
    if (data.success) setOrders(data.data || []);
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
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o,
          ),
        );
      }
    } catch (err) {
      alert("Status update failed.");
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const sid = await fetchMyStore();
      setStoreId(sid);
      await fetchOrders(sid);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <NavbarLayout />
      <div className="ord-page">
        <div className="ord-header">
          <div>
            <h1 className="ord-title">Orders</h1>
            <p className="ord-subtitle">Fulfillment dashboard.</p>
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
              return (
                <div key={o._id} className="ord-card-v2">
                  <div className="ord-card-v2-header">
                    <div className="ord-id-badge">#{o.orderId}</div>
                    <div className={`ord-status-chip ${o.status}`}>
                      {o.status}
                    </div>
                  </div>

                  <div className="ord-card-v2-content">
                    <div className="ord-customer-sect">
                      <div className="ord-avatar">
                        {o.customer?.name?.[0] || "C"}
                      </div>
                      <div>
                        <div className="ord-cust-name">{o.customer?.name}</div>
                        <div className="ord-cust-phone">
                          {o.customer?.phone}
                        </div>
                      </div>
                    </div>

                    <div className="ord-items-preview">
                      {o.products?.slice(0, 2).map((p, i) => (
                        <div key={i} className="ord-item-row">
                          <span>
                            {p.quantity}x {p.name}
                          </span>
                          <span className="ord-item-price">
                            ₹{p.price * p.quantity}
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
                      <span className="value">₹{o.totalAmount}</span>
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
