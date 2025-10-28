import React from "react";
import { SchemeTableRow } from "./SchemeTableRow";
import { ClipLoader } from "react-spinners";

/**
 * SchemeTable Component
 * Enhanced table design matching the image with better styling
 */
export const SchemeTable = ({
  schemes,
  loading,
  onToggle,
  onEdit,
  onDelete,
  onViewCommission,
  canUserAccessScheme,
  hasSchemePermission,
  hasCommissionPermission,
  userRole,
  commissionDropdownOptions,
  handleCommissionOptionClick,
  setSelectedCommission,
  currentPage,
  pageSize,
  totalSchemes,
  onPageChange,
}) => {
  const getPermissions = (scheme) => {
    const hasSchemeAccess = canUserAccessScheme(scheme);
    const isSuperAdmin =
      userRole === "superadmin" || userRole === "super_admin";

    return {
      canEdit:
        isSuperAdmin || (hasSchemeAccess && hasSchemePermission("update")),
      canDelete:
        isSuperAdmin || (hasSchemeAccess && hasSchemePermission("delete")),
      canViewCommission:
        isSuperAdmin || (hasSchemeAccess && hasCommissionPermission("read")),
      canManageCommission:
        isSuperAdmin || (hasSchemeAccess && hasCommissionPermission("update")),
    };
  };

  const totalPages = Math.ceil(totalSchemes / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalSchemes);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm overflow-hidden">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <ClipLoader color="#8B5CF6" size={40} />
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No schemes found
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Try adjusting your filters or create a new scheme
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Scheme Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Creator Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {schemes.map((scheme, index) => {
                  const permissions = getPermissions(scheme);
                  return (
                    <SchemeTableRow
                      key={scheme.id}
                      scheme={scheme}
                      index={index}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onViewCommission={onViewCommission}
                      {...permissions}
                      commissionDropdownOptions={commissionDropdownOptions}
                      handleCommissionOptionClick={handleCommissionOptionClick}
                      setSelectedCommission={setSelectedCommission}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex} to {endIndex} of {totalSchemes} schemes
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? "bg-purple-600 text-white"
                              : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
