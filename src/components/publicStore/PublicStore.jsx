import {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
  useMemo,
  useLayoutEffect,
} from "react";
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

  const langsFinal = useMemo(() => {
    const list = Array.isArray(LANGS) ? [...LANGS] : [];
    const hasEn = list.some((l) => l?.code === "en");
    if (!hasEn) list.push({ code: "en", label: "English" });
    const en = list.find((l) => l?.code === "en");
    const rest = list
      .filter((l) => l?.code && l.code !== "en")
      .sort((a, b) => (a.label || "").localeCompare(b.label || "", "en", { sensitivity: "base" }));
    return [en, ...rest];
  }, []);

  const allowedLangCodes = useMemo(() => new Set(langsFinal.map((l) => l.code)), [langsFinal]);

  // Helper to read current language from cookie
  const getLangFromCookie = useCallback(() => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match && match[1] && allowedLangCodes.has(match[1])) return match[1];
    return "en";
  }, [allowedLangCodes]);

  const [lang, setLang] = useState(getLangFromCookie());

  const getCookieDomains = useCallback(() => {
    const host = window.location.hostname;
    const parts = host.split(".").filter(Boolean);
    let root = host;
    if (parts.length >= 2) root = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    return [host, root, `.${root}`];
  }, []);

  const setSessionCookie = useCallback((code) => {
    try {
      const domains = getCookieDomains();
      const expirePast = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // Clear all existing variations first
      domains.forEach((d) => {
        document.cookie = `googtrans=; ${expirePast}; path=/; domain=${d}`;
      });
      document.cookie = `googtrans=; ${expirePast}; path=/`;
      // Set new Session Cookie (No expires/max-age means delete on tab close)
      document.cookie = `googtrans=/en/${code}; path=/`;
    } catch (e) {}
  }, [getCookieDomains]);

  const applyGoogleLang = useCallback((code, tries = 0) => {
    try {
      const combo = document.querySelector(".goog-te-combo");
      if (!combo) {
        if (tries < 30) setTimeout(() => applyGoogleLang(code, tries + 1), 150);
        return;
      }
      if (combo.value !== code) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
      }
    } catch (e) {}
  }, []);

  useLayoutEffect(() => {
    try {
      if (!document.querySelector('meta[name="google"][content="notranslate"]')) {
        const m = document.createElement("meta");
        m.name = "google";
        m.content = "notranslate";
        document.head.appendChild(m);
      }
      document.documentElement.lang = "en";
    } catch (e) {}
  }, []);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false, includedLanguages: Array.from(allowedLangCodes).join(',') },
        "google_translate_element"
      );
      applyGoogleLang(lang);
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }

    return () => {
      // Final cleanup when component unmounts
      const domains = getCookieDomains();
      const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
      domains.forEach((d) => { document.cookie = `googtrans=; ${expire}; path=/; domain=${d}`; });
      document.cookie = `googtrans=; ${expire}; path=/`;
    };
  }, [allowedLangCodes, getCookieDomains]);

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`);
      if (!res.ok) throw new Error("Store not found");
      const data = await res.json();
      setStoreData(data.data);
      if (data.data.categories?.length > 0) setActiveCategory(data.data.categories[0]._id);
      const initialSubCats = {};
      data.data.categories.forEach((cat) => {
        cat.subCategories?.forEach((sub) => { initialSubCats[sub._id] = true; });
      });
      setOpenSubCats(initialSubCats);
      document.title = data.data.store.name;
    } catch (err) { setError("Store not found"); }
  }, [slug]);

  useEffect(() => { fetchStore(); }, [fetchStore]);

  const onChangeLang = (e) => {
    const code = e.target.value;
    setLang(code);
    setSessionCookie(code);
    applyGoogleLang(code);
  };

  if (error) return <div className="ps-status"><h2>{error}</h2></div>;
  if (!storeData) return <div className="ps-status"><Oval color="#000" /></div>;

  const { store, categories } = storeData;

  return (
    <div className="ps-wrapper">
      <div id="google_translate_element" className="ps-gt-hidden" style={{ display: 'none' }} />
      <header className="ps-hero">
        <div className="ps-hero-inner">
          <div className="ps-hero-top">
            <div className="ps-lang-wrap notranslate" translate="no">
              <span className="ps-lang-chip">🌐 Language</span>
              <select className="ps-lang-select" value={lang} onChange={onChangeLang}>
                {langsFinal.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="ps-logo-wrap notranslate">
            <img src={store.logo || logo} alt="Logo" className="ps-logo" />
            <span className={`ps-badge ${store.isOnline ? "ps-on" : "ps-off"}`}>
              {store.isOnline ? "Accepting Orders" : "Closed"}
            </span>
          </div>
          <h1 className="ps-title">{store.name}</h1>
          <p className="ps-addr">{store.address}</p>
          <div className="ps-links notranslate">
            <a href={`tel:${store.contact.phone}`}>📞 {store.contact.phone}</a>
            <a href={`mailto:${store.contact.email}`}>✉️ Email Us</a>
          </div>
        </div>
      </header>

      <nav className="ps-nav notranslate">
        <div className="ps-nav-scroll">
          {categories.map((c) => (
            <button
              key={c._id}
              className={`ps-pill ${activeCategory === c._id ? "ps-pill-active" : ""}`}
              onClick={() => {
                setActiveCategory(c._id);
                const el = categoryRefs.current[c._id];
                if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="ps-main">
        {categories.map((cat) => (
          <section key={cat._id} ref={(el) => (categoryRefs.current[cat._id] = el)} className="ps-section">
            <h2 className="ps-sec-title">{cat.name}</h2>
            {cat.subCategories?.map((sub) => (
              <div key={sub._id} className={`ps-acc ${openSubCats[sub._id] ? "ps-open" : ""}`}>
                <div className="ps-acc-head" onClick={() => setOpenSubCats(p => ({...p, [sub._id]: !p[sub._id]}))}>
                  <div>
                    <span className="ps-acc-name">{sub.name}</span>
                    <span className="ps-acc-count">{sub.items?.length} items</span>
                  </div>
                  <span className="ps-chevron">↓</span>
                </div>
                <div className="ps-acc-content">
                  <div className="ps-acc-inner">
                    <div className="ps-grid">
                      {sub.items?.map((item) => (
                        <ProductCard key={item._id} item={item} onOpen={setSelectedItem} store={store} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>

      <footer className="ps-footer notranslate">
        <p className="ps-powered-by">
          Powered by <a href="https://maitripos.com" target="_blank" rel="noreferrer">maitriPOS.com</a>
        </p>
      </footer>

      {selectedItem && (
        <div className="ps-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-grid">
              <div className="ps-modal-img">
                <img src={selectedItem.image} alt={selectedItem.name} />
                <button className="ps-close-btn" onClick={() => setSelectedItem(null)}>&times;</button>
              </div>
              <div className="ps-modal-info">
                <div className="ps-modal-header">
                  <h3>{selectedItem.name}</h3>
                  <span className="ps-modal-price notranslate">
                    ₹{selectedItem.price || Math.min(...selectedItem.variants.map((v) => v.price))}
                  </span>
                </div>
                <p className="ps-modal-desc">{selectedItem.description || "No description available."}</p>
                {selectedItem.variants?.length > 0 && (
                  <div className="ps-var-list">
                    <label>Available Options</label>
                    {selectedItem.variants.map((v) => (
                      <div key={v._id} className="ps-var-row">
                        <span>{v.name}</span>
                        <b className="notranslate">₹{v.price}</b>
                      </div>
                    ))}
                  </div>
                )}
                <button className="ps-done-btn" onClick={() => setSelectedItem(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = memo(({ item, onOpen, store }) => {
  const price = item.price || (item.variants?.length ? Math.min(...item.variants.map((v) => v.price)) : 0);
  return (
    <div className={`ps-card ${!item.isAvailable ? "ps-oos" : ""}`} onClick={() => onOpen(item)}>
      <div className="ps-card-img">
        <img src={item.image || store.logo} alt={item.name} loading="lazy" />
      </div>
      <div className="ps-card-body">
        <h4>{item.name}</h4>
        <div className="ps-card-foot">
          <span className="ps-price notranslate">
            ₹{price}{item.variants?.length > 0 ? " onwards" : ""}
          </span>
        </div>
      </div>
    </div>
  );
});

export default PublicStore;