import { useEffect, useMemo, useState } from "react";

const API = `${import.meta.env.VITE_API_URL}/api/costs`;

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getSeverity(score) {
  if (score >= 3) return "Critical";
  if (score >= 2) return "High";
  if (score >= 1) return "Medium";
  return "Low";
}

function severityRank(severity) {
  return {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  }[severity] || 0;
}

export default function CostAlerts() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
const [statusFilter, setStatusFilter] = useState("All");
  const [alertStatuses, setAlertStatuses] = useState({});
  const [notification, setNotification] = useState(null);

  const playNotificationSound = (type) => {
  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) return;

  const audioContext = new AudioContext();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (type === "acknowledged") {
    oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(
      660,
      audioContext.currentTime + 0.08
    );
  } else if (type === "resolved") {
    oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(
      700,
      audioContext.currentTime + 0.08
    );
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime + 0.16
    );
  } else {
    oscillator.frequency.setValueAtTime(700, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(
      520,
      audioContext.currentTime + 0.1
    );
  }

  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(
    0.0001,
    audioContext.currentTime
  );

  gainNode.gain.exponentialRampToValueAtTime(
    0.08,
    audioContext.currentTime + 0.02
  );

  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.3
  );

  oscillator.start();

  oscillator.stop(audioContext.currentTime + 0.32);

  oscillator.onended = () => {
    audioContext.close();
  };
};

