import { useMemo, useState } from "react";
import "../styles/welcome.css";

function identity() {
  try {
    const stored = JSON.parse(localStorage.getItem("cloudspendai_user") || "{}");
    const profile = JSON.parse(localStorage.getItem("cloudspendai_profile") || "{}");
    const token = localStorage.getItem("cloudspendai_token");
    let payload = {};
    if (token) {
      const part = token.split(".")[1];
      const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(part.length + ((4 - (part.length % 4)) % 4), "=");
      payload = JSON.parse(atob(padded));
    }
    const email = payload.sub || payload.email || stored.email || "";
    return { name: profile.displayName || stored.name || (email ? email.split("@")[0] : "there"), email };
  } catch {
    return { name: "there", email: "" };
  }
}

export default function WelcomeLanding({ onComplete, records = [] }) {
  const [closing, setClosing] = useState(false);
  const user = identity();
  const stats = useMemo(() => {
    const total = records.reduce((sum, record) => sum + Number(record.cost || 0), 0);
    const days = new Set(records.map((r) => r.usageDate).filter(Boolean)).size;
    const services = new Set(records.map((r) => r.serviceName).filter(Boolean)).size;
    const regions = new Set(records.map((r) => r.region).filter(Boolean)).size;
    return { total, daily: days ? total / days : 0, services, regions };
  }, [records]);

  const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  function enter() {
    setClosing(true);
    window.setTimeout(() => onComplete?.(), 360);
  }

  return (
    <div className={`professional-welcome ${closing ? "is-closing" : ""}`}>
      <div className="welcome-ambient welcome-ambient-one" />
      <div className="welcome-ambient welcome-ambient-two" />
      <div className="welcome-grid-lines" />

      <header className="welcome-nav">
        <div className="welcome-brand">
          <div className="welcome-brand-icon">☁</div>
          <div><strong>CloudSpend<span>AI</span></strong><small>AI Cost Intelligence</small></div>
        </div>
        <div className="welcome-secure"><span /> Secure workspace · Local AI</div>
      </header>

      <main className="welcome-main">
        <section className="welcome-copy">
          <div className="welcome-kicker"><span /> YOUR CLOUD WORKSPACE IS READY</div>
          <h1>Good to see you,<br /><span>{user.name}</span>.</h1>
          <p>Get a clear view of cloud spending, uncover the biggest cost drivers, and use CloudSpend AI to explore your data faster.</p>

          <div className="welcome-actions">
            <button type="button" className="welcome-primary" onClick={enter}>Open CloudSpend <span>→</span></button>
            <div className="welcome-note"><span>✦</span> Your data stays in your local environment.</div>
          </div>

          <div className="welcome-metrics">
            <div><span>Total spend</span><strong>{money(stats.total)}</strong></div>
            <div><span>Avg. daily</span><strong>{money(stats.daily)}</strong></div>
            <div><span>Services</span><strong>{stats.services}</strong></div>
            <div><span>Regions</span><strong>{stats.regions}</strong></div>
          </div>
        </section>

        <section className="welcome-preview" aria-label="CloudSpend dashboard preview">
          <div className="preview-glow" />
          <div className="preview-window">
            <div className="preview-topbar"><div className="preview-search">⌕ Search costs, services, resources...</div><div className="preview-icons">◌　◉　<span>{user.name.slice(0, 1).toUpperCase()}</span></div></div>
            <div className="preview-content">
              <div className="preview-heading"><div><small>CLOUD COST MANAGEMENT</small><h2>Cost Visibility Dashboard</h2></div><span>LIVE DATA</span></div>
              <div className="preview-stats">
                <div><small>Total Cloud Spend</small><strong>{money(stats.total)}</strong><em>Across recorded resources</em></div>
                <div><small>Average Daily Spend</small><strong>{money(stats.daily)}</strong><em>Historical daily average</em></div>
                <div><small>Services</small><strong>{stats.services}</strong><em>Cloud services tracked</em></div>
              </div>
              <div className="preview-grid">
                <div className="preview-chart"><div className="preview-card-title">Spend trend <span>30D</span></div><div className="fake-chart"><i/><i/><i/><i/><i/><i/><i/></div></div>
                <div className="preview-donut"><div className="preview-card-title">Top cost drivers</div><div className="donut-ring"><span>{money(stats.total)}</span></div><small>Compute · Storage · Database</small></div>
              </div>
              <div className="preview-ai"><span>✦</span><div><strong>CloudSpend AI</strong><small>Ask questions about your cloud spend and get verified answers.</small></div><b>Ask AI →</b></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="welcome-footer"><span>MONITOR</span><i /> <span>ANALYZE</span><i /> <span>OPTIMIZE</span><i /> <span>ACT</span></footer>
    </div>
  );
}
