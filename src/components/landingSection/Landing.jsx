import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import NavbarLayout from "../navbar/Navbar.jsx";
import "./style.css";
import Footer from "../footer/Footer.jsx";

const PLANS = [
  {
    key: "ARAMBH",
    title: "ARAMBH",
    price: "₹0",
    badge: "Free • 1 Store",
    highlight: "Perfect to get started with a digital catalog.",
    features: [
      "Public store link",
      "Categories + sub-categories",
      "Products + images",
      "Variants (sizes / prices)",
      "QR-ready browsing",
      "Subtle maitriPOS branding",
    ],
    demo: {
      header: "Catalog Demo",
      steps: ["Create categories", "Add products", "Share your link"],
      chips: ["Public Link", "Variants", "QR Ready"],
    },
  },
  {
    key: "PRAVAH",
    title: "PRAVAH",
    price: "₹299",
    badge: "Ordering + Business",
    highlight: "Best for stores that want to accept orders.",
    features: [
      "Everything in ARAMBH",
      "Place Order By Yourself",
      "Manage Orders (Accepted → Packed → Shipped → Delivered)",
      "Payments tracking (Paid / Pending)",
      "Analytics dashboard (Revenue + Trend)",
      "Expense tracker",
    ],
    demo: {
      header: "Ordering Demo",
      steps: ["Customer scans QR", "You Place orders", "manage order status"],
      chips: ["Order Management", "Expense Tracker", "Analytics"],
    },
  },
];

