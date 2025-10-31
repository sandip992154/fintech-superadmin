import React from "react";

/**
 * SchemeFilters Component
 * Enhanced filter bar with better visual design matching the image
 */
export const SchemeFilters = ({
  filters,
  handleInputChange,
  onSearch,
  onClear,
}) => {
  return (
    <div className="space-y-6">
      {/* First Row - Main Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Search Input */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search schemes..."
            value={filters.searchValue || ""}
            onChange={(e) => handleInputChange("searchValue", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>

        {/* Status Select */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.is_active || "all"}
            onChange={(e) => handleInputChange("is_active", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          >
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* From Date */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            From
          </label>
          <input
            type="date"
            value={filters.from_date || ""}
            onChange={(e) => handleInputChange("from_date", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>

        {/* To Date */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To
          </label>
          <input
            type="date"
            value={filters.to_date || ""}
            onChange={(e) => handleInputChange("to_date", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>

        {/* User ID Filter */}
        {filters.filter_user_id !== undefined && (
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by User ID (includes hierarchy)
            </label>
            <input
              type="number"
              placeholder="Enter User ID"
              value={filters.filter_user_id || ""}
              onChange={(e) =>
                handleInputChange("filter_user_id", e.target.value)
              }
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
        )}
      </div>

      {/* Second Row - Action Buttons */}
      <div className="flex justify-start gap-4">
        <button
          onClick={onSearch}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-2.5 rounded-sm transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Search
        </button>

        {onClear && (
          <button
            onClick={onClear}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-8 py-2.5 rounded-sm transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
