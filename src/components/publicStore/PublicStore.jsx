import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react";
import logoFallback from "../../assets/maitriPOS ICON 2.jpg";
import "./style.css";
import { Oval } from "react-loader-spinner";
import { getTheme } from "./theme";

const THEME = getTheme();

/* ────────────────────────────────────────────────────
   Inject all CSS variables + body theme-class
   Called once on mount — no flicker.
──────────────────────────────────────────────────── */
const applyTheme = () => {
  const r = document.documentElement;
  r.style.setProperty("--accent", THEME.accent);
  r.style.setProperty("--accent-dark", THEME.accentDark);
  r.style.setProperty("--page-bg", THEME.bg);
  r.style.setProperty("--card-bg", THEME.cardBg);
  r.style.setProperty("--card-border", THEME.cardBorder);
  r.style.setProperty("--tab-active-bg", THEME.tabActiveBg);
  r.style.setProperty("--tab-active-tx", THEME.tabActiveText);
  r.style.setProperty("--text-primary", THEME.textPrimary);
  r.style.setProperty("--text-secondary", THEME.textSecondary);
  r.style.setProperty("--header-bg", THEME.headerBg);
  r.style.setProperty("--search-bg", THEME.searchBg);

  // apply theme-class so CSS can do light/dark-specific rules
  document.body.classList.remove("theme-light", "theme-dark");
  if (THEME.themeClass) {
    document.body.classList.add(THEME.themeClass);
  }
};