export default function Landing() {
  const API = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("ARAMBH");

  const [hasStore, setHasStore] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");

  // ✅ interactive plan preview
  const [activePlan, setActivePlan] = useState("ARAMBH");
  const activePlanObj = PLANS.find((p) => p.key === activePlan) || PLANS[0];

  useEffect(() => {
    document.title = "maitriPOS™ | Digital Catalog + Ordering";
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setErr("");
      setLoading(true);

      try {
        const authRes = await fetch(`${API}/auth/status`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!authRes.ok) {
          setIsAuthenticated(false);
          setUser(null);
          setPlan("ARAMBH");
          setHasStore(false);
          setStoreSlug("");
          return;
        }

        const authJson = await authRes.json();
        const u = authJson?.data || null;

        setIsAuthenticated(true);
        setUser(u);
        setPlan(u?.plan || "ARAMBH");

        const storeRes = await fetch(`${API}/store/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        const storeJson = await storeRes.json();

        if (
          storeJson?.success &&
          Array.isArray(storeJson?.data) &&
          storeJson.data.length > 0
        ) {
          setHasStore(true);
          setStoreSlug(storeJson.data[0]?.slug || "");
        } else {
          setHasStore(false);
          setStoreSlug("");
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
        console.error(e);
        setErr("Could not load. Please refresh.");
        setIsAuthenticated(false);
        setUser(null);
        setPlan("ARAMBH");
        setHasStore(false);
        setStoreSlug("");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [API]);

  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!storeSlug) return;

    const host = window.location.hostname;
    if (host.includes("maitripos.com")) {
      window.open(
        `https://${storeSlug}.maitripos.com`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      window.open(
        `${window.location.protocol}//${storeSlug}.${host}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const currentPlan = plan || "ARAMBH";

  const primaryCta = !isAuthenticated
    ? { to: "/register", label: "Start Free (ARAMBH)" }
    : {
        to: "/create/store",
        label: hasStore ? "Manage Store" : "Setup Your Store",
      };

  const secondaryCta = !isAuthenticated
    ? { to: "/login", label: "Login" }
    : hasStore && storeSlug
      ? { to: "#", label: "Visit Public Store ↗", onClick: handleVisitStore }
      : null;

  if (loading) {
    return (
      <div className="lp-loading-full">
        <Oval color="#000" height={40} width={40} />
      </div>
    );
  }

  return (
    <>
      <NavbarLayout />
      <div className="lp-page">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-left">
              <h1 className="lp-title">
                Your store online
                <br />
                <span className="lp-gradient">catalog + orders.</span>
              </h1>

              <p className="lp-subtitle">
                Start with ARAMBH: make a clean digital catalog for free (single
                store). Upgrade to PRAVAH to accept customer orders, manage
                workflow, and track analytics.
              </p>

              <div className="lp-ctas">
                <div className="lp-btn-row">
                  <Link className="lp-btn lp-btn--black" to={primaryCta.to}>
                    {primaryCta.label}
                  </Link>

                  {secondaryCta ? (
                    secondaryCta.onClick ? (
                      <Link
                        className="lp-btn lp-btn--outline"
                        to={secondaryCta.to}
                        onClick={secondaryCta.onClick}
                      >
                        {secondaryCta.label}
                      </Link>
                    ) : (
                      <Link
                        className="lp-btn lp-btn--outline"
                        to={secondaryCta.to}
                      >
                        {secondaryCta.label}
                      </Link>
                    )
                  ) : null}
                </div>

                <div className="lp-note">
                  <span className="lp-pill">Current Plan:</span>
                  <b className="lp-planname">
                    {isAuthenticated ? currentPlan : "Guest"}
                  </b>
                  {isAuthenticated && user?.fullName ? (
                    <span className="lp-note-muted">({user.fullName})</span>
                  ) : null}
                </div>

                {err ? <div className="lp-error">{err}</div> : null}
              </div>

              {/* ✅ Plan tabs (no buttons) */}
              <div className="lp-plan-tabs">
                <button
                  type="button"
                  className={`lp-tab ${activePlan === "ARAMBH" ? "active" : ""}`}
                  onClick={() => setActivePlan("ARAMBH")}
                >
                  ARAMBH
                  {currentPlan === "ARAMBH" && isAuthenticated ? (
                    <span className="lp-tab-pill">Current</span>
                  ) : null}
                </button>

                <button
                  type="button"
                  className={`lp-tab ${activePlan === "PRAVAH" ? "active" : ""}`}
                  onClick={() => setActivePlan("PRAVAH")}
                >
                  PRAVAH
                  {currentPlan === "PRAVAH" && isAuthenticated ? (
                    <span className="lp-tab-pill">Current</span>
                  ) : null}
                </button>
              </div>
            </div>

            {/* ✅ Interactive preview */}
            <div className="lp-hero-right">
              <div
                className={`lp-preview ${activePlan === "PRAVAH" ? "lp-preview--dark" : ""}`}
              >
                <div className="lp-preview-top">
                  <div className="lp-preview-brand">maitriPOS™</div>
                  <div className="lp-preview-chip">
                    {activePlan === "ARAMBH" ? "Catalog Ready" : "Order Ready"}
                  </div>
                </div>

                <div className="lp-preview-header">
                  <div className="lp-preview-title">
                    {activePlanObj.demo.header}
                  </div>
                  <div className="lp-preview-sub">
                    {activePlan === "ARAMBH"
                      ? "See how your catalog looks to customers."
                      : "See the full flow from QR to order status."}
                  </div>
                </div>

                <div className="lp-preview-chips">
                  <span className="lp-preview-chips-label">FEATURES:</span>
                  {activePlanObj.demo.chips.map((c) => (
                    <span className="lp-mini-chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>

                <div className="lp-preview-steps">
                  {activePlanObj.demo.steps.map((s, idx) => (
                    <div className="lp-step-card" key={s}>
                      <div className="lp-step-num">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="lp-step-text">{s}</div>
                    </div>
                  ))}
                </div>

                <div className="lp-preview-grid">
                  <div className="lp-preview-item lp-preview-item--img" />
                  <div className="lp-preview-item lp-preview-item--img" />
                </div>

                <div className="lp-preview-bottom">
                  <div className="lp-preview-cta">
                    {activePlan === "ARAMBH"
                      ? "Share → Customers Browse → Done"
                      : "Scan → Browse → Order → Track"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLANS (no CTA buttons) */}
        <section className="lp-plans">
          <div className="lp-wrap">
            <div className="lp-head">
              <h2 className="lp-h2">Plans</h2>
              <p className="lp-p">
                Click a plan to preview it. (No buttons shown here.)
              </p>
            </div>

            <div className="lp-plan-grid lp-plan-grid--two">
              {PLANS.map((p) => {
                const isCurrent = isAuthenticated && currentPlan === p.key;
                const isPro = p.key === "PRAVAH";
                const isActive = activePlan === p.key;

                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActivePlan(p.key)}
                    className={`lp-card lp-card--clickable ${
                      isPro ? "lp-card--dark" : ""
                    } ${isCurrent ? "lp-card--active" : ""} ${
                      isActive ? "lp-card--selected" : ""
                    }`}
                  >
                    <div className="lp-card-top">
                      <div>
                        <div className="lp-card-title">
                          {p.title}{" "}
                          {isCurrent ? (
                            <span className="lp-current-pill">Current</span>
                          ) : null}
                        </div>
                        <div
                          className={`lp-chip ${isPro ? "lp-chip--dark" : ""}`}
                        >
                          {p.badge}
                        </div>
                      </div>

                      <div className="lp-price">
                        <div className="lp-price-main">{p.price}</div>
                        <div
                          className={`lp-price-sub ${isPro ? "lp-muted-dark" : "lp-muted"}`}
                        >
                          / month
                        </div>
                      </div>
                    </div>

                    <div
                      className={`lp-highlight ${isPro ? "lp-highlight--dark" : ""}`}
                    >
                      {p.highlight}
                    </div>

                    <ul className={`lp-list ${isPro ? "lp-list--dark" : ""}`}>
                      {p.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>

                    <div
                      className={`lp-select-hint ${isPro ? "lp-select-hint--dark" : ""}`}
                    >
                      {isActive
                        ? "Previewing this plan ↑"
                        : "Click to preview ↑"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lp-compare">
              <div className="lp-compare-head">Quick comparison</div>

              <div className="lp-compare-table">
                <div className="lp-row lp-row--head">
                  <div>Feature</div>
                  <div>ARAMBH</div>
                  <div>PRAVAH</div>
                </div>

                {[
                  ["Catalog + public link", "✅", "✅"],
                  ["Categories + Sub-Categories", "✅", "✅"],
                  ["Products + Variants", "✅", "✅"],
                  ["Order Management Dashboard", "❌", "✅"],
                  ["Order Tracking Feature", "❌", "✅"],
                  ["Basic Analytics", "❌", "✅"],
                  ["Expense Tracker", "❌", "✅"],
                ].map((r) => (
                  <div className="lp-row lp-row--two" key={r[0]}>
                    <div className="lp-feature">{r[0]}</div>
                    <div className="lp-cell">{r[1]}</div>
                    <div className="lp-cell">{r[2]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <Footer />
      </div>
    </>
  );
}
