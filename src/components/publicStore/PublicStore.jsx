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

  // 1. CLEARS ALL GOOGLE CACHE
  const clearGoogleCache = useCallback(() => {
    try {
      const domains = [
        window.location.hostname,
        `.${window.location.hostname.split(".").slice(-2).join(".")}`,
      ];
      
      domains.forEach((d) => {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
        document.cookie = `googtrans=/en/en; path=/; domain=${d}`;
      });
      
      document.cookie = "googtrans=/en/en; path=/";
      localStorage.removeItem("googtrans");
      sessionStorage.removeItem("googtrans");
    } catch (e) {
      console.error("Cache clear failed", e);
    }
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = "en";
    // This attribute specifically tells Google Translate NOT to offer translation
    document.documentElement.setAttribute("class", "notranslate");
  }, []);

  const applyGoogleLang = useCallback((code) => {
    try {
      const combo = document.querySelector(".goog-te-combo");
      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    clearGoogleCache();

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en", 
          // 2. Force ONLY your languages to prevent random defaults
          includedLanguages: langsFinal.map(l => l.code).join(','),
          layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
          autoDisplay: false,
          multilanguagePage: false // Important: Tells Google the page is one language
        },
        "google_translate_element"
      );
      
      // Force set to English after a short delay
      setTimeout(() => applyGoogleLang("en"), 1000);
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }
  }, [clearGoogleCache, applyGoogleLang, langsFinal]);

  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`);
      if (!res.ok) throw new Error("Store not found");
      const data = await res.json();
      setStoreData(data.data);
      if (data.data.categories?.length > 0) setActiveCategory(data.data.categories[0]._id);
      document.title = data.data.store.name;
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

  if (error) return <div className="ps-status"><h2>{error}</h2></div>;
  if (!storeData) return <div className="ps-status"><Oval color="#000" /></div>;

  const { store, categories } = storeData;

  return (
    <div className="ps-wrapper">
      {/* Hide the actual widget but keep it in DOM */}
      <div id="google_translate_element" style={{ visibility: "hidden", position: "absolute", top: "-9999px" }} />
      
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
          <div className="ps-logo-wrap">
            <img src={store.logo || logo} alt="Logo" className="ps-logo" />
            <span className={`ps-badge ${store.isOnline ? "ps-on" : "ps-off"}`}>
              {store.isOnline ? "Accepting Orders" : "Closed"}
            </span>
          </div>
          <h1 className="ps-title">{store.name}</h1>
          <p className="ps-addr">{store.address}</p>
        </div>
      </header>

      <nav className="ps-nav">
        <div className="ps-nav-scroll">
          {categories.map((c) => (
            <button
              key={c._id}
              className={`ps-pill ${activeCategory === c._id ? "ps-pill-active" : ""}`}
              onClick={() => {
                setActiveCategory(c._id);
                window.scrollTo({ top: categoryRefs.current[c._id].offsetTop - 80, behavior: "smooth" });
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
              <div key={sub._id} className="ps-acc ps-open">
                <div className="ps-acc-head">
                  <span className="ps-acc-name">{sub.name}</span>
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
    </div>
  );
};

const ProductCard = memo(({ item, onOpen, store }) => {
  const price = item.price || (item.variants?.length ? Math.min(...item.variants.map((v) => v.price)) : 0);
  return (
    <div className={`ps-card ${!item.isAvailable ? "ps-oos" : ""}`} onClick={() => onOpen(item)}>
      <div className="ps-card-img"><img src={item.image || store.logo} alt={item.name} /></div>
      <div className="ps-card-body">
        <h4>{item.name}</h4>
        <span className="ps-price">₹{price}</span>
      </div>
    </div>
  );
});

export default PublicStore;