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

  const setTranslateCookie = useCallback((code) => {
    const domains = getCookieDomains();
    // The format MUST be /en/TARGET_CODE
    const cookieValue = `googtrans=/en/${code}`;
    domains.forEach((d) => {
      document.cookie = `${cookieValue}; path=/; domain=${d}`;
    });
    document.cookie = `${cookieValue}; path=/`;
  }, [getCookieDomains]);

  useLayoutEffect(() => {
    document.documentElement.lang = "en";
    // Remove global notranslate so the engine can actually work
    document.documentElement.classList.remove("notranslate");
  }, []);

  const applyGoogleLang = useCallback((code) => {
    try {
      setTranslateCookie(code);
      const combo = document.querySelector(".goog-te-combo");
      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
      } else {
        // If combo isn't ready, the cookie we set above will handle it on refresh/load
        window.location.reload(); 
      }
    } catch (e) {}
  }, [setTranslateCookie]);

  useEffect(() => {
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
  }, [langsFinal]);

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
      {/* Container must exist for the script to attach */}
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
        <span className="ps-price notranslate">₹{price}</span>
      </div>
    </div>
  );
});

export default PublicStore;