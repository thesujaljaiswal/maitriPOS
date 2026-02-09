import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    plan: "",
    planExpiresAt: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // ✅ tick forces re-render so countdown updates without refresh
  const [tick, setTick] = useState(0);

  // ✅ format date + time
  const formatDate = (dateString) => {
    if (!dateString || dateString === "FREE PLAN") return "N/A (Free Tier)";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ✅ expiry info: show hours/min if < 24h, else show days; hide if expired
  const getExpiryInfo = (expiresAt) => {
    if (!expiresAt || expiresAt === "FREE PLAN") return null;

    const exp = new Date(expiresAt);
    if (isNaN(exp.getTime())) return null;

    const diffMs = exp.getTime() - Date.now();
    if (diffMs <= 0) return null; // ❌ expired -> don't show

    const diffHours = diffMs / (1000 * 60 * 60);

    // ⏰ Less than 24 hours → show hours + minutes
    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = Math.floor((diffHours - hours) * 60);

      return { type: "hours", hours, minutes };
    }

    // 📅 24+ hours → show days
    const days = Math.ceil(diffHours / 24);
    return { type: "days", days };
  };

  // ✅ computed on every render (tick triggers render)
  const expiryInfo = getExpiryInfo(user.planExpiresAt);

  // ✅ show alert only for paid plans and only if not expired
  const showSubscriptionAlert =
    user.plan && user.plan !== "ARAMBH" && expiryInfo !== null;

  const fetchUserData = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/current-user`,
        { credentials: "include" },
      );

      const result = await res.json();

      if (result.success) {
        setUser({
          fullName: result.data.fullName || "",
          username: result.data.username || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          plan: result.data.plan || "",
          planExpiresAt: result.data.planExpiresAt || "FREE PLAN",
        });
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // ✅ auto update countdown every 30 seconds (stops when no expiry / expired)
  useEffect(() => {
    if (!user.planExpiresAt || user.planExpiresAt === "FREE PLAN") return;

    const exp = new Date(user.planExpiresAt);
    if (isNaN(exp.getTime())) return;

    // if already expired, no need to run timer
    if (exp.getTime() <= Date.now()) return;

    const interval = setInterval(() => {
      // if expired now, stop timer
      if (new Date(user.planExpiresAt).getTime() <= Date.now()) {
        clearInterval(interval);
        return;
      }
      setTick((t) => t + 1);
    }, 30 * 1000); // update every 30 seconds

    return () => clearInterval(interval);
  }, [user.planExpiresAt]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/update-account`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
          credentials: "include",
        },
      );

      const result = await res.json();

      setMessage({
        type: result.success ? "success" : "error",
        text: result.message || "Profile updated!",
      });
    } catch (err) {
      setMessage({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(passwordData),
          credentials: "include",
        },
      );

      const result = await res.json();

      if (result.success) {
        setPasswordData({ oldPassword: "", newPassword: "" });
        setIsModalOpen(false);
        setMessage({ type: "success", text: "Password updated successfully!" });
      } else {
        alert(result.message || "Failed to change password");
      }
    } catch (err) {
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarLayout />

      <div className="mp-account-page-wrapper">
        <header className="mp-account-header">
          <div className="mp-header-flex">
            <div>
              <h1>Manage Account</h1>
              <p>Update your personal details and preferences.</p>
            </div>
            <button
              className="mp-btn-lock"
              onClick={() => setIsModalOpen(true)}
            >
              🔒 Change Password
            </button>
          </div>
        </header>

        {message.text && (
          <div className={`mp-alert ${message.type}`}>{message.text}</div>
        )}

        {/* 🔴 Subscription warning (auto-updates) */}
        {showSubscriptionAlert && (
          <div className="mp-alert danger">
            ⚠️ Your <b>{user.plan}</b> plan expires{" "}
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
            . Please Renew now to have a smooth business experience..
          </div>
        )}

        <div className="mp-account-single-card">
          <div className="mp-form-group">
            <label>
              Current Plan: <b>{user.plan || "N/A"}</b>
            </label>
          </div>

          <div className="mp-form-group">
            <label>
              Expires On: <b>{formatDate(user.planExpiresAt)}</b>
            </label>
          </div>

          <section className="mp-account-card">
            <h3>Profile Details</h3>

            <form onSubmit={handleUpdateProfile}>
              <div className="mp-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={user.fullName}
                  onChange={(e) =>
                    setUser({ ...user, fullName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mp-form-group">
                <label>Username</label>
                <input type="text" value={user.username} disabled />
              </div>

              <div className="mp-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  required
                />
              </div>

              <div className="mp-form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                />
              </div>

              <button type="submit" className="mp-btn-save" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {isModalOpen && (
        <div className="mp-modal-overlay">
          <div className="mp-modal-content">
            <div className="mp-modal-header">
              <h3>Update Password</h3>
              <button
                className="mp-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="mp-form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      oldPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="mp-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <button type="submit" className="mp-btn-save" disabled={loading}>
                {loading ? "Processing..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
