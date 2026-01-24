import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import "./style.css";
import NavbarLayout from "../navbar/Navbar";

export default function Landing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  // 1. BACKEND CHECK LOGIC
  const checkAuthAndStore = useCallback(async () => {
    try {
      const authRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        {
          credentials: "include",
        },
      );

      if (authRes.ok) {
        setIsAuthenticated(true);
        const storeRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/store/me`,
          {
            credentials: "include",
          },
        );
        const result = await storeRes.json();

        if (result.success && result.data?.length > 0) {
          setHasStore(true);
          setStoreSlug(result.data[0].slug);
        }
      }
    } catch (err) {
      console.error("Landing Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "maitriPOS™ | Digital Menu & Catalog Creator";
    checkAuthAndStore();
  }, [checkAuthAndStore]);

  const closeModal = () => setActiveModal(null);

  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!storeSlug) return;
    const { protocol, host } = window.location;
    window.open(`${protocol}//${storeSlug}.${host}`, "_blank");
    setIsMobileMenuOpen(false);
  };

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
      <div className="lp-container">
        {/* HERO SECTION */}
        <section className="lp-hero">
          <div className="lp-content">
            <div className="lp-badge">
              <span className="lp-dot"></span>
              Version 2.0: Ordering Revolution Live now
            </div>
            <h1 className="lp-title">
              Your Digital Catalog <br />
              <span className="lp-gradient">Ready In Minutes.</span>
            </h1>
            <p className="lp-subtitle">
              Create professional digital menus. Organize by categories, add
              variants, and share your store link globally.
            </p>

            <div className="lp-actions">
              {isAuthenticated ? (
                <div className="lp-btn-group">
                  <Link to="/create/store" className="lp-btn-black">
                    {hasStore ? "Manage Store" : "Setup Your Store"}
                  </Link>

                  {hasStore && storeSlug && (
                    <Link
                      onClick={handleVisitStore}
                      target="_blank"
                      className="lp-btn-outline"
                    >
                      Visit Public Store ↗
                    </Link>
                  )}
                </div>
              ) : (
                <div className="lp-btn-group">
                  <Link to="/register" className="lp-btn-black">
                    Start For Free
                  </Link>
                  <Link to="/login" className="lp-btn-outline">
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* STRIP */}
        <div className="lp-strip">
          <div className="lp-strip-inner">
            <span>NESTED CATEGORIES</span>
            <span className="lp-strip-dot"></span>
            <span>PRODUCT VARIANTS</span>
            <span className="lp-strip-dot"></span>
            <span>QR READY</span>
          </div>
        </div>

        {/* FEATURES */}
        <section className="lp-features">
          <div className="lp-content">
            <div className="lp-section-head">
              <h2 className="lp-section-title">
                Cataloging Made <span className="lp-text-muted">Simple.</span>
              </h2>
            </div>
            <div className="lp-grid">
              <div className="lp-card">
                <div className="lp-icon">📁</div>
                <h3 className="lp-card-h">Hierarchy</h3>
                <p className="lp-card-p">
                  Categories and Sub-Categories for deep organization.
                </p>
              </div>
              <div className="lp-card">
                <div className="lp-icon">💎</div>
                <h3 className="lp-card-h">Variants</h3>
                <p className="lp-card-p">
                  Add multiple sizes and prices for every product.
                </p>
              </div>
              <div className="lp-card">
                <div className="lp-icon">🌐</div>
                <h3 className="lp-card-h">Public Link</h3>
                <p className="lp-card-p">
                  A dedicated URL to showcase your menu to customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-how-it-works">
          <div className="lp-content">
            <div className="lp-section-head-center">
              <h2 className="lp-section-title">
                Go Live In <span className="lp-text-muted">3 Steps.</span>
              </h2>
            </div>
            <div className="lp-steps-grid">
              <div className="lp-step">
                <div className="lp-step-number">01</div>
                <h4>Create Account</h4>
                <p>
                  Sign up in seconds and define your store's unique web slug.
                </p>
              </div>
              <div className="lp-step">
                <div className="lp-step-number">02</div>
                <h4>Build Catalog</h4>
                <p>
                  Add categories and products with high-quality images and
                  pricing.
                </p>
              </div>
              <div className="lp-step">
                <div className="lp-step-number">03</div>
                <h4>Share & Sell</h4>
                <p>
                  Share your link on WhatsApp or Instagram and start taking
                  orders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS / TRUST SECTION */}
        <section className="lp-stats">
          <div className="lp-content">
            <div className="lp-stats-card">
              <div className="lp-stat-item">
                <span className="lp-stat-value">99.9%</span>
                <span className="lp-stat-label">Uptime</span>
              </div>
              <div className="lp-stat-divider"></div>
              <div className="lp-stat-item">
                <span className="lp-stat-value">Instant</span>
                <span className="lp-stat-label">Updates</span>
              </div>
              <div className="lp-stat-divider"></div>
              <div className="lp-stat-item">
                <span className="lp-stat-value">Free</span>
                <span className="lp-stat-label">Forever Tier</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BOTTOM */}
        <section className="lp-cta-bottom">
          <div className="lp-content">
            <div className="lp-cta-box">
              <h2>Ready to transform your business?</h2>
              <p>Join the digital revolution today with maitriPOS™.</p>
              <Link
                to={isAuthenticated ? "/create/store" : "/register"}
                className="lp-btn-white"
              >
                {isAuthenticated ? "Manage Store" : "Get Started Now"}
              </Link>
            </div>
          </div>
        </section>

        {/* MODALS */}
        {activeModal && (
          <div className="lp-modal-overlay" onClick={closeModal}>
            <div className="lp-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="lp-modal-close" onClick={closeModal}>
                &times;
              </button>
              <div className="lp-modal-body">
                {activeModal === "about" && (
                  <>
                    <h2 className="lp-modal-h">About</h2>
                    <p className="lp-modal-p">
                      We digitize retailers with ultra-fast catalog tools.
                    </p>
                  </>
                )}
                {activeModal === "features" && (
                  <>
                    <h2 className="lp-modal-h">Features</h2>
                    <ul className="lp-modal-list">
                      <li>Branded Storefront</li>
                      <li>Unlimited Variants</li>
                      <li>Stock Toggles</li>
                    </ul>
                  </>
                )}
                {activeModal === "support" && (
                  <>
                    <h2 className="lp-modal-h">Support</h2>
                    <p className="lp-modal-p">
                      Email: sujaljaiswal548@gmail.com
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-content">
            <div className="lp-footer-top">
              <div className="lp-brand">maitriPOS™</div>
              <div className="lp-f-links">
                <button
                  onClick={() => setActiveModal("about")}
                  className="lp-f-btn"
                >
                  About
                </button>
                <button
                  onClick={() => setActiveModal("features")}
                  className="lp-f-btn"
                >
                  Features
                </button>
                <button
                  onClick={() => setActiveModal("support")}
                  className="lp-f-btn"
                >
                  Support
                </button>
              </div>
            </div>
            <p className="lp-copy">
              © {new Date().getFullYear()} maitriPOS — Version 1.0
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
