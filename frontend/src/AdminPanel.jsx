import { useMemo, useState } from "react";
import "./styles/admin.css";

const API = "http://localhost:8080/api/costs";

function AdminPanel({ records = [], onRefresh }) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    usageDate: today,
    serviceName: "",
    resourceName: "",
    resourceGroup: "",
    region: "",
    environment: "production",
    department: "",
    cost: "",
    currency: "USD",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalSpend = useMemo(() => {
    return records.reduce(
      (sum, record) => sum + Number(record.cost || 0),
      0
    );
  }, [records]);

  const services = useMemo(() => {
    return [...new Set(records.map((record) => record.serviceName))]
      .filter(Boolean)
      .sort();
  }, [records]);

  const latestDate = useMemo(() => {
    if (!records.length) return "N/A";

    return records
      .map((record) => record.usageDate)
      .filter(Boolean)
      .sort()
      .at(-1) || "N/A";
  }, [records]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const token = localStorage.getItem("cloudspendai_token");

      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          cost: Number(form.cost),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`
        );
      }

      setMessage("Cost record added successfully.");

      setForm({
        usageDate: today,
        serviceName: "",
        resourceName: "",
        resourceGroup: "",
        region: "",
        environment: "production",
        department: "",
        cost: "",
        currency: "USD",
      });

      await onRefresh?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to add cost record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateData() {
    setMessage("");
    setError("");
    setGenerating(true);

    try {
      const token = localStorage.getItem("cloudspendai_token");

      const response = await fetch(`${API}/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          text || `Request failed with status ${response.status}`
        );
      }

      setMessage(text || "Sample cost data generated successfully.");

      await onRefresh?.();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to generate cost data.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Admin Center</h1>
          <p className="subtitle">
            Manage cloud cost records and administrative data operations.
          </p>
        </div>

        <div className="admin-role-badge">
          🛡 ADMIN ACCESS
        </div>
      </header>

      {message && (
        <div className="admin-message success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="admin-message error">
          ⚠ {error}
        </div>
      )}

      <section className="admin-stats">
        <div className="admin-stat-card">
          <span>Total Records</span>
          <strong>{records.length.toLocaleString()}</strong>
          <small>Stored cost records</small>
        </div>

        <div className="admin-stat-card">
          <span>Total Spend</span>
          <strong>{formatCurrency(totalSpend)}</strong>
          <small>Across all records</small>
        </div>

        <div className="admin-stat-card">
          <span>Services</span>
          <strong>{services.length}</strong>
          <small>Unique cloud services</small>
        </div>

        <div className="admin-stat-card">
          <span>Latest Data</span>
          <strong>{latestDate}</strong>
          <small>Most recent usage date</small>
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>➕ Add Cost Record</h2>
              <p>Create a new cloud spending record.</p>
            </div>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <label>
                Usage Date
                <input
                  type="date"
                  name="usageDate"
                  value={form.usageDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Service Name
                <input
                  list="admin-services"
                  name="serviceName"
                  value={form.serviceName}
                  onChange={handleChange}
                  placeholder="e.g. Azure Virtual Machines"
                  required
                />
              </label>

              <datalist id="admin-services">
                {services.map((service) => (
                  <option key={service} value={service} />
                ))}
              </datalist>

              <label>
                Resource Name
                <input
                  type="text"
                  name="resourceName"
                  value={form.resourceName}
                  onChange={handleChange}
                  placeholder="e.g. production-vm-01"
                  required
                />
              </label>

              <label>
                Resource Group
                <input
                  type="text"
                  name="resourceGroup"
                  value={form.resourceGroup}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </label>

<div className="admin-field">
  <label>Region</label>
  <select
    value={form.region}
    onChange={(e) =>
      setForm({ ...form, region: e.target.value })
    }
  >
    <option value="">Select region</option>
    <option value="Central US">Central US</option>
    <option value="East US">East US</option>
    <option value="North Europe">North Europe</option>
    <option value="Southeast Asia">Southeast Asia</option>
    <option value="Test Region">Test Region</option>
    <option value="West Europe">West Europe</option>
    <option value="West US">West US</option>
  </select>
</div>

              <label>
                Environment
                <select
                  name="environment"
                  value={form.environment}
                  onChange={handleChange}
                  required
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                  <option value="development">Test</option>
                  <option value="development">Testing</option>
                </select>
              </label>

           <div className="admin-field">
  <label>Department</label>
  <select
    value={form.department}
    onChange={(e) =>
      setForm({ ...form, department: e.target.value })
    }
  >
    <option value="">Select department</option>
    <option value="Data Science">Data Science</option>
    <option value="Engineering">Engineering</option>
    <option value="Finance">Finance</option>
    <option value="Marketing">Marketing</option>
    <option value="Operations">Operations</option>
    <option value="Testing">Testing</option>
  </select>
</div>

              <label>
                Cost
                <input
                  type="number"
                  name="cost"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <label>
                Currency
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Cost Record"}
            </button>
          </form>
        </div>

        <div className="admin-card admin-actions-card">
          <div className="admin-card-header">
            <div>
              <h2>⚙ Administrative Actions</h2>
              <p>Perform privileged data operations.</p>
            </div>
          </div>

          <div className="admin-action">
            <div>
              <strong>Generate Sample Data</strong>
              <p>
                Generate additional cloud cost records for development and
                testing.
              </p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={handleGenerateData}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Data"}
            </button>
          </div>

          <div className="admin-security-note">
            <span>🔐</span>
            <div>
              <strong>Protected operation</strong>
              <p>
                These actions require an authenticated ADMIN account.
                Server-side authorization remains enforced by Spring Security.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;