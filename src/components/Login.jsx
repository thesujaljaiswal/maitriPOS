import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import "./style.css";
import NavbarLayout from "./navbar/Navbar";
import Footer from "./footer/Footer";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "maitriPOS - Login";

    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth/status`,
          { credentials: "include" },
        );

        if (res.ok) {
          navigate("/", { replace: true });
        }
      } catch {
        // ignore
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (!username || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Login failed");
        return;
      }

      navigate("/", { replace: true });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarLayout />

      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>

        {error && <div className="error">{error}</div>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setError("");
            setUsername(e.target.value);
          }}
        />

        {/* PASSWORD FIELD with SHOW/HIDE */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setError("");
              setPassword(e.target.value);
            }}
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <Oval height={20} width={20} color="#fff" /> : "Login"}
        </button>

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>

        <Footer />
      </form>
    </>
  );
}
