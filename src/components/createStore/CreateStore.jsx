import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";
import { Oval } from "react-loader-spinner";
import Footer from "../footer/Footer";
import { THEMES } from "../publicStore/Theme.js";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./cropImage";
import {
  CheckCircle2,
  AlertCircle,
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
} from "lucide-react";

export default function ManageStore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [storeId, setStoreId] = useState(null);
  const [slugStatus, setSlugStatus] = useState(null);

  // Custom Dialog Box State
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info", // "success" | "error" | "info"
    onClose: null,
  });

  const showDialog = (title, message, type = "info", onClose = null) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type,
      onClose,
    });
  };

  const closeDialog = () => {
    const callback = dialog.onClose;
    setDialog({
      isOpen: false,
      title: "",
      message: "",
      type: "info",
      onClose: null,
    });
    if (callback) callback();
  };

  // Image Cropper States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
    theme: "default",
    default_theme: false,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [pendingLogoFile, setPendingLogoFile] = useState(null);

  const sortedThemes = Object.entries(THEMES).sort(([a], [b]) => {
    const nameA = a.replace(/_/g, " ").toUpperCase();
    const nameB = b.replace(/_/g, " ").toUpperCase();
    return nameA.localeCompare(nameB);
  });

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
          theme: store.theme || "default",
          default_theme: store.default_theme || false,
        });
        setLogoPreview(store.logo);
        setSlugStatus("available");
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
        { credentials: "include" },
      );
      const result = await res.json();
      setSlugStatus(result.data.available ? "available" : "unavailable");
    } catch (err) {
      setSlugStatus(null);
    }
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showDialog("Invalid File", "Please select an image file (PNG, JPG, WEBP, etc.).", "error");
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
    // Reset file input so user can pick the same file again if desired
    e.target.value = "";
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    try {
      setIsCropping(true);
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], "store-logo.jpg", {
        type: "image/jpeg",
      });

      const previewUrl = URL.createObjectURL(croppedBlob);
      setLogoPreview(previewUrl);
      setPendingLogoFile(croppedFile);
      setCropModalOpen(false);
      setImageToCrop(null);

      // If existing store in edit mode, upload right away
      if (isEditMode && storeId) {
        await handleLogoUpdate(croppedFile);
      }
    } catch (err) {
      showDialog("Crop Failed", "Could not crop the image. Please try again.", "error");
    } finally {
      setIsCropping(false);
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
        },
      );
      if (!res.ok) throw new Error("Logo update failed");
      const result = await res.json();
      setLogoPreview(result.data.logo);
      showDialog(
        "Logo Updated",
        "Your store logo has been updated successfully!",
        "success"
      );
    } catch (err) {
      setError(err.message);
      showDialog("Update Failed", err.message || "Failed to update logo.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slugStatus !== "available") {
      showDialog(
        "Invalid Slug",
        "Please verify that your store slug is available before saving.",
        "error"
      );
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        address: formData.address,
        theme: formData.default_theme ? "" : formData.theme,
        default_theme: formData.default_theme,
        contact: { phone: formData.phone, email: formData.email },
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/store/${storeId}`
        : `${import.meta.env.VITE_API_BASE_URL}/store/create`;

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Operation failed");
      const result = await res.json();
      const newStoreId = result.data?._id || storeId;

      // In create mode, if user cropped a logo, upload it now
      if (!isEditMode && pendingLogoFile && newStoreId) {
        try {
          const logoData = new FormData();
          logoData.append("logo", pendingLogoFile);
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/store/${newStoreId}/logo`,
            {
              method: "PUT",
              body: logoData,
              credentials: "include",
            }
          );
        } catch (logoErr) {
          console.error("Failed to upload logo during store creation:", logoErr);
        }
      }

      showDialog(
        "Success",
        isEditMode
          ? "Store settings updated successfully!"
          : "Your store has been created successfully!",
        "success",
        () => {
          if (!isEditMode) navigate("/");
        }
      );
    } catch (err) {
      setError(err.message);
      showDialog("Operation Failed", err.message || "Could not save store settings.", "error");
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
                    onChange={handleLogoFileSelect}
                  />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" />
                  ) : (
                    <span className="ms-placeholder">No Logo</span>
                  )}
                </div>

                <button
                  type="button"
                  className="ms-btn-logo"
                  onClick={() => document.getElementById("storeLogo").click()}
                >
                  {logoPreview ? "Change Logo" : "Add Logo"}
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
                required={true}
              />
            </div>

            <div className="ms-input-group">
              <label>
                Store Slug (Please use text and number and avoid using special
                characters)
              </label>
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
                  placeholder="e.g. your-store"
                  required={true}
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

            {/* Theme Customizations */}
            <div className="ms-grid">
              <div className="ms-input-group">
                <label>Theme</label>
                <div className="ms-select-wrapper">
                  <select
                    className="ms-styled-select"
                    value={formData.theme}
                    disabled={formData.default_theme}
                    onChange={(e) =>
                      setFormData({ ...formData, theme: e.target.value })
                    }
                  >
                    {sortedThemes.map(([key]) => (
                      <option key={key} value={key}>
                        {key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* <div className="ms-input-group">
                <div className="ms-toggle-container">
                  <span className="ms-toggle-label">Auto-Apply Theme</span>
                  <label className="ms-switch">
                    <input
                      type="checkbox"
                      checked={formData.default_theme}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          default_theme: e.target.checked,
                          theme: e.target.checked ? "" : formData.theme,
                        })
                      }
                    />
                    <span className="ms-slider"></span>
                  </label>
                </div>
              </div> */}
            </div>

            <div className="ms-grid">
              <div className="ms-input-group">
                <label>Phone</label>
                <input
                  value={formData.phone}
                  required={true}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="ms-input-group">
                <label>Email</label>
                <input
                  value={formData.email}
                  required={true}
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
                required={true}
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

      {/* Image Cropper Modal */}
      {cropModalOpen && (
        <div
          className="ms-crop-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target.classList.contains("ms-crop-modal") && !isCropping) {
              setCropModalOpen(false);
              setImageToCrop(null);
            }
          }}
        >
          <div className="ms-crop-card" onClick={(e) => e.stopPropagation()}>
            <div className="ms-crop-header">
              <div className="ms-crop-header-left">
                <div className="ms-crop-header-badge">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <h3>Adjust Logo</h3>
                  <p className="ms-crop-subtitle">
                    Drag to reposition, pinch or use controls to zoom & rotate
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ms-dialog-close-btn"
                aria-label="Close"
                onClick={() => {
                  if (!isCropping) {
                    setCropModalOpen(false);
                    setImageToCrop(null);
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="ms-crop-area">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                zoomSpeed={0.5}
                minZoom={1}
                maxZoom={3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="ms-crop-controls">
              <div className="ms-crop-toolbar">
                <div className="ms-crop-slider-row">
                  <button
                    type="button"
                    className="ms-crop-tool-btn"
                    title="Zoom out"
                    onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(1)))}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    aria-label="Zoom level"
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="ms-crop-tool-btn"
                    title="Zoom in"
                    onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))}
                  >
                    <ZoomIn size={16} />
                  </button>
                  <span className="ms-crop-zoom-label">{zoom.toFixed(1)}x</span>
                </div>

                <div className="ms-crop-extra-tools">
                  <button
                    type="button"
                    className="ms-crop-rotate-btn"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="Rotate 90 degrees"
                  >
                    <RotateCw size={15} />
                    <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    className="ms-crop-reset-btn"
                    onClick={() => {
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                      setRotation(0);
                    }}
                    title="Reset to default"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="ms-crop-actions">
                <button
                  type="button"
                  className="ms-crop-btn-cancel"
                  onClick={() => {
                    setCropModalOpen(false);
                    setImageToCrop(null);
                  }}
                  disabled={isCropping}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ms-crop-btn-save"
                  onClick={handleSaveCrop}
                  disabled={isCropping}
                >
                  {isCropping ? "Saving..." : "Apply & Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Application Dialog Box */}
      {dialog.isOpen && (
        <div className="ms-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="ms-dialog-card">
            <div className="ms-dialog-header">
              <div className="ms-dialog-header-title">
                <div className={`ms-dialog-icon ${dialog.type}`}>
                  {dialog.type === "success" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                </div>
                <h3>{dialog.title}</h3>
              </div>
              <button
                type="button"
                className="ms-dialog-close-btn"
                onClick={closeDialog}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ms-dialog-body">
              <p>{dialog.message}</p>
            </div>

            <div className="ms-dialog-actions">
              <button
                type="button"
                className="ms-dialog-primary-btn"
                onClick={closeDialog}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
