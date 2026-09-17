import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API = "http://localhost:8080/api/costs";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatPercentage(value) {
  const number = Number(value) || 0;

  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
}

/* ==================================================
   RESOURCE TREND
================================================== */

function calculateTrend(costs) {
  if (!costs || costs.length < 6) {
    return {
      label: "Insufficient Data",
      percentage: 0,
      previousAverage: 0,
      recentAverage: 0,
    };
  }

  const midpoint = Math.floor(costs.length / 2);

  const previous = costs.slice(0, midpoint);
  const recent = costs.slice(midpoint);

  const previousAverage =
    previous.reduce((sum, value) => sum + value, 0) /
    previous.length;

  const recentAverage =
    recent.reduce((sum, value) => sum + value, 0) /
    recent.length;

  let percentage = 0;

  if (previousAverage > 0) {
    percentage =
      ((recentAverage - previousAverage) / previousAverage) * 100;
  }

  let label = "Stable";

  if (percentage >= 8) {
    label = "Increasing";
  } else if (percentage <= -8) {
    label = "Decreasing";
  }

  return {
    label,
    percentage,
    previousAverage,
    recentAverage,
  };
}

/* ==================================================
   RESOURCE FORECAST
================================================== */

function calculateForecast(costs) {
  if (!costs || costs.length < 5) {
    return 0;
  }

  const n = costs.length;

  const xValues = costs.map((_, index) => index);
  const yValues = costs;

  const xMean =
    xValues.reduce((sum, value) => sum + value, 0) / n;

  const yMean =
    yValues.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i += 1) {
    numerator +=
      (xValues[i] - xMean) *
      (yValues[i] - yMean);

    denominator +=
      Math.pow(xValues[i] - xMean, 2);
  }

  const slope =
    denominator === 0
      ? 0
      : numerator / denominator;

  const intercept = yMean - slope * xMean;

  const nextX = n;

  const forecast = intercept + slope * nextX;

  return Math.max(0, forecast);
}

/* ==================================================
   RESOURCE HEALTH
================================================== */

function calculateHealth(costs) {
  if (!costs || costs.length < 5) {
    return {
      status: "Insufficient Data",
      deviation: 0,
      zScore: 0,
      historicalAverage: 0,
    };
  }

  const latestCost = costs[costs.length - 1];

  const historicalCosts = costs.slice(
    0,
    costs.length - 1
  );

  const historicalAverage =
    historicalCosts.reduce(
      (sum, value) => sum + value,
      0
    ) / historicalCosts.length;

  const variance =
    historicalCosts.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - historicalAverage,
          2
        ),
      0
    ) / historicalCosts.length;

  const standardDeviation = Math.sqrt(variance);

  const deviation =
    historicalAverage > 0
      ? ((latestCost - historicalAverage) /
          historicalAverage) *
        100
      : 0;

  const zScore =
    standardDeviation > 0
      ? (latestCost - historicalAverage) /
        standardDeviation
      : 0;

  let status = "Healthy";

  if (
    zScore >= 2.5 ||
    deviation >= 40
  ) {
    status = "Critical";
  } else if (
    zScore >= 1.5 ||
    deviation >= 15
  ) {
    status = "Warning";
  }

  return {
    status,
    deviation,
    zScore,
    historicalAverage,
  };
}

/* ==================================================
   OPTIMIZATION RECOMMENDATION
================================================== */

function getOptimizationRecommendation(resource) {
  const {
    health,
    trend,
    trendPercentage = 0,
    latestCost = 0,
    historicalAverage = 0,
    forecastCost = 0,
    recordCount = 0,
  } = resource;

  if (
    recordCount < 5 ||
    health === "Insufficient Data"
  ) {
    return {
      category: "Insufficient Data",
      icon: "○",
      priority: "Low",
      recommendation:
        "Collect more cost history before making an optimization decision.",
      reason:
        "This resource does not have enough historical data for a reliable recommendation.",
    };
  }

  const baseline = Number(historicalAverage);
  const forecast = Number(forecastCost);
  const currentCost = Number(latestCost);

  const forecastIncrease =
    baseline > 0
      ? ((forecast - baseline) / baseline) * 100
      : 0;

  const currentIncrease =
    baseline > 0
      ? ((currentCost - baseline) / baseline) * 100
      : 0;

  if (
    health === "Critical" ||
    trendPercentage >= 25 ||
    forecastIncrease >= 25
  ) {
    return {
      category: "High Cost Risk",
      icon: "!",
      priority: "High",
      recommendation:
        "Investigate this resource immediately for sustained cost growth.",
      reason:
        `Cost behavior indicates elevated risk. ` +
        `Current trend is ${formatPercentage(
          trendPercentage
        )} and the forecast is ${formatPercentage(
          forecastIncrease
        )} above the historical baseline.`,
    };
  }

  if (
    health === "Warning" ||
    trendPercentage >= 10 ||
    forecastIncrease >= 15 ||
    currentIncrease >= 15
  ) {
    return {
      category: "Optimization Opportunity",
      icon: "↗",
      priority: "Medium",
      recommendation:
        "Review usage and configuration for potential cost reduction.",
      reason:
        "Current or projected spending is meaningfully above the resource's historical baseline.",
    };
  }

  if (
    trend === "Increasing" ||
    currentIncrease >= 8
  ) {
    return {
      category: "Review",
      icon: "•",
      priority: "Medium",
      recommendation:
        "Monitor this resource and review recent usage changes.",
      reason:
        "Spending is showing moderate upward movement compared with historical behavior.",
    };
  }

  return {
    category: "Efficient",
    icon: "✓",
    priority: "Low",
    recommendation:
      "No immediate optimization action is required.",
    reason:
      "Cost behavior is currently stable or improving relative to historical spending.",
  };
}

