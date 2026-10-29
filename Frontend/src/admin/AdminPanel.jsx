import { useEffect, useState } from "react";
import "./AdminPanel.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

function AdminPanel({ onBack }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("dairyAdminToken") || ""
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");
  const [dairies, setDairies] = useState([]);
  const [products, setProducts] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [stockAmounts, setStockAmounts] = useState({});
  const [showCreateDairy, setShowCreateDairy] = useState(false);
  const [createDairyLoading, setCreateDairyLoading] = useState(false);
  const [createDairyMessage, setCreateDairyMessage] = useState("");
  const [newDairy, setNewDairy] = useState({
    name: "",
    area: "",
    address: "",
    phone: "",
    latitude: "",
    longitude: "",
    products: "Cow Milk|1 L|60\nPaneer|200 g|80\nCurd|500 g|40\nGhee|500 g|450"
  });

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const login = async (event) => {
    event.preventDefault();
    setLoginError("");

    if (!username.trim() || !password) {
      setLoginError("Username aur password dono enter karo.");
      return;
    }

    try {
      setLoginLoading(true);

      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Login failed.");
      }

      localStorage.setItem("dairyAdminToken", data.token);
      setToken(data.token);
      setPassword("");
    } catch (error) {
      setLoginError(
        error.message === "Failed to fetch"
          ? "Server se connection nahi ho raha. Backend check karo."
          : error.message || "Login nahi ho paya."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("dairyAdminToken");
    setToken("");
    setUsername("");
    setPassword("");
    setLoginError("");
    setDairies([]);
    setProducts([]);
    setReservations([]);
    setActivePage("Dashboard");
  };

  const createDairy = async (event) => {
    event.preventDefault();
    setCreateDairyMessage("");
    const productLines = newDairy.products.split("\n").map((line) => line.trim()).filter(Boolean);
    const products = productLines.map((line, index) => {
      const [name, unit, price] = line.split("|").map((part) => part.trim());
      return { id: Date.now() + index, name, unit, price: Number(price), quantity: 0 };
    });
    if (!newDairy.name || !newDairy.latitude || !newDairy.longitude || products.some((product) => !product.name || !product.unit || !Number.isFinite(product.price))) {
      setCreateDairyMessage("Name, coordinates, and valid product lines are required.");
      return;
    }
    try {
      setCreateDairyLoading(true);
      const response = await fetch(`${API_URL}/api/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: newDairy.name,
          area: newDairy.area,
          address: newDairy.address,
          phone: newDairy.phone,
          latitude: Number(newDairy.latitude),
          longitude: Number(newDairy.longitude),
          products
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Dairy could not be created.");
      setCreateDairyMessage("Dairy created successfully.");
      setShowCreateDairy(false);
      setNewDairy((current) => ({ ...current, name: "", area: "", address: "", phone: "", latitude: "", longitude: "" }));
      await loadAdminData();
    } catch (error) {
      setCreateDairyMessage(error.message);
    } finally {
      setCreateDairyLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
      loadReservations();
    }
  }, [token]);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/dairies`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error("Dairy data load nahi hua.");
      }

      const data = await response.json();
      const dairyList = Array.isArray(data) ? data : [];

      setDairies(dairyList);

      const allProducts = [];

      for (const dairy of dairyList) {
        try {
          const productResponse = await fetch(
            `${API_URL}/api/dairies/${dairy.id}/products`,
            { headers: authHeaders }
          );

          if (!productResponse.ok) continue;

          const dairyProducts = await productResponse.json();

          if (Array.isArray(dairyProducts)) {
            dairyProducts.forEach((product) => {
              allProducts.push({
                ...product,
                dairyId: dairy.id,
                dairyName: dairy.name,
              });
            });
          }
        } catch (error) {
          console.error("Products loading error:", error);
        }
      }

      setProducts(allProducts);
    } catch (error) {
      console.error("Admin data loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      setReservationLoading(true);

      const response = await fetch(`${API_URL}/api/reservations`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error("Reservations load nahi hui.");
      }

      const data = await response.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Reservations loading error:", error);
    } finally {
      setReservationLoading(false);
    }
  };

  const updateStock = async (product) => {
    const key = `${product.dairyId}-${product.id}`;
    const amount = Number(stockAmounts[key]);

    if (!Number.isInteger(amount) || amount < 1) {
      alert("Please enter a valid quantity.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/stock/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          dairyId: product.dairyId,
          productId: product.id,
          quantity: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Stock update failed.");
      }

      alert(`${product.name} stock updated successfully!`);

      setStockAmounts((previous) => ({
        ...previous,
        [key]: "",
      }));

      await loadAdminData();
    } catch (error) {
      alert(error.message || "Unable to update stock.");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleString();
  };

  const getReservationStatus = (reservation) => {
    if (!reservation.expiresAt) {
      return reservation.status || "Reserved";
    }

    const expiryTime = new Date(reservation.expiresAt).getTime();

    if (
      !Number.isNaN(expiryTime) &&
      expiryTime <= Date.now()
    ) {
      return "Expired";
    }

    return reservation.status || "Reserved";
  };

  const totalStock = products.reduce(
    (total, product) => total + Number(product.quantity || 0),
    0
  );

  const outOfStock = products.filter(
    (product) => Number(product.quantity || 0) <= 0
  ).length;

  const lowStock = products.filter((product) => {
    const quantity = Number(product.quantity || 0);
    return quantity > 0 && quantity <= 5;
  }).length;

  // LOGIN SCREEN
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          background: "linear-gradient(135deg, #f7f3e8, #e8eee5)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <form
          onSubmit={login}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "35px",
            background: "#fff",
            borderRadius: "18px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <div style={{ fontSize: "48px" }}>🥛</div>

            <h1 style={{ margin: "10px 0", color: "#344b35" }}>
              Dairy Finder
            </h1>

            <p style={{ color: "#777", margin: 0 }}>
              Admin Login
            </p>
          </div>

          <label
            htmlFor="admin-username"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Username
          </label>

          <input
            id="admin-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter admin username"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "18px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          />

          <label
            htmlFor="admin-password"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Password
          </label>

          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter admin password"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "18px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          />

          {loginError && (
            <p
              role="alert"
              style={{
                color: "#b42318",
                background: "#fff0ef",
                padding: "10px",
                borderRadius: "7px",
                fontSize: "14px",
              }}
            >
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "8px",
              background: "#344b35",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loginLoading ? "wait" : "pointer",
            }}
          >
            {loginLoading ? "Logging in..." : "Login to Admin Panel"}
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "11px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            ← Back to Dairy Finder
          </button>
        </form>
      </div>
    );
  }

  // DASHBOARD
  const Dashboard = () => (
    <div>
      <div className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p>Dairy Finder administration overview</p>
        </div>

        <button className="refresh-btn" onClick={loadAdminData}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading admin data...</div>
      ) : (
        <>
          <div className="stats-grid">
            {[
              ["🏪", "Total Dairies", dairies.length],
              ["📦", "Total Products", products.length],
              ["🥛", "Total Stock", totalStock],
              ["⚠️", "Low Stock", lowStock],
            ].map(([icon, title, value]) => (
              <div className="stat-card" key={title}>
                <div className="stat-icon">{icon}</div>
                <div>
                  <h3>{title}</h3>
                  <strong>{value}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <div>
                <h2>Stock Summary</h2>
                <p>Current inventory status</p>
              </div>
            </div>

            <div className="stock-summary">
              <div className="stock-box">
                <span>🟢 Available</span>
                <strong>{products.length - outOfStock}</strong>
              </div>

              <div className="stock-box">
                <span>🟡 Low Stock</span>
                <strong>{lowStock}</strong>
              </div>

              <div className="stock-box">
                <span>🔴 Out of Stock</span>
                <strong>{outOfStock}</strong>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <div className="section-heading">
              <div>
                <h2>Dairies</h2>
                <p>Registered dairy stores</p>
              </div>

              <button
                className="view-btn"
                onClick={() => setActivePage("Dairies")}
              >
                View All
              </button>
            </div>

            <div className="admin-dairy-grid">
              {dairies.map((dairy) => (
                <div className="admin-dairy-card" key={dairy.id}>
                  <div className="dairy-card-top">
                    <div className="dairy-icon">🥛</div>
                    <div>
                      <h3>{dairy.name}</h3>
                      <p>📍 {dairy.area}</p>
                    </div>
                  </div>

                  <div className="dairy-info">
                    <span>📏 {dairy.distance}</span>
                    <span>📞 {dairy.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // DAIRIES
  const DairiesPage = () => (
    <div>
      <div className="admin-header">
        <div>
          <h1>Dairies</h1>
          <p>Manage registered dairies</p>
        </div>
        <button className="refresh-btn" onClick={() => setShowCreateDairy((current) => !current)}>
          {showCreateDairy ? "Close form" : "+ Add dairy"}
        </button>
      </div>

      {createDairyMessage && <div className="admin-feedback">{createDairyMessage}</div>}
      {showCreateDairy && (
        <form className="admin-section create-dairy-form" onSubmit={createDairy}>
          <div className="section-title"><h2>Add a live dairy</h2><span>Visible to nearby customers immediately</span></div>
          <div className="form-grid">
            {[
              ["name", "Dairy name"], ["area", "Area"], ["address", "Full address"],
              ["phone", "Phone / WhatsApp"], ["latitude", "Latitude"], ["longitude", "Longitude"]
            ].map(([field, label]) => (
              <label key={field}>{label}
                <input required={["name", "latitude", "longitude"].includes(field)} type={["latitude", "longitude"].includes(field) ? "number" : "text"} step="any" value={newDairy[field]} onChange={(event) => setNewDairy((current) => ({ ...current, [field]: event.target.value }))} />
              </label>
            ))}
          </div>
          <label>Products <small>One per line: Name | Pack size | Price</small>
            <textarea rows="5" value={newDairy.products} onChange={(event) => setNewDairy((current) => ({ ...current, products: event.target.value }))} />
          </label>
          <button className="refresh-btn" disabled={createDairyLoading}>{createDairyLoading ? "Creating..." : "Create dairy"}</button>
        </form>
      )}

      <div className="admin-section">
        <div className="admin-dairy-grid">
          {dairies.map((dairy) => (
            <div className="admin-dairy-card" key={dairy.id}>
              <div className="dairy-card-top">
                <div className="dairy-icon">🥛</div>
                <div>
                  <h3>{dairy.name}</h3>
                  <p>📍 {dairy.area}</p>
                </div>
              </div>

              <div className="dairy-details">
                <p><strong>Address:</strong> {dairy.address}</p>
                <p><strong>Distance:</strong> {dairy.distance}</p>
                <p><strong>Phone:</strong> {dairy.phone}</p>
              </div>

              <div className="dairy-info">
                <span>📦 {dairy.products?.length || 0} Products</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // PRODUCTS
  const ProductsPage = () => (
    <div>
      <div className="admin-header">
        <div>
          <h1>Products</h1>
          <p>All products available across dairies</p>
        </div>
      </div>

      <div className="admin-section">
        <div className="product-grid">
          {products.map((product) => {
            const quantity = Number(product.quantity || 0);

            return (
              <div
                className="product-card"
                key={`${product.dairyId}-${product.id}`}
              >
                <div className="product-icon">🥛</div>

                <div className="product-content">
                  <h3>{product.name}</h3>
                  <p className="product-dairy">{product.dairyName}</p>
                  <p className="product-price">₹{product.price}</p>

                  <div className="product-stock">
                    <span>Stock</span>
                    <strong
                      className={
                        quantity <= 0
                          ? "stock danger"
                          : quantity <= 5
                          ? "stock warning"
                          : "stock"
                      }
                    >
                      {quantity} {product.unit}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // STOCK MANAGEMENT
  const StockPage = () => (
    <div>
      <div className="admin-header">
        <div>
          <h1>Stock Management</h1>
          <p>Monitor and update product stock</p>
        </div>

        <button className="refresh-btn" onClick={loadAdminData}>
          🔄 Refresh
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Dairy</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th>Add Stock</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const quantity = Number(product.quantity || 0);
                const key = `${product.dairyId}-${product.id}`;

                const status =
                  quantity <= 0
                    ? "Out of Stock"
                    : quantity <= 5
                    ? "Low Stock"
                    : "Available";

                return (
                  <tr key={key}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.dairyName}</td>
                    <td>₹{product.price}</td>
                    <td><strong>{quantity} {product.unit}</strong></td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={stockAmounts[key] || ""}
                          onChange={(event) =>
                            setStockAmounts((previous) => ({
                              ...previous,
                              [key]: event.target.value,
                            }))
                          }
                          style={{
                            width: "65px",
                            padding: "7px 8px",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                          }}
                        />

                        <button
                          onClick={() => updateStock(product)}
                          style={{
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            background: "#d9b45b",
                            color: "#fff",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          status === "Out of Stock"
                            ? "status-badge danger"
                            : status === "Low Stock"
                            ? "status-badge warning"
                            : "status-badge success"
                        }
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RESERVATIONS
  const ReservationsPage = () => (
    <div>
      <div className="admin-header">
        <div>
          <h1>Reservations</h1>
          <p>Manage customer reservations</p>
        </div>

        <button className="refresh-btn" onClick={loadReservations}>
          🔄 Refresh
        </button>
      </div>

      <div className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Customer Reservations</h2>
            <p>
              {reservations.length} reservation
              {reservations.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {reservationLoading ? (
          <div className="admin-loading">Loading reservations...</div>
        ) : reservations.length === 0 ? (
          <div className="empty-section">
            <div className="empty-icon">📋</div>
            <h2>No Reservations Yet</h2>
            <p>Customer reservations will appear here.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reservation ID</th>
                  <th>Dairy</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Expires</th>
                </tr>
              </thead>

              <tbody>
                {reservations.map((reservation) => {
                  const status = getReservationStatus(reservation);

                  return (
                    <tr key={reservation.id}>
                      <td><strong>{reservation.id}</strong></td>
                      <td>{reservation.dairy}</td>
                      <td>{reservation.product}</td>
                      <td>{reservation.quantity} {reservation.unit}</td>
                      <td><strong>₹{reservation.totalPrice}</strong></td>
                      <td>
                        <span
                          className={
                            status === "Expired"
                              ? "status-badge danger"
                              : "status-badge success"
                          }
                        >
                          {status}
                        </span>
                      </td>
                      <td>{formatDate(reservation.createdAt)}</td>
                      <td>{formatDate(reservation.expiresAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // OWNERS / MANAGE STOCK
  const OwnersPage = () => {
    const [selectedDairy, setSelectedDairy] = useState("");
    const [ownerProducts, setOwnerProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [message, setMessage] = useState("");

    const loadProducts = async (dairyId) => {
      setOwnerProducts([]);
      setMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/dairies/${dairyId}/products`,
          { headers: authHeaders }
        );

        if (!response.ok) {
          throw new Error("Products load nahi hue.");
        }

        const data = await response.json();

        setOwnerProducts(Array.isArray(data) ? data : data.products || []);
      } catch (error) {
        setMessage(error.message);
      }
    };

    const updateOwnerStock = async (product) => {
      const quantity = Number(quantities[product.id]);

      if (!Number.isInteger(quantity) || quantity < 1) {
        setMessage("Quantity kam se kam 1 honi chahiye.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/stock/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            dairyId: Number(selectedDairy),
            productId: Number(product.id),
            quantity,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Stock update nahi hua.");
        }

        setMessage("Stock successfully update ho gaya! ✅");

        setQuantities((previous) => ({
          ...previous,
          [product.id]: "",
        }));

        await loadProducts(selectedDairy);
        await loadAdminData();
      } catch (error) {
        setMessage(error.message || "Stock update nahi hua.");
      }
    };

    return (
      <div>
        <div className="admin-header">
          <div>
            <h1>Manage Stock</h1>
            <p>Dairy owner ke liye stock management</p>
          </div>
        </div>

        <div className="admin-section">
          <h2>Select Dairy</h2>

          <select
            value={selectedDairy}
            onChange={(event) => {
              const dairyId = event.target.value;

              setSelectedDairy(dairyId);
              setOwnerProducts([]);
              setQuantities({});
              setMessage("");

              if (dairyId) {
                loadProducts(dairyId);
              }
            }}
          >
            <option value="">-- Select Dairy --</option>

            {dairies.map((dairy) => (
              <option key={dairy.id} value={dairy.id}>
                {dairy.name}
              </option>
            ))}
          </select>

          {message && <p style={{ marginTop: "15px" }}>{message}</p>}

          {ownerProducts.map((product) => (
            <div
              key={product.id}
              style={{
                padding: "15px",
                marginTop: "15px",
                border: "1px solid #ddd",
                borderRadius: "10px",
              }}
            >
              <h3>{product.name}</h3>

              <p>
                Available Stock: {product.quantity} {product.unit}
              </p>

              <input
                type="number"
                min="1"
                placeholder="Quantity to add"
                value={quantities[product.id] || ""}
                onChange={(event) =>
                  setQuantities((previous) => ({
                    ...previous,
                    [product.id]: event.target.value,
                  }))
                }
              />

              <button
                onClick={() => updateOwnerStock(product)}
                style={{ marginLeft: "10px" }}
              >
                Update Stock
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Dairies":
        return <DairiesPage />;
      case "Products":
        return <ProductsPage />;
      case "Stock":
        return <StockPage />;
      case "Reservations":
        return <ReservationsPage />;
      case "Owners":
        return <OwnersPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">🥛</div>
          <div>
            <h2>Dairy Finder</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-menu">
          {[
            ["📊", "Dashboard"],
            ["🏪", "Dairies"],
            ["🥛", "Products"],
            ["📦", "Stock"],
            ["📋", "Reservations"],
            ["👨‍🌾", "Owners"],
          ].map(([icon, page]) => (
            <button
              key={page}
              className={activePage === page ? "active" : ""}
              onClick={() => setActivePage(page)}
            >
              <span>{icon}</span>
              {page}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <button className="back-dairy-btn" onClick={onBack}>
            ← Back to Dairy Finder
          </button>

          <button
            onClick={logout}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "10px",
              border: "none",
              borderRadius: "7px",
              background: "#a83232",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            🔒 Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">{renderPage()}</main>
    </div>
  );
}

export default AdminPanel;