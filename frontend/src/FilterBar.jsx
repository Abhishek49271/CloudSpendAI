function FilterBar({
  services,
  regions,
  departments,
  environments,
  filters,
  setFilters,
  onReset,
}) {
  return (
    <div className="filter-card">
      <div className="filter-title">
        <div>
          <h2>Cost Filters</h2>
          <p>Analyze cloud spending by dimension</p>
        </div>

        <button className="reset-button" onClick={onReset}>
          Reset Filters
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>From</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                startDate: e.target.value,
              })
            }
          />
        </div>

        <div className="filter-group">
          <label>To</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                endDate: e.target.value,
              })
            }
          />
        </div>

        <div className="filter-group">
          <label>Service</label>
          <select
            value={filters.service}
            onChange={(e) =>
              setFilters({
                ...filters,
                service: e.target.value,
              })
            }
          >
            <option value="">All Services</option>

            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Region</label>
          <select
            value={filters.region}
            onChange={(e) =>
              setFilters({
                ...filters,
                region: e.target.value,
              })
            }
          >
            <option value="">All Regions</option>

            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Department</label>
          <select
            value={filters.department}
            onChange={(e) =>
              setFilters({
                ...filters,
                department: e.target.value,
              })
            }
          >
            <option value="">All Departments</option>

            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Environment</label>
          <select
            value={filters.environment}
            onChange={(e) =>
              setFilters({
                ...filters,
                environment: e.target.value,
              })
            }
          >
            <option value="">All Environments</option>

            {environments.map((environment) => (
              <option key={environment} value={environment}>
                {environment}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;