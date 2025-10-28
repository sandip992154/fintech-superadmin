import React from "react";
import { FaWrench } from "react-icons/fa";

/**
 * SchemeHeader Component
 * Displays the header with title, subtitle, role badge, and statistics
 */
export const SchemeHeader = ({ userRole, dashboardStats, lastUpdated }) => {
  const getRoleBadge = (role) => {
    const roleMap = {
      super_admin: { label: "SUPER-ADMIN ACCESS", color: "bg-blue-500" },
      admin: { label: "ADMIN ACCESS", color: "bg-blue-600" },
      whitelabel: { label: "WHITELABEL ACCESS", color: "bg-purple-500" },
      masterdistributor: { label: "MDS ACCESS", color: "bg-green-500" },
      distributor: { label: "DISTRIBUTOR ACCESS", color: "bg-yellow-500" },
      retailer: { label: "RETAILER ACCESS", color: "bg-orange-500" },
    };

    return (
      roleMap[role?.toLowerCase()] || {
        label: "USER ACCESS",
        color: "bg-gray-500",
      }
    );
  };

  const roleBadge = getRoleBadge(userRole);

  return (
    <div className="p-6 border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start ">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
            <FaWrench className="text-xl text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                Scheme Manager
              </h1>
              <span
                className={`${roleBadge.color} text-white text-xs font-semibold px-3 py-1 rounded-full uppercase`}
              >
                {roleBadge.label}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Administrative control over all schemes and commission structures
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex space-x-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md px-6 py-3 text-center ">
            <div className="text-md font-bold text-blue-600 dark:text-blue-400">
              {dashboardStats.totalSchemes}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
              Total Schemes
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-md px-6 py-3 text-center ">
            <div className="text-md font-bold text-green-600 dark:text-green-400">
              {dashboardStats.activeSchemes}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
              Active
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-md px-6 py-3 text-center ">
            <div className="text-md font-bold text-orange-600 dark:text-orange-400">
              {dashboardStats.totalSchemes - dashboardStats.activeSchemes}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
              Inactive
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
