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

  /* =============================
     FORCE GOOGLE TRANSLATE RESET
     ============================= */
  const forceEnglish = () => {
    const host = window.location.hostname;

    // clear previous cookie
    document.cookie =
      "googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie =
      `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${host}`;

    // set to english
    document.cookie = "googtrans=/en/en;path=/";
    document.cookie = `googtrans=/en/en;path=/;domain=${host}`;
  };

  /* =============================
     GOOGLE TRANSLATE TRIGGER
     ============================= */
  const applyGoogleLang = useCallback((code, tries = 0) => {
    const combo = document.querySelector(".goog-te-combo");

    if (!combo) {
      if (tries < 20) setTimeout(() => applyGoogleLang(code, tries + 1), 200);
      return;
    }

    combo.value = code;
    combo.dispatchEvent(new Event("change"));
  }, []);

  /* =============================
     LOAD GOOGLE SCRIPT
     ============================= */
  useEffect(() => {
    forceEnglish(); // ⭐ ALWAYS RESET COOKIE ON LOAD

    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );

      applyGoogleLang("en"); // ⭐ FORCE ENGLISH
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);
  }, [applyGoogleLang]);

  /* =============================
     FETCH STORE DATA
     ============================= */
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

  /* =============================
     UI HANDLERS
     ============================= */
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

  /* =============================
     STATES
     ============================= */
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

  /* =============================
     JSX
     ============================= */
  return (
    <div className="ps-wrapper">
      <div id="google_translate_element" className="ps-gt-hidden" />

      {/* HEADER */}
      <header className="ps-hero">
        <div className="ps-hero-inner">
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
                  <span className="ps-acc-name">{sub.name}</span>
                </div>

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
            ))}
          </section>
        ))}
      </main>
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
    <div className="ps-card" onClick={() => onOpen(item)}>
      <img src={item.image || store.logo} alt={item.name} />
      <h4>{item.name}</h4>
      <span>₹{price}</span>
    </div>
  );
});

export default PublicStore;