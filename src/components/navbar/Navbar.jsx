// NavbarLayout.jsx
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

  const [plan, setPlan] = useState("ARAMBH");
  const [planExpiresAt, setPlanExpiresAt] = useState(null);

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);

  const isMounted = useRef(true);
  const dropdownRef = useRef(null);

  // ✅ reactive mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ✅ close dropdown on outside click
  useEffect(() => {
    isMounted.current = true;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isMounted.current = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ lock scroll only on mobile menu
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
  }, [isMobileMenuOpen]);

  // ✅ close menus
  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setIsProductOpen(false);
    setIsBusinessOpen(false);
  }, []);

  useEffect(() => {
    if (!isMobile) closeMenu();
  }, [isMobile, closeMenu]);

  // ✅ expiry info: show hours/min if < 24h, else days; null if expired/none
  const getExpiryInfo = useCallback((expiresAt) => {
    if (!expiresAt) return null;

    const exp = new Date(expiresAt);
    if (Number.isNaN(exp.getTime())) return null;

    const diffMs = exp.getTime() - Date.now();
    if (diffMs <= 0) return null; // expired -> don't show

    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = Math.floor((diffHours - hours) * 60);
      return { type: "hours", hours, minutes };
    }

    const days = Math.ceil(diffHours / 24);
    return { type: "days", days };
  }, []);

  const expiryInfo = getExpiryInfo(planExpiresAt);

  // ✅ show Upgrade CTA:
  // - always show for ARAMBH
  // - for paid plans show when:
  //   <24h OR <= 7 days (and not expired)
  const showUpgradeCta =
    isAuthenticated &&
    (plan === "ARAMBH" ||
      (expiryInfo &&
        (expiryInfo.type === "hours" ||
          (expiryInfo.type === "days" && expiryInfo.days <= 7))));

  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      const authRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        { credentials: "include" },
      );

      if (!isMounted.current) return;

      if (!authRes.ok) {
        setIsAuthenticated(false);
        setHasStore(false);
        setStoreSlug("");
        return;
      }

      const authData = await authRes.json();
      setIsAuthenticated(true);
      setPlan(authData?.data?.plan || "ARAMBH");
      setPlanExpiresAt(authData?.data?.planExpiresAt || null);

      const storeRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/store/me`,
        { credentials: "include" },
      );

      const result = await storeRes.json();

      if (
        result?.success &&
        Array.isArray(result?.data) &&
        result.data.length > 0
      ) {
        setHasStore(true);
        setStoreSlug(result.data[0]?.slug || "");
      } else {
        setHasStore(false);
        setStoreSlug("");
      }
    } catch (err) {
      console.error(err);
      setIsAuthenticated(false);
      setHasStore(false);
      setStoreSlug("");
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
    } catch (e) {
      console.error(e);
    } finally {
      closeMenu();
      navigate("/");
      window.location.reload();
    }
  };

  // ✅ dropdown hover for desktop, click for mobile
  const onProductEnter = () => {
    if (!isMobile) setIsProductOpen(true);
  };
  const onProductLeave = () => {
    if (!isMobile) setIsProductOpen(false);
  };
  const onBusinessEnter = () => {
    if (!isMobile) setIsBusinessOpen(true);
  };
  const onBusinessLeave = () => {
    if (!isMobile) setIsBusinessOpen(false);
  };

  const toggleProduct = () => {
    if (isMobile) setIsProductOpen((p) => !p);
  };
  const toggleBusiness = () => {
    if (isMobile) setIsBusinessOpen((p) => !p);
  };

  const navClass = ({ isActive }) =>
    `mp-navbar-link ${isActive ? "mp-navbar-link--active" : ""}`;

  if (isLoading)
    return (
      <div className="loader-box">
        <Oval color="#000" height={40} width={40} />
      </div>
    );

  const expiryLabel =
    plan === "ARAMBH"
      ? ""
      : expiryInfo?.type === "hours"
        ? `(${expiryInfo.hours}h ${expiryInfo.minutes}m left)`
        : expiryInfo?.type === "days"
          ? `(${expiryInfo.days}d left)`
          : "";

  const expiryBadge =
    plan === "ARAMBH"
      ? "🚀"
      : expiryInfo?.type === "hours"
        ? `${expiryInfo.hours}h ${expiryInfo.minutes}m`
        : expiryInfo?.type === "days"
          ? `${expiryInfo.days}d left`
          : "🚀";

  return (
    <div className="mp-app-wrapper">
      <nav className="mp-navbar-root">
        <div className="mp-navbar-container">
          <Link to="/" className="mp-navbar-brand" onClick={closeMenu}>
            <img src={icon} alt="Logo" />
            <span>maitriPOS™</span>
          </Link>

          <div className="mp-nav-right-section">
            <div
              className={`mp-mobile-overlay ${isMobileMenuOpen ? "show" : ""}`}
              onClick={closeMenu}
            />

            <div
              className={`mp-navbar-links-wrapper ${
                isMobileMenuOpen ? "active" : ""
              }`}
            >
              <NavLink to="/" className={navClass} onClick={closeMenu}>
                Home
              </NavLink>

              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/create/store"
                    className={navClass}
                    onClick={closeMenu}
                  >
                    {hasStore ? "Store Settings" : "Setup Store"}
                  </NavLink>

                  {hasStore && storeSlug ? (
                    <a
                      className="mp-navbar-link mp-visit-store"
                      href={`https://${storeSlug}.maitripos.com`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={closeMenu}
                    >
                      Open Store ↗
                    </a>
                  ) : null}

                  <div
                    className="mp-nav-dropdown"
                    onMouseEnter={onProductEnter}
                    onMouseLeave={onProductLeave}
                  >
                    <button
                      type="button"
                      className="mp-navbar-link mp-dropdown-trigger"
                      onClick={toggleProduct}
                    >
                      Product <small>▾</small>
                    </button>

                    <div
                      className={`mp-nav-dropdown-content ${
                        isProductOpen ? "show" : ""
                      }`}
                    >
                      <Link to="/manage/categories" onClick={closeMenu}>
                        Categories
                      </Link>
                      <Link to="/manage/items" onClick={closeMenu}>
                        Items
                      </Link>
                    </div>
                  </div>

                  {(plan === "PRAVAH" || plan === "UTSAH") && (
                    <div
                      className="mp-nav-dropdown"
                      onMouseEnter={onBusinessEnter}
                      onMouseLeave={onBusinessLeave}
                    >
                      <button
                        type="button"
                        className="mp-navbar-link mp-dropdown-trigger"
                        onClick={toggleBusiness}
                      >
                        Business <small>▾</small>
                      </button>

                      <div
                        className={`mp-nav-dropdown-content ${
                          isBusinessOpen ? "show" : ""
                        }`}
                      >
                        <Link to="/orders" onClick={closeMenu}>
                          Manage Orders
                        </Link>
                        <Link to="/track/expense" onClick={closeMenu}>
                          Expense tracker
                        </Link>
                        <Link to="/analytics" onClick={closeMenu}>
                          Analytics
                        </Link>
                      </div>
                    </div>
                  )}

                  {isMobile ? (
                    <>
                      {showUpgradeCta ? (
                        <Link
                          to="/upgrade"
                          onClick={closeMenu}
                          className="mp-navbar-link mp-upgrade-link upgrade-btn"
                        >
                          Upgrade {expiryLabel}
                        </Link>
                      ) : null}

                      <NavLink
                        to="/account"
                        className={navClass}
                        onClick={closeMenu}
                      >
                        My Profile
                      </NavLink>

                      <button
                        type="button"
                        className="mp-navbar-link mp-logout-link"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navClass} onClick={closeMenu}>
                    Login
                  </NavLink>

                  <NavLink
                    to="/register"
                    className={({ isActive }) =>
                      `mp-navbar-btn-primary ${
                        isActive ? "mp-navbar-btn-primary--active" : ""
                      }`
                    }
                    onClick={closeMenu}
                  >
                    Join Free
                  </NavLink>
                </>
              )}
            </div>

            <div className="mp-navbar-icons-group" ref={dropdownRef}>
              {isAuthenticated && !isMobile && (
                <div className="mp-dropdown-container">
                  <button
                    type="button"
                    className="mp-user-avatar-btn"
                    onClick={() => setIsDropdownOpen((p) => !p)}
                    aria-label="User menu"
                  >
                    <div className="mp-user-icon-circle">👤</div>
                  </button>

                  {isDropdownOpen && (
                    <div className="mp-dropdown-menu">
                      <Link to="/account" onClick={closeMenu}>
                        My Profile
                      </Link>

                      {showUpgradeCta ? (
                        <Link
                          to="/upgrade"
                          onClick={closeMenu}
                          className="mp-upgrade-dropdown-link upgrade-btn"
                        >
                          <span className="mp-upgrade-title">Upgrade Plan</span>
                          <span className="mp-upgrade-meta">{expiryBadge}</span>
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mp-dropdown-logout-btn"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="mp-hamburger-btn"
                onClick={() => setIsMobileMenuOpen((p) => !p)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ marginTop: "70px" }}>
        <Outlet context={{ hasStore, isAuthenticated, checkStatus }} />
      </main>
    </div>
  );
}
