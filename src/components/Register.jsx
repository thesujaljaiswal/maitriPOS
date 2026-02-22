import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import "./style.css";
import NavbarLayout from "./navbar/Navbar";
import Footer from "./footer/Footer";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "maitriPOS - Register";
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const { fullName, username, email, password, confirmPassword } = form;

    if (!fullName || !username || !email || !password || !confirmPassword) {
      setError("All required fields must be filled");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            username: form.username,
            email: form.email,
            password: form.password,
            phone: form.phone,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Registration failed");
        return;
      }

      navigate("/login");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarLayout />

      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        {error && <div className="error">{error}</div>}

        <input
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
        />

        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={handleChange}
        />

        {/* PASSWORD FIELD */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* CONFIRM PASSWORD FIELD */}
        <div className="password-field">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <Oval height={20} width={20} color="#fff" /> : "Register"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <Footer />
      </form>
    </>
  );
}
