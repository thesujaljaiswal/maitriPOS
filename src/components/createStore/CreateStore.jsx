import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";
import { Oval } from "react-loader-spinner";

export default function ManageStore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [slugStatus, setSlugStatus] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/store/me`, {
        credentials: "include",
      });
      const result = await res.json();

      if (res.ok && result.data?.length > 0) {
        const store = result.data[0];
        setStoreId(store._id);
        setIsEditMode(true);
        setFormData({
          name: store.name || "",
          slug: store.slug || "",
          phone: store.contact?.phone || "",
          email: store.contact?.email || "",
          address: store.address || "",
        });
        setLogoPreview(store.logo);
        setSlugStatus("available"); // Existing slug is available to the owner
      }
    } catch (err) {
      setError("Failed to load store data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const handleCheckSlug = async () => {
    if (!formData.slug) return;
    setSlugStatus("checking");
    try {
      const query = storeId ? `?currentStoreId=${storeId}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/store/check-slug/${
          formData.slug
        }${query}`,
        { credentials: "include" }
      );
      const result = await res.json();
      setSlugStatus(result.data.available ? "available" : "unavailable");
    } catch (err) {
      setSlugStatus(null);
    }
  };

  const handleLogoUpdate = async (file) => {
    if (!isEditMode || !storeId) return;
    setActionLoading(true);
    try {
      const data = new FormData();
      data.append("logo", file);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/store/${storeId}/logo`,
        {
          method: "PUT",
          body: data,
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Logo update failed");
      const result = await res.json();
      setLogoPreview(result.data.logo);
      alert("Logo updated!");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slugStatus !== "available") {
      alert("Please verify slug availability first.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        address: formData.address,
        contact: { phone: formData.phone, email: formData.email },
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/store/update/${storeId}`
        : `${import.meta.env.VITE_API_BASE_URL}/store/create`;

      const res = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Operation failed");
      alert(isEditMode ? "Store updated" : "Store created");
      if (!isEditMode) navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="ms-loading">
        <Oval color="#000" />
      </div>
    );

  return (
    <>
      <NavbarLayout />
      <div className="ms-page">
        {actionLoading && (
          <div className="ms-overlay">
            <Oval color="#000" height={50} width={50} />
          </div>
        )}

        <div className="ms-container">
          <header className="ms-header">
            <h1>{isEditMode ? "Store Settings" : "Create Store"}</h1>
          </header>

          <form onSubmit={handleSubmit} className="ms-card">
            <div className="ms-logo-section">
              <div className="ms-logo-wrapper">
                <div className="ms-logo-circle">
                  <input
                    type="file"
                    id="storeLogo"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setLogoPreview(URL.createObjectURL(file));
                        if (isEditMode) handleLogoUpdate(file);
                      }
                    }}
                  />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" />
                  ) : (
                    <span className="ms-placeholder">No Logo</span>
                  )}
                </div>

                {/* Dedicated Update Button */}
                <button
                  type="button"
                  className="ms-btn-logo"
                  onClick={() => document.getElementById("storeLogo").click()}
                >
                  {logoPreview ? "Update Logo" : "Add Logo"}
                </button>
              </div>
            </div>

            <div className="ms-input-group">
              <label>Store Name</label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="ms-input-group">
              <label>Store Slug</label>
              <div className="ms-slug-row">
                <input
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugStatus(null);
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    });
                  }}
                  placeholder="e.g. jaiswal-dairy"
                  required
                />
                <button
                  type="button"
                  onClick={handleCheckSlug}
                  className="ms-btn-check"
                  disabled={!formData.slug}
                >
                  {slugStatus === "checking" ? "..." : "Check"}
                </button>
              </div>
              <div className="ms-slug-preview">
                <span>Your site will available be at: </span>
                <strong
                  className={slugStatus === "available" ? "text-success" : ""}
                >
                  {formData.slug || "your-store"}.maitripos.com
                </strong>
              </div>
              {slugStatus && (
                <span className={`ms-slug-msg ${slugStatus}`}>
                  {slugStatus === "available" ? "✅ Available" : "❌ Taken"}
                </span>
              )}
            </div>

            <div className="ms-grid">
              <div className="ms-input-group">
                <label>Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="ms-input-group">
                <label>Email</label>
                <input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="ms-input-group">
              <label>Address</label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows="3"
              />
            </div>

            <button
              type="submit"
              className="ms-btn-submit"
              disabled={slugStatus !== "available"}
            >
              {isEditMode ? "Update Settings" : "Launch Store"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