const showNotification = (type, title, message) => {
  playNotificationSound(type);

  setNotification({
    type,
    title,
    message,
  });

  setTimeout(() => {
    setNotification(null);
  }, 3000);
};

  const loadData = async () => {
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
        throw new Error("Failed to load cost data.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected API response.");
      }

      setRecords(data);
    } catch (err) {
      setError(err.message || "Unable to load cost data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const analysis = useMemo(() => {
    if (!records.length) {
      return {
        dailyData: [],
        serviceData: [],
        regionData: [],
        totalCost: 0,
        meanDaily: 0,
        stdDaily: 0,
        alerts: [],
      };
    }

    const dailyMap = {};
    const serviceMap = {};
    const regionMap = {};

    records.forEach((record) => {
const date = String(record.usageDate || "").slice(0, 10);

const service = record.serviceName || "Unknown Service";

const region = record.region || "Unknown Region";

const cost = Number(record.cost);

      if (date) {
        dailyMap[date] = (dailyMap[date] || 0) + cost;
      }

      serviceMap[service] = (serviceMap[service] || 0) + cost;
      regionMap[region] = (regionMap[region] || 0) + cost;
    });

    const dailyData = Object.entries(dailyMap)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const serviceData = Object.entries(serviceMap)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);

    const regionData = Object.entries(regionMap)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);

    const totalCost = records.reduce(
  (sum, record) => sum + Number(record.cost),
  0
);

    const dailyValues = dailyData.map((item) => item.cost);

    const meanDaily =
      dailyValues.length > 0
        ? dailyValues.reduce((sum, value) => sum + value, 0) /
          dailyValues.length
        : 0;

    const variance =
      dailyValues.length > 0
        ? dailyValues.reduce(
            (sum, value) => sum + Math.pow(value - meanDaily, 2),
            0
          ) / dailyValues.length
        : 0;

    const stdDaily = Math.sqrt(variance);

    const alerts = [];

    // --------------------------------------------------
    // 1. DAILY COST SPIKE ALERTS
    // --------------------------------------------------
    dailyData.forEach((day) => {
      if (stdDaily === 0) return;

      const zScore = (day.cost - meanDaily) / stdDaily;

      if (zScore >= 1) {
        const severity = getSeverity(zScore);

        alerts.push({
          id: `daily-${day.date}`,
          type: "Daily Cost Spike",
          severity,
          title: `${severity} daily spending spike detected`,
          description: `Cloud spending reached ${formatCurrency(
            day.cost
          )} on ${formatDate(day.date)}, which is significantly above the normal daily average.`,
          date: day.date,
          amount: day.cost,
          metric: `${zScore.toFixed(1)}σ above average`,
        });
      }
    });

    // --------------------------------------------------
    // 2. SERVICE CONCENTRATION ALERT
    // --------------------------------------------------
    if (serviceData.length > 0 && totalCost > 0) {
      const topService = serviceData[0];
      const percentage = (topService.cost / totalCost) * 100;

      if (percentage >= 40) {
        const severity = percentage >= 60 ? "High" : "Medium";

        alerts.push({
          id: `service-concentration-${topService.name}`,
          type: "Service Concentration",
          severity,
          title: `${topService.name} dominates cloud spending`,
          description: `${topService.name} represents ${percentage.toFixed(
            1
          )}% of the total recorded cloud cost.`,
          date: dailyData[dailyData.length - 1]?.date || "",
          amount: topService.cost,
          metric: `${percentage.toFixed(1)}% of total`,
        });
      }
    }

    // --------------------------------------------------
    // 3. REGIONAL CONCENTRATION ALERT
    // --------------------------------------------------
    if (regionData.length > 0 && totalCost > 0) {
      const topRegion = regionData[0];
      const percentage = (topRegion.cost / totalCost) * 100;

      if (percentage >= 35) {
        const severity = percentage >= 55 ? "High" : "Medium";

        alerts.push({
          id: `region-concentration-${topRegion.name}`,
          type: "Regional Concentration",
          severity,
          title: `${topRegion.name} has unusually high cost concentration`,
          description: `${topRegion.name} accounts for ${percentage.toFixed(
            1
          )}% of total cloud spending.`,
          date: dailyData[dailyData.length - 1]?.date || "",
          amount: topRegion.cost,
          metric: `${percentage.toFixed(1)}% of total`,
        });
      }
    }

    // --------------------------------------------------
    // 4. SERVICE SURGE ALERT
    // --------------------------------------------------
    if (dailyData.length >= 14) {
      const recentDates = new Set(
        dailyData.slice(-7).map((item) => item.date)
      );

      const previousDates = new Set(
        dailyData.slice(-14, -7).map((item) => item.date)
      );

      const recentServiceMap = {};
      const previousServiceMap = {};

      records.forEach((record) => {
  const date = String(record.usageDate || "").slice(0, 10);

const service = record.serviceName || "Unknown Service";

const cost = Number(record.cost);

        if (recentDates.has(date)) {
          recentServiceMap[service] =
            (recentServiceMap[service] || 0) + cost;
        }

        if (previousDates.has(date)) {
          previousServiceMap[service] =
            (previousServiceMap[service] || 0) + cost;
        }
      });

      Object.entries(recentServiceMap).forEach(
        ([service, recentCost]) => {
          const previousCost = previousServiceMap[service] || 0;

          if (previousCost <= 0) return;

          const percentageIncrease =
            ((recentCost - previousCost) / previousCost) * 100;

          if (percentageIncrease >= 25) {
            let severity = "Medium";

            if (percentageIncrease >= 75) {
              severity = "Critical";
            } else if (percentageIncrease >= 50) {
              severity = "High";
            }

            alerts.push({
              id: `service-surge-${service}`,
              type: "Service Cost Surge",
              severity,
              title: `${service} spending increased sharply`,
              description: `${service} cost increased ${percentageIncrease.toFixed(
                1
              )}% during the latest 7-day period compared with the previous 7 days.`,
              date: dailyData[dailyData.length - 1]?.date || "",
              amount: recentCost,
              metric: `+${percentageIncrease.toFixed(1)}%`,
            });
          }
        }
      );
    }

    alerts.sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity)
    );

    return {
      dailyData,
      serviceData,
      regionData,
      totalCost,
      meanDaily,
      stdDaily,
      alerts,
    };
  }, [records]);

 const getAlertStatus = (alert) => {
  return alertStatuses[alert.id] || "New";
};

const activeAlerts = analysis.alerts.filter((alert) => {
  const status = getAlertStatus(alert);
  return status === "New" || status === "Acknowledged";
});

const acknowledgedAlerts = analysis.alerts.filter(
  (alert) => getAlertStatus(alert) === "Acknowledged"
);

