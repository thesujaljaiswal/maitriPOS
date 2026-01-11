import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./style.css";
import icon from "../../assets/maitriPOS FAVICON.png";

export default function Navbar({
  isAuthenticated,
  onLogout,
  hasStore,
  storeSlug,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  // Helper to handle subdomain redirection
  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!storeSlug) return;

    const { protocol, host } = window.location;
    // host includes the port (e.g., localhost:5173)
    // This creates slug.localhost:5173
    const newUrl = `${protocol}//${storeSlug}.${host}`;

    window.open(newUrl, "_blank");
    closeMenu();
  };

  return (
    <nav className="mp-navbar-root">
      <div className="mp-navbar-container">
        <Link to="/" className="mp-navbar-brand" onClick={closeMenu}>
          <img src={icon} alt="Logo" />
          <span>maitriPOS™</span>
        </Link>

        {/* Desktop Menu */}
        <div className="mp-navbar-menu-desktop">
          <NavLink to="/" className="mp-navbar-link">
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              {hasStore && storeSlug ? (
                <a
                  href=""
                  onClick={handleVisitStore}
                  className="mp-navbar-link mp-visit-link"
                >
                  Visit Store ↗
                </a>
              ) : (
                <NavLink to="/create/store" className="mp-navbar-link">
                  Setup Store
                </NavLink>
              )}

              <NavLink to="/manage/categories" className="mp-navbar-link">
                Categories
              </NavLink>
              <NavLink to="/manage/items" className="mp-navbar-link">
                Items
              </NavLink>
              <button onClick={onLogout} className="mp-navbar-btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="mp-navbar-link">
                Login
              </NavLink>
              <NavLink to="/register" className="mp-navbar-btn-primary">
                Join Free
              </NavLink>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`mp-navbar-hamburger ${
            isMobileMenuOpen ? "is-active" : ""
          }`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Drawer */}
        <div
          className={`mp-navbar-drawer ${isMobileMenuOpen ? "is-open" : ""}`}
        >
          <div className="mp-navbar-drawer-links">
            <NavLink to="/" onClick={closeMenu}>
              Home
            </NavLink>
            {isAuthenticated ? (
              <>
                {hasStore && storeSlug ? (
                  <a href="#" onClick={handleVisitStore}>
                    Visit Store ↗
                  </a>
                ) : (
                  <NavLink to="/create/store" onClick={closeMenu}>
                    Setup Store
                  </NavLink>
                )}
                <NavLink to="/manage/categories" onClick={closeMenu}>
                  Categories
                </NavLink>
                <NavLink to="/manage/items" onClick={closeMenu}>
                  Items
                </NavLink>
                <button
                  className="mp-navbar-drawer-logout"
                  onClick={() => {
                    onLogout();
                    closeMenu();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu}>
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="mp-navbar-drawer-cta"
                  onClick={closeMenu}
                >
                  Join Free
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
