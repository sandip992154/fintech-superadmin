/**
 * Enhanced Resource Management Dashboard
 * =====================================
 *
 * Main entry point for resource management combining schemes, commissions,
 * and comprehensive resource management capabilities.
 */

import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFile,
  FaUsers,
  FaEye,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaChartBar,
  FaClock,
  FaExclamationTriangle,
  FaCog,
  FaDatabase,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { resourceManagementService } from "../../../services/resourceManagementService";
import { SchemeManager } from "./SchemeManger";
import ResourceIntegrationTest from "../../../components/super/resource_tab/ResourceIntegrationTest";

const ResourceManagementDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalResources: 0,
      totalCategories: 0,
      activeResources: 0,
      recentActivity: 0,
      totalSchemes: 0,
      activeSchemes: 0,
    },
    recentResources: [],
    recentActivity: [],
    categoryBreakdown: [],
  });

  useEffect(() => {
    if (activeView === "dashboard") {
      loadDashboardData();
    }
  }, [activeView]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard statistics
      const [stats, resources, activity, categories] = await Promise.all([
        resourceManagementService.getDashboardStats(),
        resourceManagementService.getRecentResources(5),
        resourceManagementService.getRecentActivity(10),
        resourceManagementService.getCategories(),
      ]);

      setDashboardData({
        stats: {
          ...stats.data,
          totalSchemes: 15, // This would come from existing schemes API
          activeSchemes: 12, // This would come from existing schemes API
        },
        recentResources: resources.data.items,
        recentActivity: activity.data.items,
        categoryBreakdown: categories.data,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    change,
    changeType,
    onClick,
  }) => (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      }`}
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p
              className={`text-xs ${
                changeType === "increase" ? "text-green-600" : "text-red-600"
              }`}
            >
              {changeType === "increase" ? "↗" : "↘"} {change}%
            </p>
          )}
        </div>
        <div
          className="p-3 rounded-full"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-start space-x-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <FaClock className="w-4 h-4 text-blue-600 dark:text-blue-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          <span className="font-medium">{activity.user_name}</span>{" "}
          {activity.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(activity.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: FaChartBar },
    { id: "schemes", label: "Schemes & Commission", icon: FaCog },
    { id: "resources", label: "Resource Manager", icon: FaDatabase },
    { id: "categories", label: "Categories", icon: FaFolder },
    { id: "integration-test", label: "API Test", icon: FaExclamationTriangle },
  ];

  return (
    <div className="h-screen max-h-screen flex flex-col p-4 mx-4 lg:mx-8 bg-secondaryOne dark:bg-darkBlue/70 rounded-2xl text-gray-800 overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className="w-64 min-w-64 bg-white dark:bg-gray-800 rounded-l-2xl p-4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="mb-6 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Resource Hub
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comprehensive management
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2 pr-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeView === item.id
                      ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Stats Sidebar */}
          <div className="mt-4 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Quick Stats
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {dashboardData.stats.totalResources}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total Resources
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {dashboardData.stats.totalSchemes}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Active Schemes
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {dashboardData.stats.totalCategories}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Categories
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-r-2xl overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700">
            {/* Dashboard View */}
            {activeView === "dashboard" && (
              <div className="p-6">
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Resource Management Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Monitor and manage all platform resources from one central
                    location
                  </p>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <ClipLoader color="#3B82F6" size={40} />
                  </div>
                ) : (
                  <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <StatCard
                        title="Total Resources"
                        value={dashboardData.stats.totalResources}
                        icon={FaFile}
                        color="#3B82F6"
                        change={12}
                        changeType="increase"
                        onClick={() => setActiveView("resources")}
                      />
                      <StatCard
                        title="Categories"
                        value={dashboardData.stats.totalCategories}
                        icon={FaFolder}
                        color="#10B981"
                        change={5}
                        changeType="increase"
                        onClick={() => setActiveView("categories")}
                      />
                      <StatCard
                        title="Active Schemes"
                        value={dashboardData.stats.activeSchemes}
                        icon={FaCog}
                        color="#8B5CF6"
                        change={8}
                        changeType="increase"
                        onClick={() => setActiveView("schemes")}
                      />
                      <StatCard
                        title="Recent Activity"
                        value={dashboardData.stats.recentActivity}
                        icon={FaChartBar}
                        color="#F59E0B"
                        change={15}
                        changeType="increase"
                      />
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Recent Resources */}
                      <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Recent Resources
                            </h2>
                            <button
                              onClick={() => setActiveView("resources")}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View All
                            </button>
                          </div>

                          {dashboardData.recentResources.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                              No resources created yet
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {dashboardData.recentResources.map((resource) => (
                                <div
                                  key={resource.id}
                                  className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => setActiveView("resources")}
                                >
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                      <FaFile className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {resource.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {resource.category_name} •{" "}
                                      {resource.resource_type}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        resource.status === "active"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                      }`}
                                    >
                                      {resource.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Activity Feed */}
                      <div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                              Recent Activity
                            </h2>
                          </div>

                          {dashboardData.recentActivity.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                              No recent activity
                            </p>
                          ) : (
                            <div className="space-y-0">
                              {dashboardData.recentActivity.map((activity) => (
                                <ActivityItem
                                  key={activity.id}
                                  activity={activity}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    {dashboardData.categoryBreakdown.length > 0 && (
                      <div className="mt-8">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Resources by Category
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dashboardData.categoryBreakdown.map((category) => (
                              <div
                                key={category.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setActiveView("categories")}
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{
                                      backgroundColor:
                                        category.color || "#3B82F6",
                                    }}
                                  />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {category.name}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {category.resources_count || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Schemes & Commission View */}
            {activeView === "schemes" && (
              <div className="p-2">
                <SchemeManager />
              </div>
            )}

            {/* Other views can be added here */}
            {activeView === "resources" && (
              <div className="p-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <FaDatabase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Resource Manager
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Advanced resource management features coming soon. Use the
                    Resource Manager button in Schemes tab for now.
                  </p>
                </div>
              </div>
            )}

            {activeView === "categories" && (
              <div className="p-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <FaFolder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Category Management
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Category management interface integrated with resource
                    manager.
                  </p>
                </div>
              </div>
            )}

            {activeView === "integration-test" && (
              <div className="p-6">
                <ResourceIntegrationTest />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManagementDashboard;
