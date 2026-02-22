// Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";
import Footer from "../footer/Footer";

const INR = (n = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const GrowthPill = ({ value }) => {
  const v = Number(value || 0);
  const up = v >= 0;
  return (
    <span className={`an-pill ${up ? "an-pill--up" : "an-pill--down"}`}>
      {up ? "▲ " : "▼ "}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
};

const Card = ({ title, value, sub, right }) => (
  <div className="an-card">
    <div className="an-card__left">
      <div className="an-card__title">{title}</div>
      <div className="an-card__value">{value}</div>
      {sub ? <div className="an-card__sub">{sub}</div> : null}
    </div>
    <div className="an-card__right">{right}</div>
  </div>
);

const Section = ({ title, right, children }) => (
  <div className="an-section">
    <div className="an-section__head">
      <div className="an-section__title">{title}</div>
      <div className="an-section__right">{right}</div>
    </div>
    {children}
  </div>
);

export default function Analytics() {
  const API = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [store, setStore] = useState(null);

  const fetchAnalytics = async () => {
    setErr("");
    setLoading(true);
    try {
      const storeRes = await fetch(`${API}/store/me`, {
        credentials: "include",
      });
      const storeJson = await storeRes.json();
      const firstStore = Array.isArray(storeJson?.data)
        ? storeJson.data[0]
        : storeJson?.data;

      const storeId = firstStore?._id;
      if (!storeId) throw new Error("No store found");
      setStore(firstStore);

      const res = await fetch(`${API}/analytics/deep?storeId=${storeId}`, {
        credentials: "include",
      });
      const json = await res.json();
      setData(json?.data);
    } catch (e) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenue = data?.revenue || {};
  const orders = data?.orders || {};
  const trend = data?.trend || [];
  const todayOrders = data?.todayOrders || [];
  const topProducts = data?.topProducts || [];

  return (
    <>
      <div className="an-page">
        <NavbarLayout />
        <div className="an-wrap">
          <div className="an-header">
            <div className="an-header__left">
              <div className="an-h1">Analytics</div>
              <div className="an-sub">
                {store?.name ? `${store.name} • ` : ""}
                Revenue • Orders • Trend
              </div>
            </div>
            <button className="an-btn" onClick={fetchAnalytics}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="an-muted">Loading analytics…</div>
          ) : err ? (
            <div className="an-error">{err}</div>
          ) : (
            <>
              <div className="an-grid-cards">
                <Card
                  title="Today Revenue"
                  value={INR(revenue.today)}
                  sub={`Paid ${INR(revenue.paid)} • Pending ${INR(revenue.pending)}`}
                  right={<GrowthPill value={revenue.todayGrowth} />}
                />
                <Card
                  title="Month Revenue"
                  value={INR(revenue.month)}
                  sub="vs last month"
                  right={<GrowthPill value={revenue.monthGrowth} />}
                />
                <Card
                  title="Orders (Month)"
                  value={orders.thisMonthCount ?? 0}
                  sub={`Last: ${orders.lastMonthCount ?? 0}`}
                  right={<GrowthPill value={orders.countGrowth} />}
                />
                <Card
                  title="Today Orders"
                  value={todayOrders.length}
                  sub="Latest entries"
                />
              </div>

              <div className="an-grid-main">
                <Section title="Revenue Trend">
                  <div className="an-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trend}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(v) => [INR(v), "Revenue"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="rev"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#4f46e5" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Section>

                <Section title="Top Products (This Month)">
                  <div className="an-life">
                    {topProducts.length ? (
                      topProducts.map((p) => (
                        <div className="an-life__row" key={p.name}>
                          <span className="an-life__label">{p.name}</span>
                          <b className="an-life__val">
                            {p.qty} • {INR(p.revenue)}
                          </b>
                        </div>
                      ))
                    ) : (
                      <div className="an-muted" style={{ padding: 0 }}>
                        No product data yet
                      </div>
                    )}
                  </div>
                </Section>
              </div>

              <Section title="Recent Orders">
                <div className="an-table-wrap">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th className="an-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayOrders.length ? (
                        todayOrders.map((o) => (
                          <tr key={o._id}>
                            <td className="an-td-muted">
                              {o.createdAt
                                ? new Date(o.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </td>
                            <td>
                              <div className="an-orderid">
                                #{String(o._id).slice(-6)}
                              </div>
                              <div className="an-small">
                                {o.customerName || "Walk-in"}
                              </div>
                            </td>
                            <td className="an-cap">{o.status}</td>
                            <td className="an-right an-strong">
                              {INR(o.totalAmount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="an-muted">
                            No orders today
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
