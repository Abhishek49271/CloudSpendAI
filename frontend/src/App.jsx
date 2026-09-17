import { useEffect, useMemo, useState } from "react";
import Auth from "./pages/Auth";
import WelcomeLanding from "./pages/WelcomeLanding";
import AdminWelcomeLanding from "./pages/AdminWelcomeLanding";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import FilterBar from "./FilterBar";
import CostAnalysis from "./CostAnalysis";
import CostAlerts from "./CostAlerts";
import Resources from "./Resources";
import AdminPanel from "./AdminPanel";
import Chatbot from "./Chatbot";
import Profile from "./Profile";
import TopNav from "./TopNav";
import "./index.css";
import "./premium-ui.css";
import "./topnav.css";

const API = "http://localhost:8080/api/costs";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("cloudspendai_token"))
  );

  const [userRole, setUserRole] = useState(() => {
  const token = localStorage.getItem("cloudspendai_token");

  if (!token) return "USER";

  try {
    const payloadPart = token.split(".")[1];

    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const payload = JSON.parse(atob(padded));

    return payload.role || "USER";
  } catch {
    return "USER";
  }
});

  const [authPage, setAuthPage] = useState("login");

  const [records, setRecords] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [showWelcome, setShowWelcome] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [pageTransition, setPageTransition] = useState(false);
  const [trendRange, setTrendRange] = useState("30");
  const [focusPanel, setFocusPanel] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("cloudspendai_theme") || "dark");

const [filters, setFilters] = useState({
  startDate: "",
  endDate: "",
  service: "",
  region: "",
  department: "",
  environment: "",
});

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
  if (isAuthenticated) {
    loadDashboard();
  }
}, [isAuthenticated]);

useEffect(() => {
  localStorage.setItem("cloudspendai_theme", theme);
  document.documentElement.dataset.theme = theme;
}, [theme]);

useEffect(() => {
  function handleAgentActions(event) {
    const actions = Array.isArray(event.detail?.actions)
      ? event.detail.actions
      : [];

    actions.forEach((action) => {
      const type = action?.type;
      const parameters = action?.parameters || {};

      if (type === "navigate") {
        const page = parameters.page;
        const allowedPages = [
          "dashboard",
          "analysis",
          "resources",
          "alerts",
          "profile",
          "admin",
        ];

        if (
          allowedPages.includes(page) &&
          !(page === "admin" && userRole !== "ADMIN")
        ) {
          handlePageChange(page);
        }
        return;
      }

      if (type === "refresh_dashboard") {
        loadDashboard();
        return;
      }

      if (type === "set_filters") {
        setFilters((current) => ({
          ...current,
          startDate: String(parameters.startDate || ""),
          endDate: String(parameters.endDate || ""),
          service: String(parameters.service || ""),
          region: String(parameters.region || ""),
          department: String(parameters.department || ""),
          environment: String(parameters.environment || ""),
        }));
        return;
      }

      if (type === "clear_filters") {
        setFilters({
          startDate: "",
          endDate: "",
          service: "",
          region: "",
          department: "",
          environment: "",
        });
        return;
      }

      if (type === "set_theme") {
        const nextTheme = parameters.theme === "light" ? "light" : "dark";
        setTheme(nextTheme);
        return;
      }

      if (type === "set_trend_range") {
        const range = String(parameters.range || "30");
        if (["7", "30", "90", "all"].includes(range)) {
          setTrendRange(range);
        }
        return;
      }

      if (type === "open_focus") {
        const focusType = parameters.type === "daily" ? "daily" : "spend";
        setFocusPanel({ type: focusType });
        return;
      }

      if (type === "scroll") {
        window.scrollTo({
          top: parameters.target === "bottom"
            ? document.documentElement.scrollHeight
            : 0,
          behavior: "smooth",
        });
      }
    });
  }

  window.addEventListener("cloudspend:agent-actions", handleAgentActions);

  return () => {
    window.removeEventListener(
      "cloudspend:agent-actions",
      handleAgentActions
    );
  };
}, [userRole, activePage]);

