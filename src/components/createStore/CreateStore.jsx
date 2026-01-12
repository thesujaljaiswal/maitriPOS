import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

export default function CreateStore() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
  });
  const [logo, setLogo] = useState(null);

  const checkAuthAndStoreLimit = useCallback(async () => {
    try {
      // 1. Check Authentication Status
      const authRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        { credentials: "include" }
      );

      if (!authRes.ok) {
        navigate("/", { replace: true });
        return;
      }

      // 2. Check if user already has a store (Restriction for v1)
      const storeRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/store/me`,
        { credentials: "include" }
      );

      if (storeRes.ok) {
        const storeData = await storeRes.json();
        // If data exists, user already has a store
        if (storeData.data && storeData.data.length > 0) {
          navigate("/", { replace: true });
          return;
        }
      }

      setIsAuthenticated(true);
    } catch (err) {
      console.error("Initialization failed:", err);
      navigate("/", { replace: true });
    } finally {
      setCheckingAuth(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthAndStoreLimit();
  }, [checkAuthAndStoreLimit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setLogo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("slug", formData.slug);
    data.append("phone", formData.phone);
    data.append("email", formData.email);
    data.append("address", formData.address);
    if (logo) data.append("logo", logo);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/store/create`,
        {
          method: "POST",
          body: data,
          credentials: "include",
        }
      );

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to create store");

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth || !isAuthenticated) return null;

  return (
    <div className="store-container">
      <div className="store-card">
        <h2>Setup Your Store</h2>
        <p className="subtitle">Launch your retail business on maitriPOS™</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="store-form">
          <div className="form-group">
            <label>Store Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Mumbai Jewelers"
            />
          </div>

          <div className="form-group">
            <label>Store Slug (eg. mystorename.maitripos.com) *</label>
            <input
              type="text"
              name="slug"
              required
              value={formData.slug}
              onChange={handleChange}
              placeholder="e.g. mystorename"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91..."
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="store@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Store Address</label>
            <textarea
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full shop address..."
            ></textarea>
          </div>

          <div className="form-group">
            <label>Store Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Creating Store..." : "Create Store"}
          </button>
        </form>
      </div>
    </div>
  );
}