/* ==================================================
   OPTIMIZATION ACTION
================================================== */

function getActionStatus(resource, actionStatuses) {
  return (
    actionStatuses[resource.resourceName] ||
    "Open"
  );
}

function getAboveBaselineCost(resource) {
  if (
    resource.health === "Insufficient Data" ||
    resource.historicalAverage <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    resource.latestCost -
      resource.historicalAverage
  );
}

/* ==================================================
   COMPONENT
================================================== */

function Resources() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [serviceFilter, setServiceFilter] =
    useState("All");

  const [regionFilter, setRegionFilter] =
    useState("All");

  const [environmentFilter, setEnvironmentFilter] =
    useState("All");

  const [healthFilter, setHealthFilter] =
    useState("All");

  const [optimizationFilter, setOptimizationFilter] =
    useState("All");

  const [actionFilter, setActionFilter] =
    useState("All");

  const [visibleCount, setVisibleCount] =
    useState(50);

 const [selectedResource, setSelectedResource] =
  useState(null);

const [actionStatuses, setActionStatuses] =
  useState(() => {
    try {
      const savedStatuses =
        localStorage.getItem(
          "cloudspendai_action_statuses"
        );

      if (!savedStatuses) {
        return {};
      }

      return JSON.parse(savedStatuses);
    } catch (error) {
      console.error(
        "Failed to load saved action statuses:",
        error
      );

      return {};
    }
  });

useEffect(() => {
  try {
    localStorage.setItem(
      "cloudspendai_action_statuses",
      JSON.stringify(actionStatuses)
    );
  } catch (error) {
    console.error(
      "Failed to save action statuses:",
      error
    );
  }
}, [actionStatuses]);