async function loadDashboard() {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("cloudspendai_token");

    const response = await fetch(API, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    if (!response.ok) {
      throw new Error("Unable to load cost records.");
    }

    const data = await response.json();

    setRecords(data);
    setToast({ type: "success", message: `Loaded ${data.length.toLocaleString()} cost records.` });
    window.setTimeout(() => setToast(null), 2600);
  } catch (err) {
    console.error(err);

    setError(
      "Could not load dashboard data. Make sure Spring Boot is running on port 8080."
    );
  } finally {
    setLoading(false);
  }
}
const filteredRecords = useMemo(() => {
  return records.filter((record) => {
    const matchesStartDate =
      !filters.startDate ||
      record.usageDate >= filters.startDate;

    const matchesEndDate =
      !filters.endDate ||
      record.usageDate <= filters.endDate;

    const matchesService =
      !filters.service ||
      record.serviceName === filters.service;

    const matchesRegion =
      !filters.region ||
      record.region === filters.region;

    const matchesDepartment =
      !filters.department ||
      record.department === filters.department;

    const matchesEnvironment =
      !filters.environment ||
      record.environment === filters.environment;

    return (
      matchesStartDate &&
      matchesEndDate &&
      matchesService &&
      matchesRegion &&
      matchesDepartment &&
      matchesEnvironment
    );
  });
}, [records, filters]);

const totalCost = useMemo(() => {
  return filteredRecords.reduce(
    (sum, record) => sum + Number(record.cost || 0),
    0
  );
}, [filteredRecords]);

const dailyData = useMemo(() => {
  const grouped = {};

  filteredRecords.forEach((record) => {
    const date = record.usageDate;

    grouped[date] =
      (grouped[date] || 0) + Number(record.cost || 0);
  });

  return Object.entries(grouped)
    .sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB)
    )
    .map(([date, cost]) => ({
      date,
      cost,
    }));
}, [filteredRecords]);

const createBreakdown = (field) => {
  const grouped = {};

  filteredRecords.forEach((record) => {
    const key = record[field];

    grouped[key] =
      (grouped[key] || 0) + Number(record.cost || 0);
  });

  return Object.entries(grouped)
    .map(([name, cost]) => ({
      name,
      cost,
    }))
    .sort((a, b) => b.cost - a.cost);
};

const serviceData = useMemo(
  () => createBreakdown("serviceName"),
  [filteredRecords]
);

const regionData = useMemo(
  () => createBreakdown("region"),
  [filteredRecords]
);

const departmentData = useMemo(
  () => createBreakdown("department"),
  [filteredRecords]
);

const environmentData = useMemo(
  () => createBreakdown("environment"),
  [filteredRecords]
);
  
const services = [
  ...new Set(records.map((record) => record.serviceName)),
].sort();

const regions = [
  ...new Set(records.map((record) => record.region)),
].sort();

const departments = [
  ...new Set(records.map((record) => record.department)),
].sort();

const environments = [
  ...new Set(records.map((record) => record.environment)),
].sort();




  const averageDailyCost =
    dailyData.length > 0 ? totalCost / dailyData.length : 0;

  const displayedDailyData = useMemo(() => {
    if (trendRange === "all") return dailyData;
    const count = Number(trendRange);
    return dailyData.slice(-count);
  }, [dailyData, trendRange]);

    const anomalyStats = useMemo(() => {
  if (dailyData.length < 2) {
    return {
      mean: 0,
      standardDeviation: 0,
      threshold: 0,
    };
  }

  const costs = dailyData.map((day) => Number(day.cost));

  const mean =
    costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

  const variance =
    costs.reduce(
      (sum, cost) => sum + Math.pow(cost - mean, 2),
      0
    ) / costs.length;

  const standardDeviation = Math.sqrt(variance);

  return {
    mean,
    standardDeviation,
    threshold: mean + 2 * standardDeviation,
  };
}, [dailyData]);

const anomalies = useMemo(() => {
  return dailyData.filter(
    (day) => Number(day.cost) > anomalyStats.threshold
  );
}, [dailyData, anomalyStats]);

const forecastData = useMemo(() => {
  if (dailyData.length < 2) {
    return {
      nextDay: 0,
      next7Days: 0,
      trend: 0,
    };
  }

  const firstCost = Number(dailyData[0].cost);
  const lastCost = Number(
    dailyData[dailyData.length - 1].cost
  );

  const trend =
    (lastCost - firstCost) / (dailyData.length - 1);

  const nextDay = Math.max(0, lastCost + trend);

  return {
  nextDay,
  next7Days: nextDay * 7,
  trend,
  dataPoints: dailyData.length,
};
}, [dailyData]);

  /* const anomalies = useMemo(() => {
  if (dailyData.length < 2) {
    return [];
  }

  const costs = dailyData.map((day) => Number(day.cost));

  const mean =
    costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

  const variance =
    costs.reduce(
      (sum, cost) => sum + Math.pow(cost - mean, 2),
      0
    ) / costs.length;

  const standardDeviation = Math.sqrt(variance);

  const threshold = mean + 2 * standardDeviation;

  return dailyData.filter(
    (day) => Number(day.cost) > threshold
  );
}, [dailyData]);*/

  const highestService =
    serviceData.length > 0
      ? [...serviceData].sort((a, b) => b.cost - a.cost)[0]
      : null;

  const highestRegion =
    regionData.length > 0
      ? [...regionData].sort((a, b) => b.cost - a.cost)[0]
      : null;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

