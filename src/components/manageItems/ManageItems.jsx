import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import "./style.css";
import Layout from "../Layout";

const ManageItems = () => {
  const navigate = useNavigate();
  const { hasStore } = useOutletContext() || {};

  const [storeId, setStoreId] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableSubs, setAvailableSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
    tags: "",
    isAvailable: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [variants, setVariants] = useState([]);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const fetchItems = async (id) => {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/item/${id}`, {
      credentials: "include",
    });
    const data = await res.json();
    setItems(data.data || []);
  };

  const fetchCategories = async (id) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/categories/${id}`,
      { credentials: "include" }
    );
    const data = await res.json();
    setCategories(data.data || []);
  };

  const init = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/store/me`, {
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.data?.length) {
        navigate("/create/store");
        return;
      }
      const id = result.data[0]._id;
      setStoreId(id);
      await Promise.all([fetchItems(id), fetchCategories(id)]);
    } catch {
      showMsg("Connection error", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const cat = categories.find((c) => c._id === formData.category);
    setAvailableSubs(cat?.subcategories || []);
  }, [formData.category, categories]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      subCategory: "",
      tags: "",
      isAvailable: true,
    });
    setVariants([]);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedItemId(null);
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!storeId) return;
    setActionLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      data.set(
        "tags",
        JSON.stringify(formData.tags.split(",").map((t) => t.trim()))
      );
      if (variants.length > 0)
        data.append("variants", JSON.stringify(variants));
      if (imageFile && !isEditMode) data.append("image", imageFile);

      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/item/update/${selectedItemId}`
        : `${import.meta.env.VITE_API_BASE_URL}/item/${storeId}`;
      const res = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        body: data,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Action failed");

      if (isEditMode && imageFile) {
        const imgData = new FormData();
        imgData.append("image", imageFile);
        await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/item/update/${selectedItemId}/image`,
          { method: "PATCH", body: imgData, credentials: "include" }
        );
      }

      showMsg(isEditMode ? "Item updated" : "Item created");
      resetForm();
      fetchItems(storeId);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="mi-loader">Loading Inventory...</div>;

  return (
    <>
      <Layout />
      <div className="mi-page">
        <div className="mi-container">
          <header className="mi-header">
            <div>
              <h1>Inventory</h1>
              <p>{items.length} Products Found</p>
            </div>
            <button
              className="mi-btn-add"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              + Add Product
            </button>
          </header>

          {msg.text && <div className={`mi-toast ${msg.type}`}>{msg.text}</div>}

          <div className="mi-grid">
            {items.map((item) => (
              <div
                key={item._id}
                className="mi-card"
                onClick={() => {
                  setSelectedItemId(item._id);
                  setIsEditMode(true);
                  setIsModalOpen(true);
                  setFormData({
                    name: item.name,
                    description: item.description || "",
                    price: item.price || "",
                    category: item.category?._id || "",
                    subCategory: item.subCategory?._id || "",
                    tags: item.tags?.join(", ") || "",
                    isAvailable: item.isAvailable,
                  });
                  setVariants(item.variants || []);
                  setImagePreview(item.image);
                }}
              >
                <div className="mi-card-img">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    "No Image"
                  )}
                  {!item.isAvailable && <span>Out of Stock</span>}
                </div>
                <h3>{item.name}</h3>
                <p>
                  {item.variants?.length
                    ? "Multiple Variants"
                    : `₹${item.price}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {isModalOpen && (
          <div className="mi-modal-overlay">
            <form className="mi-modal" onSubmit={handleAction}>
              <h2>{isEditMode ? "Edit Product" : "New Product"}</h2>

              <div className="mi-form-group">
                <label>Product Image</label>
                <div
                  className="mi-card-img"
                  style={{ height: "120px", cursor: "pointer" }}
                  onClick={() => document.getElementById("imgInp").click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" />
                  ) : (
                    "Click to upload"
                  )}
                </div>
                <input
                  id="imgInp"
                  type="file"
                  hidden
                  onChange={handleImageChange}
                />
              </div>

              <div className="mi-form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mi-form-row">
                <div className="mi-form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mi-form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mi-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="mi-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageItems;
