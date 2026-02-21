import { useEffect, useState, useRef, useCallback, memo } from "react";
import logo from "../../assets/maitriPOS ICON 2.jpg";
import "./style.css";
import { Oval } from "react-loader-spinner";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "pa", label: "Punjabi" },
  { code: "ur", label: "Urdu" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
];

const PublicStore = ({ slug }) => {
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSubCats, setOpenSubCats] = useState({});
  const categoryRefs = useRef({});

  // ✅ Language state
  const [lang, setLang] = useState(() => localStorage.getItem("ps_lang") || "en");

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`,
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

  const toggleAccordion = (id) =>
    setOpenSubCats((p) => ({ ...p, [id]: !p[id] }));

  const scrollToCat = (id) => {
    setActiveCategory(id);
    const el = categoryRefs.current[id];
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  // ✅ Inject Google Translate once
  useEffect(() => {
    // If already loaded, skip
    if (document.getElementById("google-translate-script")) return;

    // Init function must be on window for Google callback
    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-undef
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
        },
        "google_translate_element"
      );

      // Apply saved language (after widget is ready)
      setTimeout(() => {
        applyGoogleLang(localStorage.getItem("ps_lang") || "en");
      }, 500);
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }, []);

  // ✅ helper to trigger translation
  const applyGoogleLang = (code) => {
    try {
      // Google creates a hidden select with class "goog-te-combo"
      const combo = document.querySelector(".goog-te-combo");
      if (!combo) return;

      combo.value = code;
      combo.dispatchEvent(new Event("change"));
    } catch (e) {}
  };

  const onChangeLang = (e) => {
    const code = e.target.value;
    setLang(code);
    localStorage.setItem("ps_lang", code);
    applyGoogleLang(code);
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
      {/* ✅ Google translate mount point (hidden) */}
      <div id="google_translate_element" style={{ display: "none" }} />

      <header className="ps-hero">
        <div className="ps-hero-inner">
          <div className="ps-logo-wrap">
            <img src={store.logo || logo} alt="Logo" className="ps-logo" />
            <span className={`ps-badge ${store.isOnline ? "ps-on" : "ps-off"}`}>
              {store.isOnline ? "Accepting Orders" : "Closed"}
            </span>
          </div>

          {/* ✅ Language dropdown (visible) */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <select
              value={lang}
              onChange={onChangeLang}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                fontSize: "14px",
                background: "#fff",
              }}
              aria-label="Select language"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
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
        </div>
      </div>
    </div>
  );
});

export default PublicStore;