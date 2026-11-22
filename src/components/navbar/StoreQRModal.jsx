import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Share2, Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import "./qrModal.css";
import icon from "../../assets/maitriPOS FAVICON.png";

export default function StoreQRModal({ isOpen, onClose, store }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  if (!isOpen || !store) return null;

  const storeSlug = store.slug || "";
  const storeRef = store.storeRef || "";
  const storeName = store.name || "My Store";
  const storeLogo = store.logo;
  const storeAddress = store.address || "";

  // The permanent URL embedded in the QR Code
  const qrUrl = `https://${storeSlug}.maitripos.com/?ref=${storeRef}`;

  const handleCopyLink = async () => {
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

  const handleDownloadQR = () => {
    // Generate a high-resolution canvas standee card for printing
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scale = 2; // For crisp print quality

    const width = 460 * scale;
    const height = 640 * scale;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "#ffffff");
    bgGradient.addColorStop(1, "#f8fafc");
    ctx.fillStyle = bgGradient;
    ctx.roundRect(0, 0, width, height, 32 * scale);
    ctx.fill();

    // Top Brand Accent Bar
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(0, 0, width, 18 * scale, [32 * scale, 32 * scale, 0, 0]);
    ctx.fill();

    // Header badge
    ctx.fillStyle = "#f1f5f9";
    ctx.beginPath();
    ctx.roundRect(140 * scale, 36 * scale, 180 * scale, 32 * scale, 16 * scale);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = `bold ${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("SCAN TO ORDER ONLINE", 230 * scale, 57 * scale);

    // Store Name
    ctx.fillStyle = "#000000";
    ctx.font = `bold ${24 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(storeName, 230 * scale, 110 * scale);

    // Address / Subtext
    if (storeAddress) {
      ctx.fillStyle = "#64748b";
      ctx.font = `${13 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(storeAddress.slice(0, 48), 230 * scale, 136 * scale);
    }

    // QR Code Frame
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.roundRect(80 * scale, 165 * scale, 300 * scale, 300 * scale, 24 * scale);
    ctx.fill();
    ctx.stroke();

    // Draw SVG QR into Image
    const svgElement = document.getElementById("store-qr-svg");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const qrImage = new Image();
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 105 * scale, 190 * scale, 250 * scale, 250 * scale);
      URLObject.revokeObjectURL(blobURL);

      // Footer notice & MaitriPOS watermark
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${14 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(`${storeSlug}.maitripos.com`, 230 * scale, 505 * scale);

      ctx.fillStyle = "#94a3b8";
      ctx.font = `${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("Powered by MaitriPOS", 230 * scale, 595 * scale);

      // Trigger download
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${storeSlug}-qr-standee.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    qrImage.src = blobURL;
  };

  return (
    <div
      className="mp-qr-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target.classList.contains("mp-qr-backdrop")) onClose();
      }}
    >
      <div className="mp-qr-card" onClick={(e) => e.stopPropagation()}>
        <div className="mp-qr-header">
          <div className="mp-qr-header-title">
            <Sparkles size={18} className="mp-qr-sparkle-icon" />
            <h3>Store QR Standee</h3>
          </div>
          <button
            type="button"
            className="mp-qr-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mp-qr-body">
          {/* Printable Standee Card Preview */}
          <div className="mp-qr-standee" ref={cardRef}>
            <div className="mp-qr-standee-bar" />
            
            <div className="mp-qr-badge">SCAN TO ORDER ONLINE</div>

            <div className="mp-qr-store-info">
              {storeLogo && (
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="mp-qr-store-logo"
                />
              )}
              <h2 className="mp-qr-store-name">{storeName}</h2>
              {storeAddress && (
                <p className="mp-qr-store-addr">{storeAddress}</p>
              )}
            </div>

            <div className="mp-qr-code-frame">
              <QRCodeSVG
                id="store-qr-svg"
                value={qrUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="mp-qr-footer">
              <span className="mp-qr-domain">{storeSlug}.maitripos.com</span>
              <p className="mp-qr-powered">
                Powered by <strong>MaitriPOS</strong>
              </p>
            </div>
          </div>

          {/* Quick Info & Permanent URL box */}
          <div className="mp-qr-url-box">
            <div className="mp-qr-url-row">
              <span className="mp-qr-url-text">{qrUrl}</span>
              <button
                type="button"
                className={`mp-qr-copy-btn ${copied ? "copied" : ""}`}
                onClick={handleCopyLink}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="mp-qr-tip">
              💡 Even if you change your store slug in the future, this QR code will automatically redirect customers to your new URL!
            </p>
          </div>
        </div>

        <div className="mp-qr-actions">
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mp-qr-btn-secondary"
          >
            <ExternalLink size={16} />
            <span>Open Menu</span>
          </a>

          <button
            type="button"
            className="mp-qr-btn-primary"
            onClick={handleDownloadQR}
          >
            <Download size={16} />
            <span>Download Standee (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
