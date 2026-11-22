import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import NavbarLayout from "../navbar/Navbar";
import Footer from "../footer/Footer";
import { Oval } from "react-loader-spinner";
import maitriLogoCubes from "../../assets/maitripos-logo-cubes.png";
import {
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  ExternalLink,
  Store,
  Share2,
  Palette,
} from "lucide-react";
import "./style.css";

const STAND_TEMPLATES = [
  {
    id: "maitripos-default",
    name: "MaitriPOS (Default)",
    cardBg: "#0f172a",
    border: "#1e293b",
    textPrimary: "#ffffff",
    textSecondary: "#93c5fd",
    badgeBg: "#f59e0b",
    badgeText: "#000000",
    qrPlateBg: "#ffffff",
    bracketColor: "#2563eb",
    stepNumBg: "#1e293b",
    stepNumBorder: "#ef4444",
    bannerBg: "#ffffff",
    storeNameColor: "#0f172a",
    taglineColor: "#f59e0b",
  },
  {
    id: "forest-green",
    name: "Emerald Forest",
    cardBg: "#0f3d2e",
    border: "#184e3c",
    textPrimary: "#ffffff",
    textSecondary: "#86efac",
    badgeBg: "#e2d9cc",
    badgeText: "#0f3d2e",
    qrPlateBg: "#fbf6ee",
    bracketColor: "#0f3d2e",
    stepNumBg: "rgba(0, 0, 0, 0.35)",
    stepNumBorder: "#2dd4bf",
    bannerBg: "#fbf6ee",
    storeNameColor: "#0f3d2e",
    taglineColor: "#e2d9cc",
  },
  {
    id: "midnight-black",
    name: "Midnight Luxury",
    cardBg: "#121214",
    border: "#27272a",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    badgeBg: "#f59e0b",
    badgeText: "#000000",
    qrPlateBg: "#ffffff",
    bracketColor: "#121214",
    stepNumBg: "#27272a",
    stepNumBorder: "#f59e0b",
    bannerBg: "#ffffff",
    storeNameColor: "#121214",
    taglineColor: "#f59e0b",
  },
  {
    id: "sapphire-navy",
    name: "Sapphire Navy",
    cardBg: "#0f2042",
    border: "#1e3a8a",
    textPrimary: "#ffffff",
    textSecondary: "#93c5fd",
    badgeBg: "#38bdf8",
    badgeText: "#082f49",
    qrPlateBg: "#f0f9ff",
    bracketColor: "#0f2042",
    stepNumBg: "#1e3a8a",
    stepNumBorder: "#38bdf8",
    bannerBg: "#f0f9ff",
    storeNameColor: "#0f2042",
    taglineColor: "#38bdf8",
  },
  {
    id: "crimson-ruby",
    name: "Crimson Velvet",
    cardBg: "#500713",
    border: "#881337",
    textPrimary: "#ffffff",
    textSecondary: "#fecdd3",
    badgeBg: "#fb7185",
    badgeText: "#4c0519",
    qrPlateBg: "#fff1f2",
    bracketColor: "#500713",
    stepNumBg: "#881337",
    stepNumBorder: "#fb7185",
    bannerBg: "#fff1f2",
    storeNameColor: "#500713",
    taglineColor: "#fb7185",
  },
  {
    id: "royal-purple",
    name: "Imperial Violet",
    cardBg: "#2e1065",
    border: "#581c87",
    textPrimary: "#ffffff",
    textSecondary: "#d8b4fe",
    badgeBg: "#c084fc",
    badgeText: "#3b0764",
    qrPlateBg: "#faf5ff",
    bracketColor: "#2e1065",
    stepNumBg: "#581c87",
    stepNumBorder: "#c084fc",
    bannerBg: "#faf5ff",
    storeNameColor: "#2e1065",
    taglineColor: "#c084fc",
  },
  {
    id: "roasted-coffee",
    name: "Cafe Mocha",
    cardBg: "#30180d",
    border: "#5c2e17",
    textPrimary: "#ffffff",
    textSecondary: "#fed7aa",
    badgeBg: "#fef08a",
    badgeText: "#431407",
    qrPlateBg: "#fffbeb",
    bracketColor: "#30180d",
    stepNumBg: "#5c2e17",
    stepNumBorder: "#fef08a",
    bannerBg: "#fffbeb",
    storeNameColor: "#30180d",
    taglineColor: "#fef08a",
  },
  {
    id: "terracotta-warm",
    name: "Warm Terracotta",
    cardBg: "#7c2d12",
    border: "#9a3412",
    textPrimary: "#ffffff",
    textSecondary: "#fdba74",
    badgeBg: "#ffedd5",
    badgeText: "#7c2d12",
    qrPlateBg: "#fff7ed",
    bracketColor: "#7c2d12",
    stepNumBg: "#9a3412",
    stepNumBorder: "#fdba74",
    bannerBg: "#fff7ed",
    storeNameColor: "#7c2d12",
    taglineColor: "#fed7aa",
  },
  {
    id: "slate-minimal",
    name: "Slate Modern",
    cardBg: "#1e293b",
    border: "#334155",
    textPrimary: "#ffffff",
    textSecondary: "#cbd5e1",
    badgeBg: "#f1f5f9",
    badgeText: "#0f172a",
    qrPlateBg: "#f8fafc",
    bracketColor: "#1e293b",
    stepNumBg: "#334155",
    stepNumBorder: "#94a3b8",
    bannerBg: "#f8fafc",
    storeNameColor: "#0f172a",
    taglineColor: "#e2e8f0",
  },
  {
    id: "cyber-teal",
    name: "Cyber Neon",
    cardBg: "#083344",
    border: "#155e75",
    textPrimary: "#ffffff",
    textSecondary: "#67e8f9",
    badgeBg: "#22d3ee",
    badgeText: "#083344",
    qrPlateBg: "#ecfeff",
    bracketColor: "#083344",
    stepNumBg: "#155e75",
    stepNumBorder: "#22d3ee",
    bannerBg: "#ecfeff",
    storeNameColor: "#083344",
    taglineColor: "#22d3ee",
  },
  {
    id: "clean-minimal",
    name: "Studio Cream",
    cardBg: "#f4ede2",
    border: "#e2d4c0",
    textPrimary: "#1c1917",
    textSecondary: "#57534e",
    badgeBg: "#1c1917",
    badgeText: "#ffffff",
    qrPlateBg: "#ffffff",
    bracketColor: "#1c1917",
    stepNumBg: "#e7d9c6",
    stepNumBorder: "#1c1917",
    bannerBg: "#ffffff",
    storeNameColor: "#1c1917",
    taglineColor: "#1c1917",
  },
];