/* ────────────────────────────────────────────────────
   Floating particle layer — emoji drifts down the page
──────────────────────────────────────────────────── */
const ParticleLayer = () => {
  const emoji = THEME.particles;
  const count = Math.min(THEME.particleCount || 0, 20);
  if (!emoji || count === 0) return null;

  // generate once — stable between renders
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${4 + Math.random() * 92}%`,
        size: `${14 + Math.random() * 14}px`,
        dur: `${7 + Math.random() * 9}s`,
        delay: `${Math.random() * 14}s`,
      })),
    [],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="particle-layer" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            fontSize: p.size,
            "--fall-dur": p.dur,
            "--fall-delay": p.delay,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────── */
const minPrice = (item) =>
  item.price ||
  (item.variants?.length ? Math.min(...item.variants.map((v) => v.price)) : 0);

const VegDot = () => (
  <span className="dot-veg" title="Vegetarian">
    <span className="dot-veg__circle" />
  </span>
);

/* ────────────────────────────────────────────────────
   Festival Banner
──────────────────────────────────────────────────── */
const FestivalBanner = () => {
  const b = THEME.banner;
  if (!b?.show) return null;
  return (
    <div className="fest-banner" style={{ background: b.bg }}>
      <span className="fest-banner__emoji">{b.emoji}</span>
      <div className="fest-banner__text">
        <strong style={{ color: b.textColor }}>{b.line1}</strong>
        <span style={{ color: b.subtextColor }}>{b.line2}</span>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   PRODUCT CARD
════════════════════════════════════════════════════ */
const ProductCard = memo(({ item, onOpen, index = 0 }) => {
  const isOOS = !item.isAvailable;
  const price = minPrice(item);
  const hasV = item.variants?.length > 0;

  return (
    <article
      className={`card card--enter${isOOS ? " card--oos" : ""}`}
      style={{ animationDelay: `${index * 0.055}s` }}
      onClick={() => !isOOS && onOpen(item)}
      role={!isOOS ? "button" : undefined}
      tabIndex={!isOOS ? 0 : undefined}
      onKeyDown={(e) => e.key === "Enter" && !isOOS && onOpen(item)}
    >
      {/* thumbnail */}
      <div className="card__thumb">
        <img
          src={item.image || logoFallback}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = logoFallback;
          }}
        />
        {isOOS && <div className="card__oos-film">Sold Out</div>}
        {item.tags?.[0] && !isOOS && (
          <span className="card__tag">#{item.tags[0].replace(/\s+/g, "")}</span>
        )}
      </div>

      {/* body */}
      <div className="card__body">
        <div className="card__dot-row">
          <VegDot />
        </div>
        <h4 className="card__name">{item.name}</h4>
        <div className="card__foot">
          <span className="card__price">
            ₹{price}
            {hasV && <small>+</small>}
          </span>
          {!isOOS ? (
            <button
              className="card__btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(item);
              }}
            >
              View
            </button>
          ) : (
            <span className="card__sold">Unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
});

/* ════════════════════════════════════════════════════
   ITEM DETAIL SHEET
════════════════════════════════════════════════════ */
const ItemSheet = ({ item, onClose }) => {
  const [sel, setSel] = useState(item.variants?.[0] || null);
  const price = sel?.price ?? item.price ?? null;

  /* lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="sheet-mask"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {/* drag handle (mobile only) */}
        <div className="sheet__handle" />

        {/* hero image */}
        <div className="sheet__hero">
          <img
            src={item.image || logoFallback}
            alt={item.name}
            onError={(e) => {
              e.target.src = logoFallback;
            }}
          />
          <button className="sheet__x" onClick={onClose} aria-label="Close">
            ✕
          </button>
          {!item.isAvailable && (
            <div className="sheet__oos-film">Currently Unavailable</div>
          )}
        </div>

        {/* content */}
        <div className="sheet__body">
          {/* title + price */}
          <div className="sheet__title-row">
            <div className="sheet__title-left">
              <VegDot />
              <h2 className="sheet__title">{item.name}</h2>
            </div>
            {price != null && <span className="sheet__price">₹{price}</span>}
          </div>

          <p className="sheet__desc">{item.description}</p>

          {/* tags */}
          {item.tags?.length > 0 && (
            <div className="sheet__tags">
              {item.tags.map((t, i) => (
                <span key={i} className="sheet__tag-pill">
                  #{t.replace(/\s+/g, "")}
                </span>
              ))}
            </div>
          )}

          {/* variants table */}
          {item.variants?.length > 0 && (
            <div className="sheet__variants">
              <p className="sheet__variants-label">Available sizes & prices</p>
              <table className="variant-table">
                <thead>
                  <tr>
                    <th>Size / Quantity</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {item.variants.map((v) => (
                    <tr
                      key={v._id}
                      className={
                        sel?._id === v._id ? "variant-table__row--active" : ""
                      }
                      onClick={() => setSel(v)}
                    >
                      <td className="variant-table__size">{v.name}</td>
                      <td className="variant-table__price">₹{v.price}</td>
                      <td className="variant-table__check">
                        {sel?._id === v._id && (
                          <span className="check-mark" key={v._id}>
                            ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CTA */}
          <button
            className="sheet__cta"
            onClick={onClose}
            disabled={!item.isAvailable}
          >
            {item.isAvailable
              ? `Got it${price != null ? ` — ₹${price}` : ""}`
              : "Currently Unavailable"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════ */
const PublicStore = ({ slug }) => {
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const categoryRefs = useRef({});

  /* apply theme + viewport meta on first mount */
  useEffect(() => {
    applyTheme();

    let vp = document.querySelector("meta[name='viewport']");
    if (!vp) {
      vp = document.createElement("meta");
      vp.name = "viewport";
      document.head.appendChild(vp);
    }
    vp.content = "width=device-width, initial-scale=1, viewport-fit=cover";

    return () => {
      document.body.classList.remove("theme-light", "theme-dark");
    };
  }, []);

  /* Escape key closes sheet */
  useEffect(() => {
    const h = (e) => e.key === "Escape" && setSelectedItem(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* scroll spy — update active tab */
  useEffect(() => {
    const onScroll = () => {
      const offset = window.innerWidth >= 768 ? 170 : 150;
      const y = window.scrollY + offset;
      let cur = null;
      Object.entries(categoryRefs.current).forEach(([id, el]) => {
        if (el && el.offsetTop <= y) cur = id;
      });
      if (cur) setActiveTab(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [storeData]);

  /* fetch */
  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`,
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setStoreData(json.data);
      if (json.data.categories?.length > 0)
        setActiveTab(json.data.categories[0]._id);
    } catch {
      setError("Store not found");
    }
  }, [slug]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  /* browser tab title + favicon */
  useEffect(() => {
    if (!storeData) return;
    const { store } = storeData;

    document.title = store.name ? `${store.name} — Menu` : "Menu";

    if (store.logo) {
      document
        .querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']")
        .forEach((el) => el.remove());

      const fav = document.createElement("link");
      fav.rel = "icon";
      fav.type = "image/png";
      fav.href = store.logo;
      document.head.appendChild(fav);

      const apple = document.createElement("link");
      apple.rel = "apple-touch-icon";
      apple.href = store.logo;
      document.head.appendChild(apple);
    }

    return () => {
      document.title = "MaitriPOS";
    };
  }, [storeData]);

  /* filtered categories for search */
  const filtered = useMemo(() => {
    if (!storeData) return [];
    if (!searchQuery) return storeData.categories;
    const q = searchQuery.toLowerCase();
    return storeData.categories
      .map((cat) => ({
        ...cat,
        subCategories: cat.subCategories
          .map((sub) => ({
            ...sub,
            items: sub.items.filter(
              (i) =>
                i.name.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q) ||
                i.tags?.some((t) => t.toLowerCase().includes(q)),
            ),
          }))
          .filter((sub) => sub.items.length > 0),
      }))
      .filter((cat) => cat.subCategories.length > 0);
  }, [storeData, searchQuery]);

  /* ── states ── */
  if (error)
    return (
      <div className="state-screen">
        <span className="state-screen__icon">🔍</span>
        <h2>Store not found</h2>
        <p>The link may be wrong or the store is offline.</p>
      </div>
    );

  if (!storeData)
    return (
      <div className="state-screen">
        <Oval
          color={THEME.accent}
          secondaryColor={THEME.cardBorder}
          strokeWidth={3}
          width={44}
          height={44}
        />
      </div>
    );

  const { store } = storeData;

  return (
    <div className="ps-page">
      {/* floating particles */}
      <ParticleLayer />

      {/* festival banner */}
      <FestivalBanner />

      {/* header */}
      <header className="ps-header">
        <div className="ps-header__row">
          <img
            src={store.logo || logoFallback}
            alt={store.name}
            className="ps-header__logo"
            onError={(e) => {
              e.target.src = logoFallback;
            }}
          />
          <div className="ps-header__meta">
            <h1 className="ps-header__name">{store.name}</h1>
            {store.address && (
              <p className="ps-header__address">📍 {store.address}</p>
            )}
            <div className="ps-header__chips">
              <a href={`tel:${store.contact.phone}`} className="chip">
                📞 Call
              </a>
              <a href={`mailto:${store.contact.email}`} className="chip">
                ✉️ Email
              </a>
              {store.isOnline && (
                <span className="chip chip--live">● Open</span>
              )}
            </div>
          </div>
        </div>

        {/* search */}
        <div className="ps-search">
          <span className="ps-search__ico">🔍</span>
          <input
            type="search"
            placeholder={
              THEME.banner?.show
                ? `Search ${store.name}...`
                : "Search anything..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="ps-search__clr"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* category tabs */}
      <nav className="ps-tabs" role="navigation" aria-label="Categories">
        {filtered.map((c) => (
          <button
            key={c._id}
            className={`ps-tab${activeTab === c._id ? " ps-tab--on" : ""}`}
            onClick={() => {
              setActiveTab(c._id);
              const el = categoryRefs.current[c._id];
              if (el) {
                const offset = window.innerWidth >= 768 ? 155 : 125;
                window.scrollTo({
                  top: el.offsetTop - offset,
                  behavior: "smooth",
                });
              }
            }}
          >
            {c.name}
          </button>
        ))}
      </nav>

      {/* menu */}
      <main className="ps-menu">
        {filtered.length === 0 ? (
          <div className="state-empty">
            <span>🔍</span>
            <h3>Nothing found</h3>
            <p>Try a different keyword</p>
            <button onClick={() => setSearchQuery("")}>Clear search</button>
          </div>
        ) : (
          filtered.map((cat) => (
            <section
              key={cat._id}
              ref={(el) => (categoryRefs.current[cat._id] = el)}
              className="ps-section"
            >
              <h2 className="ps-section__title">{cat.name}</h2>

              {cat.subCategories.map((sub) => (
                <div key={sub._id} className="ps-sub">
                  {sub.name !== cat.name && (
                    <h3 className="ps-sub__title">{sub.name}</h3>
                  )}
                  <div className="ps-grid">
                    {sub.items.map((item, idx) => (
                      <ProductCard
                        key={item._id}
                        item={item}
                        onOpen={setSelectedItem}
                        index={idx}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </main>

      {/* footer */}
      <footer className="ps-footer">
        <p>
          Powered by{" "}
          <a href="https://maitripos.com" target="_blank" rel="noreferrer">
            MaitriPOS
          </a>
        </p>
      </footer>

      {/* item detail sheet */}
      {selectedItem && (
        <ItemSheet item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default PublicStore;
