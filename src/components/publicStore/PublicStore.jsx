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

  const [lang, setLang] = useState("en");

  const sortedLangs = useMemo(() => {
    return [...LANGS].sort((a, b) =>
      a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    );
  }, []);

  /* =======================
     FIX GOOGLE COOKIE ISSUE
     ======================= */
  const resetTranslateCookie = () => {
    const host = window.location.hostname;

    document.cookie =
      "googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie =
      `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${host}`;

    document.cookie = "googtrans=/en/en;path=/";
    document.cookie = `googtrans=/en/en;path=/;domain=${host}`;
  };

  const applyGoogleLang = useCallback((code, tries = 0) => {
    const combo = document.querySelector(".goog-te-combo");

    if (!combo) {
      if (tries < 20) setTimeout(() => applyGoogleLang(code, tries + 1), 200);
      return;
    }

    combo.value = code;
    combo.dispatchEvent(new Event("change"));
  }, []);

  /* LOAD TRANSLATE SCRIPT */
  useEffect(() => {
    resetTranslateCookie();

    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
      applyGoogleLang("en");
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }, [applyGoogleLang]);

  /* =======================
     FETCH STORE DATA
     ======================= */
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

      document.title = store.store.name;
    } catch {
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

  const onChangeLang = (e) => {
    const code = e.target.value;
    setLang(code);
    applyGoogleLang(code);
  };

  /* =======================
     LOADING STATES
     ======================= */
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
      <div id="google_translate_element" className="ps-gt-hidden" />

      {/* HEADER */}
      <header className="ps-hero">
        <div className="ps-hero-inner">
          {/* LANGUAGE SELECTOR */}
          <div className="ps-hero-top">
            <div className="ps-lang-wrap notranslate" translate="no">
              <span className="ps-lang-chip">🌐 Language</span>

              <select
                className="ps-lang-select notranslate"
                translate="no"
                value={lang}
                onChange={onChangeLang}
              >
                {sortedLangs.map((l) => (
                  <option key={l.code} value={l.code}>
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
        </div>
      </header>

      {/* NAV */}
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

      {/* MAIN */}
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
            ))}
          </section>
        ))}
      </main>

      {/* MODAL */}
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
                  ×
                </button>
              </div>

              <div className="ps-modal-info">
                <h3>{selectedItem.name}</h3>
                <p>{selectedItem.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* PRODUCT CARD */
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
        <img src={item.image || store.logo} alt={item.name} />
      </div>

      <div className="ps-card-body">
        <h4>{item.name}</h4>
        <span className="ps-price">₹{price}</span>
      </div>
    </div>
  );
});

export default PublicStore;