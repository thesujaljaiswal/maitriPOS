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
  const [lang, setLang] = useState("en");

  const langsFinal = useMemo(() => {
    const list = Array.isArray(LANGS) ? [...LANGS] : [];
    const hasEn = list.some((l) => l?.code === "en");
    if (!hasEn) list.push({ code: "en", label: "English" });
    const en = list.find((l) => l?.code === "en");
    const rest = list
      .filter((l) => l?.code && l.code !== "en")
      .sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    return [en, ...rest];
  }, []);

  const getCookieDomains = useCallback(() => {
    const host = window.location.hostname;
    const parts = host.split(".");
    const domains = [host];
    if (parts.length >= 2) {
      const root = parts.slice(-2).join(".");
      domains.push(root, `.${root}`);
    }
    return domains;
  }, []);

  // FORCE CLEAR function to stop the "Abkhaz" or old cookie from returning
  const clearTranslateCookies = useCallback(() => {
    const domains = getCookieDomains();
    domains.forEach((d) => {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    sessionStorage.removeItem("googtrans");
    localStorage.removeItem("googtrans");
  }, [getCookieDomains]);

  const setTranslateCookie = useCallback((code) => {
    clearTranslateCookies(); // Clear old ones first
    if (code === "en") return; // English doesn't need a cookie

    const domains = getCookieDomains();
    const cookieValue = `googtrans=/en/${code}`;
    domains.forEach((d) => {
      document.cookie = `${cookieValue}; path=/; domain=${d}`;
    });
    document.cookie = `${cookieValue}; path=/`;
  }, [getCookieDomains, clearTranslateCookies]);

  useLayoutEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  const applyGoogleLang = useCallback((code) => {
    try {
      setTranslateCookie(code);
      const combo = document.querySelector(".goog-te-combo");
      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
      } else {
        window.location.reload(); 
      }
    } catch (e) {}
  }, [setTranslateCookie]);

  useEffect(() => {
    // On fresh load, if no specific lang is set in state, nuke cookies to prevent auto-translate
    if (lang === "en") {
        clearTranslateCookies();
    }

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: langsFinal.map((l) => l.code).join(","),
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }
  }, [langsFinal, clearTranslateCookies]);

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`);
      if (!res.ok) throw new Error("Store not found");
      const data = await res.json();
      const store = data.data;
      setStoreData(store);
      
      if (store.categories?.length > 0) setActiveCategory(store.categories[0]._id);
      
      const initialSubCats = {};
      store.categories.forEach((cat) => {
        cat.subCategories?.forEach((sub) => { initialSubCats[sub._id] = true; });
      });
      setOpenSubCats(initialSubCats);
      document.title = store.store.name;
    } catch (err) {
      setError("Store not found");
    }
  }, [slug]);

  useEffect(() => { fetchStore(); }, [fetchStore]);

  const onChangeLang = (e) => {
    const code = e.target.value;
    setLang(code);
    applyGoogleLang(code);
  };

  const toggleAccordion = (id) => setOpenSubCats((p) => ({ ...p, [id]: !p[id] }));

  if (error) return <div className="ps-status"><h2>{error}</h2></div>;
  if (!storeData) return <div className="ps-status"><Oval color="#000" /></div>;

  const { store, categories } = storeData;

  return (
    <div className="ps-wrapper">
      <div id="google_translate_element" style={{ display: "none" }} />
      
      <header className="ps-hero">
        <div className="ps-hero-inner">
          <div className="ps-hero-top">
            <div className="ps-lang-wrap notranslate">
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
                <div className="ps-acc-head" onClick={() => toggleAccordion(sub._id)}>
                  <div>
                    <span className="ps-acc-name">{sub.name}</span>
                    <span className="ps-acc-count">{sub.items?.length} items</span>
                  </div>
                  <span className="ps-chevron">↓</span>
                </div>
                <div className="ps-acc-content">
                  <div className="ps-grid">
                    {sub.items?.map((item) => (
                      <ProductCard key={item._id} item={item} onOpen={setSelectedItem} store={store} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}
      </main>

      {selectedItem && (
        <div className="ps-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-grid">
              <div className="ps-modal-img">
                <img src={selectedItem.image} alt={selectedItem.name} />
                <button className="ps-close-btn" onClick={() => setSelectedItem(null)}>&times;</button>
              </div>
              <div className="ps-modal-info">
                <h3>{selectedItem.name}</h3>
                <span className="ps-modal-price notranslate">₹{selectedItem.price || 0}</span>
                <p>{selectedItem.description || "No description available."}</p>
                {selectedItem.variants?.length > 0 && (
                  <div className="ps-var-list">
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
      <div className="ps-card-img"><img src={item.image || store.logo} alt={item.name} loading="lazy" /></div>
      <div className="ps-card-body">
        <h4>{item.name}</h4>
        <span className="ps-price notranslate">₹{price}</span>
      </div>
    </div>
  );
});

export default PublicStore;