function handlePageChange(page) {
  if (page === activePage) {
    setMobileNavOpen(false);
    return;
  }

  setPageTransition(true);
  setMobileNavOpen(false);
  window.setTimeout(() => {
    setActivePage(page);
    window.setTimeout(() => setPageTransition(false), 40);
  }, 140);
}

function handleLogin(data) {
  setIsAuthenticated(true);
  setUserRole(() => {
  const token = localStorage.getItem("cloudspendai_token");

  if (!token) return "USER";

  try {
    const payloadPart = token.split(".")[1];
    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const payload = JSON.parse(atob(padded));

    return payload.role || "USER";
  } catch {
    return "USER";
  }
});
  setShowWelcome(true);
  setActivePage("dashboard");
  setAuthPage("login");
}

function handleSignUp() {
  setAuthPage("login");
}

function handleLogout() {
  localStorage.removeItem("cloudspendai_token");
  localStorage.removeItem("cloudspendai_user");

setIsAuthenticated(false);
setUserRole("USER");
setShowWelcome(false);
setAuthPage("login");
setRecords([]);
setActivePage("dashboard");
}

  if (!isAuthenticated) {
    return (
      <Auth
        initialMode={authPage}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
      />
    );
  }


return (
  <div className={`app theme-${theme}`}>
{showWelcome && (
  userRole === "ADMIN" ? (
    <AdminWelcomeLanding
      records={records}
      onComplete={() => setShowWelcome(false)}
    />
  ) : (
    <WelcomeLanding
      records={records}
      onComplete={() => setShowWelcome(false)}
    />
  )
)}
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">☁</div>
          <div>
            <h2>CloudSpend</h2>
            <span>AI Cost Intelligence</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {[
            ["dashboard", "▦", "Dashboard"],
            ["analysis", "◈", "Cost Analysis"],
            ["resources", "◉", "Resources"],
            ["alerts", "⚠", "Cost Alerts"],
            ["profile", "◎", "My Profile"],
            ...(userRole === "ADMIN" ? [["admin", "🛡", "Admin Center"]] : []),
          ].map(([page, icon, label]) => (
            <button
              type="button"
              key={page}
              className={`nav-item ${activePage === page ? "active" : ""}`}
              onClick={() => handlePageChange(page)}
              aria-current={activePage === page ? "page" : undefined}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
              {activePage === page && <span className="nav-active-glow" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span className="theme-toggle-copy">{theme === "dark" ? "☀" : "☾"} {theme === "dark" ? "Light mode" : "Dark mode"}</span>
            <span className="theme-toggle-switch"><span /></span>
          </button>

          <div className="sidebar-ai-card">
            <div className="sidebar-ai-orb">✦</div>
            <div>
              <strong>AI Cost Analyst</strong>
              <span>Ask about your cloud spend</span>
            </div>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            <span>Local system online</span>
          </div>

          <small>CloudSpend AI v1.0</small>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            ↪ Sign out
          </button>
        </div>
      </aside>

{/* Main */}
<main
  className={`main ${pageTransition ? "page-transitioning" : ""} ${
    activePage === "analysis"
      ? "analysis-mode"
      : activePage === "alerts"
      ? "alerts-mode"
      : ""
  }`}
>
<TopNav
  records={records}
  userRole={userRole}
  activePage={activePage}
  onNavigate={handlePageChange}
  onRefresh={loadDashboard}
  onLogout={handleLogout}
  onOpenMobileNav={() => setMobileNavOpen(true)}
/>
{activePage === "analysis" ? (
  <CostAnalysis />
) : activePage === "alerts" ? (
  <CostAlerts />
) : activePage === "resources" ? (
  <Resources />
) : activePage === "profile" ? (
  <Profile userRole={userRole} onNavigate={handlePageChange} />
) : activePage === "admin" ? (
  <AdminPanel records={records} onRefresh={loadDashboard} />
) : (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">CLOUD COST MANAGEMENT</p>
          <h1>Cost Visibility Dashboard</h1>
          <p className="subtitle">
            Monitor and understand your cloud spending in one place.
          </p>
        </div>

        <button className="refresh-button" onClick={loadDashboard}>
          ↻ Refresh Data
        </button>
      </header>

      {error && <div className="error-box">⚠ {error}</div>}

      <FilterBar
        services={services}
        regions={regions}
        departments={departments}
        environments={environments}
        filters={filters}
        setFilters={setFilters}
        onReset={() =>
          setFilters({
            startDate: "",
            endDate: "",
            service: "",
            region: "",
            department: "",
            environment: "",
          })
        }
      />

      {loading ? (
        <div className="loading">
          <div className="loader"></div>
          <p>Loading cloud cost data...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <section className="stats-grid">
            <button type="button" className="stat-card primary stat-card-button" onClick={() => setFocusPanel({ type: "spend" })}>
              <div className="stat-top">
                <span>Total Cloud Cost</span>
                <div className="stat-icon">💰</div>
              </div>

              <div className="stat-value">
                {formatCurrency(totalCost)}
              </div>

              <div className="stat-description">
                Across all recorded resources
              </div>
            </button>

            <button type="button" className="stat-card stat-card-button" onClick={() => setFocusPanel({ type: "daily" })}>
              <div className="stat-top">
                <span>Average Daily Cost</span>
                <div className="stat-icon">📊</div>
              </div>

              <div className="stat-value">
                {formatCurrency(averageDailyCost)}
              </div>

              <div className="stat-description">
                Based on {dailyData.length} days of data
              </div>
            </button>

            <button type="button" className="stat-card stat-card-button" onClick={() => highestService && setFilters((current) => ({ ...current, service: highestService.name }))}>
              <div className="stat-top">
                <span>Top Service</span>
                <div className="stat-icon">☁</div>
              </div>

              <div className="stat-value small">
                {highestService?.name || "N/A"}
              </div>

              <div className="stat-description">
                {highestService
                  ? formatCurrency(highestService.cost)
                  : "No data"}
              </div>
            </button>

            <button type="button" className="stat-card stat-card-button" onClick={() => highestRegion && setFilters((current) => ({ ...current, region: highestRegion.name }))}>
              <div className="stat-top">
                <span>Top Region</span>
                <div className="stat-icon">🌍</div>
              </div>

              <div className="stat-value small">
                {highestRegion?.name || "N/A"}
              </div>

              <div className="stat-description">
                {highestRegion
                  ? formatCurrency(highestRegion.cost)
                  : "No data"}
              </div>
            </button>
          </section>

          <section className="dashboard-command-bar">
            <div>
              <span className="command-kicker">COST INTELLIGENCE</span>
              <h2>Explore your cloud spend</h2>
              <p>Use the controls below to move from overview to focused analysis without leaving the dashboard.</p>
            </div>
            <div className="command-actions">
              <button type="button" onClick={() => handlePageChange("analysis")}>Open analytics <span>→</span></button>
              <button type="button" onClick={() => handlePageChange("alerts")}>Review alerts <span>→</span></button>
            </div>
          </section>

          {/* Cost Anomaly Detection */}
          {anomalies.length > 0 && (
            <section className="anomaly-card">
              <h2>🚨 Cost Anomaly Detection</h2>

              <p>
                We detected <strong>{anomalies.length}</strong>{" "}
                statistically unusual spending day(s).
              </p>

              <p>
                Average daily cost:{" "}
                <strong>{formatCurrency(anomalyStats.mean)}</strong>
                {" | "}
                Anomaly threshold:{" "}
                <strong>
                  {formatCurrency(anomalyStats.threshold)}
                </strong>
              </p>

              <div className="anomaly-list">
                {anomalies.map((day) => (
                  <div className="anomaly-item" key={day.date}>
                    <strong>{day.date}</strong>

                    <span>{formatCurrency(day.cost)}</span>

                    <small>
                      {(
                        (day.cost / anomalyStats.threshold - 1) *
                        100
                      ).toFixed(1)}
                      % above anomaly threshold
                    </small>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cost Forecast */}
          <section className="forecast-card">
            <div className="forecast-header">
              <div>
                <h2>📈 Cost Forecast</h2>
                <p>
                  Estimated cloud spending based on historical daily
                  costs.
                </p>
              </div>
            </div>

            <div className="forecast-grid">
              <div className="forecast-item">
                <span>Next Day Forecast</span>
                <strong>
                  {formatCurrency(forecastData.nextDay)}
                </strong>
              </div>

              <div className="forecast-item">
                <span>Next 7 Days Forecast</span>
                <strong>
                  {formatCurrency(forecastData.next7Days)}
                </strong>
              </div>

              <div className="forecast-item">
                <span>Daily Spending Trend</span>
                <strong>
                  {forecastData.trend >= 0 ? "+" : ""}
                  {formatCurrency(forecastData.trend)}
                </strong>

                <small>
                  Based on {forecastData.dataPoints} days of
                  historical data
                </small>
              </div>
            </div>
          </section>

          {/* Daily Trend */}
          <section className="card chart-large">
            <div className="card-header">
              <div>
                <h2>Daily Cost Trend</h2>
                <p>Cloud spending over time</p>
              </div>

              <div className="trend-controls" aria-label="Trend range">
                {[['7','7D'],['30','30D'],['90','90D'],['all','ALL']].map(([value,label]) => (
                  <button key={value} type="button" className={trendRange === value ? "active" : ""} onClick={() => setTrendRange(value)}>{label}</button>
                ))}
              </div>
              <span className="badge">LIVE DATA</span>
            </div>

            <ResponsiveContainer width="100%" height={330}>
              <AreaChart data={displayedDailyData}>
                <defs>
                  <linearGradient
                    id="costGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#6366f1"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.12}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value ? String(value).slice(5) : ""
                  }
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value}`}
                />

                <Tooltip
                  formatter={(value) => [
                    formatCurrency(value),
                    "Cost",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#costGradient)"
                  animationBegin={100}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Service + Region */}
          <section className="two-column">
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Cost by Azure Service</h2>
                  <p>Where your money is going</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.1}
                  />

                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Cost",
                    ]}
                  />

                  <Bar
                    dataKey="cost"
                    fill="#6366f1"
                    radius={[0, 6, 6, 0]}
                    animationBegin={200}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Cost by Region</h2>
                  <p>Geographic spending distribution</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={regionData}
                    dataKey="cost"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={3}
                    label
                    animationBegin={300}
                    animationDuration={1300}
                    animationEasing="ease-out"
                  >
                    {regionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Cost",
                    ]}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Department + Environment */}
          <section className="two-column">
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Cost by Department</h2>
                  <p>Department-level cloud spending</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={departmentData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.1}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis tick={{ fontSize: 11 }} />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Cost",
                    ]}
                  />

                  <Bar
                    dataKey="cost"
                    fill="#06b6d4"
                    radius={[6, 6, 0, 0]}
                    animationBegin={400}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Cost by Environment</h2>
                  <p>Production vs non-production</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={environmentData}
                    dataKey="cost"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={50}
                    paddingAngle={4}
                    label
                    animationBegin={500}
                    animationDuration={1300}
                    animationEasing="ease-out"
                  >
                    {environmentData.map((entry, index) => (
                      <Cell
                        key={`environment-${index}`}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(value),
                      "Cost",
                    ]}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </>
  )}
</main>
{focusPanel && (
  <div className="focus-overlay" role="presentation" onClick={() => setFocusPanel(null)}>
    <section className="focus-modal" role="dialog" aria-modal="true" aria-label="Cost detail" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="focus-close" onClick={() => setFocusPanel(null)} aria-label="Close">×</button>
      <span className="command-kicker">FOCUS VIEW</span>
      <h2>{focusPanel.type === "spend" ? "Total cloud spend" : "Average daily cost"}</h2>
      <strong>{formatCurrency(focusPanel.type === "spend" ? totalCost : averageDailyCost)}</strong>
      <p>{focusPanel.type === "spend" ? `Calculated from ${filteredRecords.length.toLocaleString()} records currently matching your filters.` : `Calculated across ${dailyData.length} recorded usage days.`}</p>
      <div className="focus-actions">
        <button type="button" onClick={() => { setFocusPanel(null); handlePageChange("analysis"); }}>Open Cost Analysis →</button>
        <button type="button" onClick={() => setFocusPanel(null)}>Close</button>
      </div>
    </section>
  </div>
)}
{toast && (
  <div className={`app-toast ${toast.type}`} role="status">
    <span>{toast.type === "success" ? "✓" : "!"}</span>
    <div>
      <strong>{toast.type === "success" ? "Updated" : "Notice"}</strong>
      <p>{toast.message}</p>
    </div>
    <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
  </div>
)}
<Chatbot />
    </div>
  );
}

export default App;