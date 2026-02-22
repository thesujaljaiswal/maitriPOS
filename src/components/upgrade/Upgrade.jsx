import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavbarLayout from "../navbar/Navbar";
import Footer from "../footer/Footer";

export default function Upgrade() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasRedirectedRef = React.useRef(false);

  // ✅ tick forces re-render so countdown updates without refresh
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      if (hasRedirectedRef.current) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        { credentials: "include" },
      );

      const data = await res.json();
      const userData = data.data;

      if (!userData) {
        hasRedirectedRef.current = true;
        alert("Please log in to continue.");
        navigate("/account", { replace: true });
        return;
      }

      const plan = userData.plan;
      const planExpiresAt = userData.planExpiresAt;

      let allow = false;

      if (plan === "ARAMBH") allow = true;

      // ✅ allow when within 7 days OR within 24 hours (hours will show)
      if (plan === "PRAVAH" && planExpiresAt) {
        const remainingDays =
          (new Date(planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24);

        if (remainingDays <= 7 && remainingDays > 0) allow = true;
      }

      if (!allow) {
        hasRedirectedRef.current = true;
        alert(
          "Your current plan is already active. You can upgrade or renew only when your plan is close to expiry (within 7 days).",
        );
        navigate("/account", { replace: true });
        return;
      }

      setUser(userData);
    };

    fetchUser();
  }, [navigate]);

  // ✅ expiry info: show hours/min if < 24h, else show days; null if expired/none
  const getExpiryInfo = (expiresAt) => {
    if (!expiresAt) return null;

    const exp = new Date(expiresAt);
    if (isNaN(exp.getTime())) return null;

    const diffMs = exp.getTime() - Date.now();
    if (diffMs <= 0) return null; // expired -> don't show

    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = Math.floor((diffHours - hours) * 60);
      return { type: "hours", hours, minutes };
    }

    const days = Math.ceil(diffHours / 24);
    return { type: "days", days };
  };

  // ✅ computed on every render (tick triggers render)
  const expiryInfo = getExpiryInfo(user?.planExpiresAt);

  // ✅ auto update countdown every 30 seconds (stops when expired)
  useEffect(() => {
    if (!user?.planExpiresAt) return;

    const exp = new Date(user.planExpiresAt);
    if (isNaN(exp.getTime())) return;
    if (exp.getTime() <= Date.now()) return;

    const interval = setInterval(() => {
      if (new Date(user.planExpiresAt).getTime() <= Date.now()) {
        clearInterval(interval);
        return;
      }
      setTick((t) => t + 1);
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [user?.planExpiresAt]);

  // 🔹 Razorpay loader
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setLoading(true);

    const razorpayLoaded = await loadRazorpay();
    if (!razorpayLoaded) {
      alert("Razorpay SDK failed to load");
      setLoading(false);
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/subscription/pravah/create-order`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "PRAVAH" }),
      },
    );

    const order = await res.json();

    if (!order.success) {
      alert("Unable to create order");
      setLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.data.amount,
      currency: "INR",
      name: "maitriPOS™",
      description: "Pravah Plan (30 Days)",
      order_id: order.data.id,
      handler: () => navigate("/"),
      prefill: {
        name: user?.fullName,
        email: user?.email,
      },
      notes: {
        userId: user?._id,
        plan: "PRAVAH",
      },
      theme: { color: "#ffd700" },
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

        {/* 🔴 PLAN EXPIRY WARNING (auto-updates + hours if <24h; hidden if expired) */}
        {user.plan !== "ARAMBH" && expiryInfo && (
          <p
            style={{
              marginTop: "8px",
              color: "#c62828",
              fontWeight: 600,
            }}
          >
            ⚠️ Your plan is expiring{" "}
            {expiryInfo.type === "hours" ? (
              <>
                in{" "}
                <b>
                  {expiryInfo.hours}h {expiryInfo.minutes}m
                </b>
              </>
            ) : (
              <>
                in <b>{expiryInfo.days}</b> day
                {expiryInfo.days !== 1 ? "s" : ""}
              </>
            )}
            . Renew now to have a smooth business experience.
          </p>
        )}

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
            <li>✅ QR Digital Menu</li>
            <li>✅ Unlimited Orders</li>
            <li>✅ Personalized Analytics</li>
            <li>✅ Expense Tracker</li>
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
      <Footer />
    </>
  );
}
