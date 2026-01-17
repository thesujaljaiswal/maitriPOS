import React, { useEffect, useState, useCallback, useRef } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import "./style.css";
import icon from "../../assets/maitriPOS FAVICON.png";
import { Oval } from "react-loader-spinner";

export default function NavbarLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isMounted.current = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      if (!isMounted.current) return;

      if (authRes.ok) {
        setIsAuthenticated(true);
        const storeRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/store/me`,
          {
            credentials: "include",
          }
        );
        const result = await storeRes.json();
        if (isMounted.current && result.success && result.data?.length > 0) {
          setHasStore(true);
          setStoreSlug(result.data[0].slug);
        } else if (isMounted.current) {
          setHasStore(false);
        }
      } else {
        if (isMounted.current) setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      if (isMounted.current) setIsAuthenticated(false);
    } finally {
      if (isMounted.current) setIsLoading(false);
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
      setIsDropdownOpen(false);
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

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Oval color="#000" height={40} width={40} />
      </div>
    );
  }

  return (
    <div className="mp-app-wrapper">
      <nav className="mp-navbar-root">
        <div className="mp-navbar-container">
          <Link to="/" className="mp-navbar-brand" onClick={closeMenu}>
            <img src={icon} alt="Logo" />
            <span>maitriPOS™</span>
          </Link>

          {/* Desktop & Mobile Shared Dropdown Context */}
          <div className="mp-navbar-actions-wrapper" ref={dropdownRef}>
            <div className="mp-navbar-menu-desktop">
              <NavLink to="/" className="mp-navbar-link">
                Home
              </NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink to="/create/store" className="mp-navbar-link">
                    {hasStore ? "Manage Store" : "Setup Store"}
                  </NavLink>
                  {hasStore && (
                    <a
                      href="#"
                      onClick={handleVisitStore}
                      className="mp-navbar-link mp-visit-link"
                    >
                      Visit Store ↗
                    </a>
                  )}
                  <NavLink to="/manage/categories" className="mp-navbar-link">
                    Categories
                  </NavLink>
                  <NavLink to="/manage/items" className="mp-navbar-link">
                    Items
                  </NavLink>

                  <button
                    className="mp-user-avatar-btn"
                    onClick={toggleDropdown}
                  >
                    <div className="mp-user-icon-circle">👤</div>
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

            {/* Mobile Actions (Visible under 850px) */}
            <div className="mp-mobile-actions">
              {isAuthenticated && (
                <button className="mp-user-avatar-btn" onClick={toggleDropdown}>
                  <div className="mp-user-icon-circle">👤</div>
                </button>
              )}
              <button
                className={`mp-navbar-hamburger ${
                  isMobileMenuOpen ? "is-active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>

            {/* Shared Dropdown Menu */}
            {isAuthenticated && isDropdownOpen && (
              <div className="mp-dropdown-menu">
                <div className="mp-dropdown-header">Account</div>
                <Link to="/account" onClick={closeMenu}>
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="mp-dropdown-logout-btn"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer (Side links) */}
      <div className={`mp-navbar-drawer ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div className="mp-navbar-drawer-links">
          <NavLink to="/" onClick={closeMenu}>
            Home
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/create/store" onClick={closeMenu}>
                {hasStore ? "Manage Store" : "Setup Store"}
              </NavLink>
              {hasStore && (
                <a
                  href="#"
                  onClick={handleVisitStore}
                  className="mp-navbar-link mp-visit-link"
                >
                  Visit Store ↗
                </a>
              )}
              <NavLink to="/manage/categories" onClick={closeMenu}>
                Categories
              </NavLink>
              <NavLink to="/manage/items" onClick={closeMenu}>
                Items
              </NavLink>
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
