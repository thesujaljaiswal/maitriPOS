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

  /**
   * ✅ Language list:
   * - Force English to exist
   * - Pin English at top so browser never picks Abkhaz as "first option"
   * - Keep rest alphabetical
   */
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
        })
      );

    return [en, ...rest];
  }, []);

  const allowedLangCodes = useMemo(() => {
    return new Set(langsFinal.map((l) => l.code));
  }, [langsFinal]);

  // ✅ Always start in English (do NOT read old storage)
  const [lang, setLang] = useState("en");

  // ✅ Never allow invalid value (prevents <select> fallback to 1st option)
  useEffect(() => {
    if (!allowedLangCodes.has(lang)) setLang("en");
  }, [lang, allowedLangCodes]);

  /**
   * ✅ Domain helper:
   * If you are on store.maitripos.com, cookie might be set on:
   * - store.maitripos.com
   * - .maitripos.com   (root domain)
   * We clear/set both.
   */
  const getCookieDomains = useCallback(() => {
    const host = window.location.hostname; // e.g. store.maitripos.com
    const parts = host.split(".").filter(Boolean);

    // root domain guess: last 2 parts (maitripos.com)
    let root = host;
    if (parts.length >= 2) root = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;

    const domains = new Set();
    domains.add(host);
    domains.add(`.${host}`); // sometimes used
    domains.add(root);
    domains.add(`.${root}`); // IMPORTANT for subdomain sites

    return Array.from(domains);
  }, []);

  /**
   * ✅ Anti auto-translate signals (Chrome + Google)
   * We inject meta + html attrs to discourage auto translation.
   */
  const setNoAutoTranslateSignals = useCallback(() => {
    try {
      // HTML signals
      document.documentElement.lang = "en";
      document.documentElement.setAttribute("translate", "no");
      document.documentElement.classList.add("notranslate");

      // META: <meta name="google" content="notranslate" />
      if (!document.querySelector('meta[name="google"][content="notranslate"]')) {
        const m = document.createElement("meta");
        m.name = "google";
        m.content = "notranslate";
        document.head.appendChild(m);
      }

      // META: Content-Language (extra hint)
      if (!document.querySelector('meta[http-equiv="Content-Language"]')) {
        const m2 = document.createElement("meta");
        m2.setAttribute("http-equiv", "Content-Language");
        m2.setAttribute("content", "en");
        document.head.appendChild(m2);
      }
    } catch (e) {}
  }, []);

  /**
   * ✅ Hard reset of Google Translate cookie
   * Clears all variants + forces /en/en
   */
  const hardResetGoogTransToEnglish = useCallback(() => {
    try {
      const domains = getCookieDomains();

      // Clear old cookie variants
      const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
      const baseClear = `googtrans=; ${expire}; path=/`;

      // Clear for no-domain (current)
      document.cookie = baseClear;

      // Clear for domain variants
      domains.forEach((d) => {
        document.cookie = `${baseClear}; domain=${d}`;
      });

      // Force English cookie (current + domains)
      const setBase = "googtrans=/en/en; path=/";
      document.cookie = setBase;
      domains.forEach((d) => {
        document.cookie = `${setBase}; domain=${d}`;
      });
    } catch (e) {}
  }, [getCookieDomains]);

  /**
   * ✅ Robust translate trigger:
   * waits for goog-te-combo to exist; retries
   */
  const applyGoogleLang = useCallback((code, tries = 0) => {
    try {
      const combo = document.querySelector(".goog-te-combo");
      if (!combo) {
        if (tries < 30) setTimeout(() => applyGoogleLang(code, tries + 1), 150);
        return;
      }
      combo.value = code;
      combo.dispatchEvent(new Event("change"));
    } catch (e) {}
  }, []);

  /**
   * ✅ MOST IMPORTANT TIMING FIX:
   * useLayoutEffect runs earlier than useEffect (before paint)
   * so we can set meta/html + reset cookie ASAP.
   */
  useLayoutEffect(() => {
    setNoAutoTranslateSignals();
    hardResetGoogTransToEnglish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ✅ Load Google widget ONCE.
   * After it loads, force English.
   */
  useEffect(() => {
    // If script already exists (SPA navigation), just force English
    if (document.getElementById("google-translate-script")) {
      hardResetGoogTransToEnglish();
      applyGoogleLang("en");
      return;
    }

    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-undef
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );

      // Force English after init
      hardResetGoogTransToEnglish();
      applyGoogleLang("en");
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }, [applyGoogleLang, hardResetGoogTransToEnglish]);

  /**
   * ✅ Your original fetch logic (unchanged UI behavior)
   */
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

  /**
   * ✅ When content loads, apply selected language again
   * (fixes “sometimes translation doesn’t apply”)
   */
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
    const safe = allowedLangCodes.has(code) ? code : "en";
    setLang(safe);

    // If user chooses English, hard reset cookie too
    if (safe === "en") hardResetGoogTransToEnglish();

    applyGoogleLang(safe);
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
          {/* Language dropdown (NOT translatable) */}
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