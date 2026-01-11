import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import "./style.css";
import Layout from "../Layout";

export default function Landing() {
  const { isAuthenticated, hasStore, storeSlug } = useOutletContext() || {
    isAuthenticated: false,
    hasStore: false,
    storeSlug: null,
  };

  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    document.title = "maitriPOS™ | Digital Menu & Catalog Creator";
  }, []);

  const closeModal = () => setActiveModal(null);

  return (
    <div className="lp-container">
      <Layout />
      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-content">
          <div className="lp-badge">
            <span className="lp-dot"></span>
            Version 1.0: Catalog Revolution
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
                <Link
                  to={hasStore ? "/manage/items" : "/create/store"}
                  className="lp-btn-black"
                >
                  {hasStore ? "Go to Dashboard" : "Setup Your Store"}
                </Link>
                {hasStore && storeSlug && (
                  <Link
                    to={`/s/${storeSlug}`}
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
                Add multiple sizes and prices for every single product.
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
                  <p className="lp-modal-p">Email: sujaljaiswal548@gmail.com</p>
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
  );
}
