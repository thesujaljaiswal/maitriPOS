import { useEffect, useState, useRef } from "react";
import logo from "../../assets/maitriPOS ICON 2.jpg";
import "./style.css";

const PublicStore = ({ slug }) => {
  const [storeData, setStoreData] = useState(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSubCats, setOpenSubCats] = useState({});
  const categoryRefs = useRef({});

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/public/store/${slug}`
        );
        if (!res.ok) throw new Error("Store not found");
        const data = await res.json();
        const fetchedStore = data.data.store;

        // 1. Update Document Title
        if (fetchedStore?.name) {
          document.title = fetchedStore.name;
        }

        // 2. Update Favicon with Store Logo
        if (fetchedStore?.logo) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.getElementsByTagName("head")[0].appendChild(link);
          }
          link.href = fetchedStore.logo;
        }

        setStoreData(data.data);
        if (data.data.categories.length > 0)
          setActiveCategory(data.data.categories[0]._id);

        const initialSubCats = {};
        data.data.categories.forEach((cat) => {
          cat.subCategories?.forEach((sub) => {
            initialSubCats[sub._id] = true;
          });
        });
        setOpenSubCats(initialSubCats);
      } catch (err) {
        setError("Unable to load store data.");
        document.title = "Store Not Found";
      }
    };
    fetchStore();
  }, [slug]);

  const toggleAccordion = (id) => {
    setOpenSubCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToCategory = (id) => {
    setActiveCategory(id);
    const element = categoryRefs.current[id];
    if (element) {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.pageYOffset - 100,
        behavior: "smooth",
      });
    }
  };

  if (error)
    return (
      <div className="ps-status-screen">
        <h2 className="ps-error-text">{error}</h2>
      </div>
    );
  if (!storeData)
    return (
      <div className="ps-status-screen">
        <div className="ps-spinner"></div>
      </div>
    );

  const { store, categories } = storeData;

  return (
    <div className="ps-store-wrapper">
      <header className="ps-store-hero">
        <div className="ps-hero-content">
          <div className="ps-hero-top">
            <img
              src={store.logo ? store.logo : logo}
              alt="Logo"
              className="ps-hero-logo"
            />
            <div
              className={`ps-hero-status ${
                store.isOnline ? "ps-online ps-blink" : "ps-offline"
              }`}
            >
              {store.isOnline ? "● Accepting Orders" : "● Closed"}
            </div>
          </div>
          <div className="ps-hero-details">
            <h1 className="ps-hero-title">{store.name}</h1>
            <p className="ps-hero-address">📍 {store.address}</p>
            <div className="ps-hero-contact-grid">
              <a
                href={`tel:${store.contact.phone}`}
                className="ps-contact-item"
              >
                📞 {store.contact.phone}
              </a>
              <a
                href={`mailto:${store.contact.email}`}
                className="ps-contact-item"
              >
                ✉️ {store.contact.email}
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="ps-category-bar-sticky">
        <div className="ps-category-scroll">
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`ps-cat-pill ${
                activeCategory === cat._id ? "ps-cat-active" : ""
              }`}
              onClick={() => scrollToCategory(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <main className="ps-store-main">
        {categories.map((cat) => (
          <section
            key={cat._id}
            ref={(el) => (categoryRefs.current[cat._id] = el)}
            className="ps-main-cat-section"
          >
            <div className="ps-cat-header-group">
              <h2 className="ps-main-cat-title">{cat.name}</h2>
              <p className="ps-cat-desc">{cat.description}</p>
            </div>

            {cat.subCategories?.map((sub) => (
              <div
                key={sub._id}
                className={`ps-accordion-box ${
                  openSubCats[sub._id] ? "ps-is-open" : ""
                }`}
              >
                <div
                  className="ps-accordion-header"
                  onClick={() => toggleAccordion(sub._id)}
                >
                  <div className="ps-header-left">
                    <span className="ps-sub-cat-dot"></span>
                    <div className="ps-sub-cat-info">
                      <span className="ps-sub-cat-name">{sub.name}</span>
                      <span className="ps-sub-cat-desc">{sub.description}</span>
                    </div>
                  </div>
                  <div className="ps-header-right">
                    <span className="ps-sub-cat-count">
                      {sub.items?.length} Items
                    </span>
                    <span className="ps-accordion-chevron"></span>
                  </div>
                </div>

                <div className="ps-accordion-content-wrapper">
                  <div className="ps-accordion-content-inner">
                    <div className="ps-product-grid">
                      {sub.items?.map((item) => (
                        <ProductCard
                          key={item._id}
                          item={item}
                          onSelect={setSelectedItem}
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
          <a
            href="https://maitripos.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            maitriPOS.com
          </a>
        </p>
      </footer>

      {/* COMPREHENSIVE MODAL */}
      {selectedItem && (
        <div className="ps-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="ps-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-img-container">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="ps-modal-img"
              />
              <button
                className="ps-modal-close-icon"
                onClick={() => setSelectedItem(null)}
              >
                ×
              </button>
            </div>

            <div className="ps-modal-info">
              <div className="ps-modal-header">
                <h3 className="ps-modal-title">{selectedItem.name}</h3>
                <span className="ps-modal-price-main">
                  ₹
                  {selectedItem.price ||
                    (selectedItem.variants?.length > 0
                      ? Math.min(...selectedItem.variants.map((v) => v.price))
                      : 0)}
                </span>
              </div>

              {selectedItem.tags?.length > 0 && selectedItem.tags[0] !== "" && (
                <div className="ps-modal-tags">
                  {selectedItem.tags.map((tag, idx) => (
                    <span key={idx} className="ps-modal-tag-chip">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="ps-modal-body">
                <label className="ps-modal-label">Description</label>
                <p className="ps-modal-desc">
                  {selectedItem.description ||
                    "No additional description available."}
                </p>

                {selectedItem.variants?.length > 0 && (
                  <div className="ps-modal-variants-section">
                    <label className="ps-modal-label">Available Options</label>
                    <div className="ps-modal-variant-list">
                      {selectedItem.variants.map((v) => (
                        <div key={v._id} className="ps-modal-variant-row">
                          <div className="ps-v-info">
                            <span className="ps-v-name">{v.name}</span>
                          </div>
                          <span className="ps-v-price">₹{v.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="ps-modal-close-btn"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ item, onSelect }) => {
  const price =
    item.price ||
    (item.variants?.length > 0
      ? Math.min(...item.variants.map((v) => v.price))
      : 0);
  return (
    <div
      className={`ps-item-card ${!item.isAvailable ? "ps-item-oos" : ""}`}
      onClick={() => onSelect(item)}
    >
      <div className="ps-item-img-box">
        <img
          src={item.image}
          alt={item.name}
          className="ps-item-img"
          loading="lazy"
        />
        {!item.isAvailable && <div className="ps-oos-overlay">SOLD OUT</div>}
      </div>
      <div className="ps-item-info">
        <h4 className="ps-item-title">{item.name}</h4>
        <div className="ps-item-footer">
          <p className="ps-item-price">
            ₹{price}
            {item.variants?.length > 0 && " Onwards"}
          </p>
          <div className="ps-add-badge">+</div>
        </div>
      </div>
    </div>
  );
};

export default PublicStore;
