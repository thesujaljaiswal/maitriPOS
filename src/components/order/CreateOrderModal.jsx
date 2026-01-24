import React, { useEffect, useMemo, useRef, useState } from "react";
import "./style.css";

const emptyForm = {
  customerName: "",
  customerPhone: "",
  paymentMethod: "cash",
  paymentStatus: "pending",
  discount: 0,
  taxPercent: 0,
};

export default function CreateOrderModal({
  open,
  onClose,
  storeId,
  onCreated,
}) {
  const api = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsList, setItemsList] = useState([]);
  const [orderProducts, setOrderProducts] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });

  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 3500);
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (!open) return;
    const fetchItems = async () => {
      if (!storeId) return showAlert("Store not found.", "error");
      setLoadingItems(true);
      try {
        const res = await fetch(`${api}/item/${storeId}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setItemsList([]);
          showAlert(data?.message || "Unable to load items.");
          return;
        }
        setItemsList(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        setItemsList([]);
        showAlert("Network error.");
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [open, storeId]);

  // Group items by category alphabetically
  const groupedItems = useMemo(() => {
    const groups = itemsList.reduce((acc, item) => {
      const cat = item.category?.name || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    return Object.keys(groups)
      .sort()
      .map((cat) => ({
        category: cat,
        items: groups[cat].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [itemsList]);

  const handleAddItem = (itemId) => {
    if (!itemId) return;
    const item = itemsList.find((it) => String(it._id) === String(itemId));
    if (!item) return;

    if (orderProducts.some((p) => p.itemId === String(item._id))) {
      return showAlert("Item already added.");
    }

    const variants = (item.variants || [])
      .filter((v) => v && v.price != null)
      .map((v) => ({
        _id: String(v._id),
        name: v.name || "",
        price: Number(v.price || 0),
      }));

    setOrderProducts((p) => [
      ...p,
      {
        itemId: String(item._id),
        name: item.name,
        hasVariants: variants.length > 0,
        variants,
        selectedVariantId: "",
        unitPrice: variants.length > 0 ? 0 : Number(item.price || 0),
        quantity: 1,
      },
    ]);
  };

  const handleVariantChange = (index, variantId) => {
    setOrderProducts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const v = p.variants.find((x) => String(x._id) === String(variantId));
        return v
          ? { ...p, selectedVariantId: v._id, unitPrice: v.price }
          : { ...p, selectedVariantId: "", unitPrice: 0 };
      }),
    );
  };

  const updateQty = (index, delta) => {
    setOrderProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p,
      ),
    );
  };

  const subtotal = useMemo(
    () => orderProducts.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0),
    [orderProducts],
  );
  const taxAmount = useMemo(
    () => ((subtotal - form.discount) * form.taxPercent) / 100,
    [subtotal, form.discount, form.taxPercent],
  );
  const totalAmount = useMemo(
    () => Math.max(0, subtotal - form.discount + taxAmount),
    [subtotal, form.discount, taxAmount],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderProducts.length) return showAlert("Add items.");
    if (orderProducts.some((p) => p.hasVariants && !p.selectedVariantId))
      return showAlert("Select variants.");

    setSaving(true);
    try {
      const payload = {
        storeId,
        items: orderProducts.map((p) => ({
          itemId: p.itemId,
          variantId: p.selectedVariantId || undefined,
          quantity: p.quantity,
        })),
        pricing: {
          subtotal,
          discount: Number(form.discount),
          tax: taxAmount,
          totalAmount,
        },
        customer: { name: form.customerName, phone: form.customerPhone },
        payment: {
          method: form.paymentMethod,
          paymentStatus: form.paymentStatus,
        },
      };
      const res = await fetch(`${api}/order/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onCreated();
        onClose();
        setOrderProducts([]);
        setForm({ ...emptyForm });
      } else {
        const d = await res.json();
        showAlert(d.message || "Error creating order.");
      }
    } catch (err) {
      showAlert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ord-modal-backdrop" onMouseDown={onClose}>
      <div className="ord-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ord-modal-head">
          <div className="ord-modal-title">Create New Order</div>
          <button className="ord-x" onClick={onClose}>
            ✕
          </button>
        </div>

        {alert.message && (
          <div className={`ord-alert is-${alert.type}`}>{alert.message}</div>
        )}

        <form onSubmit={handleSubmit} className="ord-form">
          <div className="ord-row">
            <div className="ord-field">
              <label>Customer Name</label>
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Name"
              />
            </div>
            <div className="ord-field">
              <label>Customer Phone</label>
              <input
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder="Phone"
              />
            </div>
          </div>

          <div className="ord-row">
            <div className="ord-field">
              <label>Payment</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="ord-field">
              <label>Status</label>
              <select
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="ord-field">
            <label>Select Product</label>
            <select
              className="ord-product-dropdown"
              value=""
              onChange={(e) => handleAddItem(e.target.value)}
            >
              <option value="">-- Choose an item from list --</option>
              {groupedItems.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.items.map((it) => (
                    <option key={it._id} value={it._id}>
                      {it.name} {it.price ? `(₹${it.price})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {orderProducts.length > 0 && (
            <div className="ord-table-wrap">
              <table className="ord-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Variant</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="ord-item-name">{p.name}</span>
                      </td>
                      <td>
                        {p.hasVariants ? (
                          <select
                            className={`ord-variant-select ${!p.selectedVariantId ? "is-empty" : ""}`}
                            value={p.selectedVariantId}
                            onChange={(e) =>
                              handleVariantChange(idx, e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            {p.variants.map((v) => (
                              <option key={v._id} value={v._id}>
                                {v.name} (₹{v.price})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="muted">Standard</span>
                        )}
                      </td>
                      <td>₹{p.unitPrice}</td>
                      <td>
                        <div className="qty-wrap">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQty(idx, -1)}
                          >
                            -
                          </button>
                          <span className="qty-val">{p.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQty(idx, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>₹{p.unitPrice * p.quantity}</td>
                      <td>
                        <button
                          type="button"
                          className="ord-del"
                          onClick={() =>
                            setOrderProducts((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="ord-summary">
            <div className="ord-sum-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="ord-sum-row">
              <span>Discount</span>
              <input
                name="discount"
                type="number"
                value={form.discount}
                onChange={handleChange}
              />
            </div>
            <div className="ord-sum-row">
              <span>Tax (%)</span>
              <input
                name="taxPercent"
                type="number"
                value={form.taxPercent}
                onChange={handleChange}
              />
            </div>
            <div className="ord-sum-row ord-sum-total">
              <span>Total</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>

          <div className="ord-modal-foot">
            <button type="button" className="ord-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ord-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
