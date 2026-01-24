import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${api}/order/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setOrder(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, api]);

  if (loading) return <div className="ord-page">Loading details...</div>;
  if (!order) return <div className="ord-page">Order not found.</div>;

  return (
    <>
      <NavbarLayout />
      <div className="ord-page">
        <div className="ord-header">
          <button className="ord-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 className="ord-title">Order #{order.orderId}</h2>
        </div>

        <div className="ord-details-container">
          {/* Left: Invoice Items */}
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
                    {order.products.map((p, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{p.name}</strong>
                          {p.variantName && (
                            <div className="muted">{p.variantName}</div>
                          )}
                        </td>
                        <td>₹{p.price}</td>
                        <td>{p.quantity}</td>
                        <td>₹{p.price * p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ord-summary">
                <div className="ord-sum-row">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="ord-sum-row">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
                <div className="ord-sum-row">
                  <span>Tax</span>
                  <span>+₹{order.tax}</span>
                </div>
                <div className="ord-sum-row ord-sum-total">
                  <span>Total Paid</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info Panels */}
          <div className="ord-details-side">
            <div className="ord-card">
              <h3>Customer</h3>
              <div className="ord-customer-info">
                <strong>{order.customer?.name}</strong>
                <p>{order.customer?.phone}</p>
              </div>
              <hr className="ord-divider" />
              <h3>Payment</h3>
              <div
                className={`ord-status-mini ${order.payment?.paymentStatus}`}
              >
                {order.payment?.method.toUpperCase()} -{" "}
                {order.payment?.paymentStatus.toUpperCase()}
              </div>
            </div>

            <div className="ord-card">
              <h3>Timeline</h3>
              <div className="ord-timeline">
                {Object.entries(order.statusTimeline).map(([key, date]) => (
                  <div key={key} className="ord-timeline-item">
                    <div className="ord-timeline-dot"></div>
                    <div>
                      <div className="ord-timeline-label">
                        {key.replace("At", "").toUpperCase()}
                      </div>
                      <div className="ord-timeline-date">
                        {new Date(date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
