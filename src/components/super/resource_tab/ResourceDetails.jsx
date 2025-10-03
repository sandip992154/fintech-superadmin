/**
 * Resource Details Component
 * =========================
 *
 * Component for displaying detailed information about a resource
 * including metadata, files, access levels, and history.
 */

import React, { useState, useEffect } from "react";
import {
  FaFile,
  FaDownload,
  FaEdit,
  FaTrash,
  FaEye,
  FaClock,
  FaUser,
  FaTag,
  FaLink,
  FaShieldAlt,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

const ResourceDetails = ({
  resource,
  onEdit = () => {},
  onDelete = () => {},
  canEdit = true,
  canDelete = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (resource?.files) {
      setFiles(resource.files);
    }
  }, [resource]);

  const handleDownload = async (fileId, fileName) => {
    try {
      setLoading(true);
      // Implement file download logic here
      // const response = await resourceManagementService.downloadFile(fileId);
      toast.success(`Downloading ${fileName}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (file) => {
    // Implement file preview logic
    window.open(file.url, "_blank");
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getAccessLevelBadge = (level) => {
    const levels = {
      public: { color: "bg-green-100 text-green-800", icon: FaEye },
      internal: { color: "bg-blue-100 text-blue-800", icon: FaShieldAlt },
      restricted: { color: "bg-red-100 text-red-800", icon: FaShieldAlt },
      confidential: {
        color: "bg-purple-100 text-purple-800",
        icon: FaShieldAlt,
      },
    };

    const config = levels[level?.toLowerCase()] || levels["internal"];
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${config.color}`}
      >
        <IconComponent className="mr-1" />
        {level?.toUpperCase() || "INTERNAL"}
      </span>
    );
  };

  if (!resource) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No resource selected</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FaFile className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {resource.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {resource.resource_type?.toUpperCase()} • Created{" "}
                {new Date(resource.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => onEdit(resource)}
                className="btn-primary-outline"
                disabled={loading}
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(resource)}
                className="btn-danger-outline"
                disabled={loading}
              >
                <FaTrash className="mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {resource.description || "No description provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <span className="inline-flex items-center px-2 py-1 text-sm font-medium rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                <FaTag className="mr-1" />
                {resource.category_name || "Uncategorized"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <span
                className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded ${getStatusBadgeColor(
                  resource.status
                )}`}
              >
                {resource.status || "Active"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Level
              </label>
              {getAccessLevelBadge(resource.access_level)}
            </div>
          </div>
        </div>

        {/* Content Preview */}
        {resource.content && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {resource.content}
              </pre>
            </div>
          </div>
        )}

        {/* Files Section */}
        {files && files.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Attached Files ({files.length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <FaFile className="text-gray-400 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.size
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : "Unknown size"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={() => handlePreview(file)}
                      className="flex-1 text-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <FaEye className="inline mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(file.id, file.name)}
                      className="flex-1 text-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      disabled={loading}
                    >
                      {loading ? (
                        <ClipLoader size={12} color="#16a34a" />
                      ) : (
                        <>
                          <FaDownload className="inline mr-1" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {resource.metadata && Object.keys(resource.metadata).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metadata
            </label>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {JSON.stringify(resource.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Timeline/History */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Timeline
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <FaClock className="text-green-600 dark:text-green-400 text-sm" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Resource Created
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(resource.created_at).toLocaleString()}
                  {resource.created_by && ` by ${resource.created_by}`}
                </p>
              </div>
            </div>

            {resource.updated_at &&
              resource.updated_at !== resource.created_at && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <FaEdit className="text-blue-600 dark:text-blue-400 text-sm" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Last Updated
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(resource.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetails;