const resolvedAlerts = analysis.alerts.filter(
  (alert) => getAlertStatus(alert) === "Resolved"
);

const displayedAlerts =
  statusFilter === "All"
    ? analysis.alerts
    : statusFilter === "New"
    ? analysis.alerts.filter(
        (alert) => getAlertStatus(alert) === "New"
      )
    : statusFilter === "Acknowledged"
    ? acknowledgedAlerts
    : resolvedAlerts;

  const filteredAlerts = displayedAlerts.filter((alert) => {
    if (severityFilter === "All") return true;
    return alert.severity === severityFilter;
  });

  const criticalCount = activeAlerts.filter(
    (alert) => alert.severity === "Critical"
  ).length;

  const highCount = activeAlerts.filter(
    (alert) => alert.severity === "High"
  ).length;

const acknowledgeAlert = (id) => {
  setAlertStatuses((previous) => ({
    ...previous,
    [id]: "Acknowledged",
  }));

  showNotification(
    "acknowledged",
    "Alert acknowledged",
    "The alert is now being investigated."
  );
};

const resolveAlert = (id) => {
  setAlertStatuses((previous) => ({
    ...previous,
    [id]: "Resolved",
  }));

  showNotification(
    "resolved",
    "Alert resolved",
    "The alert has been marked as resolved."
  );
};

