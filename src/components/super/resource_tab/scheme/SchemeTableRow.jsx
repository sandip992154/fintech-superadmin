import React from "react";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { ToggleButton } from "../../../utility/ToggleButton";
import CommissionDropdown from "../CommissionDropdown";

/**
 * SchemeTableRow Component
 * Individual row in the scheme table with all actions
 * Supports partial rendering for use with PaginatedTable columns
 */
export const SchemeTableRow = ({
  scheme,
  index,
  onToggle,
  onEdit,
  onDelete,
  onViewCommission,
  canEdit,
  canDelete,
  canViewCommission,
  canManageCommission,
  commissionDropdownOptions,
  handleCommissionOptionClick,
  setSelectedCommission,
  renderOnly, // New prop for partial rendering
}) => {
  const getRoleDisplay = (role) => {
    if (!role)
      return { text: "Unknown", className: "bg-gray-100 text-gray-800" };

    const normalizedRole = role.toLowerCase();

    const roleMap = {
      super_admin: {
        text: "Super Admin",
        className: "bg-purple-100 text-purple-800",
      },
      superadmin: {
        text: "Super Admin",
        className: "bg-purple-100 text-purple-800",
      },
      admin: { text: "Admin", className: "bg-blue-100 text-blue-800" },
      whitelabel: {
        text: "Whitelabel",
        className: "bg-indigo-100 text-indigo-800",
      },
      masterdistributor: {
        text: "Master Distributor",
        className: "bg-green-100 text-green-800",
      },
      distributor: {
        text: "Distributor",
        className: "bg-yellow-100 text-yellow-800",
      },
      retailer: {
        text: "Retailer",
        className: "bg-orange-100 text-orange-800",
      },
      user: { text: "User", className: "bg-gray-100 text-gray-800" },
      customer: { text: "Customer", className: "bg-gray-100 text-gray-800" },
    };

    return (
      roleMap[normalizedRole] || {
        text: role.charAt(0).toUpperCase() + role.slice(1),
        className: "bg-gray-100 text-gray-800",
      }
    );
  };

  const roleDisplay = getRoleDisplay(scheme.created_by_role);
  const showAnyAction =
    canEdit || canDelete || canViewCommission || canManageCommission;

  // Partial rendering for PaginatedTable columns
  if (renderOnly === "status") {
    return (
      <ToggleButton
        row={scheme}
        onchange={() => onToggle(scheme, index)}
        checked={Boolean(scheme.is_active)}
      />
    );
  }

  if (renderOnly === "role") {
    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${roleDisplay.className}`}
      >
        {roleDisplay.text}
      </span>
    );
  }

  if (renderOnly === "owner") {
    return scheme.owner_id ? (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        User #{scheme.owner_id}
      </span>
    ) : (
      <span className="text-sm text-gray-400">N/A</span>
    );
  }

  if (renderOnly === "actions") {
    return showAnyAction ? (
      <div className="flex items-center space-x-2">
        {canEdit && (
          <button
            onClick={() => onEdit(scheme)}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title="Edit Scheme"
          >
            <FaEdit className="text-lg" />
          </button>
        )}

        {canViewCommission && (
          <button
            onClick={() => onViewCommission(scheme)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="View Commission"
          >
            <FaEye className="text-lg" />
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(scheme)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete Scheme"
          >
            <FaTrash className="text-lg" />
          </button>
        )}

        {canManageCommission && (
          <CommissionDropdown
            commissions={scheme.commissions || []}
            setSelectedCommission={setSelectedCommission}
            commissionDropdownOptions={commissionDropdownOptions}
            handleCommissionOptionClick={handleCommissionOptionClick}
            scheme={scheme}
          />
        )}
      </div>
    ) : (
      <span className="text-xs text-gray-400">No access</span>
    );
  }

  // Full row rendering (legacy support)
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* ID */}
      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
        #{scheme.id}
      </td>

      {/* Scheme Name */}
      <td className="px-6 py-4">
        <div className="font-semibold text-gray-900 dark:text-white">
          {scheme.name}
        </div>
      </td>

      {/* Description */}
      <td className="px-6 py-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {scheme.description || "No description"}
        </div>
      </td>

      {/* Status Toggle */}
      <td className="px-6 py-4">
        <ToggleButton
          row={scheme}
          onchange={() => onToggle(scheme, index)}
          checked={Boolean(scheme.is_active)}
        />
      </td>

      {/* Creator Role */}
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${roleDisplay.className}`}
        >
          {roleDisplay.text}
        </span>
      </td>

      {/* Owner */}
      <td className="px-6 py-4">
        {scheme.owner_id ? (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            User #{scheme.owner_id}
          </span>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        )}
      </td>

      {/* Created Date */}
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
        {scheme.created_at
          ? new Date(scheme.created_at).toLocaleDateString()
          : "N/A"}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        {showAnyAction ? (
          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => onEdit(scheme)}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Edit Scheme"
              >
                <FaEdit className="text-lg" />
              </button>
            )}

            {canViewCommission && (
              <button
                onClick={() => onViewCommission(scheme)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="View Commission"
              >
                <FaEye className="text-lg" />
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(scheme)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Scheme"
              >
                <FaTrash className="text-lg" />
              </button>
            )}

            {canManageCommission && (
              <CommissionDropdown
                commissions={scheme.commissions || []}
                setSelectedCommission={setSelectedCommission}
                commissionDropdownOptions={commissionDropdownOptions}
                handleCommissionOptionClick={handleCommissionOptionClick}
                scheme={scheme}
              />
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">No access</span>
        )}
      </td>
    </tr>
  );
};