export default function StoreQR() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(STAND_TEMPLATES[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  const standeeRef = useRef(null);

  useEffect(() => {
    document.title = "maitriPOS — Store QR Standee";

    const fetchStore = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/store/me`,
          { credentials: "include" }
        );
        const result = await res.json();
        if (res.ok && result.data?.length > 0) {
          setStore(result.data[0]);
        }
      } catch (err) {
        console.error("Failed to load store data for QR", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, []);

  const storeSlug = store?.slug || "";
  const storeRef = store?.storeRef || "";
  const storeName = store?.name || "My Store";
  const storeLogo = store?.logo;
  const storeAddress = store?.address || "";

  // The permanent URL embedded in the QR Code
  const qrUrl = storeSlug
    ? `https://${storeSlug}.maitripos.com/?ref=${storeRef}`
    : "";

  const handleCopy = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement("input");
      input.value = qrUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadStandee = async () => {
    if (!standeeRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      // Use html-to-image with pixelRatio: 3 for ultra-HD crisp print output
      // This guarantees 100% exact visual parity with the on-screen card preview!
      const dataUrl = await toPng(standeeRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        style: {
          borderRadius: "24px",
          transform: "none",
        },
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `${storeSlug || "store"}-standee-${selectedTemplate.id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Failed to generate image from preview", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <NavbarLayout />
        <div className="sq-loading-screen">
          <Oval color="#000" height={45} width={45} />
        </div>
        <Footer />
      </>
    );
  }

  if (!store) {
    return (
      <>
        <NavbarLayout />
        <div className="sq-empty-screen">
          <Store size={48} />
          <h2>No Store Found</h2>
          <p>Please setup your store first to generate your QR standee.</p>
          <Link to="/create/store" className="sq-btn-primary">
            Setup Store
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavbarLayout />
      <div className="sq-page">
        <div className="sq-container">
          {/* Header */}
          <div className="sq-header">
            <h1>Your Store QR Standee</h1>
            <p>
              Display this branded standee on your checkout counter, tables, or entry glass.
              Customers can scan and instantly browse your online menu.
            </p>
          </div>

          <div className="sq-content-grid">
            {/* Standee Preview Column */}
            <div className="sq-preview-column">
              <div
                className="sq-poster-card"
                ref={standeeRef}
                style={{
                  background: selectedTemplate.cardBg,
                  color: selectedTemplate.textPrimary,
                }}
              >
                {/* Header Title */}
                <div className="sq-poster-header">
                  <h1 className="sq-poster-heading">Scan to View</h1>
                  <h2 className="sq-poster-subheading">Our Menu</h2>
                </div>

                {/* QR Code Container Plate with Corner Focus Brackets */}
                <div
                  className="sq-poster-qr-plate"
                  style={{ background: selectedTemplate.qrPlateBg }}
                >
                  {/* Corner Brackets */}
                  <span
                    className="sq-bracket sq-bracket-tl"
                    style={{ borderColor: selectedTemplate.bracketColor }}
                  />
                  <span
                    className="sq-bracket sq-bracket-tr"
                    style={{ borderColor: selectedTemplate.bracketColor }}
                  />
                  <span
                    className="sq-bracket sq-bracket-bl"
                    style={{ borderColor: selectedTemplate.bracketColor }}
                  />
                  <span
                    className="sq-bracket sq-bracket-br"
                    style={{ borderColor: selectedTemplate.bracketColor }}
                  />

                  <div className="sq-poster-qr-inner">
                    <QRCodeSVG
                      id="store-qr-page-svg"
                      value={qrUrl}
                      size={240}
                      level="H"
                      fgColor="#000000"
                      bgColor="transparent"
                      includeMargin={false}
                      className="sq-qr-svg-responsive"
                    />
                  </div>
                </div>

                {/* 3 Steps Guide Row */}
                <div className="sq-poster-steps">
                  <div className="sq-poster-step">
                    <div
                      className="sq-step-num"
                      style={{
                        background: selectedTemplate.stepNumBg,
                        borderColor: selectedTemplate.stepNumBorder,
                      }}
                    >
                      1
                    </div>
                    <p className="sq-step-text">
                      Use your phone camera to scan the QR code on this sign.
                    </p>
                  </div>

                  <div className="sq-step-divider" />

                  <div className="sq-poster-step">
                    <div
                      className="sq-step-num"
                      style={{
                        background: selectedTemplate.stepNumBg,
                        borderColor: selectedTemplate.stepNumBorder,
                      }}
                    >
                      2
                    </div>
                    <p className="sq-step-text">
                      View our complete range, crafted for every preference.
                    </p>
                  </div>

                  <div className="sq-step-divider" />

                  <div className="sq-poster-step">
                    <div
                      className="sq-step-num"
                      style={{
                        background: selectedTemplate.stepNumBg,
                        borderColor: selectedTemplate.stepNumBorder,
                      }}
                    >
                      3
                    </div>
                    <p className="sq-step-text">
                      Place your order at the counter or simply let us know!
                    </p>
                  </div>
                </div>

                {/* Bottom Brand Bar */}
                <div
                  className="sq-poster-banner"
                  style={{ background: selectedTemplate.bannerBg }}
                >
                  <div
                    className="sq-poster-store-name"
                    style={{ color: selectedTemplate.storeNameColor }}
                  >
                    {storeName.toUpperCase()}
                  </div>
                  <div className="sq-poster-brand-divider" />
                  <div className="sq-poster-maitri-brand">
                    <img
                      src={maitriLogoCubes}
                      alt="maitriPOS"
                      className="sq-maitri-logo-img"
                    />
                    <span className="sq-maitri-name">maitriPOS™</span>
                  </div>
                </div>

                {/* Powered by footnote */}
                <div
                  className="sq-poster-footnote"
                  style={{ color: selectedTemplate.taglineColor }}
                >
                  Powered by <strong>maitriPOS.com</strong>
                </div>
              </div>
            </div>

            {/* Controls & Options Column */}
            <div className="sq-controls-column">
              {/* Template Style Selector */}
              <div className="sq-control-card">
                <div className="sq-card-title">
                  <Palette size={18} />
                  <h3>Choose Theme Style</h3>
                </div>
                <div className="sq-template-grid">
                  {STAND_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      className={`sq-template-btn ${selectedTemplate.id === tmpl.id ? "active" : ""
                        }`}
                      onClick={() => setSelectedTemplate(tmpl)}
                    >
                      <span
                        className="sq-tmpl-swatch"
                        style={{ background: tmpl.cardBg, borderColor: tmpl.badgeBg }}
                      />
                      <span className="sq-tmpl-name">{tmpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permanent Link Info Card */}
              <div className="sq-control-card">
                <div className="sq-card-title">
                  <ExternalLink size={18} />
                  <h3>Permanent Menu URL</h3>
                </div>
                <p className="sq-card-desc">
                  Embedded with your store reference token. Even if you update your store
                  name or slug in the future, your printed standees will automatically redirect.
                </p>

                <div className="sq-url-bar">
                  <span className="sq-url-text">{qrUrl}</span>
                  <button
                    type="button"
                    className={`sq-copy-btn ${copied ? "copied" : ""}`}
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sq-actions-card">
                <button
                  type="button"
                  className="sq-btn-primary"
                  onClick={handleDownloadStandee}
                  disabled={isDownloading}
                >
                  <Download size={18} />
                  <span>
                    {isDownloading ? "Generating Standee..." : "Download Standee (PNG)"}
                  </span>
                </button>

                <div className="sq-btn-row">
                  <button
                    type="button"
                    className="sq-btn-secondary"
                    onClick={handlePrint}
                  >
                    <Printer size={16} />
                    <span>Print Standee</span>
                  </button>

                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sq-btn-secondary"
                  >
                    <ExternalLink size={16} />
                    <span>Open Live Menu</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
