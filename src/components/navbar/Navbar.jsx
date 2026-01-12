import React, { useEffect, useState, useCallback } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import "./style.css";
import icon from "../../assets/maitriPOS FAVICON.png";

export default function NavbarLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
  }, [isMobileMenuOpen]);

  const checkStatus = useCallback(async () => {
    try {
      const authRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        {
          credentials: "include",
        }
      );
      const authOk = authRes.ok;
      setIsAuthenticated(authOk);

      if (authOk) {
        const storeRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/store/me`,
          {
            credentials: "include",
          }
        );
        const result = await storeRes.json();

        if (result.success && result.data?.length > 0) {
          setHasStore(true);
          setStoreSlug(result.data[0].slug);
        } else {
          setHasStore(false);
        }
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
      setHasStore(false);
      setIsMobileMenuOpen(false);
      navigate("/");
      window.location.reload();
    }
  };

  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!storeSlug) return;
    const { protocol, host } = window.location;
    window.open(`${protocol}//${storeSlug}.${host}`, "_blank");
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="mp-app-wrapper">
      <nav className="mp-navbar-root">
        <div className="mp-navbar-container">
          <Link to="/" className="mp-navbar-brand" onClick={closeMenu}>
            <img src={icon} alt="Logo" />
            <span>maitriPOS™</span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="mp-navbar-menu-desktop">
            <NavLink to="/" className="mp-navbar-link">
              Home
            </NavLink>
            {isAuthenticated ? (
              <>
                {hasStore ? (
                  <a
                    href="#"
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
                <button onClick={handleLogout} className="mp-navbar-btn-logout">
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

          {/* HAMBURGER BUTTON */}
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
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <div className={`mp-navbar-drawer ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div className="mp-navbar-drawer-links">
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>
          {isAuthenticated ? (
            <>
              {hasStore ? (
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
                onClick={handleLogout}
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

      <main style={{ marginTop: "70px" }}>
        <Outlet
          context={{ hasStore, isAuthenticated, storeSlug, checkStatus }}
        />
      </main>
    </div>
  );
}
