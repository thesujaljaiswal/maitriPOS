import React, { useEffect, useState, useCallback } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import "./style.css";
import icon from "../../assets/maitriPOS FAVICON.png";

export default function NavbarLayout() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");

  /* ---------------- AUTH + STORE CHECK ---------------- */

  const checkStatus = useCallback(async () => {
    try {
      const authRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        { credentials: "include" }
      );

      const authOk = authRes.ok;
      setIsAuthenticated(authOk);

      if (authOk) {
        const storeRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/store/me`,
          { credentials: "include" }
        );
        const result = await storeRes.json();

        if (result.success && result.data?.length > 0) {
          setHasStore(true);
          setStoreSlug(result.data[0].slug);
        } else {
          setHasStore(false);
          setStoreSlug("");
        }
      } else {
        setHasStore(false);
        setStoreSlug("");
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setIsAuthenticated(false);
      setHasStore(false);
      setStoreSlug("");
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
      setHasStore(false);
      setStoreSlug("");
      navigate("/");
      window.location.reload();
    }
  };

  /* ---------------- SUBDOMAIN REDIRECT ---------------- */

  const handleVisitStore = (e) => {
    e.preventDefault();
    if (!storeSlug) return;

    const { protocol, host } = window.location;
    const newUrl = `${protocol}//${storeSlug}.${host}`;
    window.open(newUrl, "_blank");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="mp-app-wrapper">
      <nav className="mp-navbar-root">
        <div className="mp-navbar-container">
          <Link to="/" className="mp-navbar-brand">
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
        </div>
      </nav>

      <main style={{ marginTop: "70px" }}>
        <Outlet
          context={{
            hasStore,
            isAuthenticated,
            storeSlug,
            checkStatus,
          }}
        />
      </main>
    </div>
  );
}
