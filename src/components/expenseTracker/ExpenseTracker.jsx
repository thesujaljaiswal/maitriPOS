import React, { useEffect, useMemo, useState, useCallback } from "react";
import NavbarLayout from "../navbar/Navbar";
import "./style.css";

const INR = (n = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const Card = ({ title, value, sub }) => (
  <div className="ex-card">
    <div className="ex-card__title">{title}</div>
    <div className="ex-card__value">{value}</div>
    {sub ? <div className="ex-card__sub">{sub}</div> : null}
  </div>
);

export default function ExpenseTracker() {
  const API = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [store, setStore] = useState(null);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [paid, setPaid] = useState(0);
  const [pending, setPending] = useState(0);

  const [expenses, setExpenses] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const net = Number(todayRevenue || 0) - Number(totalExpense || 0);

  const fetchStore = useCallback(async () => {
    const storeRes = await fetch(`${API}/store/me`, { credentials: "include" });
    const storeJson = await storeRes.json();
    const firstStore = Array.isArray(storeJson?.data)
      ? storeJson.data[0]
      : storeJson?.data;

    const storeId = firstStore?._id;
    if (!storeId) throw new Error("No store found");
    setStore(firstStore);
    return storeId;
  }, [API]);

  const fetchTodayRevenue = useCallback(
    async (storeId) => {
      const res = await fetch(`${API}/analytics/deep?storeId=${storeId}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to fetch analytics");

      const rev = json?.data?.revenue || {};
      setTodayRevenue(Number(rev.today || 0));
      setPaid(Number(rev.paid || 0));
      setPending(Number(rev.pending || 0));
    },
    [API],
  );

  const fetchTodayExpenses = useCallback(
    async (storeId) => {
      const res = await fetch(`${API}/expenses/store/${storeId}/today`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch expenses");

      const list = json?.data?.expenses || [];
      const total = Number(json?.data?.total ?? 0);

      setExpenses(list);
      setTotalExpense(total);
    },
    [API],
  );

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const storeId = store?._id || (await fetchStore());
      await Promise.all([
        fetchTodayRevenue(storeId),
        fetchTodayExpenses(storeId),
      ]);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [store?._id, fetchStore, fetchTodayRevenue, fetchTodayExpenses]);

  useEffect(() => {
    load();
  }, [load]);

  const addExpense = async (e) => {
    e.preventDefault();
    setErr("");
    const amt = Number(amount);

    if (!amt || amt <= 0) return setErr("Enter valid amount");
    if (!reason.trim()) return setErr("Enter reason");
    if (!store?._id) return setErr("Store not loaded");

    try {
      setBusy(true);
      const res = await fetch(`${API}/expenses`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store._id,
          amount: amt,
          reason: reason.trim(),
          date: new Date(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to add expense");

      setAmount("");
      setReason("");
      await fetchTodayExpenses(store._id);
    } catch (e2) {
      setErr(e2?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    setErr("");
    if (!store?._id) return setErr("Store not loaded");
    try {
      setBusy(true);
      const res = await fetch(
        `${API}/expenses/store/${store._id}/${expenseId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Failed to delete");
      const next = expenses.filter((x) => x._id !== expenseId);
      setExpenses(next);
      setTotalExpense(next.reduce((s, x) => s + Number(x.amount || 0), 0));
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ex-page">
      <NavbarLayout />
      <div className="ex-wrap">
        <div className="ex-header">
          <div>
            <h1 className="ex-h1">Expense Tracker</h1>
            <p className="ex-sub">
              {store?.name ? `${store.name} • ` : ""}Today
            </p>
          </div>
          <button className="ex-btn" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="ex-muted">Loading...</div>
        ) : (
          <>
            <div className="ex-grid-main">
              <div className="ex-section">
                <h3 className="ex-section__title">Add Expense</h3>
                <form className="ex-form" onSubmit={addExpense}>
                  <div className="ex-field">
                    <label className="ex-label">Amount</label>
                    <input
                      className="ex-input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="ex-field">
                    <label className="ex-label">Reason</label>
                    <input
                      className="ex-input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Milk purchase"
                    />
                  </div>
                  <button
                    className="ex-btn ex-btn--full"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? "Saving..." : "Add"}
                  </button>
                </form>
              </div>

              <div className="ex-section">
                <div className="ex-section__head">
                  <h3 className="ex-section__title">Today’s List</h3>
                  <span className="ex-total">{INR(totalExpense)}</span>
                </div>
                {expenses.length ? (
                  <div className="ex-list">
                    {expenses.map((e) => (
                      <div className="ex-row" key={e._id}>
                        <div className="ex-row__left">
                          <div className="ex-row__amt">{INR(e.amount)}</div>
                          <div className="ex-row__reason">{e.reason}</div>
                          <div className="ex-row__meta">
                            {e.createdAt
                              ? new Date(e.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </div>
                        </div>
                        <button
                          className="ex-del"
                          onClick={() => deleteExpense(e._id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ex-muted">No expenses today.</div>
                )}
              </div>
            </div>

            {err && <div className="ex-error">{err}</div>}
            <div className="ex-grid-cards">
              <Card
                title="Today Revenue"
                value={INR(todayRevenue)}
                sub={`Paid ${INR(paid)} • Pending ${INR(pending)}`}
              />
              <Card
                title="Today Expenses"
                value={INR(totalExpense)}
                sub="Manual entries"
              />
              <Card
                title="Net (Today)"
                value={INR(net)}
                sub={net >= 0 ? "Profit" : "Loss"}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
