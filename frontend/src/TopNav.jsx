import { useEffect, useMemo, useRef, useState } from "react";

function getIdentity() {
  let tokenUser = {};
  try {
    const token = localStorage.getItem("cloudspendai_token");
    if (token) {
      const part = token.split(".")[1];
      const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(part.length + ((4 - (part.length % 4)) % 4), "=");
      tokenUser = JSON.parse(atob(padded));
    }
  } catch {}

  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem("cloudspendai_user") || "{}");
  } catch {}

  let profile = {};
  try {
    profile = JSON.parse(localStorage.getItem("cloudspendai_profile") || "{}");
  } catch {}

  const email = tokenUser.sub || tokenUser.email || stored.email || "";
  const role = tokenUser.role || stored.role || "USER";
  const displayName = profile.displayName || stored.name || (email ? email.split("@")[0] : "CloudSpend User");

  return { email, role, displayName, photo: localStorage.getItem("cloudspendai_profile_photo") || "" };
}

export default function TopNav({ records = [], userRole = "USER", activePage = "dashboard", onNavigate, onRefresh, onLogout, onOpenMobileNav }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [identity, setIdentity] = useState(getIdentity);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const refreshIdentity = () => setIdentity(getIdentity());
    window.addEventListener("storage", refreshIdentity);
    window.addEventListener("cloudspend:profile-updated", refreshIdentity);
    return () => {
      window.removeEventListener("storage", refreshIdentity);
      window.removeEventListener("cloudspend:profile-updated", refreshIdentity);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const anomalyItems = useMemo(() => {
    const grouped = new Map();
    records.forEach((record) => {
      const date = record.usageDate;
      if (!date) return;
      grouped.set(date, (grouped.get(date) || 0) + Number(record.cost || 0));
    });
    const values = [...grouped.values()];
    if (values.length < 3) return [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const sd = Math.sqrt(variance);
    if (!sd) return [];
    return [...grouped.entries()]
      .map(([date, cost]) => ({ date, cost, z: (cost - mean) / sd }))
      .filter((item) => Math.abs(item.z) >= 2)
      .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
      .slice(0, 5);
  }, [records]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const services = [...new Set(records.map((r) => r.serviceName).filter(Boolean))];
    const regions = [...new Set(records.map((r) => r.region).filter(Boolean))];
    const resources = [...new Set(records.map((r) => r.resourceName).filter(Boolean))];
    return [
      ...services.filter((x) => x.toLowerCase().includes(q)).slice(0, 4).map((x) => ({ type: "service", label: x, page: "analysis" })),
      ...regions.filter((x) => x.toLowerCase().includes(q)).slice(0, 3).map((x) => ({ type: "region", label: x, page: "analysis" })),
      ...resources.filter((x) => x.toLowerCase().includes(q)).slice(0, 3).map((x) => ({ type: "resource", label: x, page: "resources" })),
    ].slice(0, 7);
  }, [records, query]);

  const initials = identity.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "CS";

  function chooseSearch(result) {
    onNavigate?.(result.page);
    setQuery("");
    setSearchOpen(false);
  }

  return (
    <header className="topnav-shell">
      <div className="topnav-left">
        <button type="button" className="topnav-mobile-menu" onClick={onOpenMobileNav} aria-label="Open navigation">☰</button>
        <div className="topnav-search-wrap">
          <span className="topnav-search-icon">⌕</span>
          <input
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onKeyDown={(e) => { if (e.key === "Escape") setSearchOpen(false); }}
            placeholder="Search costs, services, regions, resources..."
            aria-label="Search CloudSpend"
          />
          <kbd>⌘ K</kbd>
          {searchOpen && query.trim() && (
            <div className="topnav-search-results">
              {searchResults.length ? searchResults.map((result) => (
                <button type="button" key={`${result.type}-${result.label}`} onClick={() => chooseSearch(result)}>
                  <span>{result.type === "service" ? "☁" : result.type === "region" ? "◎" : "◈"}</span>
                  <div><strong>{result.label}</strong><small>{result.type} · Open {result.page === "analysis" ? "analysis" : "resources"}</small></div>
                  <b>→</b>
                </button>
              )) : <div className="topnav-no-results">No matching workspace data found.</div>}
            </div>
          )}
        </div>
      </div>

      <div className="topnav-actions">
        <button type="button" className="topnav-refresh" onClick={onRefresh} title="Refresh data">↻</button>

        <div className="topnav-dropdown" ref={notificationRef}>
          <button type="button" className={`topnav-icon-button ${notificationsOpen ? "open" : ""}`} onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false); }} aria-label="Notifications">
            🔔
            {anomalyItems.length > 0 && <span className="topnav-count">{anomalyItems.length}</span>}
          </button>
          {notificationsOpen && (
            <div className="topnav-popover notification-popover">
              <div className="popover-heading"><div><strong>Notifications</strong><span>Recent workspace signals</span></div><span className="popover-badge">{anomalyItems.length}</span></div>
              {anomalyItems.length ? anomalyItems.map((item) => (
                <button type="button" className="notification-row" key={item.date} onClick={() => { onNavigate?.("alerts"); setNotificationsOpen(false); }}>
                  <span className="notification-alert">!</span>
                  <div><strong>Unusual daily spend</strong><small>{item.date} · z-score {item.z.toFixed(1)}</small></div>
                  <b>→</b>
                </button>
              )) : <div className="popover-empty"><span>✓</span><div><strong>You're all caught up</strong><small>No current anomaly signals.</small></div></div>}
              <button type="button" className="popover-footer-action" onClick={() => { onNavigate?.("alerts"); setNotificationsOpen(false); }}>Open Cost Alerts →</button>
            </div>
          )}
        </div>

        <div className="topnav-dropdown" ref={profileRef}>
          <button type="button" className={`topnav-profile-button ${profileOpen ? "open" : ""}`} onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false); }}>
            <span className="topnav-avatar">{identity.photo ? <img src={identity.photo} alt="" /> : initials}</span>
            <span className="topnav-user-copy"><strong>{identity.displayName}</strong><small>{userRole === "ADMIN" ? "Administrator" : "Cloud Engineer"}</small></span>
            <span className="topnav-chevron">⌄</span>
          </button>
          {profileOpen && (
            <div className="topnav-popover profile-popover">
              <div className="profile-popover-head"><span className="topnav-avatar large">{identity.photo ? <img src={identity.photo} alt="" /> : initials}</span><div><strong>{identity.displayName}</strong><small>{identity.email || "Signed-in account"}</small><em>{userRole}</em></div></div>
              <button type="button" onClick={() => { onNavigate?.("profile"); setProfileOpen(false); }}>◎ <span>My Profile</span><b>→</b></button>
              {userRole === "ADMIN" && <button type="button" onClick={() => { onNavigate?.("admin"); setProfileOpen(false); }}>🛡 <span>Admin Center</span><b>→</b></button>}
              <button type="button" onClick={() => { onNavigate?.("dashboard"); setProfileOpen(false); }}>▦ <span>Dashboard</span><b>→</b></button>
              <div className="profile-divider" />
              <button type="button" className="profile-logout" onClick={onLogout}>↪ <span>Sign out</span></button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
