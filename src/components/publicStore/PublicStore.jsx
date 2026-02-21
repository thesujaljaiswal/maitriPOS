import { useEffect, useState, useRef, useCallback, memo, useMemo } from "react";
import logo from "../../assets/maitriPOS ICON 2.jpg";
import "./style.css";
import { Oval } from "react-loader-spinner";
import LANGS from "./language.json";

const PublicStore = ({ slug }) => {
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSubCats, setOpenSubCats] = useState({});
  const categoryRefs = useRef({});

  /**
   * ✅ Build safe language list:
   * - Ensure "en" exists
   * - Keep English pinned at the top
   * - Rest alphabetical
   */
  const langsFinal = useMemo(() => {
    const list = Array.isArray(LANGS) ? [...LANGS] : [];

    const hasEn = list.some((l) => l?.code === "en");
    if (!hasEn) list.push({ code: "en", label: "English" });

    const en = list.find((l) => l?.code === "en") || { code: "en", label: "English" };
    const rest = list
      .filter((l) => l?.code && l.code !== "en")
      .sort((a, b) =>
        (a.label || "").localeCompare(b.label || "", "en", { sensitivity: "base" })
      );

    return [en, ...rest];
  }, []);

  const allowedLangCodes = useMemo(() => {
    return new Set(langsFinal.map((l) => l.code));
  }, [langsFinal]);

  // ✅ ALWAYS start in English (never read old localStorage)
  const [lang, setLang] = useState("en");

  // ✅ If lang ever becomes invalid, force back to English (prevents first-option fallback)
  useEffect(() => {
    if (!allowedLangCodes.has(lang)) setLang("en");
  }, [lang, allowedLangCodes]);

  /* =========================
     Google Translate HARD RESET
     ========================= */
  const resetGoogTransToEnglish = useCallback(() => {
    try {
      const host = window.location.hostname;

      // Remove any previous language cookie (both cookie variants)
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie =
        `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${host}`;

      // Force English as default
      document.cookie = "googtrans=/en/en; path=/";
      document.cookie = `googtrans=/en/en; path=/; domain=${host}`;
    } catch (e) {}
  }, []);

  // ✅ Robust apply (waits for widget select to exist)
  const applyGoogleLang = useCallback((code, tries = 0) => {
    try {
      const combo = document.querySelector(".goog-te-combo");
      if (!combo) {
        if (tries < 25) setTimeout(() => applyGoogleLang(code, tries + 1), 200);
        return;
      }

      combo.value = code;
      combo.dispatchEvent(new Event("change"));
    } catch (e) {}
  }, []);

  // ✅ Load translate script once; always reset to English on mount
  useEffect(() => {
    resetGoogTransToEnglish();

    // If already loaded (SPA), just force English once
    if (document.getElementById("google-translate-script")) {
      applyGoogleLang("en");
      return;
    }

    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-undef
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );

      // Always begin as English
      applyGoogleLang("en");
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }, [applyGoogleLang, resetGoogTransToEnglish]);

  /* =========================
     Your original fetch logic (unchanged)
     ========================= */
  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`
      );
      if (!res.ok) throw new Error("Store not found");
      const data = await res.json();
      const store = data.data;

      setStoreData(store);

      if (store.categories?.length > 0)
        setActiveCategory(store.categories[0]._id);

      const initialSubCats = {};
      store.categories.forEach((cat) => {
        cat.subCategories?.forEach((sub) => {
          initialSubCats[sub._id] = true;
        });
      });
      setOpenSubCats(initialSubCats);

      // Update Page Title
      document.title = store.store.name;

      // Update Favicon
      const logoUrl = store.store.logo;
      if (logoUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = logoUrl;
      }
    } catch (err) {
      setError("Store not found");
    }
  }, [slug]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  // ✅ After content loads, apply current lang (fixes “sometimes doesn’t work”)
  useEffect(() => {
    if (!storeData) return;
    applyGoogleLang(lang);
  }, [storeData, lang, applyGoogleLang]);

  const toggleAccordion = (id) =>
    setOpenSubCats((p) => ({ ...p, [id]: !p[id] }));

  const scrollToCat = (id) => {
    setActiveCategory(id);
    const el = categoryRefs.current[id];
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  const onChangeLang = (e) => {
    const code = e.target.value;

    // Safety: if somehow invalid, force English
    const safeCode = allowedLangCodes.has(code) ? code : "en";

    setLang(safeCode);

    // If English selected, hard reset cookie too
    if (safeCode === "en") resetGoogTransToEnglish();

    applyGoogleLang(safeCode);
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
      {/* Google translate mount point (hidden) */}
      <div id="google_translate_element" className="ps-gt-hidden" />

      <header className="ps-hero">
        <div className="ps-hero-inner">
          {/* ✅ Language dropdown (NOT translatable) */}
          <div className="ps-hero-top">
            <div className="ps-lang-wrap notranslate" translate="no">
              <span className="ps-lang-chip notranslate" translate="no">
                🌐 Language
              </span>

              <select
                className="ps-lang-select notranslate"
                translate="no"
                value={lang}
                onChange={onChangeLang}
                aria-label="Select language"
              >
                {langsFinal.map((l) => (
                  <option
                    key={l.code}
                    value={l.code}
                    className="notranslate"
                    translate="no"
                  >
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ps-logo-wrap">
            <img src={store.logo || logo} alt="Logo" className="ps-logo" />
            <span className={`ps-badge ${store.isOnline ? "ps-on" : "ps-off"}`}>
              {store.isOnline ? "Accepting Orders" : "Closed"}
            </span>
          </div>

          <h1 className="ps-title">{store.name}</h1>
          <p className="ps-addr">{store.address}</p>

          <div className="ps-links">
            <a href={`tel:${store.contact.phone}`}>📞 {store.contact.phone}</a>
            <a href={`mailto:${store.contact.email}`}>✉️ Email Us</a>
          </div>
        </div>
      </header>

      <nav className="ps-nav">
        <div className="ps-nav-scroll">
          {categories.map((c) => (
            <button
              key={c._id}
              className={`ps-pill ${
                activeCategory === c._id ? "ps-pill-active" : ""
              }`}
              onClick={() => scrollToCat(c._id)}
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
                  onClick={() => toggleAccordion(sub._id)}
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

      <footer className="ps-footer">
        <p className="ps-powered-by">
          Powered by{" "}
          <a href="https://maitripos.com" target="_blank" rel="noreferrer">
            maitriPOS.com
          </a>
        </p>
      </footer>

      {selectedItem && (
        <div className="ps-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-grid">
              <div className="ps-modal-img">
                <img src={selectedItem.image} alt={selectedItem.name} />
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
                  <span className="ps-modal-price">
                    ₹
                    {selectedItem.price ||
                      Math.min(...selectedItem.variants.map((v) => v.price))}
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
                        <b>₹{v.price}</b>
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
      ? Math.min(...item.variants.map((v) => v.price))
      : 0);
  return (
    <div
      className={`ps-card ${!item.isAvailable ? "ps-oos" : ""}`}
      onClick={() => onOpen(item)}
    >
      <div className="ps-card-img">
        <img src={item.image || store.logo} alt={item.name} loading="lazy" />
      </div>
      <div className="ps-card-body">
        <h4>{item.name}</h4>
        <div className="ps-card-foot">
          <span className="ps-price">
            ₹{price}
            {item.variants?.length > 0 ? " onwards" : ""}
          </span>
          {/* <div className="ps-add">+</div> */}
        </div>
      </div>
    </div>
  );
});

export default PublicStore;