const reopenAlert = (id) => {
  setAlertStatuses((previous) => ({
    ...previous,
    [id]: "New",
  }));

  showNotification(
    "reopened",
    "Alert reopened",
    "The alert has been moved back to New."
  );
};

  return (
    <section className="alerts-page">

        {notification && (
  <div className={`alert-notification ${notification.type}`}>
    <div className="notification-icon">
      {notification.type === "acknowledged"
        ? "✓"
        : notification.type === "resolved"
        ? "✓"
        : "↻"}
    </div>

    <div className="notification-content">
      <strong>{notification.title}</strong>
      <span>{notification.message}</span>
    </div>

    <button
      className="notification-close"
      onClick={() => setNotification(null)}
      aria-label="Close notification"
    >
      ×
    </button>
  </div>
)}
      <div className="alerts-topbar">
        <div>
          <div className="page-eyebrow">CLOUDSPEND AI</div>
          <h1>Cost Alerts</h1>
          <p>
            Monitor unusual spending patterns and identify potential cloud
            cost risks before they become expensive problems.
          </p>
        </div>

        <button className="refresh-btn" onClick={loadData}>
          ↻ Refresh Alerts
        </button>
      </div>

      {error && (
        <div className="error-box">
          <strong>Unable to load alerts</strong>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <span>Analyzing cloud spending...</span>
        </div>
      ) : (
        <>
          <div className="alert-stats-grid">
            <div className="card alert-stat-card">
              <div className="alert-stat-icon">⚡</div>
              <div>
                <span>Active Alerts</span>
                <strong>{activeAlerts.length}</strong>
                <small>Requires attention</small>
              </div>
            </div>

            <div className="card alert-stat-card critical-stat">
              <div className="alert-stat-icon">!</div>
              <div>
                <span>Critical Alerts</span>
                <strong>{criticalCount}</strong>
                <small>Immediate attention</small>
              </div>
            </div>

            <div className="card alert-stat-card high-stat">
              <div className="alert-stat-icon">↑</div>
              <div>
                <span>High Alerts</span>
                <strong>{highCount}</strong>
                <small>Potential cost risk</small>
              </div>
            </div>

            <div className="card alert-stat-card">
              <div className="alert-stat-icon">$</div>
              <div>
                <span>Daily Average</span>
                <strong>{formatCurrency(analysis.meanDaily)}</strong>
                <small>Current dataset</small>
              </div>
            </div>
          </div>

          <div className="card alerts-monitor-card">
            <div className="alerts-monitor-header">
              <div>
                <h2>Alert Monitor</h2>
                <p>
                  Automatically detected anomalies from your PostgreSQL cost
                  data.
                </p>
              </div>

              <div className="alert-controls">
                <div className="alert-control-group">
                  <label>Status</label>
        <select
  value={statusFilter}
  onChange={(event) =>
    setStatusFilter(event.target.value)
  }
>
  <option value="All">All Alerts</option>
  <option value="New">New</option>
  <option value="Acknowledged">Acknowledged</option>
  <option value="Resolved">Resolved</option>
</select>
                </div>

                <div className="alert-control-group">
                  <label>Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(event) =>
                      setSeverityFilter(event.target.value)
                    }
                  >
                    <option value="All">All</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="empty-alerts">
                <div className="empty-alert-icon">✓</div>
                <h3>
  {statusFilter === "All"
    ? "No alerts detected"
    : statusFilter === "New"
    ? "No new alerts"
    : statusFilter === "Acknowledged"
    ? "No acknowledged alerts"
    : "No resolved alerts"}
</h3>

<p>
  {statusFilter === "All"
    ? "CloudSpend AI has not detected any cost alerts."
    : statusFilter === "New"
    ? "There are no new alerts requiring review."
    : statusFilter === "Acknowledged"
    ? "There are no alerts currently being investigated."
    : "Resolved alerts will appear here."}
</p>
              </div>
            ) : (
              <div className="alerts-list">
                {filteredAlerts.map((alert) => (
                  <div
                    className={`alert-item alert-${alert.severity.toLowerCase()}`}
                    key={alert.id}
                  >
                    <div className="alert-severity-indicator">
                      <span>
                        {alert.severity === "Critical"
                          ? "!"
                          : alert.severity === "High"
                          ? "↑"
                          : alert.severity === "Medium"
                          ? "•"
                          : "i"}
                      </span>
                    </div>

                    <div className="alert-content">
                      <div className="alert-heading-row">
                        <div>
                          <span className="alert-type">{alert.type}</span>
                          <h3>{alert.title}</h3>
                        </div>

                        <span
                          className={`severity-badge ${alert.severity.toLowerCase()}`}
                        >
                          {alert.severity}
                        </span>
                      </div>

                      <p>{alert.description}</p>

                      <div className="alert-status-row">
  <span
    className={`alert-status-badge ${getAlertStatus(
      alert
    ).toLowerCase()}`}
  >
    {getAlertStatus(alert)}
  </span>
</div>

                      <div className="alert-meta">
                        {alert.date && (
                          <span>
                            <b>Date</b> {formatDate(alert.date)}
                          </span>
                        )}

                        <span>
                          <b>Impact</b> {formatCurrency(alert.amount)}
                        </span>

                        <span>
                          <b>Metric</b> {alert.metric}
                        </span>
                      </div>
                    </div>

                   <div className="alert-action">
  {getAlertStatus(alert) === "New" && (
    <button
      className="acknowledge-btn"
      onClick={() => acknowledgeAlert(alert.id)}
    >
      Acknowledge
    </button>
  )}

  {getAlertStatus(alert) === "Acknowledged" && (
    <button
      className="resolve-btn"
      onClick={() => resolveAlert(alert.id)}
    >
      Mark Resolved
    </button>
  )}

  {getAlertStatus(alert) === "Resolved" && (
    <button
      className="reopen-btn"
      onClick={() => reopenAlert(alert.id)}
    >
      Reopen
    </button>
  )}
</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="alert-info-grid">
            <div className="card alert-info-card">
              <div className="info-icon">📊</div>
              <div>
                <h3>Daily Cost Spike Detection</h3>
                <p>
                  Daily spending is compared with the historical average and
                  standard deviation to identify unusually expensive days.
                </p>
              </div>
            </div>

            <div className="card alert-info-card">
              <div className="info-icon">☁</div>
              <div>
                <h3>Service & Region Monitoring</h3>
                <p>
                  The system watches for unusually concentrated spending and
                  significant service-level cost increases.
                </p>
              </div>
            </div>
          </div>

          <div className="alert-footer-note">
            <span className="status-dot"></span>
            Monitoring {formatNumber(records.length)} cost records from the
            connected cloud cost dataset.
          </div>
        </>
      )}
    </section>
  );
}