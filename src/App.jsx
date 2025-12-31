import { useState } from "react";
import { Instagram, Linkedin } from "lucide-react";
import Snowfall from "react-snowfall";
import logoImage from "../src/assets/maitriPOS ICON 2 white.png";
import "./App.css";

function App() {
  return (
    <div className="main-wrapper">
      <Snowfall snowflakeCount={100} />
      <div className="content-card">
        {/* Header Logo */}
        <header className="header">
          <h1 className="brand-logo">
            <img src={logoImage} alt="Logo" />
          </h1>
        </header>

        {/* Hero Section */}
        <main className="hero">
          <h2 className="title">Coming Soon</h2>

          <p className="tagline">From India, for the world. </p>

          <p className="description">
            The ultimate smart platform for anyone who loves to create. Build
            digital catalogues, manage orders, and handle seamless payments in
            one vibe-heavy app.
          </p>

          <a
            href="https://forms.gle/1wjfgfeJhwwWZtPCA"
            target="_blank"
            rel="noopener noreferrer"
            className="glow-button"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Get Early Access
          </a>

          {/* Social Proof Placeholder */}
          {/* <div className="waiting-counter">
            <div className="avatar-stack">
              <span className="avatar" style={{ backgroundColor: "#a855f7" }}>
                M
              </span>
              <span className="avatar" style={{ backgroundColor: "#f43f5e" }}>
                L
              </span>
              <span className="avatar" style={{ backgroundColor: "#fbbf24" }}>
                CX
              </span>
            </div>
            <p>Join 200+ people waiting</p>
          </div> */}
        </main>

        {/* Footer */}
        <footer className="social-footer">
          <div className="social-icons">
            <a
              href="https://www.instagram.com/maitripos/"
              target="_blank"
              rel="noopener noreferrer"
              className="icon"
            >
              <Instagram />
            </a>
            <a
              href="https://www.linkedin.com/company/maitripos/"
              target="_blank"
              rel="noopener noreferrer"
              className="icon"
            >
              <Linkedin />
            </a>
          </div>
          <div className="bottom-bar">
            <span>© 2025 MaitriPOS </span>
            <span className="divider">|</span>
            <span>भारत से, पूरे विश्व के लिए</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
