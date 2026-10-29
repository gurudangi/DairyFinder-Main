import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import AdminPanel from "./admin/AdminPanel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";


const defaultMarkerIcon = L.divIcon({
  className: "custom-map-marker",
  html: '<div class="map-marker-pin">📍</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [dairyFilter, setDairyFilter] = useState("all");

  const [dairies, setDairies] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingDairies, setLoadingDairies] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedDairy, setSelectedDairy] = useState(null);

  const [searchArea, setSearchArea] = useState("");
  const [searchedArea, setSearchedArea] = useState("");
  const [searchMode, setSearchMode] = useState("text");
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [reservation, setReservation] = useState(null);
  const [reservationHistory, setReservationHistory] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dairyFinderFavorites") || "[]");
    } catch {
      return [];
    }
  });
  const [viewHistory, setViewHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dairyFinderViewHistory") || "[]");
    } catch {
      return [];
    }
  });

  const [message, setMessage] = useState("");
  const [quantities, setQuantities] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [contactProduct, setContactProduct] = useState(null);
  const [reportProduct, setReportProduct] = useState(null);
  const [reportReason, setReportReason] = useState("not_available_today");
  const [reportNotes, setReportNotes] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // =========================================================
  // LOAD DAIRIES
  // =========================================================

  const loadDairies = async () => {
    try {
      setLoadingDairies(true);
      setMessage("");

      const response = await fetch(`${API_URL}/api/dairies`);

      if (!response.ok) {
        throw new Error("Failed to load dairies");
      }

      const data = await response.json();
      setDairies(data);
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to load dairies. Please check the backend."
      );
    } finally {
      setLoadingDairies(false);
    }
  };

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  const loadProducts = async (dairyId) => {
    try {
      setLoadingProducts(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/dairies/${dairyId}/products`
      );

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json();

      setProducts(data);

      const initialQuantities = {};

      data.forEach((product) => {
        initialQuantities[product.id] = 1;
      });

      setQuantities(initialQuantities);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load products.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      const target = tab === "home" ? "home" : tab === "history" ? "history" : "dairy-results";
      document.getElementById(target)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 0);
  };

  const toggleFavorite = (dairy) => {
    setFavoriteIds((current) => {
      const next = current.includes(dairy.id)
        ? current.filter((id) => id !== dairy.id)
        : [...current, dairy.id];
      localStorage.setItem("dairyFinderFavorites", JSON.stringify(next));
      return next;
    });
  };

  const getProductStatus = (product) => {
    const availability = product.availability || {};
    if (availability.status === "owner_confirmed") {
      return { label: "Confirmed Available", className: "stock-good" };
    }
    if (availability.status === "customer_reported_unavailable") {
      return {
        label: `Reported Unavailable${availability.reportCount ? ` (${availability.reportCount})` : ""}`,
        className: "stock-out"
      };
    }
    if (availability.status === "customer_likely") {
      return { label: "Likely Available - Customer Report", className: "stock-low" };
    }
    return { label: "Availability Not Confirmed", className: "stock-low" };
  };

  const whatsappUrl = (product) => {
    let phone = String(selectedDairy?.phone || "").replace(/\D/g, "");
    if (phone.length === 10) phone = `91${phone}`;
    if (!phone) return null;
    const message = [
      `Hello, I found ${selectedDairy.name} on Dairy Finder.`,
      `I would like to check whether ${product.name}${product.unit ? ` (${product.unit})` : ""} is available today.`,
      "Please confirm availability and today's price. Thank you."
    ].join("\n");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!selectedDairy || !reportProduct) return;
    try {
      setReportLoading(true);
      const response = await fetch(
        `${API_URL}/api/dairies/${selectedDairy.id}/products/${reportProduct.id}/reports`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reportReason, notes: reportNotes })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Report could not be submitted.");
      setProducts((current) => current.map((product) =>
        product.id === reportProduct.id ? { ...product, availability: data } : product
      ));
      setReportProduct(null);
      setReportNotes("");
      setMessage("Thank you. Your report will help other customers.");
    } catch (error) {
      setMessage(error.message || "Report could not be submitted.");
    } finally {
      setReportLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDairies();
  }, []);

  // =========================================================
  // RESERVATION TIMER
  // =========================================================

  useEffect(() => {
    if (!reservation?.expiresAt) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(reservation.expiresAt).getTime() -
            Date.now()) /
            1000
        )
      );

      setTimeLeft(remaining);
    };

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [reservation]);

  // =========================================================
  // FORMAT TIMER
  // =========================================================

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // =========================================================
  // LOCATION SEARCH
  // =========================================================

  const runNearbySearch = async (lat, lng, label) => {
    try {
      setLocationLoading(true);
      setMessage("");
      setActiveTab("dairies");

      const response = await fetch(
        `${API_URL}/api/dairies/nearby?lat=${lat}&lng=${lng}`
      );

      if (!response.ok) {
        throw new Error("Nearby dairy search failed");
      }

      const data = await response.json();

      if (data.length === 0) {
        const allResponse = await fetch(`${API_URL}/api/dairies`);
        const allDairies = allResponse.ok ? await allResponse.json() : [];
        setDairies(allDairies);
        setMessage(
          allDairies.length > 0
            ? "No dairies were found within 2 km. Showing all live dairies instead."
            : "No live dairy records are available yet. An admin must add a dairy first."
        );
      } else {
        setDairies(data);
      }
      setLocationCoords({ lat, lng });
      setSearchedArea(label);
      setSearchArea(label);
      setSelectedDairy(null);
      setProducts([]);
      setReservation(null);
      setShowMap(false);

      setTimeout(() => {
        document.getElementById("dairies")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    } catch (error) {
      console.error(error);
      setActiveTab("dairies");
      setMessage("Unable to find nearby dairies. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support location services.");
      return;
    }

    setLocationLoading(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        runNearbySearch(
          position.coords.latitude,
          position.coords.longitude,
          "Your current location"
        );
      },
      (error) => {
        console.error(error);
        setLocationLoading(false);
        setActiveTab("dairies");
        setMessage("Location permission was blocked. Allow it for this site, or use Select on Map. Showing all live dairies.");
        loadDairies();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleTextLocation = async () => {
    const value = searchArea.trim();

    if (!value) {
      setMessage("Please enter a location.");
      return;
    }

    try {
      setLocationLoading(true);
      setMessage("");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
          value + ", Indore, Madhya Pradesh, India"
        )}`
      );

      if (!response.ok) {
        throw new Error("Location lookup failed");
      }

      const results = await response.json();

      if (!results.length) {
        setMessage("Location not found. Try a nearby area or full address.");
        return;
      }

      const result = results[0];

      await runNearbySearch(
        Number(result.lat),
        Number(result.lon),
        result.display_name.split(",").slice(0, 2).join(",")
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to find that location right now.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMapLocation = (lat, lng) => {
    runNearbySearch(lat, lng, "Selected map location");
  };

  const clearSearch = () => {
    setSearchArea("");
    setSearchedArea("");
    setLocationCoords(null);
    setShowMap(false);
    loadDairies();
  };

  // =========================================================
  // DEFAULT DAIRIES
  // =========================================================

  const displayedDairies = dairies.filter((dairy) => {
    if (dairyFilter === "open") return dairy.isOpen === true;
    if (dairyFilter === "cow") return dairy.products?.some((product) => /milk/i.test(product.name));
    if (dairyFilter === "buffalo") return dairy.products?.some((product) => /buffalo/i.test(product.name));
    if (dairyFilter === "delivery") return dairy.homeDelivery === true;
    return true;
  });

  // =========================================================
  // VIEW PRODUCTS
  // =========================================================

  const viewProducts = (dairy) => {
    setActiveTab("dairies");
    setSelectedDairy(dairy);
    setReservation(null);
    setMessage("");

    loadProducts(dairy.id);
    setViewHistory((current) => {
      const next = [
        { dairy, viewedAt: new Date().toISOString() },
        ...current.filter((item) => item.dairy.id !== dairy.id)
      ].slice(0, 20);
      localStorage.setItem("dairyFinderViewHistory", JSON.stringify(next));
      return next;
    });

    setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 150);
  };

  // =========================================================
  // INCREASE QUANTITY
  // =========================================================

  const increaseQuantity = (product) => {
    const currentQuantity = quantities[product.id] || 1;

    if (currentQuantity < product.quantity) {
      setQuantities((previous) => ({
        ...previous,
        [product.id]: currentQuantity + 1,
      }));
    }
  };

  // =========================================================
  // DECREASE QUANTITY
  // =========================================================

  const decreaseQuantity = (product) => {
    const currentQuantity = quantities[product.id] || 1;

    if (currentQuantity > 1) {
      setQuantities((previous) => ({
        ...previous,
        [product.id]: currentQuantity - 1,
      }));
    }
  };

  // =========================================================
  // RESERVE PRODUCT
  // =========================================================

  const reserveProduct = async (productId) => {
    if (!selectedDairy) {
      return;
    }

    try {
      setMessage("");

      const selectedQuantity = quantities[productId] || 1;

      const response = await fetch(`${API_URL}/api/reserve`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          dairyId: selectedDairy.id,
          productId: productId,
          quantity: selectedQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Reservation failed.");
        return;
      }

      setReservation(data);

      setReservationHistory((previous) => [
        data,
        ...previous,
      ]);

      await loadProducts(selectedDairy.id);

      setTimeout(() => {
        document.getElementById("reservation")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 150);
    } catch (error) {
      console.error(error);

      setMessage(
        "Server error. Please make sure the backend is running."
      );
    }
  };

  // =========================================================
  // PRODUCT ICON
  // =========================================================

  const getProductIcon = (name) => {
    const icons = {
      Milk: "🥛",
      Curd: "🥣",
      Butter: "🧈",
      Ghee: "🫙",
      Paneer: "🧀",
      Chaas: "🍶",
      Lassi: "🥛",
      Khoya: "🍨",
    };

    return icons[name] || "🥛";
  };

  // =========================================================
  // STOCK STATUS
  // =========================================================

  const getStockStatus = (quantity) => {
    if (quantity <= 0) {
      return {
        label: "Out of Stock",
        className: "stock-out",
      };
    }

    if (quantity <= 5) {
      return {
        label: "Low Stock",
        className: "stock-low",
      };
    }

    return {
      label: "In Stock",
      className: "stock-good",
    };
  };

  // =========================================================
  // ADMIN PANEL
  // =========================================================

  if (isAdmin) {
    return (
      <AdminPanel
        onBack={() => {
          setIsAdmin(false);
        }}
      />
    );
  }

  // =========================================================
  // CUSTOMER PANEL
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">

        <button type="button" className="logo" onClick={() => navigateTo("home")}>
          <span className="logo-icon">🥛</span>

          <span>
            Dairy <strong>Finder</strong>
          </span>
        </button>

        <div className="nav-links">
          <button className={activeTab === "home" ? "active-nav" : ""} onClick={() => navigateTo("home")}>Home</button>
          <button className={activeTab === "dairies" ? "active-nav" : ""} onClick={() => navigateTo("dairies")}>Dairies</button>
          <button className={activeTab === "map" ? "active-nav" : ""} onClick={() => navigateTo("map")}>Map</button>
          <button className={activeTab === "favorites" ? "active-nav" : ""} onClick={() => navigateTo("favorites")}>Favorites</button>
          <button className={activeTab === "history" ? "active-nav" : ""} onClick={() => navigateTo("history")}>History</button>

          <button
            className="admin-access-btn"
            onClick={() => setIsAdmin(true)}
          >
            Admin
          </button>
        </div>

      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      {activeTab === "home" && <section className="hero" id="home">

        <div className="hero-content">

          <h1>
            Find Nearby
            <br />
            <span>Dairies in Your Area</span>
          </h1>

          <p>
            Discover trusted local dairies around you. Get locations,
            contact details and check product availability before you visit.
          </p>

          <div className="location-search">

            <div className="search-box">

              <div className="search-icon">
                🔎
              </div>

              <input
                type="text"
                placeholder="Enter area, locality or address..."
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTextLocation();
                  }
                }}
              />

              <button
                onClick={handleTextLocation}
                disabled={locationLoading}
              >
                {locationLoading ? "Finding..." : "Search"}
              </button>

            </div>

            <div className="location-actions">

              <button
                className="location-action"
                onClick={handleCurrentLocation}
                disabled={locationLoading}
              >
                📍 Use Current Location
              </button>

              <button
                className="location-action"
                onClick={() => setShowMap((previous) => !previous)}
              >
                🗺️ {showMap ? "Close Map" : "Select on Map"}
              </button>

            </div>

            {showMap && (
              <div className="map-picker">
                <MapContainer
                  center={[22.7196, 75.8577]}
                  zoom={12}
                  scrollWheelZoom={true}
                  className="location-map"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapClickHandler onSelect={handleMapLocation} />

                  {locationCoords && (
                    <Marker
                      position={[locationCoords.lat, locationCoords.lng]}
                      icon={defaultMarkerIcon}
                    />
                  )}
                </MapContainer>

                <p className="map-help">
                  Click anywhere on the map to find dairies near that location.
                </p>
              </div>
            )}

          </div>

          <div className="hero-features">
            <span><b>●</b> Nearby Dairies<br /><small>in Real Time</small></span>
            <span><b>⌁</b> Check Product<br /><small>Availability</small></span>
            <span><b>☎</b> Call or WhatsApp<br /><small>Dairy Directly</small></span>
            <span><b>✓</b> Trusted &amp; Verified<br /><small>Dairies</small></span>
          </div>

        </div>

      </section>}

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div className="message">
          <span>⚠️</span>
          {message}
        </div>
      )}

      {/* =====================================================
          SEARCH RESULT
      ===================================================== */}

      {activeTab !== "home" && searchedArea && (
        <section className="search-result">

          <div>
            <span className="result-label">
              SEARCH RESULTS
            </span>

            <h3>
              Dairies near "{searchedArea}"
            </h3>
          </div>

          <button
            onClick={() => {
              clearSearch();
            }}
          >
            Clear Search
          </button>

        </section>
      )}

      {/* =====================================================
          DAIRIES
      ===================================================== */}

      <section
        className="section"
        id="dairy-results"
        style={{ display: activeTab === "home" || activeTab === "history" ? "none" : undefined }}
      >

        <div className="results-toolbar">
          <div>
            <div className="section-kicker"><span>{displayedDairies.length}</span> nearby dairies found</div>
            <h2>Nearby <span>Dairies</span></h2>
          </div>
          <div className="results-controls">
            <button type="button" className="filter-button">⚱ Filters</button>
            <button type="button" className="sort-button">Sort by: Nearest⌄</button>
          </div>
        </div>
        <div className="results-filters">
          <button className={dairyFilter === "all" ? "active" : ""} onClick={() => setDairyFilter("all")}>All</button>
          <button className={dairyFilter === "open" ? "active" : ""} onClick={() => setDairyFilter("open")}>Open Now</button>
          <button className={dairyFilter === "cow" ? "active" : ""} onClick={() => setDairyFilter("cow")}>🐄 Cow Milk</button>
          <button className={dairyFilter === "buffalo" ? "active" : ""} onClick={() => setDairyFilter("buffalo")}>🐃 Buffalo Milk</button>
          <button className={dairyFilter === "delivery" ? "active" : ""} onClick={() => setDairyFilter("delivery")}>Home Delivery</button>
        </div>
        <div className="section-heading legacy-heading">

          <div className="section-kicker">
            <span>01</span>
            Nearby dairies
          </div>

          <h2>
            Choose Your <span>Dairy</span>
          </h2>

          <p>
            Find a nearby dairy and review its listed products.
          </p>

        </div>

        {loadingDairies ? (

          <div className="loading">
            <div className="loading-circle"></div>
            <p>Finding nearby dairies...</p>
          </div>

        ) : displayedDairies.length === 0 ? (

          <div className="empty">

            <div className="empty-icon">
              🔎
            </div>

            <h3>
              No dairies found
            </h3>

            <p>No live dairy records are available yet. Add a dairy from the Admin panel to make it searchable.</p>
            <button type="button" className="empty-action" onClick={() => setIsAdmin(true)}>Open Admin panel</button>

          </div>

        ) : (

          <div className={`dairy-results-layout ${activeTab === "map" ? "map-tab-layout" : ""}`}>
          <div className="dairy-grid" style={{ display: activeTab === "map" ? "none" : undefined }}>

            {(activeTab === "favorites"
              ? displayedDairies.filter((dairy) => favoriteIds.includes(dairy.id))
              : displayedDairies
            ).map((dairy) => (

              <div
                className="dairy-card"
                key={dairy.id}
              >

                <div className="dairy-card-top">
                  <div className="dairy-photo">🏪</div>
                  <div className="dairy-card-heading">
                    <h3>{dairy.name} {dairy.isOpen != null && <span className="open-pill">● {dairy.isOpen ? "Open" : "Closed"}</span>}</h3>
                    <p>{dairy.rating != null ? `⭐ ${dairy.rating}${dairy.reviewCount != null ? ` (${dairy.reviewCount} reviews)` : ""} · ` : ""}{dairy.distance || "Distance unavailable"}</p>
                  </div>
                  <button className={`favorite-button ${favoriteIds.includes(dairy.id) ? "is-favorite" : ""}`} onClick={() => toggleFavorite(dairy)} aria-label={`Save ${dairy.name}`}>{favoriteIds.includes(dairy.id) ? "♥" : "♡"}</button>
                </div>

                <p className="dairy-area">📍 {dairy.area}, Indore</p>

                <div className="dairy-info">

                  <span className="dairy-tags"><b>Cow Milk</b><b>Paneer</b><b>Curd</b></span>
                </div>

                <button
                  className="dairy-button"
                  onClick={() => viewProducts(dairy)}
                >
                  <span>View Details</span>
                  <span>→</span>
                </button>

              </div>

            ))}

          </div>
          {activeTab === "favorites" && displayedDairies.filter((dairy) => favoriteIds.includes(dairy.id)).length === 0 && (
            <div className="empty favorite-empty">
              <div className="empty-icon">♡</div>
              <h3>No favorite dairies yet</h3>
              <p>Use the heart on a dairy card to save it here.</p>
            </div>
          )}
          <div className="results-map" style={{ display: activeTab === "dairies" || activeTab === "favorites" ? undefined : "block" }}>
            <div className="map-heading"><b>Map</b><span>Satellite</span></div>
            <MapContainer center={[22.7196, 75.8577]} zoom={12} scrollWheelZoom={false} className="results-map-container">
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {displayedDairies.map((dairy) => dairy.latitude && dairy.longitude ? (
                <Marker key={dairy.id} position={[dairy.latitude, dairy.longitude]} icon={defaultMarkerIcon} />
              ) : null)}
            </MapContainer>
          </div>
          </div>

        )}

      </section>

      {/* =====================================================
          SELECTED DAIRY
      ===================================================== */}

      {selectedDairy && activeTab === "dairies" && (

        <section className="selected-dairy">

          <div className="selected-dairy-icon">
            🏪
          </div>

          <div className="selected-dairy-content">

            <span>
              Currently viewing
            </span>

            <h2>
              {selectedDairy.name}
            </h2>

            <p>
              📍 {selectedDairy.area}
              <span>•</span>
              🚗 {selectedDairy.distance}
            </p>

          </div>

          <button
            onClick={() => {
              setSelectedDairy(null);
              setProducts([]);
            }}
          >
            Change Dairy
          </button>

        </section>

      )}

      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      {selectedDairy && activeTab === "dairies" && (

        <section
          className="section products-section"
          id="products"
        >

          <div className="section-heading">

            <div className="section-kicker">
              <span>02</span>
              Fresh dairy products
            </div>

            <h2>
              What's <span>Available?</span>
            </h2>

            <p>
              Product listings come from the dairy catalogue. Confirm current
              availability directly before visiting.
            </p>

          </div>

          {loadingProducts ? (

            <div className="loading">

              <div className="loading-circle"></div>

              <p>
                Checking product availability...
              </p>

            </div>

          ) : products.length === 0 ? (

            <div className="empty">

              <div className="empty-icon">
                🥛
              </div>

              <h3>
                No products available
              </h3>

              <p>
                This dairy currently has no products listed.
              </p>

            </div>

          ) : (

            <div className="product-box">

              {products.map((product) => {

                const stockStatus = getProductStatus(product);

                return (

                  <div
                    className="product-card"
                    key={product.id}
                  >

                    <div className="product-card-top">

                      <div className="product-icon">
                        {getProductIcon(product.name)}
                      </div>

                      <span className={`stock-badge ${stockStatus.className}`}>
                        {stockStatus.label}
                      </span>

                    </div>

                    <h4>
                      {product.name}
                    </h4>

                    <p className="product-stock">
                      {product.availability?.updatedAt
                        ? `Updated ${new Date(product.availability.updatedAt).toLocaleDateString()}`
                        : "The dairy has not confirmed current availability."}
                    </p>

                    {product.price != null && (
                      <div className="product-price">
                        ₹{product.price}<span> / {product.unit}</span>
                      </div>
                    )}

                    <div className="availability-actions">
                      <button type="button" onClick={() => setContactProduct(product)}>
                        📞 Contact dairy
                      </button>
                      <button type="button" onClick={() => setReportProduct(product)}>
                        Report unavailable
                      </button>
                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      )}

      {/* =====================================================
          RESERVATION
      ===================================================== */}

      {reservation && (

        <section
          className="reservation-section"
          id="reservation"
        >

          <div className="reservation-card">

            <div className="reservation-success">

              <div className="reservation-icon">
                ✓
              </div>

              <span>
                Reservation Successful
              </span>

            </div>

            <h2>
              Your Reservation is Confirmed
            </h2>

            <p className="reservation-subtitle">
              Keep your reservation ID and collect
              your product before the timer expires.
            </p>

            <div className="reservation-id-box">

              <span>
                Reservation ID
              </span>

              <strong>
                {reservation.id}
              </strong>

            </div>

            <div className="reservation-details">

              <div className="reservation-detail">
                <span>DAIRY</span>
                <strong>
                  {reservation.dairy}
                </strong>
              </div>

              <div className="reservation-detail">
                <span>PRODUCT</span>
                <strong>
                  {reservation.product}
                </strong>
              </div>

              <div className="reservation-detail">
                <span>QUANTITY</span>
                <strong>
                  {reservation.quantity}{" "}
                  {reservation.unit}
                </strong>
              </div>

              <div className="reservation-detail">
                <span>PRICE / UNIT</span>
                <strong>
                  ₹{reservation.price}
                </strong>
              </div>

              <div className="reservation-detail">
                <span>TOTAL</span>
                <strong className="reservation-total">
                  ₹
                  {reservation.totalPrice ??
                    reservation.price *
                      reservation.quantity}
                </strong>
              </div>

            </div>

            <div className="reservation-timer-box">

              <div className="timer-text">
                <span>⏳</span>

                <div>
                  <small>
                    Reservation valid for
                  </small>

                  <strong>
                    10 minutes
                  </strong>
                </div>
              </div>

              {timeLeft > 0 ? (

                <div className="timer">
                  {formatTime(timeLeft)}
                </div>

              ) : (

                <div className="reservation-expired">
                  Expired
                </div>

              )}

            </div>

            {timeLeft > 0 ? (

              <p className="notice">
                📍 Please collect your reserved product
                from the dairy before the timer expires.
              </p>

            ) : (

              <p className="notice expired-notice">
                ⏰ This reservation has expired.
              </p>

            )}

          </div>

        </section>

      )}

      {/* =====================================================
          HISTORY
      ===================================================== */}

      {activeTab === "history" && (

        <section
          className="section reservation-history"
          id="history"
        >

          <div className="section-heading">

            <div className="section-kicker">
              <span>03</span>
              Your activity
            </div>

            <h2>
              Your <span>History</span>
            </h2>

            <p>
              Recently viewed dairies and reservations saved on this device.
            </p>

          </div>

          {viewHistory.length > 0 && (
            <div className="history-list viewed-dairies-list">
              {viewHistory.map((item) => (
                <div className="history-card" key={`${item.dairy.id}-${item.viewedAt}`}>
                  <div className="history-icon">🏪</div>
                  <div className="history-info">
                    <div className="history-title-row">
                      <h3>{item.dairy.name}</h3>
                      <span className="history-status">Viewed</span>
                    </div>
                    <p>📍 {item.dairy.address || item.dairy.area}</p>
                    <p>🕒 {new Date(item.viewedAt).toLocaleString()}</p>
                  </div>
                  <button className="dairy-button" onClick={() => viewProducts(item.dairy)}>Open</button>
                </div>
              ))}
            </div>
          )}

          {reservationHistory.length > 0 && (
          <div className="history-list">

            {reservationHistory.map(
              (item, index) => (

                <div
                  className="history-card"
                  key={`${item.id}-${index}`}
                >

                  <div className="history-icon">
                    {getProductIcon(item.product)}
                  </div>

                  <div className="history-info">

                    <div className="history-title-row">

                      <h3>
                        {item.product}
                      </h3>

                      <span className="history-status">
                        Reserved
                      </span>

                    </div>

                    <p>
                      🏪 {item.dairy}
                    </p>

                    <p>
                      📦 {item.quantity}{" "}
                      {item.unit}
                    </p>

                  </div>

                  <div className="history-price">

                    <span>
                      Total
                    </span>

                    <strong>
                      ₹
                      {item.totalPrice ??
                        item.price *
                          item.quantity}
                    </strong>

                    <small>
                      {item.id}
                    </small>

                  </div>

                </div>

              )
            )}

          </div>
          )}

          {viewHistory.length === 0 && reservationHistory.length === 0 && (
            <div className="empty">
              <div className="empty-icon">🕒</div>
              <h3>No history yet</h3>
              <p>Open a dairy or make a reservation to see activity here.</p>
            </div>
          )}

        </section>

      )}

      {contactProduct && (
        <div className="modal-backdrop" role="presentation" onClick={() => setContactProduct(null)}>
          <div className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setContactProduct(null)} aria-label="Close contact dialog">×</button>
            <h2 id="contact-title">Contact {selectedDairy?.name}</h2>
            <p>Confirm current availability for {contactProduct.name} before visiting.</p>
            <div className="contact-actions">
              {selectedDairy?.phone ? (
                <a href={`tel:${selectedDairy.phone}`} className="contact-action primary">📞 Call now</a>
              ) : <span className="contact-unavailable">Phone number not available</span>}
              {whatsappUrl(contactProduct) ? (
                <a href={whatsappUrl(contactProduct)} target="_blank" rel="noreferrer" className="contact-action whatsapp">💬 Open WhatsApp</a>
              ) : <span className="contact-unavailable">WhatsApp number not available</span>}
            </div>
          </div>
        </div>
      )}

      {reportProduct && (
        <div className="modal-backdrop" role="presentation" onClick={() => setReportProduct(null)}>
          <form className="contact-modal report-modal" onSubmit={submitReport} role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setReportProduct(null)} aria-label="Close report dialog">×</button>
            <h2 id="report-title">Report unavailable product</h2>
            <p><strong>{reportProduct.name}</strong> at {selectedDairy?.name}</p>
            <label htmlFor="report-reason">Why is it unavailable?</label>
            <select id="report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
              <option value="not_available_today">Not available today</option>
              <option value="owner_out_of_stock">Owner confirmed out of stock</option>
              <option value="not_sold">Product not sold at this dairy</option>
              <option value="price_incorrect">Price information incorrect</option>
              <option value="other">Other</option>
            </select>
            <label htmlFor="report-notes">Notes (optional)</label>
            <textarea id="report-notes" maxLength="500" value={reportNotes} onChange={(event) => setReportNotes(event.target.value)} placeholder="Add helpful context" />
            <div className="report-actions">
              <button type="button" onClick={() => setReportProduct(null)}>Cancel</button>
              <button type="submit" className="report-submit" disabled={reportLoading}>{reportLoading ? "Submitting..." : "Submit report"}</button>
            </div>
            <small>This report is customer-provided and does not permanently change the dairy catalogue.</small>
          </form>
        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">

        <div className="footer-brand">
          <span>🥛</span>

          <strong>
            Dairy Finder
          </strong>
        </div>

        <p>
          Find nearby dairies. Check live availability.
          Reserve fresh dairy products.
        </p>

        <div className="footer-line"></div>

        <small>
          © 2026 Dairy Finder · Built for a better
          local dairy experience.
        </small>

      </footer>

    </div>
  );
}

export default App;