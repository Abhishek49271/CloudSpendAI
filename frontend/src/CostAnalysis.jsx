import { useEffect, useMemo, useState } from "react";

import {
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

const API = "http://localhost:8080/api/costs";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

function CostAnalysis() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    service: "",
    region: "",
    department: "",
    environment: "",
  });

  useEffect(() => {
    loadCostData();
  }, []);

  async function loadCostData() {
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
    } catch (err) {
      console.error(err);

      setError(
        "Could not load cost analysis data. Make sure Spring Boot is running on port 8080."
      );
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------
     FILTER OPTIONS
  ----------------------------- */

  const services = useMemo(() => {
    return [
      ...new Set(records.map((record) => record.serviceName)),
    ].sort();
  }, [records]);

  const regions = useMemo(() => {
    return [
      ...new Set(records.map((record) => record.region)),
    ].sort();
  }, [records]);

  const departments = useMemo(() => {
    return [
      ...new Set(records.map((record) => record.department)),
    ].sort();
  }, [records]);

  const environments = useMemo(() => {
    return [
      ...new Set(records.map((record) => record.environment)),
    ].sort();
  }, [records]);

  /* -----------------------------
     FILTERED DATA
  ----------------------------- */

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

  /* -----------------------------
     CURRENCY
  ----------------------------- */

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  /* -----------------------------
     TOTAL COST
  ----------------------------- */

  const totalCost = useMemo(() => {
    return filteredRecords.reduce(
      (sum, record) => sum + Number(record.cost || 0),
      0
    );
  }, [filteredRecords]);

  /* -----------------------------
     DAILY COST
  ----------------------------- */

  const dailyData = useMemo(() => {
    const grouped = {};

    filteredRecords.forEach((record) => {
      const date = record.usageDate;

      grouped[date] =
        (grouped[date] || 0) + Number(record.cost || 0);
    });

    return Object.entries(grouped)
      .map(([date, cost]) => ({
        date,
        cost,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  const averageDailyCost =
    dailyData.length > 0
      ? totalCost / dailyData.length
      : 0;

  /* -----------------------------
     GROUPED COST DATA
  ----------------------------- */

  const serviceData = useMemo(() => {
    const grouped = {};

    filteredRecords.forEach((record) => {
      const service = record.serviceName;

      grouped[service] =
        (grouped[service] || 0) +
        Number(record.cost || 0);
    });

    return Object.entries(grouped)
      .map(([name, cost]) => ({
        name,
        cost,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRecords]);

  const regionData = useMemo(() => {
    const grouped = {};

    filteredRecords.forEach((record) => {
      const region = record.region;

      grouped[region] =
        (grouped[region] || 0) +
        Number(record.cost || 0);
    });

    return Object.entries(grouped)
      .map(([name, cost]) => ({
        name,
        cost,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRecords]);

  const departmentData = useMemo(() => {
    const grouped = {};

    filteredRecords.forEach((record) => {
      const department = record.department;

      grouped[department] =
        (grouped[department] || 0) +
        Number(record.cost || 0);
    });

    return Object.entries(grouped)
      .map(([name, cost]) => ({
        name,
        cost,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRecords]);

  const environmentData = useMemo(() => {
    const grouped = {};

    filteredRecords.forEach((record) => {
      const environment = record.environment;

      grouped[environment] =
        (grouped[environment] || 0) +
        Number(record.cost || 0);
    });

    return Object.entries(grouped)
      .map(([name, cost]) => ({
        name,
        cost,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRecords]);

  /* -----------------------------
     TOP DRIVERS
  ----------------------------- */

  const topService =
    serviceData.length > 0
      ? serviceData[0]
      : null;

  const secondService =
    serviceData.length > 1
      ? serviceData[1]
      : null;

  const thirdService =
    serviceData.length > 2
      ? serviceData[2]
      : null;

  const topRegion =
    regionData.length > 0
      ? regionData[0]
      : null;

  /* -----------------------------
     TOP SERVICE SHARE
  ----------------------------- */

  const topServicePercentage =
    topService && totalCost > 0
      ? (topService.cost / totalCost) * 100
      : 0;

  /* -----------------------------
     PREVIOUS PERIOD
  ----------------------------- */

  const previousPeriodCost = useMemo(() => {
    if (!filters.startDate || !filters.endDate) {
      return null;
    }

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return null;
    }

    const periodLength =
      Math.floor(
        (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    const previousEnd = new Date(start);
    previousEnd.setDate(
      previousEnd.getDate() - 1
    );

    const previousStart = new Date(previousEnd);
    previousStart.setDate(
      previousStart.getDate() - periodLength + 1
    );

    return records
      .filter((record) => {
        const date = new Date(record.usageDate);

        return (
          date >= previousStart &&
          date <= previousEnd
        );
      })
      .reduce(
        (sum, record) =>
          sum + Number(record.cost || 0),
        0
      );
  }, [records, filters.startDate, filters.endDate]);

  const comparisonPercentage =
    previousPeriodCost !== null &&
    previousPeriodCost > 0
      ? ((totalCost - previousPeriodCost) /
          previousPeriodCost) *
        100
      : null;

  /* -----------------------------
     INSIGHTS
  ----------------------------- */

  const insights = useMemo(() => {
    const result = [];

    if (topService) {
      result.push({
        icon: "◈",
        title: "Largest cost driver",
        text: `${topService.name} is your largest cost driver at ${formatCurrency(
          topService.cost
        )}.`,
      });
    }

    if (topService && totalCost > 0) {
      result.push({
        icon: "◉",
        title: "Cost concentration",
        text: `${topService.name} represents ${topServicePercentage.toFixed(
          1
        )}% of your filtered cloud spending.`,
      });
    }

    if (topRegion) {
      result.push({
        icon: "◎",
        title: "Highest-cost region",
        text: `${topRegion.name} has the highest regional spend at ${formatCurrency(
          topRegion.cost
        )}.`,
      });
    }

    if (
      comparisonPercentage !== null
    ) {
      if (comparisonPercentage > 0) {
        result.push({
          icon: "↗",
          title: "Spending increased",
          text: `Cloud spending is ${Math.abs(
            comparisonPercentage
          ).toFixed(
            1
          )}% higher than the previous period.`,
        });
      } else if (comparisonPercentage < 0) {
        result.push({
          icon: "↘",
          title: "Spending decreased",
          text: `Cloud spending is ${Math.abs(
            comparisonPercentage
          ).toFixed(
            1
          )}% lower than the previous period.`,
        });
      } else {
        result.push({
          icon: "→",
          title: "Spending unchanged",
          text: "Cloud spending is approximately unchanged from the previous period.",
        });
      }
    }

    if (dailyData.length >= 2) {
      const firstDay = dailyData[0].cost;
      const lastDay =
        dailyData[dailyData.length - 1].cost;

      if (lastDay > firstDay * 1.1) {
        result.push({
          icon: "⚡",
          title: "Recent upward trend",
          text: "Daily cloud spending is trending upward across the selected period.",
        });
      } else if (lastDay < firstDay * 0.9) {
        result.push({
          icon: "✓",
          title: "Recent downward trend",
          text: "Daily cloud spending is trending downward across the selected period.",
        });
      }
    }

    return result.slice(0, 5);
  }, [
    topService,
    topRegion,
    totalCost,
    topServicePercentage,
    comparisonPercentage,
    dailyData,
  ]);

  /* -----------------------------
     FILTER ACTIONS
  ----------------------------- */

  function updateFilter(name, value) {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      startDate: "",
      endDate: "",
      service: "",
      region: "",
      department: "",
      environment: "",
    });
  }

  return (
    <div className="analysis-page">

      {/* HEADER */}

      <div className="topbar">
        <div>
          <p className="eyebrow">
            CLOUD COST ANALYSIS
          </p>

          <h1>Cost Analysis</h1>

          <p className="subtitle">
            Analyze your cloud spending in detail.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadCostData}
        >
          ↻ Refresh Data
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="error-box">
          ⚠ {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="loading">
          <div className="loader"></div>

          <p>
            Loading cost analysis data...
          </p>
        </div>
      ) : (
        <>

          {/* FILTERS */}

          <section className="card analysis-filters">

            <div className="card-header">
              <div>
                <h2>Analysis Filters</h2>

                <p>
                  Filter cloud spending by dimension.
                </p>
              </div>

              <button
                className="reset-button"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>

            <div className="filter-grid">

              <div className="filter-group">
                <label>FROM</label>

                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) =>
                    updateFilter(
                      "startDate",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="filter-group">
                <label>TO</label>

                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) =>
                    updateFilter(
                      "endDate",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="filter-group">
                <label>SERVICE</label>

                <select
                  value={filters.service}
                  onChange={(event) =>
                    updateFilter(
                      "service",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Services
                  </option>

                  {services.map((service) => (
                    <option
                      key={service}
                      value={service}
                    >
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>REGION</label>

                <select
                  value={filters.region}
                  onChange={(event) =>
                    updateFilter(
                      "region",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Regions
                  </option>

                  {regions.map((region) => (
                    <option
                      key={region}
                      value={region}
                    >
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>DEPARTMENT</label>

                <select
                  value={filters.department}
                  onChange={(event) =>
                    updateFilter(
                      "department",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Departments
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>ENVIRONMENT</label>

                <select
                  value={filters.environment}
                  onChange={(event) =>
                    updateFilter(
                      "environment",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Environments
                  </option>

                  {environments.map((environment) => (
                    <option
                      key={environment}
                      value={environment}
                    >
                      {environment}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </section>

          {/* KPI CARDS */}

          <section className="stats-grid">

            <div className="stat-card">
              <div className="stat-top">
                <div>
                  <div className="stat-label">
                    Total Cloud Cost
                  </div>

                  <div className="stat-value">
                    {formatCurrency(totalCost)}
                  </div>
                </div>

                <div className="stat-icon">
                  $
                </div>
              </div>

              <div className="stat-meta">
                {filteredRecords.length} cost records
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <div>
                  <div className="stat-label">
                    Average Daily Cost
                  </div>

                  <div className="stat-value">
                    {formatCurrency(
                      averageDailyCost
                    )}
                  </div>
                </div>

                <div className="stat-icon">
                  ≈
                </div>
              </div>

              <div className="stat-meta">
                Based on {dailyData.length} days
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <div>
                  <div className="stat-label">
                    Top Service
                  </div>

                  <div className="stat-value">
                    {topService
                      ? topService.name
                      : "N/A"}
                  </div>
                </div>

                <div className="stat-icon">
                  ◈
                </div>
              </div>

              <div className="stat-meta">
                {topService
                  ? formatCurrency(
                      topService.cost
                    )
                  : "No data"}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <div>
                  <div className="stat-label">
                    Top Region
                  </div>

                  <div className="stat-value">
                    {topRegion
                      ? topRegion.name
                      : "N/A"}
                  </div>
                </div>

                <div className="stat-icon">
                  ◎
                </div>
              </div>

              <div className="stat-meta">
                {topRegion
                  ? formatCurrency(
                      topRegion.cost
                    )
                  : "No data"}
              </div>
            </div>

          </section>

          {/* PERIOD COMPARISON */}

          <section className="analysis-insight-grid">

            <div className="analysis-highlight-card">
              <div className="highlight-label">
                PERIOD COMPARISON
              </div>

              <div className="highlight-value">
                {comparisonPercentage === null
                  ? "Select dates"
                  : `${comparisonPercentage >= 0 ? "+" : ""}${comparisonPercentage.toFixed(
                      1
                    )}%`}
              </div>

              <p>
                {comparisonPercentage === null
                  ? "Choose a start and end date to compare spending with the previous period."
                  : comparisonPercentage > 0
                  ? "Spending is higher than the previous period."
                  : comparisonPercentage < 0
                  ? "Spending is lower than the previous period."
                  : "Spending is unchanged from the previous period."}
              </p>

              {previousPeriodCost !== null && (
                <div className="comparison-row">
                  <span>
                    Previous period
                  </span>

                  <strong>
                    {formatCurrency(
                      previousPeriodCost
                    )}
                  </strong>
                </div>
              )}
            </div>

            <div className="analysis-highlight-card">
              <div className="highlight-label">
                TOP COST DRIVER
              </div>

              <div className="highlight-value">
                {topService
                  ? topService.name
                  : "N/A"}
              </div>

              <p>
                {topService
                  ? `${topServicePercentage.toFixed(
                      1
                    )}% of total filtered spending`
                  : "No cost data available."}
              </p>

              <div className="driver-progress">
                <div
                  className="driver-progress-fill"
                  style={{
                    width: `${Math.min(
                      topServicePercentage,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

          </section>

          {/* TOP COST DRIVERS */}

          <section className="card drivers-card">

            <div className="card-header">
              <div>
                <h2>Top Cost Drivers</h2>

                <p>
                  Services contributing the most to your cloud spend.
                </p>
              </div>

              <span className="badge">
                {serviceData.length} services
              </span>
            </div>

            <div className="driver-list">

              {[
                topService,
                secondService,
                thirdService,
              ]
                .filter(Boolean)
                .map((service, index) => {
                  const percentage =
                    totalCost > 0
                      ? (service.cost /
                          totalCost) *
                        100
                      : 0;

                  return (
                    <div
                      className="driver-item"
                      key={service.name}
                    >
                      <div className="driver-rank">
                        #{index + 1}
                      </div>

                      <div className="driver-main">
                        <div className="driver-title-row">
                          <strong>
                            {service.name}
                          </strong>

                          <span>
                            {formatCurrency(
                              service.cost
                            )}
                          </span>
                        </div>

                        <div className="driver-bar">
                          <div
                            className="driver-bar-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>

                        <small>
                          {percentage.toFixed(1)}% of total cost
                        </small>
                      </div>
                    </div>
                  );
                })}

              {serviceData.length === 0 && (
                <div className="empty-state">
                  No service cost data available.
                </div>
              )}

            </div>
          </section>

          {/* AUTOMATIC INSIGHTS */}

          <section className="card insights-card">

            <div className="card-header">
              <div>
                <h2>Cost Insights</h2>

                <p>
                  Automatically generated observations from your selected data.
                </p>
              </div>

              <span className="insight-status">
                ● LIVE ANALYSIS
              </span>
            </div>

            <div className="insights-grid">

              {insights.map((insight, index) => (
                <div
                  className="insight-item"
                  key={`${insight.title}-${index}`}
                >
                  <div className="insight-icon">
                    {insight.icon}
                  </div>

                  <div>
                    <strong>
                      {insight.title}
                    </strong>

                    <p>
                      {insight.text}
                    </p>
                  </div>
                </div>
              ))}

              {insights.length === 0 && (
                <div className="empty-state">
                  More data is required to generate insights.
                </div>
              )}

            </div>
          </section>

          {/* ANALYSIS CHARTS */}

          <section className="charts-grid">

            {/* SERVICE */}

            <div className="chart-card">

              <div className="chart-header">
                <div>
                  <h2>Cost by Service</h2>

                  <p>
                    Service-level spending distribution
                  </p>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer
                  width="100%"
                  height={350}
                >
                  <BarChart
                    data={serviceData}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 20,
                      left: 10,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `$${Number(
                          value
                        ).toLocaleString()}`
                      }
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Bar
                      dataKey="cost"
                      fill="#6366f1"
                      radius={[
                        0,
                        6,
                        6,
                        0,
                      ]}
                      animationBegin={200}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* REGION */}

            <div className="chart-card">

              <div className="chart-header">
                <div>
                  <h2>Cost by Region</h2>

                  <p>
                    Geographic spending distribution
                  </p>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer
                  width="100%"
                  height={350}
                >
                  <PieChart>

                    <Pie
                      data={regionData}
                      dataKey="cost"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name }) =>
                        name
                      }
                      animationBegin={300}
                      animationDuration={1300}
                      animationEasing="ease-out"
                    >
                      {regionData.map(
                        (entry, index) => (
                          <Cell
                            key={`region-${index}`}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Legend />

                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DEPARTMENT */}

            <div className="chart-card">

              <div className="chart-header">
                <div>
                  <h2>Cost by Department</h2>

                  <p>
                    Department-level spending distribution
                  </p>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer
                  width="100%"
                  height={350}
                >
                  <BarChart
                    data={departmentData}
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 30,
                      left: 40,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      type="number"
                      tickFormatter={(value) =>
                        `$${Number(
                          value
                        ).toLocaleString()}`
                      }
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Bar
                      dataKey="cost"
                      fill="#10b981"
                      radius={[
                        0,
                        6,
                        6,
                        0,
                      ]}
                      animationBegin={400}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ENVIRONMENT */}

            <div className="chart-card">

              <div className="chart-header">
                <div>
                  <h2>Cost by Environment</h2>

                  <p>
                    Environment-level spending distribution
                  </p>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer
                  width="100%"
                  height={350}
                >
                  <PieChart>

                    <Pie
                      data={environmentData}
                      dataKey="cost"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name }) =>
                        name
                      }
                      animationBegin={500}
                      animationDuration={1300}
                      animationEasing="ease-out"
                    >
                      {environmentData.map(
                        (entry, index) => (
                          <Cell
                            key={`environment-${index}`}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Legend />

                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </section>

        </>
      )}
    </div>
  );
}

export default CostAnalysis;