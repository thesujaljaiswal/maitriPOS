import React, { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";

export default function Layout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [storeSlug, setStoreSlug] = useState(""); // Track the slug
  const [checking, setChecking] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      // 1. Check Auth Status
      const authRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
        {
          credentials: "include",
        }
      );
      const authOk = authRes.ok;
      setIsAuthenticated(authOk);

      // 2. Check Store Status if authenticated
      if (authOk) {
        const storeRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/store/me`,
          {
            credentials: "include",
          }
        );
        const result = await storeRes.json();

        if (result.success && result.data && result.data.length > 0) {
          setHasStore(true);
          setStoreSlug(result.data[0].slug); // Set the slug from the first store
        } else {
          setHasStore(false);
          setStoreSlug("");
        }
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setIsAuthenticated(false);
      setHasStore(false);
    } finally {
      setChecking(false);
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
      setStoreSlug("");
      navigate("/");
      window.location.reload();
    }
  };

  if (checking) return null;

  return (
    <div className="mp-app-wrapper">
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        hasStore={hasStore}
        storeSlug={storeSlug} // Pass slug to Navbar
      />
      <main style={{ marginTop: "70px" }}>
        <Outlet
          context={{ hasStore, isAuthenticated, storeSlug, checkStatus }}
        />
      </main>
    </div>
  );
}
