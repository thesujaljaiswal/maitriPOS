import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import Layout from "../Layout";
import Footer from "../footer/Footer";

const ManageCategory = () => {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [subCategoryForm, setSubCategoryForm] = useState({
    name: "",
    description: "",
    parentCategory: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null); // "category" | "subcategory"

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const init = useCallback(async () => {
    try {
      const storeRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/store/me`,
        { credentials: "include" },
      );
      const storeData = await storeRes.json();
      if (!storeRes.ok || !storeData.data?.length)
        return navigate("/create/store");

      const id = storeData.data[0]._id;
      setStoreId(id);
      fetchCategories(id);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const fetchCategories = async (id) => {
    const targetId = id || storeId;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/categories/${targetId}`,
        { credentials: "include" },
      );
      const data = await res.json();
      setCategories(data.data || []);
    } catch {
      setError("Failed to fetch categories");
    }
  };

  useEffect(() => {
    init();
  }, [init]);

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) return setError("Category name is required");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/categories/${storeId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(categoryForm),
        },
      );
      if (!res.ok) throw new Error("Failed to create category");
      setCategoryForm({ name: "", description: "" });
      setSuccess("Category created successfully");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSub = async () => {
    if (!subCategoryForm.name || !subCategoryForm.parentCategory)
      return setError("Select parent & name");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/categories/sub/${storeId}/${
          subCategoryForm.parentCategory
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: subCategoryForm.name,
            description: subCategoryForm.description,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to create subcategory");
      setSubCategoryForm({ name: "", description: "", parentCategory: "" });
      setSuccess("Subcategory created successfully");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item, type) => {
    setEditingItem({ ...item, description: item.description || "" });
    setEditingType(type);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const endpoint =
        editingType === "category"
          ? `/categories/update/${editingItem._id}`
          : `/categories/sub/update/${editingItem._id}`;
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: editingItem.name,
            description: editingItem.description,
          }),
        },
      );
      if (!res.ok) throw new Error("Update failed");
      setSuccess("Updated successfully");
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    const msg =
      type === "category"
        ? "Delete category and all subcategories?"
        : "Delete subcategory?";
    if (!window.confirm(msg)) return;
    setLoading(true);
    try {
      const endpoint =
        type === "category"
          ? `/categories/delete/${id}`
          : `/categories/sub/delete/${id}`;
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) throw new Error("Delete failed");
      setSuccess("Deleted successfully");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Layout />
      <div className="mc-wrapper">
        <div className="mc-container">
          <h2 className="mc-title">Manage Categories</h2>

          {error && <div className="mc-alert mc-error">{error}</div>}
          {success && <div className="mc-alert mc-success">{success}</div>}

          <div className="mc-flex-row">
            <div className="mc-card">
              <h4 className="mc-card-title">Add Category</h4>
              <input
                className="mc-input"
                placeholder="Name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
              />
              <input
                className="mc-input"
                placeholder="Description (Optional)"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />
              <button
                className="mc-btn-primary"
                onClick={handleCreateCategory}
                disabled={loading}
              >
                Create
              </button>
            </div>

            <div className="mc-card">
              <h4 className="mc-card-title">Add Subcategory</h4>
              <select
                className="mc-select"
                value={subCategoryForm.parentCategory}
                onChange={(e) =>
                  setSubCategoryForm({
                    ...subCategoryForm,
                    parentCategory: e.target.value,
                  })
                }
              >
                <option value="">Select Parent</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="mc-input"
                placeholder="Name"
                value={subCategoryForm.name}
                onChange={(e) =>
                  setSubCategoryForm({
                    ...subCategoryForm,
                    name: e.target.value,
                  })
                }
              />
              <input
                className="mc-input"
                placeholder="Description (Optional)"
                value={subCategoryForm.description}
                onChange={(e) =>
                  setSubCategoryForm({
                    ...subCategoryForm,
                    description: e.target.value,
                  })
                }
              />
              <button
                className="mc-btn-primary"
                onClick={handleCreateSub}
                disabled={loading}
              >
                Create
              </button>
            </div>
          </div>

          <div className="mc-card">
            <h4 className="mc-card-title">All Categories</h4>
            {categories.map((cat) => (
              <div key={cat._id} className="mc-item-group">
                <div className="mc-item-info">
                  <div>
                    <span className="mc-item-name">{cat.name}</span>
                    {cat.description && (
                      <span className="mc-desc-text">{cat.description}</span>
                    )}
                  </div>
                  <div className="mc-item-actions">
                    <button
                      className="mc-btn-text"
                      onClick={() => openEdit(cat, "category")}
                    >
                      Edit
                    </button>
                    <button
                      className="mc-btn-text mc-danger"
                      onClick={() => handleDelete(cat._id, "category")}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mc-subcategory-list">
                  {cat.subcategories?.map((sub) => (
                    <div key={sub._id} className="mc-subcategory-item">
                      <div>
                        <span className="mc-sub-label">{sub.name}</span>
                        {sub.description && (
                          <span
                            className="mc-desc-text"
                            style={{ marginLeft: "20px" }}
                          >
                            {sub.description}
                          </span>
                        )}
                      </div>
                      <div className="mc-item-actions">
                        <button
                          className="mc-btn-text"
                          onClick={() => openEdit(sub, "subcategory")}
                        >
                          Edit
                        </button>
                        <button
                          className="mc-btn-text mc-danger"
                          onClick={() => handleDelete(sub._id, "subcategory")}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isModalOpen && (
          <div className="mc-modal-overlay">
            <div className="mc-modal-content">
              <h4 className="mc-card-title">Edit {editingType}</h4>
              <input
                className="mc-input"
                value={editingItem.name}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
              />
              <input
                className="mc-input"
                placeholder="Description"
                value={editingItem.description}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    description: e.target.value,
                  })
                }
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  className="mc-btn-primary"
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  className="mc-btn-primary"
                  style={{ background: "#475569" }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ManageCategory;
