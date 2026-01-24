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

  const isMounted = useRef(true);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
  }, [isMobileMenuOpen]);

  const checkStatus = useCallback(async () => {
    try {
      const authRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        { credentials: "include" },
      );
      if (!isMounted.current) return;
      if (authRes.ok) {
        const authData = await authRes.json();
        setIsAuthenticated(true);
        setPlan(authData.data.plan);
        setPlanExpiresAt(authData.data.planExpiresAt);
        const storeRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/store/me`,
          { credentials: "include" },
        );
        const result = await storeRes.json();
        if (result.success && result.data?.length > 0) {
          setHasStore(true);
          setStoreSlug(result.data[0].slug);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/");
    window.location.reload();
  };

  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!storeSlug) return;
    const { protocol, host } = window.location;
    window.open(`${protocol}//${storeSlug}.${host}`, "_blank");
    closeMenu();
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const shouldShowUpgrade = () => {
    if (plan === "ARAMBH") return true;
    if (!planExpiresAt) return false;
    const diff = (new Date(planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  };

  if (isLoading)
    return (
      <div className="loader-box">
        <Oval color="#000" height={40} width={40} />
      </div>
    );

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
              className={`mp-navbar-links-wrapper ${isMobileMenuOpen ? "active" : ""}`}
            >
              <NavLink to="/" className="mp-navbar-link" onClick={closeMenu}>
                Home
              </NavLink>
              {isAuthenticated ? (
                <>
                  {(plan === "PRAVAH" || plan === "UTSAH") && (
                    <NavLink
                      to="/orders"
                      className="mp-navbar-link"
                      onClick={closeMenu}
                    >
                      Manage Orders
                    </NavLink>
                  )}
                  <NavLink
                    to="/create/store"
                    className="mp-navbar-link"
                    onClick={closeMenu}
                  >
                    {hasStore ? "Store Settings" : "Setup Store"}
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
                  <NavLink
                    to="/manage/categories"
                    className="mp-navbar-link"
                    onClick={closeMenu}
                  >
                    Categories
                  </NavLink>
                  <NavLink
                    to="/manage/items"
                    className="mp-navbar-link"
                    onClick={closeMenu}
                  >
                    Items
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="mp-navbar-link"
                    onClick={closeMenu}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="mp-navbar-btn-primary"
                    onClick={closeMenu}
                  >
                    Join Free
                  </NavLink>
                </>
              )}
            </div>

            <div className="mp-navbar-icons-group" ref={dropdownRef}>
              {isAuthenticated && (
                <div className="mp-dropdown-container">
                  <button
                    className="mp-user-avatar-btn"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="mp-user-icon-circle">👤</div>
                  </button>
                  {isDropdownOpen && (
                    <div className="mp-dropdown-menu">
                      {shouldShowUpgrade() && (
                        <button
                          className="mp-dropdown-upgrade-btn"
                          onClick={() => {
                            navigate("/upgrade");
                            closeMenu();
                          }}
                        >
                          🚀 {plan === "ARAMBH" ? "Upgrade Plan" : "Renew Plan"}
                        </button>
                      )}
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
              )}
              <button
                className="mp-hamburger-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main style={{ marginTop: "70px" }}>
        <Outlet
          context={{ hasStore, isAuthenticated, storeSlug, checkStatus }}
        />
      </main>
    </div>
  );
}
