// CreateOrderModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./style.css";

const emptyForm = {
  customerName: "",
  customerPhone: "",
  paymentMethod: "cash",
  paymentStatus: "pending",
  discount: 0,
  taxPercent: 0,
};

const INR = (n = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

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

  // ✅ Variant popup flow
  const [variantPopupOpen, setVariantPopupOpen] = useState(false);
  const [pending, setPending] = useState(null);
  // pending: { itemId, name, variants: [{_id,name,price}], selectedVariantId }

  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    window.clearTimeout(showAlert._t);
    showAlert._t = window.setTimeout(
      () => setAlert({ message: "", type: "" }),
      3500,
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "discount" || name === "taxPercent") {
      const num = Number(value);
      setForm((p) => ({ ...p, [name]: Number.isFinite(num) ? num : 0 }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
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
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setItemsList([]);
          showAlert(json?.message || "Unable to load items.");
          return;
        }

        setItemsList(Array.isArray(json?.data) ? json.data : []);
      } catch {
        setItemsList([]);
        showAlert("Network error.");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [open, storeId, api]);

  const groupedItems = useMemo(() => {
    const groups = itemsList.reduce((acc, item) => {
      const cat = item?.category?.name || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    return Object.keys(groups)
      .sort()
      .map((cat) => ({
        category: cat,
        items: groups[cat]
          .slice()
          .sort((a, b) => (a?.name || "").localeCompare(b?.name || "")),
      }));
  }, [itemsList]);

  const makeKey = (itemId, variantId) =>
    `${String(itemId)}:${variantId ? String(variantId) : "regular"}`;

  // ✅ Adds a line OR increments qty if same item+variant already exists
  const addOrIncrement = ({
    itemId,
    name,
    variantId,
    variantName,
    unitPrice,
  }) => {
    const key = makeKey(itemId, variantId || null);

    const existingIndex = orderProducts.findIndex((p) => p.key === key);
    if (existingIndex !== -1) {
      setOrderProducts((prev) =>
        prev.map((p, i) =>
          i === existingIndex ? { ...p, quantity: p.quantity + 1 } : p,
        ),
      );
      return;
    }

    setOrderProducts((prev) => [
      ...prev,
      {
        key,
        itemId: String(itemId),
        name,
        hasVariants: Boolean(variantId),
        variants: [], // not needed for now (we select variant before adding)

        selectedVariantId: variantId ? String(variantId) : "",
        selectedVariantName: variantName || "Regular",

        unitPrice: Number(unitPrice || 0),
        quantity: 1,
      },
    ]);
  };

  // ✅ Product picker:
  // - no variants => add directly
  // - has variants => open variant popup (preselect first variant)
  const handlePickProduct = (itemId) => {
    if (!itemId) return;

    const item = itemsList.find((it) => String(it._id) === String(itemId));
    if (!item) return;

    const variants = (item.variants || [])
      .filter((v) => v && v.price != null)
      .map((v) => ({
        _id: String(v._id),
        name: v.name || "Variant",
        price: Number(v.price || 0),
      }));

    const hasVariants = variants.length > 0;

    if (!hasVariants) {
      addOrIncrement({
        itemId: item._id,
        name: item.name,
        variantId: "",
        variantName: "Regular",
        unitPrice: Number(item.price || 0),
      });
      return;
    }

    setPending({
      itemId: String(item._id),
      name: item.name,
      variants,
      selectedVariantId: variants[0]?._id || "",
    });
    setVariantPopupOpen(true);
  };

  const closeVariantPopup = () => {
    setVariantPopupOpen(false);
    setPending(null);
  };

  const confirmAddPendingVariant = () => {
    if (!pending) return;

    const v = pending.variants.find(
      (x) => String(x._id) === String(pending.selectedVariantId),
    );
    if (!v) {
      showAlert("Select a variant first.");
      return;
    }

    addOrIncrement({
      itemId: pending.itemId,
      name: pending.name,
      variantId: v._id,
      variantName: v.name,
      unitPrice: v.price,
    });

    closeVariantPopup();
  };

  // ✅ keyboard: Enter adds variant
  const onVariantPopupKeyDown = (e) => {
    if (e.key === "Escape") closeVariantPopup();
    if (e.key === "Enter") {
      e.preventDefault();
      confirmAddPendingVariant();
    }
  };

  const updateQty = (index, delta) => {
    setOrderProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p,
      ),
    );
  };

  const removeLine = (index) => {
    setOrderProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(
    () =>
      orderProducts.reduce(
        (acc, p) => acc + Number(p.unitPrice || 0) * Number(p.quantity || 0),
        0,
      ),
    [orderProducts],
  );

  const discount = Math.max(0, Number(form.discount || 0));
  const taxPercent = Math.max(0, Number(form.taxPercent || 0));

  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - discount);
    return (taxable * taxPercent) / 100;
  }, [subtotal, discount, taxPercent]);

  const totalAmount = useMemo(
    () => Math.max(0, subtotal - discount + taxAmount),
    [subtotal, discount, taxAmount],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderProducts.length) return showAlert("Add items.");

    // ✅ if popup open, force user to finish it
    if (variantPopupOpen) return showAlert("Finish selecting the variant.");

    setSaving(true);
    try {
      const payload = {
        storeId,
        items: orderProducts.map((p) => ({
          itemId: p.itemId,
          ...(p.selectedVariantId ? { variantId: p.selectedVariantId } : {}),
          quantity: p.quantity,
        })),
        pricing: {
          subtotal,
          discount,
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

      const d = await res.json().catch(() => ({}));

      if (res.ok && d?.success) {
        onCreated?.();
        onClose?.();
        setOrderProducts([]);
        setForm({ ...emptyForm });
        closeVariantPopup();
        return;
      }

      showAlert(d?.message || "Error creating order.");
    } catch {
      showAlert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (saving) return;
    closeVariantPopup();
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="ord-modal-backdrop" onMouseDown={close}>
      <div className="ord-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ord-modal-head">
          <div className="ord-modal-title">Create New Order</div>
          <button
            className="ord-x"
            onClick={close}
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {alert.message && (
          <div className={`ord-alert is-${alert.type}`}>{alert.message}</div>
        )}

        <form onSubmit={handleSubmit} className="ord-form">
          <div className="ord-row">
            <div className="ord-field">
              <label className="ord-label">Customer Name</label>
              <input
                className="ord-input"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Name"
              />
            </div>
            <div className="ord-field">
              <label className="ord-label">Customer Phone</label>
              <input
                className="ord-input"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder="Phone"
                inputMode="numeric"
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
              onChange={(e) => handlePickProduct(e.target.value)}
              disabled={loadingItems}
            >
              <option value="">
                {loadingItems
                  ? "Loading items..."
                  : "-- Add an item from list --"}
              </option>

              {groupedItems.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.items.map((it) => (
                    <option key={it._id} value={it._id}>
                      {it.name}{" "}
                      {it?.variants?.length
                        ? "(Variants)"
                        : it.price != null
                          ? `(₹${it.price})`
                          : ""}
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
                    <th className="ord-right">Price</th>
                    <th>Qty</th>
                    <th className="ord-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orderProducts.map((p, idx) => (
                    <tr key={p.key}>
                      <td>
                        <span className="ord-item-name">{p.name}</span>
                      </td>

                      <td>
                        {p.selectedVariantId ? (
                          <span className="ord-variant-pill">
                            {p.selectedVariantName}
                          </span>
                        ) : (
                          <span className="muted">Regular</span>
                        )}
                      </td>

                      <td className="ord-right">{INR(p.unitPrice)}</td>

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

                      <td className="ord-right">
                        {INR(
                          Number(p.unitPrice || 0) * Number(p.quantity || 0),
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="ord-del"
                          onClick={() => removeLine(idx)}
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ord-tip">
                Tip: selecting the same variant again increases quantity.
              </div>
            </div>
          )}

          <div className="ord-summary">
            <div className="ord-sum-row">
              <span>Subtotal</span>
              <span>{INR(subtotal)}</span>
            </div>

            <div className="ord-sum-row">
              <label className="ord-label">Discount</label>
              <input
                className="ord-input ord-input-sm"
                name="discount"
                type="number"
                value={form.discount}
                onChange={handleChange}
                min={0}
              />
            </div>

            <div className="ord-sum-row">
              <label className="ord-label">Tax (%)</label>
              <input
                className="ord-input ord-input-sm"
                name="taxPercent"
                type="number"
                value={form.taxPercent}
                onChange={handleChange}
                min={0}
              />
            </div>

            <div className="ord-sum-row ord-sum-total">
              <span>Total</span>
              <span>{INR(totalAmount)}</span>
            </div>

            <div className="muted" style={{ marginTop: 8 }}>
              Server will calculate final total. Subtotal must match.
            </div>
          </div>

          <div className="ord-modal-foot">
            <button
              type="button"
              className="ord-btn"
              onClick={close}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="ord-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Create Order"}
            </button>
          </div>
        </form>

        {/* ✅ Variant popup (effortless UX) */}
        {variantPopupOpen && pending && (
          <div className="ord-mini-backdrop" onMouseDown={closeVariantPopup}>
            <div
              className="ord-mini-modal"
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={onVariantPopupKeyDown}
              tabIndex={0}
              role="dialog"
              aria-modal="true"
            >
              <div className="ord-mini-head">
                <div>
                  <div className="ord-mini-title">Choose Variant</div>
                  <div className="ord-mini-sub">
                    {pending.name} • same variant adds quantity
                  </div>
                </div>

                <button
                  className="ord-x"
                  type="button"
                  onClick={closeVariantPopup}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="ord-mini-body">
                <select
                  className="ord-variant-select"
                  value={pending.selectedVariantId}
                  onChange={(e) =>
                    setPending((p) => ({
                      ...p,
                      selectedVariantId: e.target.value,
                    }))
                  }
                >
                  {pending.variants.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} (₹{v.price})
                    </option>
                  ))}
                </select>

                <div className="ord-mini-actions">
                  <button
                    type="button"
                    className="ord-btn"
                    onClick={closeVariantPopup}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="ord-btn-primary"
                    onClick={confirmAddPendingVariant}
                  >
                    Add
                  </button>
                </div>

                <div className="muted ord-mini-hint">
                  Press <b>Enter</b> to add • <b>Esc</b> to close
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
