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

  const fetchCategoriesAndSubs = async (id) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/categories/${id}`,
      {
        credentials: "include",
      }
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
      if (!res.ok || !result.data?.length) return navigate("/create/store");

      const id = result.data[0]._id;
      setStoreId(id);
      await Promise.all([fetchItems(id), fetchCategoriesAndSubs(id)]);
    } catch {
      showMsg("Connection Error", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (formData.category) {
      const selectedCat = categories.find((c) => c._id === formData.category);
      setAvailableSubs(selectedCat?.subcategories || []);
    } else {
      setAvailableSubs([]);
    }
  }, [formData.category, categories]);

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
    setActionLoading(true);

    try {
      const data = new FormData();
      data.append("storeId", storeId);
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("subCategory", formData.subCategory);
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

      if (imageFile) data.append("image", imageFile);

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

      showMsg(isEditMode ? "Item Updated" : "Item Created");
      resetForm();
      fetchItems(storeId);
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="mi-loader">Loading...</div>;

  return (
    <>
      <Layout />
      <div className="mi-page">
        <div className="mi-container">
          <header className="mi-header">
            <div className="mi-header-left">
              <h1>Inventory</h1>
              <p className="mi-sub-count">{items.length} Products</p>
            </div>
            <button
              className="mi-btn-add"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <span>+</span> Add Product
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
                  setIsEditMode(true);
                  setIsModalOpen(true);
                }}
              >
                <div className="mi-card-img">
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <div className="mi-no-img">No Image</div>
                  )}
                  {!item.isAvailable && (
                    <div className="mi-oos-badge">Unavailable</div>
                  )}
                </div>
                <div className="mi-card-content">
                  <span className="mi-card-cat">
                    {item.category?.name > item.sunCategory?.name ||
                      "Uncategorized"}
                  </span>
                  <h3 className="mi-card-title">{item.name}</h3>
                  <p className="mi-card-price">
                    {item.variants?.length > 0
                      ? "Multiple Prices"
                      : `₹${item.price}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isModalOpen && (
          <div className="mi-modal-overlay">
            <form className="mi-modal" onSubmit={handleAction}>
              <div className="mi-modal-head">
                <h2>{isEditMode ? "Edit Product" : "Create Product"}</h2>
                <button
                  type="button"
                  className="mi-close-x"
                  onClick={resetForm}
                >
                  &times;
                </button>
              </div>

              <div className="mi-modal-body">
                <div className="mi-form-section">
                  <div className="mi-input-box">
                    <label>Product Image</label>
                    <label className="mi-image-label">
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {imagePreview ? (
                        <img src={imagePreview} className="mi-preview-img" />
                      ) : (
                        <div className="mi-placeholder">
                          <span className="mi-plus-icon">+</span>
                          <p>Upload Image</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="mi-input-box">
                    <label>Product Name</label>
                    <input
                      required
                      placeholder="e.g. Cappuccino"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="mi-input-box">
                    <label>Description</label>
                    <textarea
                      placeholder="Ingredients, notes, etc..."
                      rows="3"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mi-grid-2">
                    <div className="mi-input-box">
                      <label>Category</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value,
                            subCategory: "",
                          })
                        }
                      >
                        <option value="">Select</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mi-input-box">
                      <label>Sub-Category</label>
                      <select
                        value={formData.subCategory}
                        disabled={!formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subCategory: e.target.value,
                          })
                        }
                      >
                        <option value="">Select</option>
                        {availableSubs.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mi-form-section">
                  <div className="mi-input-box">
                    <label>Tags</label>
                    <input
                      placeholder="Coffee, Hot, Latte"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                    />
                  </div>

                  <div className="mi-input-box">
                    <label>Base Price (₹)</label>
                    <input
                      type="number"
                      disabled={variants.length > 0}
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                    {variants.length > 0 && (
                      <span className="mi-info-txt">
                        Price managed via variants
                      </span>
                    )}
                  </div>

                  <div className="mi-variants-card">
                    <div className="mi-v-head">
                      <label>Variants (Sizes/Options)</label>
                      <button
                        type="button"
                        onClick={() =>
                          setVariants([
                            ...variants,
                            { name: "", price: "", quantity: "" },
                          ])
                        }
                      >
                        + Add
                      </button>
                    </div>
                    <div className="mi-v-list">
                      {variants.map((v, i) => (
                        <div key={i} className="mi-v-row">
                          <input
                            placeholder="Size"
                            value={v.name}
                            required
                            onChange={(e) => {
                              const n = [...variants];
                              n[i].name = e.target.value;
                              setVariants(n);
                            }}
                          />
                          <input
                            placeholder="₹"
                            type="number"
                            value={v.price}
                            required
                            onChange={(e) => {
                              const n = [...variants];
                              n[i].price = e.target.value;
                              setVariants(n);
                            }}
                          />
                          <input
                            placeholder="Qty"
                            type="number"
                            value={v.quantity}
                            required
                            onChange={(e) => {
                              const n = [...variants];
                              n[i].quantity = e.target.value;
                              setVariants(n);
                            }}
                          />
                          <button
                            type="button"
                            className="mi-v-del"
                            onClick={() =>
                              setVariants(
                                variants.filter((_, idx) => idx !== i)
                              )
                            }
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mi-toggle-row">
                    <label className="mi-switch">
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isAvailable: e.target.checked,
                          })
                        }
                      />
                      <span className="mi-slider"></span>
                    </label>
                    <span>Is Available</span>
                  </div>
                </div>
              </div>

              <div className="mi-modal-foot">
                {isEditMode ? (
                  <button
                    type="button"
                    className="mi-btn-del"
                    onClick={async () => {
                      if (window.confirm("Delete product?")) {
                        await fetch(
                          `${
                            import.meta.env.VITE_API_BASE_URL
                          }/item/delete/${selectedItemId}`,
                          { method: "DELETE", credentials: "include" }
                        );
                        resetForm();
                        fetchItems(storeId);
                      }
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <div />
                )}
                <div className="mi-foot-btns">
                  <button
                    type="button"
                    className="mi-btn-sec"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mi-btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Save Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageItems;
