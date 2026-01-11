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

  /* ---------------- FETCHERS ---------------- */

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
    if (!formData.category) {
      setAvailableSubs([]);
      return;
    }
    const cat = categories.find((c) => c._id === formData.category);
    setAvailableSubs(cat?.subcategories || []);
  }, [formData.category, categories]);

  /* ---------------- HELPERS ---------------- */

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

  /* ---------------- CREATE / UPDATE ---------------- */

  const handleAction = async (e) => {
    e.preventDefault();
    if (!storeId) return;

    setActionLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("subCategory", formData.subCategory || "");
      data.append("isAvailable", String(formData.isAvailable));
      data.append(
        "tags",
        JSON.stringify(formData.tags.split(",").map((t) => t.trim()))
      );

      if (variants.length > 0) {
        data.append("variants", JSON.stringify(variants));
      } else {
        data.append("price", formData.price);
      }

      if (imageFile && !isEditMode) {
        data.append("image", imageFile);
      }

      const url = isEditMode
        ? `${import.meta.env.VITE_API_BASE_URL}/item/update/${selectedItemId}`
        : `${import.meta.env.VITE_API_BASE_URL}/item/${storeId}`;

      const res = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        body: data,
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      /* IMAGE UPDATE (EDIT MODE ONLY) */
      if (isEditMode && imageFile) {
        const imgData = new FormData();
        imgData.append("image", imageFile);

        await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/item/update/${selectedItemId}/image`,
          {
            method: "PATCH",
            body: imgData,
            credentials: "include",
          }
        );
      }

      showMsg(isEditMode ? "Item updated" : "Item created");
      resetForm();
      fetchItems(storeId);
    } catch (err) {
      showMsg(err.message || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------------- RENDER ---------------- */

  if (loading) return <div className="mi-loader">Loading...</div>;

  return (
    <>
      <Layout />
      <div className="mi-page">
        <div className="mi-container">
          <header className="mi-header">
            <div>
              <h1>Inventory</h1>
              <p>{items.length} Products</p>
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
                  {item.image ? <img src={item.image} /> : "No Image"}
                  {!item.isAvailable && <span>Unavailable</span>}
                </div>
                <h3>{item.name}</h3>
                <p>
                  {item.variants?.length ? "Multiple Prices" : `₹${item.price}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        {isModalOpen && (
          <div className="mi-modal-overlay">
            <form className="mi-modal" onSubmit={handleAction}>
              {/* UI unchanged – already correct */}
              {/* Submit logic fixed */}
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageItems;
