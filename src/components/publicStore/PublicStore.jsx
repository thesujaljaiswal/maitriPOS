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

const GT_SCRIPT_ID = "google-translate-script";
const GT_ELEM_ID = "google_translate_element";
const LANG_COOKIE = "mt_lang";
const GT_COOKIE = "googtrans";

const PublicStore = ({ slug }) => {
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSubCats, setOpenSubCats] = useState({});
  const categoryRefs = useRef({});

  // --- Languages (English always present + first) ---
  const langsFinal = useMemo(() => {
    const list = Array.isArray(LANGS) ? [...LANGS] : [];
    if (!list.some((l) => l?.code === "en"))
      list.push({ code: "en", label: "English" });

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

  // IMPORTANT: exclude "en" from includedLanguages (prevents weird defaults)
  const includedLanguages = useMemo(() => {
    return langsFinal
      .map((l) => l.code)
      .filter((c) => c && c !== "en")
      .join(",");
  }, [langsFinal]);

  // --- Cookie helpers (set/clear across domain variants) ---
  const getCookieDomains = useCallback(() => {
    const host = window.location.hostname;
    const parts = host.split(".").filter(Boolean);
    if (host === "localhost" || parts.length < 2) return [null];

    const root = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    return [host, `.${root}`, root, null];
  }, []);

  const readCookie = useCallback((name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  }, []);

  const setCookieEverywhere = useCallback(
    (name, value, days = 365) => {
      const maxAge = days * 24 * 60 * 60;
      const base = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
      const domains = getCookieDomains();

      domains.forEach((d) => {
        if (d) document.cookie = `${base}; domain=${d}`;
        else document.cookie = base;
      });
    },
    [getCookieDomains],
  );

  const clearCookieEverywhere = useCallback(
    (name) => {
      const domains = getCookieDomains();
      const expire = `expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=lax`;
      domains.forEach((d) => {
        if (d) document.cookie = `${name}=; ${expire}; domain=${d}`;
        else document.cookie = `${name}=; ${expire}`;
      });
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    },
    [getCookieDomains],
  );

  // --- FULL RESET (used when switching back to English) ---
  const hardResetToEnglish = useCallback(() => {
    try {
      clearCookieEverywhere(GT_COOKIE);
      setCookieEverywhere(GT_COOKIE, "/en/en");

      document.documentElement.classList.remove("translated-ltr");
      document.documentElement.classList.remove("translated-rtl");

      const banner = document.querySelector(".goog-te-banner-frame");
      if (banner) banner.remove();

      if (document.body) document.body.style.top = "0px";
    } catch (e) {}
  }, [clearCookieEverywhere, setCookieEverywhere]);

  // --- Apply lang to GT widget when combo exists ---
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

  // ✅ Source of truth (stable): mt_lang only
  const [lang, setLang] = useState("en");
  const [gtReady, setGtReady] = useState(false);

  // --- Lazy loader: only loads GT when needed ---
  const ensureGoogleTranslateLoaded = useCallback(() => {
    return new Promise((resolve) => {
      // If already initialized, resolve immediately
      if (
        window.google?.translate?.TranslateElement &&
        window.__GT_INITIALIZED__
      ) {
        setGtReady(true);
        resolve(true);
        return;
      }

      // define init callback once
      window.googleTranslateElementInit = () => {
        try {
          if (window.__GT_INITIALIZED__) {
            setGtReady(true);
            resolve(true);
            return;
          }
          window.__GT_INITIALIZED__ = true;

          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              autoDisplay: false,
              includedLanguages, // <-- excludes "en"
            },
            GT_ELEM_ID,
          );

          setGtReady(true);
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      };

      // inject script once
      if (!document.getElementById(GT_SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = GT_SCRIPT_ID;
        script.src =
          "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      } else {
        // script exists, wait for window.google
        const t = setInterval(() => {
          if (window.google?.translate?.TranslateElement) {
            clearInterval(t);
            window.googleTranslateElementInit();
          }
        }, 200);
        setTimeout(() => {
          clearInterval(t);
          resolve(false);
        }, 8000);
      }
    });
  }, [includedLanguages]);

  // Read saved language on mount
  useEffect(() => {
    const saved = readCookie(LANG_COOKIE);
    const next = saved && allowedLangCodes.has(saved) ? saved : "en";
    setLang(next);

    // If english, force clean english and DO NOT load google translate
    if (next === "en") {
      hardResetToEnglish();
    } else {
      // if non-english saved, load and apply
      ensureGoogleTranslateLoaded().then(() => {
        setCookieEverywhere(GT_COOKIE, `/en/${next}`);
        applyGoogleLang(next);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedLangCodes]);

  // Persist + apply on user change
  useEffect(() => {
    setCookieEverywhere(LANG_COOKIE, lang);

    if (lang === "en") {
      hardResetToEnglish();

      // If page was already translated, safest is reload to fully restore DOM
      const wasTranslated =
        document.documentElement.classList.contains("translated-ltr") ||
        document.documentElement.classList.contains("translated-rtl");
      if (wasTranslated) {
        window.location.reload();
      }
      return;
    }

    // only NOW load GT (prevents auto-setting /en/af on first load)
    ensureGoogleTranslateLoaded().then(() => {
      setCookieEverywhere(GT_COOKIE, `/en/${lang}`);
      applyGoogleLang(lang);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ✅ favicon as store logo
  const setFavicon = useCallback((href) => {
    try {
      if (!href) return;

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

  if (error) {
    return (
      <div className="ps-status">
        <h2>{error}</h2>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="ps-status">
        <Oval color="#000" />
      </div>
    );
  }

  const { store, categories } = storeData;

  return (
    <div className="ps-wrapper">
      {/* GT mount point (hidden) */}
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
              className={`ps-pill ${activeCategory === c._id ? "ps-pill-active" : ""}`}
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
