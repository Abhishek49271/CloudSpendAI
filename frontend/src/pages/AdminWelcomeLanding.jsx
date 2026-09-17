import { useMemo, useState } from "react";
import "./adminWelcome.css";

function getAdminName() {
  try {
    const stored = JSON.parse(localStorage.getItem("cloudspendai_user") || "{}");
    const profile = JSON.parse(localStorage.getItem("cloudspendai_profile") || "{}");
    return profile.displayName || stored.name || "Administrator";
  } catch { return "Administrator"; }
}

export default function AdminWelcomeLanding({ onComplete, records = [] }) {
  const [closing, setClosing] = useState(false);
  const name = getAdminName();
  const stats = useMemo(() => {
    const total = records.reduce((sum, r) => sum + Number(r.cost || 0), 0);
    const services = new Set(records.map((r) => r.serviceName).filter(Boolean)).size;
    const resources = new Set(records.map((r) => r.resourceName).filter(Boolean)).size;
    const regions = new Set(records.map((r) => r.region).filter(Boolean)).size;
    return { total, services, resources, regions };
  }, [records]);
  const money = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  function enter() {
    setClosing(true);
    window.setTimeout(() => onComplete?.(), 360);
  }

  return (
    <div className={`professional-admin-welcome ${closing ? "is-closing" : ""}`}>
      <div className="admin-welcome-glow admin-welcome-glow-one" /><div className="admin-welcome-glow admin-welcome-glow-two" /><div className="admin-welcome-grid" />
      <header className="admin-welcome-nav"><div className="admin-welcome-brand"><div>🛡</div><span><strong>CloudSpend<span>AI</span></strong><small>Administration</small></span></div><div className="admin-secure"><span /> ADMINISTRATOR · SECURE WORKSPACE</div></header>
      <main className="admin-welcome-main">
        <section className="admin-welcome-copy">
          <div className="admin-kicker"><span>✓</span> ADMIN ACCESS VERIFIED</div>
          <h1>Welcome back,<br /><span>{name}</span>.</h1>
          <p>Manage organization-wide cloud visibility, cost data operations, alerts, and AI-assisted analysis from one control center.</p>
          <div className="admin-welcome-actions"><button type="button" onClick={enter}>Enter Admin Center <b>→</b></button><small><span>●</span> Backend · Database · AI ready</small></div>
          <div className="admin-metrics"><div><span>Organization spend</span><strong>{money(stats.total)}</strong></div><div><span>Resources</span><strong>{stats.resources}</strong></div><div><span>Services</span><strong>{stats.services}</strong></div><div><span>Regions</span><strong>{stats.regions}</strong></div></div>
        </section>
        <section className="admin-preview"><div className="admin-preview-window"><div className="admin-preview-head"><div className="admin-mini-search">⌕ Search organization data...</div><div>◌　🛡　<span>{name.slice(0,1).toUpperCase()}</span></div></div><div className="admin-preview-content"><div className="admin-preview-title"><div><small>ADMINISTRATION</small><h2>Organization Overview</h2></div><em>ADMIN</em></div><div className="admin-preview-cards"><div><small>Total spend</small><strong>{money(stats.total)}</strong><span>All cloud records</span></div><div><small>Resources</small><strong>{stats.resources}</strong><span>Tracked infrastructure</span></div><div><small>Data coverage</small><strong>98%</strong><span>Healthy</span></div></div><div className="admin-preview-lower"><div className="admin-fake-chart"><div className="admin-card-label">Organization spend trend</div><div className="admin-lines"><i/><i/><i/><i/><i/></div></div><div className="admin-system-card"><div className="admin-card-label">System overview</div><p><span>●</span> Ollama AI <b>Online</b></p><p><span>●</span> PostgreSQL <b>Connected</b></p><p><span>●</span> Spring Boot <b>Running</b></p><p><span>●</span> React frontend <b>Running</b></p></div></div><div className="admin-ai-strip"><span>✦</span><div><strong>CloudSpend AI · Admin</strong><small>Ask about organization spend, alerts, users, or system health.</small></div><b>Open AI →</b></div></div></div></section>
      </main>
      <footer className="admin-welcome-footer"><span>GOVERN</span><i/><span>MONITOR</span><i/><span>ANALYZE</span><i/><span>OPTIMIZE</span></footer>
    </div>
  );
}
