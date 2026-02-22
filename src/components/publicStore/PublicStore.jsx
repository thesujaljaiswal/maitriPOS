import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react";
import logo from "../../assets/maitriPOS ICON 2.jpg";
import "./style.css";
import { Oval } from "react-loader-spinner";
import LANGS from "./language.json";

/**
 * ✅ Fixes in this version:
 * 1) Stops starting in Afrikaans (or any random lang):
 *    - Uses OUR cookie `mt_lang` as the source of truth.
 *    - If mt_lang missing/invalid -> defaults to English.
 *    - Also forces Google Translate cookie to /en/en when defaulting to English.
 *
 * 2) Sets the store logo as the browser tab icon (favicon) on load.
 */

const GT_SCRIPT_ID = "google-translate-script";
const GT_ELEM_ID = "google_translate_element";
const LANG_COOKIE = "mt_lang"; // ✅ our own cookie (stable)
const GT_COOKIE = "googtrans"; // Google uses this

const PublicStore = ({ slug }) => {
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSubCats, setOpenSubCats] = useState({});
  const categoryRefs = useRef({});

  // --- Languages: ensure English exists and is first ---
  const langsFinal = useMemo(() => {
    const list = Array.isArray(LANGS) ? [...LANGS] : [];
    const hasEn = list.some((l) => l?.code === "en");
    if (!hasEn) list.push({ code: "en", label: "English" });

    const en = list.find((l) => l?.code === "en") || {
      code: "en",
      label: "English",
    };

    const rest = list
      .filter((l) => l?.code && l.code !== "en")
      .sort((a, b) =>
        (a.label || "").localeCompare(b.label || "", "en", {
          sensitivity: "base",
        }),
      );

    return [en, ...rest];
  }, []);

  const allowedLangCodes = useMemo(
    () => new Set(langsFinal.map((l) => l.code).filter(Boolean)),
    [langsFinal],
  );

  // --- Cookie helpers (domain-safe) ---
  const getCookieDomains = useCallback(() => {
    const host = window.location.hostname;
    const parts = host.split(".").filter(Boolean);

    // localhost / ip: only no-domain cookie works
    if (host === "localhost" || parts.length < 2) return [null];

    const root = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    return [host, `.${root}`, root, null];
  }, []);

  const setCookie = useCallback(
    (name, value, days = 365) => {
      const maxAge = days * 24 * 60 * 60;
      const base = `${name}=${encodeURIComponent(
        value,
      )}; path=/; max-age=${maxAge}; samesite=lax`;
      const domains = getCookieDomains();

      domains.forEach((d) => {
        if (d) document.cookie = `${base}; domain=${d}`;
        else document.cookie = base;
      });
    },
    [getCookieDomains],
  );

  const readCookie = useCallback((name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  }, []);

  // ✅ Apply language to Google Translate dropdown when available
  const applyGoogleLang = useCallback((code, tries = 0) => {
    try {
      const combo = document.querySelector(".goog-te-combo");
      if (!combo) {
        if (tries < 80) setTimeout(() => applyGoogleLang(code, tries + 1), 150);
        return;
      }

      if (combo.value !== code) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
        combo.dispatchEvent(new Event("blur"));
      }
    } catch (e) {}
  }, []);

  const [gtReady, setGtReady] = useState(false);

  // ✅ Language state starts as English ALWAYS (then we read OUR cookie)
  const [lang, setLang] = useState("en");

  // ✅ Read OUR cookie on mount (NOT googtrans)
  useEffect(() => {
    const saved = readCookie(LANG_COOKIE);
    const next = saved && allowedLangCodes.has(saved) ? saved : "en";
    setLang(next);

    // If no saved language, force translate OFF (prevents random Afrikaans start)
    if (!saved || !allowedLangCodes.has(saved)) {
      setCookie(GT_COOKIE, "/en/en");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedLangCodes]);

  // --- Ensure HTML lang is stable ---
  useEffect(() => {
    try {
      document.documentElement.lang = "en";
    } catch (e) {}
  }, []);

  // --- Load Google Translate script once and init widget once ---
  useEffect(() => {
    const init = () => {
      try {
        if (!window.google?.translate?.TranslateElement) return;

        if (window.__GT_INITIALIZED__) {
          setGtReady(true);
          return;
        }

        window.__GT_INITIALIZED__ = true;

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            autoDisplay: false,
            includedLanguages: Array.from(allowedLangCodes).join(","),
          },
          GT_ELEM_ID,
        );

        setGtReady(true);
      } catch (e) {}
    };

    window.googleTranslateElementInit = init;

    if (window.google?.translate?.TranslateElement) {
      init();
      return;
    }

    if (!document.getElementById(GT_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = GT_SCRIPT_ID;
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      const t = setInterval(() => {
        if (window.google?.translate?.TranslateElement) {
          clearInterval(t);
          init();
        }
      }, 200);

      return () => clearInterval(t);
    }
  }, [allowedLangCodes]);

  // ✅ Persist + apply language whenever it changes
  useEffect(() => {
    // persist OUR cookie
    setCookie(LANG_COOKIE, lang);

    // set Google cookie (en => translate off)
    setCookie(GT_COOKIE, `/en/${lang === "en" ? "en" : lang}`);

    // apply even if widget loads later
    applyGoogleLang(lang === "en" ? "en" : lang);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, gtReady]);

  // ✅ Set favicon (store logo in title tab)
  const setFavicon = useCallback((href) => {
    try {
      if (!href) return;

      // pick existing icon link, else create one
      let link =
        document.querySelector("link[rel='icon']") ||
        document.querySelector("link[rel='shortcut icon']");

      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }

      link.type = "image/png";
      link.href = href;
    } catch (e) {}
  }, []);

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`,
      );
      if (!res.ok) throw new Error("Store not found");

      const data = await res.json();
      const sd = data.data;

      setStoreData(sd);

      if (sd.categories?.length > 0) setActiveCategory(sd.categories[0]._id);

      const initialSubCats = {};
      sd.categories?.forEach((cat) => {
        cat.subCategories?.forEach((sub) => {
          initialSubCats[sub._id] = true;
        });
      });
      setOpenSubCats(initialSubCats);

      // ✅ title + favicon
      document.title = sd?.store?.name || "Store";
      setFavicon(sd?.store?.logo || logo);
    } catch (err) {
      setError("Store not found");
    }
  }, [slug, setFavicon]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const onChangeLang = (e) => {
    const code = e.target.value;
    if (!allowedLangCodes.has(code)) return;
    setLang(code);
  };

  if (error)
    return (
      <div className="ps-status">
        <h2>{error}</h2>
      </div>
    );

  if (!storeData)
    return (
      <div className="ps-status">
        <Oval color="#000" />
      </div>
    );

  const { store, categories } = storeData;

  return (
    <div className="ps-wrapper">
      {/* must exist for widget */}
      <div id={GT_ELEM_ID} style={{ display: "none" }} />

      <header className="ps-hero">
        <div className="ps-hero-inner">
          <div className="ps-hero-top">
            <div className="ps-lang-wrap notranslate" translate="no">
              <span className="ps-lang-chip">🌐 Language</span>
              <select
                className="ps-lang-select"
                value={lang}
                onChange={onChangeLang}
              >
                {langsFinal.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ps-logo-wrap notranslate" translate="no">
            <img src={store.logo || logo} alt="Logo" className="ps-logo" />
            <span className={`ps-badge ${store.isOnline ? "ps-on" : "ps-off"}`}>
              {store.isOnline ? "Accepting Orders" : "Closed"}
            </span>
          </div>

          <h1 className="ps-title">{store.name}</h1>
          <p className="ps-addr">{store.address}</p>

          <div className="ps-links notranslate" translate="no">
            <a href={`tel:${store?.contact?.phone || ""}`}>
              📞 {store?.contact?.phone || "Call"}
            </a>
            <a href={`mailto:${store?.contact?.email || ""}`}>✉️ Email Us</a>
          </div>
        </div>
      </header>

      <nav className="ps-nav notranslate" translate="no">
        <div className="ps-nav-scroll">
          {categories.map((c) => (
            <button
              key={c._id}
              className={`ps-pill ${
                activeCategory === c._id ? "ps-pill-active" : ""
              }`}
              onClick={() => {
                setActiveCategory(c._id);
                const el = categoryRefs.current[c._id];
                if (el)
                  window.scrollTo({
                    top: el.offsetTop - 80,
                    behavior: "smooth",
                  });
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="ps-main">
        {categories.map((cat) => (
          <section
            key={cat._id}
            ref={(el) => (categoryRefs.current[cat._id] = el)}
            className="ps-section"
          >
            <h2 className="ps-sec-title">{cat.name}</h2>

            {cat.subCategories?.map((sub) => (
              <div
                key={sub._id}
                className={`ps-acc ${openSubCats[sub._id] ? "ps-open" : ""}`}
              >
                <div
                  className="ps-acc-head"
                  onClick={() =>
                    setOpenSubCats((p) => ({ ...p, [sub._id]: !p[sub._id] }))
                  }
                >
                  <div>
                    <span className="ps-acc-name">{sub.name}</span>
                    <span className="ps-acc-count">
                      {sub.items?.length} items
                    </span>
                  </div>
                  <span className="ps-chevron">↓</span>
                </div>

                <div className="ps-acc-content">
                  <div className="ps-acc-inner">
                    <div className="ps-grid">
                      {sub.items?.map((item) => (
                        <ProductCard
                          key={item._id}
                          item={item}
                          onOpen={setSelectedItem}
                          store={store}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>

      <footer className="ps-footer notranslate" translate="no">
        <p className="ps-powered-by">
          Powered by{" "}
          <a href="https://maitripos.com" target="_blank" rel="noreferrer">
            maitripos.com
          </a>
        </p>
      </footer>

      {selectedItem && (
        <div className="ps-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-grid">
              <div className="ps-modal-img">
                <img
                  src={selectedItem.image || store.logo || logo}
                  alt={selectedItem.name}
                />
                <button
                  className="ps-close-btn"
                  onClick={() => setSelectedItem(null)}
                >
                  &times;
                </button>
              </div>

              <div className="ps-modal-info">
                <div className="ps-modal-header">
                  <h3>{selectedItem.name}</h3>
                  <span className="ps-modal-price notranslate" translate="no">
                    ₹
                    {selectedItem.price ||
                      (selectedItem.variants?.length
                        ? Math.min(
                            ...selectedItem.variants.map((v) => v.price || 0),
                          )
                        : 0)}
                  </span>
                </div>

                <p className="ps-modal-desc">
                  {selectedItem.description || "No description available."}
                </p>

                {selectedItem.variants?.length > 0 && (
                  <div className="ps-var-list">
                    <label>Available Options</label>
                    {selectedItem.variants.map((v) => (
                      <div key={v._id} className="ps-var-row">
                        <span>{v.name}</span>
                        <b className="notranslate" translate="no">
                          ₹{v.price}
                        </b>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="ps-done-btn"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = memo(({ item, onOpen, store }) => {
  const price =
    item.price ||
    (item.variants?.length
      ? Math.min(...item.variants.map((v) => v.price || 0))
      : 0);

  return (
    <div
      className={`ps-card ${!item.isAvailable ? "ps-oos" : ""}`}
      onClick={() => onOpen(item)}
    >
      <div className="ps-card-img">
        <img
          src={item.image || store.logo || logo}
          alt={item.name}
          loading="lazy"
        />
      </div>
      <div className="ps-card-body">
        <h4>{item.name}</h4>
        <div className="ps-card-foot">
          <span className="ps-price notranslate" translate="no">
            ₹{price}
            {item.variants?.length > 0 ? " onwards" : ""}
          </span>
        </div>
      </div>
    </div>
  );
});

export default PublicStore;