const [notification, setNotification] =
  useState(null);

  /* ==================================================
     FETCH DATA
  ================================================== */

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
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
        throw new Error(
          "Unable to load resource data."
        );
      }

      const data = await response.json();

      setRecords(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Could not load resource data. Make sure Spring Boot is running on port 8080."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==================================================
     SEARCH DEBOUNCE
  ================================================== */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  /* ==================================================
     RESET VISIBLE COUNT WHEN FILTERS CHANGE
  ================================================== */

  useEffect(() => {
    setVisibleCount(50);
  }, [
    debouncedSearch,
    serviceFilter,
    regionFilter,
    environmentFilter,
    healthFilter,
    optimizationFilter,
    actionFilter,
  ]);

  /* ==================================================
     RESOURCE DATA
  ================================================== */

  const resourceData = useMemo(() => {
    const groups = {};

    records.forEach((record) => {
      const resourceName =
        String(
          record.resourceName ||
            "Unknown Resource"
        ).trim();

      const key =
        resourceName.toLowerCase();

      if (!groups[key]) {
        groups[key] = {
          resourceName,
          records: [],
        };
      }

      groups[key].records.push(record);
    });

    return Object.values(groups)
      .map((group) => {
        const sortedRecords =
          [...group.records].sort(
            (a, b) =>
              String(
                a.usageDate || ""
              ).localeCompare(
                String(
                  b.usageDate || ""
                )
              )
          );

        const costHistory =
          sortedRecords.map((record) => ({
            date: String(
              record.usageDate || ""
            ).slice(0, 10),

            cost:
              Number(record.cost) || 0,
          }));

        const costValues =
          costHistory.map(
            (item) => item.cost
          );

        const latestRecord =
          sortedRecords[
            sortedRecords.length - 1
          ];

        const latestCost =
          Number(
            latestRecord?.cost
          ) || 0;

        const latestDate =
          String(
            latestRecord?.usageDate || ""
          ).slice(0, 10);

        const healthData =
          calculateHealth(costValues);

        const trendData =
          calculateTrend(costValues);

        const forecastCost =
          calculateForecast(costValues);

        const resource = {
          resourceName:
            group.resourceName,

          serviceName:
            latestRecord?.serviceName ||
            "Unknown Service",

          resourceGroup:
            latestRecord?.resourceGroup ||
            "Unknown Group",

          region:
            latestRecord?.region ||
            "Unknown Region",

          environment:
            latestRecord?.environment ||
            "Unknown Environment",

          department:
            latestRecord?.department ||
            "Unknown Department",

          currency:
            latestRecord?.currency ||
            "USD",

          latestCost,

          latestDate,

          historicalAverage:
            healthData.historicalAverage,

          deviation:
            healthData.deviation,

          zScore:
            healthData.zScore,

          health:
            healthData.status,

          history:
            costHistory,

          trend:
            trendData.label,

          trendPercentage:
            trendData.percentage,

          previousAverage:
            trendData.previousAverage,

          recentAverage:
            trendData.recentAverage,

          forecastCost,

          recordCount:
            sortedRecords.length,
        };

        return {
          ...resource,

          optimization:
            getOptimizationRecommendation(
              resource
            ),
        };
      })
      .sort((a, b) =>
        a.resourceName.localeCompare(
          b.resourceName
        )
      );
  }, [records]);

  /* ==================================================
     FILTER OPTIONS
  ================================================== */

  const services = useMemo(() => {
    return [
      ...new Set(
        resourceData.map(
          (resource) =>
            resource.serviceName
        )
      ),
    ].sort();
  }, [resourceData]);

  const regions = useMemo(() => {
    return [
      ...new Set(
        resourceData.map(
          (resource) =>
            resource.region
        )
      ),
    ].sort();
  }, [resourceData]);

  const environments = useMemo(() => {
    return [
      ...new Set(
        resourceData.map(
          (resource) =>
            resource.environment
        )
      ),
    ].sort();
  }, [resourceData]);

  /* ==================================================
     FILTERED RESOURCES
  ================================================== */

  const filteredResources = useMemo(() => {
    const normalizedSearch =
      debouncedSearch
        .trim()
        .toLowerCase();

    return resourceData.filter(
      (resource) => {
        const matchesSearch =
          !normalizedSearch ||
          resource.resourceName
            .toLowerCase()
            .includes(normalizedSearch) ||
          resource.serviceName
            .toLowerCase()
            .includes(normalizedSearch) ||
          resource.region
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesService =
          serviceFilter === "All" ||
          resource.serviceName ===
            serviceFilter;

        const matchesRegion =
          regionFilter === "All" ||
          resource.region ===
            regionFilter;

        const matchesEnvironment =
          environmentFilter === "All" ||
          resource.environment ===
            environmentFilter;

        const matchesHealth =
          healthFilter === "All" ||
          resource.health ===
            healthFilter;

        const matchesOptimization =
          optimizationFilter === "All" ||
          resource.optimization
            ?.category ===
            optimizationFilter;

        const matchesAction =
          actionFilter === "All" ||
          getActionStatus(
            resource,
            actionStatuses
          ) === actionFilter;

        return (
          matchesSearch &&
          matchesService &&
          matchesRegion &&
          matchesEnvironment &&
          matchesHealth &&
          matchesOptimization &&
          matchesAction
        );
      }
    );
  }, [
    resourceData,
    debouncedSearch,
    serviceFilter,
    regionFilter,
    environmentFilter,
    healthFilter,
    optimizationFilter,
    actionFilter,
    actionStatuses,
  ]);

  /* ==================================================
     VISIBLE RESOURCES
  ================================================== */

  const visibleResources =
    filteredResources.slice(
      0,
      visibleCount
    );

  /* ==================================================
     SUMMARY COUNTS
  ================================================== */

  const healthCounts = useMemo(() => {
    return resourceData.reduce(
      (counts, resource) => {
        if (
          resource.health ===
          "Healthy"
        ) {
          counts.healthy += 1;
        }

        if (
          resource.health ===
          "Warning"
        ) {
          counts.warning += 1;
        }

        if (
          resource.health ===
          "Critical"
        ) {
          counts.critical += 1;
        }

        if (
          resource.health ===
          "Insufficient Data"
        ) {
          counts.insufficient += 1;
        }

        return counts;
      },
      {
        healthy: 0,
        warning: 0,
        critical: 0,
        insufficient: 0,
      }
    );
  }, [resourceData]);

  const optimizationCounts =
    useMemo(() => {
      return resourceData.reduce(
        (counts, resource) => {
          const category =
            resource.optimization
              ?.category;

          if (
            category ===
            "Efficient"
          ) {
            counts.efficient += 1;
          }

          if (
            category === "Review"
          ) {
            counts.review += 1;
          }

          if (
            category ===
            "Optimization Opportunity"
          ) {
            counts.opportunity += 1;
          }

          if (
            category ===
            "High Cost Risk"
          ) {
            counts.highRisk += 1;
          }

          if (
            category ===
            "Insufficient Data"
          ) {
            counts.insufficient += 1;
          }

          return counts;
        },
        {
          efficient: 0,
          review: 0,
          opportunity: 0,
          highRisk: 0,
          insufficient: 0,
        }
      );
    }, [resourceData]);

  /* ==================================================
     ACTION COUNTS
  ================================================== */

  const actionCounts = useMemo(() => {
    return resourceData.reduce(
      (counts, resource) => {
        const status =
          getActionStatus(
            resource,
            actionStatuses
          );

        if (status === "Open") {
          counts.open += 1;
        }

        if (
          status === "In Progress"
        ) {
          counts.inProgress += 1;
        }

        if (
          status === "Completed"
        ) {
          counts.completed += 1;
        }

        return counts;
      },
      {
        open: 0,
        inProgress: 0,
        completed: 0,
      }
    );
  }, [resourceData, actionStatuses]);

  /* ==================================================
     TOTAL COST
  ================================================== */

  const totalCost = useMemo(() => {
    return records.reduce(
      (sum, record) =>
        sum +
        (Number(record.cost) || 0),
      0
    );
  }, [records]);

  /* ==================================================
     RESOURCE COST AVERAGE
  ================================================== */

  const averageResourceCost =
    resourceData.length > 0
      ? totalCost /
        resourceData.length
      : 0;

  /* ==================================================
     ACTION NOTIFICATION
  ================================================== */

  function showActionNotification(
    type,
    title,
    message
  ) {
    setNotification({
      type,
      title,
      message,
    });

    setTimeout(() => {
      setNotification(null);
    }, 2800);
  }

  /* ==================================================
     OPTIMIZATION ACTIONS
  ================================================== */

  function startOptimization(resource) {
    setActionStatuses(
      (previous) => ({
        ...previous,
        [resource.resourceName]:
          "In Progress",
      })
    );

    showActionNotification(
      "progress",
      "Optimization started",
      `${resource.resourceName} is now In Progress.`
    );
  }

  function completeOptimization(resource) {
    setActionStatuses(
      (previous) => ({
        ...previous,
        [resource.resourceName]:
          "Completed",
      })
    );

    showActionNotification(
      "completed",
      "Optimization completed",
      `${resource.resourceName} has been marked Completed.`
    );
  }

  function reopenOptimization(resource) {
    setActionStatuses(
      (previous) => ({
        ...previous,
        [resource.resourceName]:
          "Open",
      })
    );

    showActionNotification(
      "reopened",
      "Optimization reopened",
      `${resource.resourceName} has been moved back to Open.`
    );
  }

  function handleAction(resource) {
    const status =
      getActionStatus(
        resource,
        actionStatuses
      );

    if (status === "Open") {
      startOptimization(resource);
      return;
    }

    if (status === "In Progress") {
      completeOptimization(resource);
      return;
    }

    reopenOptimization(resource);
  }

  /* ==================================================
     RESET FILTERS
  ================================================== */

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setServiceFilter("All");
    setRegionFilter("All");
    setEnvironmentFilter("All");
    setHealthFilter("All");
    setOptimizationFilter("All");
    setActionFilter("All");
    setVisibleCount(50);
  }

  /* ==================================================
     LOAD MORE
  ================================================== */

  function loadMore() {
    setVisibleCount(
      (previous) =>
        previous + 50
    );
  }

  /* ==================================================
     CLASS HELPERS
  ================================================== */

  function statusClass(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  /* ==================================================
     RENDER
  ================================================== */

  return (
    <div className="resources-page">

      {/* ==================================================
          NOTIFICATION
      ================================================== */}

      {notification && (
        <div
          className={`resource-action-notification ${statusClass(
            notification.type
          )}`}
        >
          <div className="resource-action-notification-icon">
            {notification.type ===
            "completed"
              ? "✓"
              : notification.type ===
                "progress"
              ? "→"
              : "↻"}
          </div>

          <div>
            <strong>
              {notification.title}
            </strong>

            <span>
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="resources-topbar">
        <div>
          <h1>Resources</h1>

          <p>
            Resource-level cloud cost
            intelligence and optimization.
          </p>
        </div>

        <div className="resource-record-count">
          Monitoring{" "}
          <strong>
            {formatNumber(
              records.length
            )}
          </strong>{" "}
          cost records
        </div>
      </div>

      {/* ==================================================
          STAT CARDS
      ================================================== */}

      <section className="resource-stats-grid">

        <div className="resource-stat-card">
          <div className="resource-stat-icon">
            ◈
          </div>

          <div>
            <span>
              TOTAL RESOURCES
            </span>

            <strong>
              {formatNumber(
                resourceData.length
              )}
            </strong>
          </div>
        </div>

        <div className="resource-stat-card">
          <div className="resource-stat-icon">
            $
          </div>

          <div>
            <span>
              TOTAL COST
            </span>

            <strong>
              {formatCurrency(
                totalCost
              )}
            </strong>
          </div>
        </div>

        <div className="resource-stat-card">
          <div className="resource-stat-icon">
            ✓
          </div>

          <div>
            <span>
              HEALTHY
            </span>

            <strong>
              {healthCounts.healthy}
            </strong>
          </div>
        </div>

        <div className="resource-stat-card">
          <div className="resource-stat-icon">
            !
          </div>

          <div>
            <span>
              NEEDS ATTENTION
            </span>

            <strong>
              {healthCounts.warning +
                healthCounts.critical}
            </strong>
          </div>
        </div>

      </section>

      {/* ==================================================
          OPTIMIZATION SUMMARY
      ================================================== */}

      <div className="resource-optimization-summary">

        <div className="optimization-summary-title">

          <div>
            <span>
              RESOURCE OPTIMIZATION
            </span>

            <strong>
              Automated Recommendations
            </strong>
          </div>

          <small>
            Based on cost history,
            health, trend and forecast
          </small>

        </div>

        <div className="optimization-summary-grid">

          <button
            type="button"
            className="optimization-summary-item efficient"
            onClick={() =>
              setOptimizationFilter(
                "Efficient"
              )
            }
          >
            <span className="optimization-summary-icon">
              ✓
            </span>

            <div>
              <strong>
                {
                  optimizationCounts.efficient
                }
              </strong>

              <span>
                Efficient
              </span>
            </div>
          </button>

          <button
            type="button"
            className="optimization-summary-item review"
            onClick={() =>
              setOptimizationFilter(
                "Review"
              )
            }
          >
            <span className="optimization-summary-icon">
              •
            </span>

            <div>
              <strong>
                {
                  optimizationCounts.review
                }
              </strong>

              <span>
                Review
              </span>
            </div>
          </button>

          <button
            type="button"
            className="optimization-summary-item opportunity"
            onClick={() =>
              setOptimizationFilter(
                "Optimization Opportunity"
              )
            }
          >
            <span className="optimization-summary-icon">
              ↗
            </span>

            <div>
              <strong>
                {
                  optimizationCounts.opportunity
                }
              </strong>

              <span>
                Optimization
              </span>
            </div>
          </button>

          <button
            type="button"
            className="optimization-summary-item high-risk"
            onClick={() =>
              setOptimizationFilter(
                "High Cost Risk"
              )
            }
          >
            <span className="optimization-summary-icon">
              !
            </span>

            <div>
              <strong>
                {
                  optimizationCounts.highRisk
                }
              </strong>

              <span>
                High Cost Risk
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* ==================================================
          OPTIMIZATION ACTIONS SUMMARY
      ================================================== */}

      <div className="resource-action-summary">

        <div className="resource-action-summary-header">

          <div>
            <span>
              OPTIMIZATION ACTIONS
            </span>

            <strong>
              Action Workflow
            </strong>
          </div>

          <small>
            Track recommended work from
            Open to Completed
          </small>

        </div>

        <div className="resource-action-summary-grid">

          <button
            type="button"
            className={`resource-action-summary-item open ${
              actionFilter === "Open"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActionFilter("Open")
            }
          >
            <span className="resource-action-summary-icon">
              ○
            </span>

            <div>
              <strong>
                {actionCounts.open}
              </strong>

              <span>
                Open
              </span>
            </div>
          </button>

          <button
            type="button"
            className={`resource-action-summary-item in-progress ${
              actionFilter ===
              "In Progress"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActionFilter(
                "In Progress"
              )
            }
          >
            <span className="resource-action-summary-icon">
              →
            </span>

            <div>
              <strong>
                {actionCounts.inProgress}
              </strong>

              <span>
                In Progress
              </span>
            </div>
          </button>

          <button
            type="button"
            className={`resource-action-summary-item completed ${
              actionFilter ===
              "Completed"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActionFilter(
                "Completed"
              )
            }
          >
            <span className="resource-action-summary-icon">
              ✓
            </span>

            <div>
              <strong>
                {actionCounts.completed}
              </strong>

              <span>
                Completed
              </span>
            </div>
          </button>

          <button
            type="button"
            className="resource-action-summary-item all"
            onClick={() =>
              setActionFilter("All")
            }
          >
            <span className="resource-action-summary-icon">
              ◈
            </span>

            <div>
              <strong>
                {resourceData.length}
              </strong>

              <span>
                All Actions
              </span>
            </div>
          </button>

        </div>

      </div>

      {/* ==================================================
          INVENTORY
      ================================================== */}

      <section className="resource-inventory-card">

        <div className="resource-inventory-header">

          <div>
            <h2>
              Resource Inventory
            </h2>

            <p>
              Showing{" "}
              <strong>
                {formatNumber(
                  filteredResources.length
                )}
              </strong>{" "}
              resources
            </p>
          </div>

          <div>
            <span>
              Average Resource Cost
            </span>

            <strong>
              {formatCurrency(
                averageResourceCost
              )}
            </strong>
          </div>

        </div>

        {/* ==================================================
            HEALTH SUMMARY
        ================================================== */}

        <div className="resource-health-summary">

          <button
            type="button"
            className="health-summary-item healthy"
            onClick={() =>
              setHealthFilter("Healthy")
            }
          >
            <span className="status-dot" />

            <span>
              Healthy
            </span>

            <strong>
              {healthCounts.healthy}
            </strong>
          </button>

          <button
            type="button"
            className="health-summary-item warning"
            onClick={() =>
              setHealthFilter("Warning")
            }
          >
            <span className="status-dot" />

            <span>
              Warning
            </span>

            <strong>
              {healthCounts.warning}
            </strong>
          </button>

          <button
            type="button"
            className="health-summary-item critical"
            onClick={() =>
              setHealthFilter("Critical")
            }
          >
            <span className="status-dot" />

            <span>
              Critical
            </span>

            <strong>
              {healthCounts.critical}
            </strong>
          </button>

          <button
            type="button"
            className="health-summary-item insufficient"
            onClick={() =>
              setHealthFilter(
                "Insufficient Data"
              )
            }
          >
            <span className="status-dot" />

            <span>
              Insufficient
            </span>

            <strong>
              {healthCounts.insufficient}
            </strong>
          </button>

        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="resource-filters">

          <input
            className="resource-search"
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <select
            value={serviceFilter}
            onChange={(event) =>
              setServiceFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Services
            </option>

            {services.map(
              (service) => (
                <option
                  key={service}
                  value={service}
                >
                  {service}
                </option>
              )
            )}
          </select>

          <select
            value={regionFilter}
            onChange={(event) =>
              setRegionFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Regions
            </option>

            {regions.map(
              (region) => (
                <option
                  key={region}
                  value={region}
                >
                  {region}
                </option>
              )
            )}
          </select>

          <select
            value={environmentFilter}
            onChange={(event) =>
              setEnvironmentFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Environments
            </option>

            {environments.map(
              (environment) => (
                <option
                  key={environment}
                  value={environment}
                >
                  {environment}
                </option>
              )
            )}
          </select>

          <select
            value={healthFilter}
            onChange={(event) =>
              setHealthFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Health
            </option>

            <option value="Healthy">
              Healthy
            </option>

            <option value="Warning">
              Warning
            </option>

            <option value="Critical">
              Critical
            </option>

            <option value="Insufficient Data">
              Insufficient Data
            </option>
          </select>

          <select
            value={optimizationFilter}
            onChange={(event) =>
              setOptimizationFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Recommendations
            </option>

            <option value="Efficient">
              Efficient
            </option>

            <option value="Review">
              Review
            </option>

            <option value="Optimization Opportunity">
              Optimization Opportunity
            </option>

            <option value="High Cost Risk">
              High Cost Risk
            </option>

            <option value="Insufficient Data">
              Insufficient Data
            </option>
          </select>

          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Action Status
            </option>

            <option value="Open">
              Open
            </option>

            <option value="In Progress">
              In Progress
            </option>

            <option value="Completed">
              Completed
            </option>
          </select>

          <button
            type="button"
            className="reset-button"
            onClick={resetFilters}
          >
            Reset
          </button>

        </div>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <div className="loading-card">
            Loading resources...
          </div>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {!loading && error && (
          <div className="error-card">
            {error}
          </div>
        )}

        {/* ==================================================
            RESOURCE CARDS
        ================================================== */}

        {!loading &&
          !error &&
          visibleResources.length > 0 && (
            <div className="resource-cards-wrapper">

              <div className="resource-cards-grid">

                {visibleResources.map(
                  (resource) => {
                    const currentAction =
                      getActionStatus(
                        resource,
                        actionStatuses
                      );

                    const aboveBaseline =
                      getAboveBaselineCost(
                        resource
                      );

                    return (
                      <div
                        className="resource-card"
                        key={
                          resource.resourceName
                        }
                      >

                        {/* CARD HEADER */}

                        <div className="resource-card-header">

                          <div className="resource-card-identity">

                            <div className="resource-card-icon">
                              ◈
                            </div>

                            <div>
                              <h3>
                                {
                                  resource.resourceName
                                }
                              </h3>

                              <span className="resource-service">
                                {
                                  resource.serviceName
                                }
                              </span>
                            </div>

                          </div>

                          <div
                            className={`resource-status ${statusClass(
                              resource.health
                            )}`}
                          >
                            <span className="status-dot" />

                            {resource.health}
                          </div>

                        </div>

                        {/* CARD DETAILS */}

                        <div className="resource-card-details">

                          <div className="resource-detail">
                            <span>
                              REGION
                            </span>

                            <strong>
                              {
                                resource.region
                              }
                            </strong>
                          </div>

                          <div className="resource-detail">
                            <span>
                              ENVIRONMENT
                            </span>

                            <strong>
                              <span
                                className={`environment-badge ${statusClass(
                                  resource.environment
                                )}`}
                              >
                                {
                                  resource.environment
                                }
                              </span>
                            </strong>
                          </div>

                          <div className="resource-detail">
                            <span>
                              RECORDS
                            </span>

                            <strong>
                              {formatNumber(
                                resource.recordCount
                              )}
                            </strong>
                          </div>

                        </div>

                        {/* COST COMPARISON */}

                        <div className="resource-card-cost-comparison">

                          <div>
                            <span>
                              LATEST
                            </span>

                            <strong>
                              {formatCurrency(
                                resource.latestCost
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              HISTORICAL AVG
                            </span>

                            <strong>
                              {resource.health ===
                              "Insufficient Data"
                                ? "—"
                                : formatCurrency(
                                    resource.historicalAverage
                                  )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              CHANGE
                            </span>

                            <strong
                              className={
                                resource.deviation >
                                0
                                  ? "positive-deviation"
                                  : resource.deviation <
                                    0
                                  ? "negative-deviation"
                                  : ""
                              }
                            >
                              {resource.health ===
                              "Insufficient Data"
                                ? "—"
                                : formatPercentage(
                                    resource.deviation
                                  )}
                            </strong>
                          </div>

                        </div>

                        {/* TREND */}

                        <div className="resource-card-cost-comparison">

                          <div>
                            <span>
                              TREND
                            </span>

                            <strong>
                              {resource.trend}
                            </strong>
                          </div>

                          <div>
                            <span>
                              TREND CHANGE
                            </span>

                            <strong
                              className={
                                resource.trendPercentage >
                                0
                                  ? "positive-deviation"
                                  : resource.trendPercentage <
                                    0
                                  ? "negative-deviation"
                                  : ""
                              }
                            >
                              {resource.trend ===
                              "Insufficient Data"
                                ? "—"
                                : formatPercentage(
                                    resource.trendPercentage
                                  )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              NEXT PERIOD
                            </span>

                            <strong>
                              {resource.forecastCost >
                              0
                                ? formatCurrency(
                                    resource.forecastCost
                                  )
                                : "—"}
                            </strong>
                          </div>

                        </div>

                        {/* OPTIMIZATION */}

                        <div className="resource-optimization">

                          <div className="resource-optimization-header">

                            <span>
                              RECOMMENDATION
                            </span>

                            <span
                              className={`resource-optimization-badge ${statusClass(
                                resource.optimization
                                  ?.category
                              )}`}
                            >
                              {
                                resource.optimization
                                  ?.icon
                              }{" "}
                              {
                                resource.optimization
                                  ?.category
                              }
                            </span>

                          </div>

                          <strong className="resource-optimization-title">
                            {
                              resource.optimization
                                ?.recommendation
                            }
                          </strong>

                          <p className="resource-optimization-reason">
                            {
                              resource.optimization
                                ?.reason
                            }
                          </p>

                        </div>

                        {/* ABOVE BASELINE */}

                        {aboveBaseline > 0 && (
                          <div className="resource-above-baseline">

                            <span>
                              ABOVE HISTORICAL BASELINE
                            </span>

                            <strong>
                              {formatCurrency(
                                aboveBaseline
                              )}
                            </strong>

                          </div>
                        )}

                        {/* ACTION */}

                        <div className="resource-action">

                          <div className="resource-action-header">

                            <span>
                              OPTIMIZATION ACTION
                            </span>

                            <span
                              className={`resource-action-status ${statusClass(
                                currentAction
                              )}`}
                            >
                              <span className="action-status-dot" />

                              {currentAction}
                            </span>

                          </div>

                          <p>
                            {currentAction ===
                            "Open"
                              ? "Recommended optimization work is ready to be investigated."
                              : currentAction ===
                                "In Progress"
                              ? "Optimization work is currently being investigated."
                              : "Optimization work has been completed."}
                          </p>

                          <button
                            type="button"
                            className={`resource-action-btn ${statusClass(
                              currentAction
                            )}`}
                            onClick={() =>
                              handleAction(
                                resource
                              )
                            }
                          >
                            {currentAction ===
                            "Open"
                              ? "Start Optimization →"
                              : currentAction ===
                                "In Progress"
                              ? "Mark Completed ✓"
                              : "Reopen Action ↻"}
                          </button>

                        </div>

                        {/* CARD FOOTER */}

                        <div className="resource-card-footer">

                          <span>
                            Latest:{" "}
                            {
                              resource.latestDate ||
                              "N/A"
                            }
                          </span>

                          <button
                            type="button"
                            className="resource-view-btn"
                            onClick={() =>
                              setSelectedResource(
                                resource
                              )
                            }
                          >
                            View Details →
                          </button>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>
          )}

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!loading &&
          !error &&
          visibleResources.length ===
            0 && (
            <div className="resource-empty-state">

              <div>
                ◈
              </div>

              <h3>
                No resources found
              </h3>

              <p>
                Try changing your
                search or filters.
              </p>

            </div>
          )}

        {/* ==================================================
            LOAD MORE
        ================================================== */}

        {!loading &&
          !error &&
          visibleCount <
            filteredResources.length && (
            <div className="resource-load-more">

              <button
                type="button"
                onClick={loadMore}
              >
                Load More Resources
              </button>

              <span>
                Showing{" "}
                {visibleResources.length}{" "}
                of{" "}
                {
                  filteredResources.length
                }
              </span>

            </div>
          )}

      </section>

      {/* ==================================================
          RESOURCE MODAL
      ================================================== */}

      {selectedResource && (
        <div
          className="resource-modal-overlay"
          onClick={() =>
            setSelectedResource(null)
          }
        >

          <div
            className="resource-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="resource-modal-header">

              <div className="resource-modal-title">

                <div className="resource-modal-icon">
                  ◈
                </div>

                <div>
                  <h2>
                    {
                      selectedResource.resourceName
                    }
                  </h2>

                  <span className="resource-modal-service">
                    {
                      selectedResource.serviceName
                    }
                  </span>
                </div>

              </div>

              <button
                type="button"
                className="resource-modal-close"
                onClick={() =>
                  setSelectedResource(null)
                }
              >
                ×
              </button>

            </div>

            {/* HEALTH */}

            <div
              className={`resource-modal-status ${statusClass(
                selectedResource.health
              )}`}
            >

              <span className="status-dot" />

              <div>
                <span>
                  RESOURCE HEALTH
                </span>

                <strong>
                  {
                    selectedResource.health
                  }
                </strong>
              </div>

            </div>

            {/* INFO GRID */}

            <div className="resource-modal-grid">

              <div className="resource-modal-field">
                <span>
                  REGION
                </span>

                <strong>
                  {
                    selectedResource.region
                  }
                </strong>
              </div>

              <div className="resource-modal-field">
                <span>
                  ENVIRONMENT
                </span>

                <strong>
                  {
                    selectedResource.environment
                  }
                </strong>
              </div>

              <div className="resource-modal-field">
                <span>
                  RESOURCE GROUP
                </span>

                <strong>
                  {
                    selectedResource.resourceGroup
                  }
                </strong>
              </div>

              <div className="resource-modal-field">
                <span>
                  DEPARTMENT
                </span>

                <strong>
                  {
                    selectedResource.department
                  }
                </strong>
              </div>

              <div className="resource-modal-field">
                <span>
                  COST RECORDS
                </span>

                <strong>
                  {formatNumber(
                    selectedResource.recordCount
                  )}
                </strong>
              </div>

              <div className="resource-modal-field">
                <span>
                  LATEST DATE
                </span>

                <strong>
                  {
                    selectedResource.latestDate ||
                    "N/A"
                  }
                </strong>
              </div>

            </div>

            {/* COST */}

            <div className="resource-cost-panel">

              <span>
                LATEST COST
              </span>

              <strong>
                {formatCurrency(
                  selectedResource.latestCost
                )}
              </strong>

            </div>

            <div className="resource-cost-panel">

              <span>
                HISTORICAL AVERAGE
              </span>

              <strong>
                {selectedResource.health ===
                "Insufficient Data"
                  ? "Insufficient Data"
                  : formatCurrency(
                      selectedResource.historicalAverage
                    )}
              </strong>

            </div>

            <div className="resource-health-comparison">

              <div>
                <span>
                  COST DEVIATION
                </span>

                <strong
                  className={
                    selectedResource.deviation >
                    0
                      ? "positive-deviation"
                      : selectedResource.deviation <
                        0
                      ? "negative-deviation"
                      : ""
                  }
                >
                  {selectedResource.health ===
                  "Insufficient Data"
                    ? "—"
                    : formatPercentage(
                        selectedResource.deviation
                      )}
                </strong>
              </div>

              <div>
                <span>
                  Z-SCORE
                </span>

                <strong>
                  {selectedResource.health ===
                  "Insufficient Data"
                    ? "—"
                    : selectedResource.zScore.toFixed(
                        2
                      )}
                </strong>
              </div>

            </div>

            {/* HEALTH EXPLANATION */}

            <div className="resource-health-comparison">

              <div>
                <span>
                  HEALTH ANALYSIS
                </span>

                <strong>
                  {selectedResource.health ===
                  "Critical"
                    ? "Cost is significantly above normal historical behavior."
                    : selectedResource.health ===
                      "Warning"
                    ? "Cost is moderately above historical behavior."
                    : selectedResource.health ===
                      "Healthy"
                    ? "Cost is behaving within the expected historical range."
                    : "More historical data is required for reliable analysis."}
                </strong>
              </div>

            </div>

            {/* ==================================================
                TREND & FORECAST
            ================================================== */}

            <div className="resource-trend-section">

              <div className="resource-trend-header">

                <div>
                  <span>
                    COST TREND
                  </span>

                  <strong>
                    {
                      selectedResource.trend
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    NEXT PERIOD FORECAST
                  </span>

                  <strong>
                    {selectedResource.forecastCost >
                    0
                      ? formatCurrency(
                          selectedResource.forecastCost
                        )
                      : "Insufficient Data"}
                  </strong>
                </div>

              </div>

              {selectedResource.history &&
              selectedResource.history.length >=
                2 ? (
                <div className="resource-trend-chart">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        selectedResource.history
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        opacity={0.08}
                      />

                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 10,
                        }}
                        tickFormatter={(
                          value
                        ) =>
                          value
                            ? String(
                                value
                              ).slice(5)
                            : ""
                        }
                      />

                      <YAxis
                        tick={{
                          fontSize: 10,
                        }}
                        tickFormatter={(
                          value
                        ) =>
                          `$${Number(
                            value
                          ).toFixed(0)}`
                        }
                      />

                      <Tooltip
                        formatter={(
                          value
                        ) => [
                          formatCurrency(
                            value
                          ),
                          "Cost",
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#8f96a3"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 4,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                </div>
              ) : (
                <div className="resource-trend-empty">
                  Not enough historical data
                  to display a cost trend.
                </div>
              )}

              <div className="resource-trend-summary">

                <div>
                  <span>
                    PREVIOUS PERIOD AVG
                  </span>

                  <strong>
                    {selectedResource.previousAverage >
                    0
                      ? formatCurrency(
                          selectedResource.previousAverage
                        )
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    RECENT PERIOD AVG
                  </span>

                  <strong>
                    {selectedResource.recentAverage >
                    0
                      ? formatCurrency(
                          selectedResource.recentAverage
                        )
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    TREND CHANGE
                  </span>

                  <strong
                    className={
                      selectedResource.trendPercentage >
                      0
                        ? "positive-deviation"
                        : selectedResource.trendPercentage <
                          0
                        ? "negative-deviation"
                        : ""
                    }
                  >
                    {selectedResource.trend ===
                    "Insufficient Data"
                      ? "—"
                      : formatPercentage(
                          selectedResource.trendPercentage
                        )}
                  </strong>
                </div>

              </div>

            </div>

            {/* ==================================================
                OPTIMIZATION RECOMMENDATION
            ================================================== */}

            <div className="resource-optimization-modal">

              <div className="resource-modal-section-title">
                <span>
                  OPTIMIZATION RECOMMENDATION
                </span>
              </div>

              <div
                className={`resource-optimization-modal-card ${statusClass(
                  selectedResource
                    .optimization
                    ?.category
                )}`}
              >

                <div className="resource-optimization-modal-header">

                  <div className="resource-optimization-modal-icon">
                    {
                      selectedResource
                        .optimization
                        ?.icon
                    }
                  </div>

                  <div>
                    <span>
                      RECOMMENDED ACTION
                    </span>

                    <strong>
                      {
                        selectedResource
                          .optimization
                          ?.category
                      }
                    </strong>
                  </div>

                </div>

                <p>
                  {
                    selectedResource
                      .optimization
                      ?.recommendation
                  }
                </p>

                <small>
                  {
                    selectedResource
                      .optimization
                      ?.reason
                  }
                </small>

              </div>

            </div>

            {/* ==================================================
                OPTIMIZATION ACTION WORKFLOW
            ================================================== */}

            <div className="resource-optimization-action-modal">

              <div className="resource-modal-section-title">
                <span>
                  OPTIMIZATION ACTION
                </span>
              </div>

              <div
                className={`resource-optimization-action-card ${statusClass(
                  getActionStatus(
                    selectedResource,
                    actionStatuses
                  )
                )}`}
              >

                <div className="resource-optimization-action-header">

                  <div>
                    <span>
                      ACTION STATUS
                    </span>

                    <strong>
                      {getActionStatus(
                        selectedResource,
                        actionStatuses
                      )}
                    </strong>
                  </div>

                  <div
                    className={`resource-action-status ${statusClass(
                      getActionStatus(
                        selectedResource,
                        actionStatuses
                      )
                    )}`}
                  >
                    <span className="action-status-dot" />

                    {getActionStatus(
                      selectedResource,
                      actionStatuses
                    )}
                  </div>

                </div>

                <p>
                  {getActionStatus(
                    selectedResource,
                    actionStatuses
                  ) === "Open"
                    ? "This recommendation is ready to be investigated."
                    : getActionStatus(
                        selectedResource,
                        actionStatuses
                      ) === "In Progress"
                    ? "Optimization work is currently in progress."
                    : "The optimization action has been completed."}
                </p>

                <button
                  type="button"
                  className={`resource-action-btn ${statusClass(
                    getActionStatus(
                      selectedResource,
                      actionStatuses
                    )
                  )}`}
                  onClick={() =>
                    handleAction(
                      selectedResource
                    )
                  }
                >
                  {getActionStatus(
                    selectedResource,
                    actionStatuses
                  ) === "Open"
                    ? "Start Optimization →"
                    : getActionStatus(
                        selectedResource,
                        actionStatuses
                      ) === "In Progress"
                    ? "Mark Completed ✓"
                    : "Reopen Action ↻"}
                </button>

              </div>

              {getAboveBaselineCost(
                selectedResource
              ) > 0 && (
                <div className="resource-modal-above-baseline">

                  <span>
                    CURRENT COST ABOVE HISTORICAL BASELINE
                  </span>

                  <strong>
                    {formatCurrency(
                      getAboveBaselineCost(
                        selectedResource
                      )
                    )}
                  </strong>

                  <small>
                    This represents the current
                    spending above the resource's
                    historical average. It is an
                    indicator for investigation,
                    not a guaranteed savings amount.
                  </small>

                </div>
              )}

            </div>

            {/* ==================================================
                TREND EXPLANATION
            ================================================== */}

            <div className="resource-health-comparison">

              <div>
                <span>
                  TREND ANALYSIS
                </span>

                <strong>
                  {selectedResource.trend ===
                  "Increasing"
                    ? "Recent spending is higher than the earlier historical period."
                    : selectedResource.trend ===
                      "Decreasing"
                    ? "Recent spending is lower than the earlier historical period."
                    : selectedResource.trend ===
                      "Stable"
                    ? "Recent spending is broadly consistent with the earlier historical period."
                    : "More historical data is required for trend analysis."}
                </strong>
              </div>

            </div>

            <div className="resource-modal-done">

              <button
                type="button"
                onClick={() =>
                  setSelectedResource(null)
                }
              >
                Done
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Resources;