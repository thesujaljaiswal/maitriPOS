import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarLayout from "../navbar/Navbar";

export default function Upgrade() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch logged-in user info
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        { credentials: "include" },
      );

      const data = await res.json();
      setUser(data.data);
    };

    fetchUser();
  }, []);

  // 🔹 Load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 🔹 Start payment
  const handleUpgrade = async () => {
    setLoading(true);

    const razorpayLoaded = await loadRazorpay();
    if (!razorpayLoaded) {
      alert("Razorpay SDK failed to load");
      setLoading(false);
      return;
    }

    // 1️⃣ Create order from backend
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/subscription/pravah/create-order`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "PRAVAH",
        }),
      },
    );

    const order = await res.json();

    if (!order.success) {
      alert("Unable to create order");
      setLoading(false);
      return;
    }

    // 2️⃣ Razorpay checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.data.amount,
      currency: "INR",
      name: "maitriPOS™",
      description: "Pravah Plan (30 Days)",
      order_id: order.data.id,

      handler: function () {
        // ⚠️ DO NOTHING HERE
        // Webhook will activate plan
        navigate("/");
      },

      prefill: {
        name: user?.fullName,
        email: user?.email,
      },

      notes: {
        userId: user?._id,
        plan: "PRAVAH",
      },

      theme: {
        color: "#ffd700",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

    setLoading(false);
  };

  if (!user) return null;

  return (
    <>
      <NavbarLayout />
      <div style={{ maxWidth: "800px", margin: "60px auto", padding: "20px" }}>
        <h1>Upgrade Your Plan 🚀</h1>

        <p style={{ marginTop: "10px", color: "#555" }}>
          Current Plan: <strong>{user.plan}</strong>
        </p>

        <div
          style={{
            marginTop: "30px",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #ddd",
          }}
        >
          <h2>PRAVAH Plan</h2>

          <ul style={{ marginTop: "15px", lineHeight: "1.8" }}>
            <li>✅ Unlimited Orders</li>
            <li>✅ QR Digital Menu</li>
            <li>✅ Customer Analytics</li>
            <li>✅ Priority Support</li>
          </ul>

          <h3 style={{ marginTop: "20px" }}>₹299 / month</h3>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              fontSize: "16px",
              background: "#000",
              color: "#fff",
              borderRadius: "8px",
              cursor: "pointer",
              border: "none",
            }}
          >
            {loading ? "Processing..." : "Upgrade Now"}
          </button>
        </div>
      </div>
    </>
  );
}
