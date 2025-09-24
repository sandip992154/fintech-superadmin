/**
 * Resource Details Component
 * =========================
 *
 * Displays comprehensive resource information including metadata,
 * files, permissions, and activity logs.
 */

import React, { useState, useEffect } from "react";
import {
  FaFile,
  FaDownload,
  FaEye,
  FaCalendar,
  FaUser,
  FaTag,
  FaLock,
  FaGlobe,
  FaKey,
  FaHistory,
  FaEdit,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { resourceManagementService } from "../../../services/resourceManagementService";

const ResourceDetails = ({ resource }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [resourceFiles, setResourceFiles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (resource) {
      loadResourceDetails();
    }
  }, [resource]);

  const loadResourceDetails = async () => {
    try {
      setLoading(true);
      const [filesRes, permissionsRes, auditRes] = await Promise.all([
        resourceManagementService.getResourceFiles(resource.id),
        resourceManagementService.getResourcePermissions(resource.id),
        resourceManagementService.getResourceAuditLogs(resource.id, {
          limit: 10,
        }),
      ]);

      setResourceFiles(filesRes.data || []);
      setPermissions(permissionsRes.data || []);
      setAuditLogs(auditRes.data.items || []);
    } catch (error) {
      console.error("Error loading resource details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelIcon = (level) => {
    switch (level) {
      case "public":
        return <FaGlobe className="text-green-500" />;
      case "internal":
        return <FaKey className="text-blue-500" />;
      case "restricted":
        return <FaLock className="text-orange-500" />;
      case "private":
        return <FaLock className="text-red-500" />;
      default:
        return <FaKey className="text-gray-500" />;
    }
  };

  const getResourceTypeIcon = (type) => {
    switch (type) {
      case "document":
        return <FaFile className="text-blue-500" />;
      case "image":
        return <FaFile className="text-green-500" />;
      case "video":
        return <FaFile className="text-purple-500" />;
      case "template":
        return <FaFile className="text-orange-500" />;
      case "link":
        return <FaFile className="text-cyan-500" />;
      case "data":
        return <FaFile className="text-yellow-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaEye },
    { id: "files", label: "Files", icon: FaFile },
    { id: "permissions", label: "Permissions", icon: FaLock },
    { id: "activity", label: "Activity", icon: FaHistory },
  ];

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="space-y-6">
        {/* Resource Header */}
        <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                {getResourceTypeIcon(resource.resource_type)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                  {resource.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                  {resource.description || "No description available"}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <FaTag className="flex-shrink-0" />
                    <span className="truncate">{resource.category_name}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FaCalendar className="flex-shrink-0" />
                    <span>
                      {new Date(resource.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FaUser className="flex-shrink-0" />
                    <span className="truncate">
                      {resource.created_by_name || "System"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  resource.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                {resource.status}
              </span>
              <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                {getAccessLevelIcon(resource.access_level)}
                <span className="text-sm capitalize">
                  {resource.access_level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="overflow-x-auto">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px] max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader color="#3B82F6" size={35} />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Basic Information
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Resource Type:</span>
                          <span className="capitalize">
                            {resource.resource_type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Access Level:</span>
                          <span className="capitalize">
                            {resource.access_level}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Created:</span>
                          <span>
                            {new Date(resource.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Last Updated:</span>
                          <span>
                            {new Date(resource.updated_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Statistics
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Files:</span>
                          <span>{resourceFiles.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Permissions:</span>
                          <span>{permissions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Size:</span>
                          <span>
                            {formatFileSize(
                              resourceFiles.reduce(
                                (total, file) => total + (file.file_size || 0),
                                0
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  {resource.content && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Content
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        {resource.resource_type === "link" ? (
                          <a
                            href={resource.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all"
                          >
                            {resource.content}
                          </a>
                        ) : (
                          <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
                            {resource.content}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {resource.metadata &&
                    Object.keys(resource.metadata).length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Metadata
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <pre className="text-sm font-mono overflow-x-auto">
                            {JSON.stringify(resource.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Files Tab */}
              {activeTab === "files" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Attached Files ({resourceFiles.length})
                    </h3>
                  </div>

                  {resourceFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No files attached to this resource
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {resourceFiles.map((file) => (
                        <div
                          key={file.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FaFile className="text-blue-500" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {file.original_filename}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatFileSize(file.file_size)} •{" "}
                                  {file.file_type} • Uploaded{" "}
                                  {new Date(
                                    file.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  window.open(file.file_url, "_blank")
                                }
                                className="text-blue-600 hover:text-blue-800 p-2"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = file.file_url;
                                  link.download = file.original_filename;
                                  link.click();
                                }}
                                className="text-green-600 hover:text-green-800 p-2"
                              >
                                <FaDownload />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === "permissions" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Access Permissions
                  </h3>

                  {permissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No specific permissions configured
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {permissions.map((permission, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {permission.user_name || permission.role_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {permission.user_name ? "User" : "Role"} •{" "}
                                {permission.permission_type}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {permission.permission_type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recent Activity
                  </h3>

                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No activity recorded
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {log.action}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                by {log.user_name || "System"}
                              </p>
                              {log.details && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {typeof log.details === "string"
                                    ? log.details
                                    : JSON.stringify(log.details)}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceDetails;
