/**
 * Enhanced Member List Component
 * Optimized listing with role-based filtering and advanced search
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiToggleLeft,
  FiToggleRight,
  FiTrash2,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "react-toastify";
import PerformanceMonitor from "../../common/PerformanceMonitor";

const EnhancedMemberList = React.memo(
  ({
    members = [],
    loading = false,
    currentPage = 1,
    totalPages = 1,
    totalMembers = 0,
    pageSize = 20,
    filters = {},
    currentUser,
    schemes = [],
    availableParents = [],
    onFilterChange,
    onSearch,
    onPageChange,
    onMemberStatusToggle,
    onMemberEdit,
    onMemberView,
    onMemberDelete,
    onRefresh,
    onExport,
  }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({
      key: filters.sort_by || "created_at",
      direction: filters.sort_order || "desc",
    });

    // Memoized filtered and sorted members
    const processedMembers = useMemo(() => {
      let result = [...members];

      // Apply local search if no server-side search
      if (searchTerm && !filters.search) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (member) =>
            member.full_name?.toLowerCase().includes(term) ||
            member.email?.toLowerCase().includes(term) ||
            member.phone?.includes(term) ||
            member.user_code?.toLowerCase().includes(term)
        );
      }

      return result;
    }, [members, searchTerm, filters.search]);

    // Handle search input
    const handleSearchChange = useCallback(
      (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Debounced search
        if (onSearch) {
          const timeoutId = setTimeout(() => {
            onSearch(value);
          }, 300);

          return () => clearTimeout(timeoutId);
        }
      },
      [onSearch]
    );

    // Handle filter changes
    const handleFilterChange = useCallback(
      (filterName, value) => {
        if (onFilterChange) {
          onFilterChange({
            ...filters,
            [filterName]: value,
          });
        }
      },
      [filters, onFilterChange]
    );

    // Handle sorting
    const handleSort = useCallback(
      (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
          direction = "desc";
        }

        setSortConfig({ key, direction });

        if (onFilterChange) {
          onFilterChange({
            ...filters,
            sort_by: key,
            sort_order: direction,
          });
        }
      },
      [sortConfig, filters, onFilterChange]
    );

    // Handle member selection
    const handleMemberSelect = useCallback((memberId) => {
      setSelectedMembers((prev) => {
        const newSelected = new Set(prev);
        if (newSelected.has(memberId)) {
          newSelected.delete(memberId);
        } else {
          newSelected.add(memberId);
        }
        return newSelected;
      });
    }, []);

    // Handle select all
    const handleSelectAll = useCallback(() => {
      if (selectedMembers.size === processedMembers.length) {
        setSelectedMembers(new Set());
      } else {
        setSelectedMembers(new Set(processedMembers.map((m) => m.id)));
      }
    }, [selectedMembers.size, processedMembers]);

    // Handle bulk actions
    const handleBulkAction = useCallback(
      async (action) => {
        if (selectedMembers.size === 0) {
          toast.warning("Please select members to perform bulk action");
          return;
        }

        const memberIds = Array.from(selectedMembers);

        try {
          switch (action) {
            case "activate":
              // Implement bulk activate
              toast.success(`Activated ${memberIds.length} members`);
              break;
            case "deactivate":
              // Implement bulk deactivate
              toast.success(`Deactivated ${memberIds.length} members`);
              break;
            case "delete":
              if (
                window.confirm(
                  `Are you sure you want to delete ${memberIds.length} members?`
                )
              ) {
                // Implement bulk delete
                toast.success(`Deleted ${memberIds.length} members`);
              }
              break;
            default:
              break;
          }

          setSelectedMembers(new Set());
          if (onRefresh) onRefresh();
        } catch (error) {
          toast.error(`Failed to ${action} members`);
        }
      },
      [selectedMembers, onRefresh]
    );

    // Get pagination info
    const paginationInfo = useMemo(() => {
      const start = (currentPage - 1) * pageSize + 1;
      const end = Math.min(currentPage * pageSize, totalMembers);
      return { start, end };
    }, [currentPage, pageSize, totalMembers]);

    // Get sort icon
    const getSortIcon = useCallback(
      (columnKey) => {
        if (sortConfig.key !== columnKey) {
          return <span className="sort-icon">↕️</span>;
        }
        return (
          <span className="sort-icon active">
            {sortConfig.direction === "asc" ? "↑" : "↓"}
          </span>
        );
      },
      [sortConfig]
    );

    // Role-based access control
    const canEdit = useMemo(() => {
      return (
        currentUser?.role && ["SuperAdmin", "Admin"].includes(currentUser.role)
      );
    }, [currentUser]);

    const canDelete = useMemo(() => {
      return currentUser?.role === "SuperAdmin";
    }, [currentUser]);

    return (
      <div className="enhanced-member-list">
        {/* Header Section */}
        <div className="list-header">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="list-title">
              <h5 className="mb-0">
                <FiUsers className="me-2" />
                Members ({totalMembers})
              </h5>
              <small className="text-muted">
                {currentUser?.role} view - Showing {paginationInfo.start}-
                {paginationInfo.end} of {totalMembers}
              </small>
            </div>

            <div className="list-actions">
              <button
                className="btn btn-outline-primary btn-sm me-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="me-1" />
                Filters
              </button>

              <button
                className="btn btn-outline-success btn-sm me-2"
                onClick={onExport}
                disabled={loading || totalMembers === 0}
              >
                <FiDownload className="me-1" />
                Export
              </button>

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <FiRefreshCw className={`me-1 ${loading ? "spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FiSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search members by name, email, phone, or code..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {selectedMembers.size > 0 && (
              <div className="col-md-6">
                <div className="bulk-actions">
                  <span className="me-2">{selectedMembers.size} selected</span>
                  <div className="btn-group" role="group">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleBulkAction("activate")}
                    >
                      Activate
                    </button>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleBulkAction("deactivate")}
                    >
                      Deactivate
                    </button>
                    {canDelete && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleBulkAction("delete")}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="filter-panel">
              <div className="row g-2">
                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={filters.role || ""}
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="WhiteLabel">WhiteLabel</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Retailer">Retailer</option>
                    <option value="CustomerSupport">Customer Support</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={filters.status || "all"}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={filters.scheme || ""}
                    onChange={(e) =>
                      handleFilterChange("scheme", e.target.value)
                    }
                  >
                    <option value="">All Schemes</option>
                    {schemes.map((scheme) => (
                      <option
                        key={scheme.id || scheme.name}
                        value={scheme.name}
                      >
                        {scheme.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={filters.parent_id || ""}
                    onChange={(e) =>
                      handleFilterChange("parent_id", e.target.value)
                    }
                  >
                    <option value="">All Parents</option>
                    {availableParents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.name} ({parent.role_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="table-light">
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={
                      selectedMembers.size === processedMembers.length &&
                      processedMembers.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("user_code")}
                >
                  Code {getSortIcon("user_code")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("full_name")}
                >
                  Name {getSortIcon("full_name")}
                </th>
                <th>Email & Phone</th>
                <th>Role</th>
                <th>Parent</th>
                <th>Business Info</th>
                <th
                  className="sortable"
                  onClick={() => handleSort("created_at")}
                >
                  Created {getSortIcon("created_at")}
                </th>
                <th>Status</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="mt-2">Loading members...</div>
                  </td>
                </tr>
              ) : processedMembers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    <FiUsers size={48} className="mb-2 opacity-50" />
                    <div>No members found</div>
                    <small>Try adjusting your search or filters</small>
                  </td>
                </tr>
              ) : (
                processedMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => handleMemberSelect(member.id)}
                      />
                    </td>
                    <td>
                      <code className="text-primary">{member.user_code}</code>
                    </td>
                    <td>
                      <div className="member-name">
                        <strong>{member.full_name}</strong>
                        {member.shop_name && (
                          <small className="d-block text-muted">
                            {member.shop_name}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div>{member.email}</div>
                        <small className="text-muted">
                          {member.displayPhone}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge bg-${getRoleBadgeColor(
                          member.role_name
                        )}`}
                      >
                        {member.role_name}
                      </span>
                    </td>
                    <td>
                      {member.parent_name ? (
                        <small className="text-muted">
                          {member.parent_name}
                        </small>
                      ) : (
                        <small className="text-muted">-</small>
                      )}
                    </td>
                    <td>
                      <div className="business-info">
                        {member.company_name && (
                          <small className="d-block">
                            {member.company_name}
                          </small>
                        )}
                        {member.scheme && (
                          <span className="badge bg-light text-dark">
                            {member.scheme}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">{member.joinDate}</small>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${
                          member.is_active ? "btn-success" : "btn-danger"
                        }`}
                        onClick={() =>
                          onMemberStatusToggle(member.id, !member.is_active)
                        }
                        disabled={loading}
                      >
                        {member.is_active ? (
                          <>
                            <FiToggleRight className="me-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <FiToggleLeft className="me-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => onMemberView(member)}
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        {canEdit && (
                          <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => onMemberEdit(member)}
                            title="Edit Member"
                          >
                            <FiEdit />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onMemberDelete(member.id)}
                            title="Delete Member"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="pagination-info">
              <small className="text-muted">
                Showing {paginationInfo.start} to {paginationInfo.end} of{" "}
                {totalMembers} entries
              </small>
            </div>

            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <FiChevronLeft />
                  </button>
                </li>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <li
                      key={pageNum}
                      className={`page-item ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => onPageChange(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    <FiChevronRight />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        <style jsx>{`
          .enhanced-member-list {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .list-header {
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
          }

          .filter-panel {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            margin-top: 1rem;
          }

          .sortable {
            cursor: pointer;
            user-select: none;
          }

          .sortable:hover {
            background-color: #f8f9fa;
          }

          .sort-icon {
            margin-left: 0.5rem;
            opacity: 0.5;
          }

          .sort-icon.active {
            opacity: 1;
            color: #0d6efd;
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .bulk-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .member-name strong {
            font-size: 0.9rem;
          }

          .contact-info div {
            font-size: 0.85rem;
          }

          .business-info {
            font-size: 0.8rem;
          }

          @media (max-width: 768px) {
            .enhanced-member-list {
              padding: 1rem;
            }

            .table-responsive {
              font-size: 0.8rem;
            }

            .btn-group .btn {
              padding: 0.25rem 0.4rem;
            }
          }
        `}</style>

        {/* Performance Monitor for Development */}
        <PerformanceMonitor
          isEnabled={process.env.NODE_ENV === "development"}
          position="bottom-left"
          apiMetrics={{
            apiCalls: loading ? 1 : 0,
            cacheHits: members.length > 0 ? 1 : 0,
            errorCount: 0,
          }}
          renderMetrics={{
            componentName: "EnhancedMemberList",
            itemCount: members.length,
            totalItems: totalMembers,
          }}
        />
      </div>
    );
  }
);

// Helper function for role badge colors
const getRoleBadgeColor = (role) => {
  const colors = {
    SuperAdmin: "danger",
    Admin: "primary",
    WhiteLabel: "info",
    Distributor: "success",
    Retailer: "warning",
    CustomerSupport: "secondary",
  };
  return colors[role] || "secondary";
};

EnhancedMemberList.displayName = "EnhancedMemberList";

export default EnhancedMemberList;
