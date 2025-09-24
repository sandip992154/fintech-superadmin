/**
 * Resource Form Component
 * ======================
 *
 * Form component for creating and editing resources with validation,
 * file uploads, and category selection.
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { FaUpload, FaTimes, FaFile } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { resourceManagementService } from "../../../services/resourceManagementService";

const ResourceForm = ({
  resource = null,
  categories = [],
  onSubmit,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: resource?.name || "",
      description: resource?.description || "",
      category_id: resource?.category_id || "",
      resource_type: resource?.resource_type || "document",
      content: resource?.content || "",
      metadata: resource?.metadata || {},
      is_active: resource?.is_active ?? true,
      access_level: resource?.access_level || "internal",
    },
  });

  const resourceType = watch("resource_type");

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);

      // Process metadata as JSON
      if (typeof data.metadata === "string") {
        try {
          data.metadata = JSON.parse(data.metadata);
        } catch (e) {
          data.metadata = {};
        }
      }

      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...fileArray]);
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Resource Name *
              </label>
              <input
                type="text"
                {...register("name", { required: "Resource name is required" })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter resource name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category *
              </label>
              <select
                {...register("category_id", {
                  required: "Category is required",
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Resource Type *
              </label>
              <select
                {...register("resource_type", {
                  required: "Resource type is required",
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="document">Document</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="template">Template</option>
                <option value="link">Link</option>
                <option value="data">Data</option>
              </select>
              {errors.resource_type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.resource_type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Access Level
              </label>
              <select
                {...register("access_level")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="restricted">Restricted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Content and Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter resource description"
              />
            </div>

            {resourceType === "link" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL *
                </label>
                <input
                  type="url"
                  {...register("content", {
                    required:
                      resourceType === "link" ? "URL is required" : false,
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://example.com"
                />
                {errors.content && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.content.message}
                  </p>
                )}
              </div>
            )}

            {(resourceType === "data" || resourceType === "template") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content
                </label>
                <textarea
                  {...register("content")}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                  placeholder={
                    resourceType === "data"
                      ? "Enter JSON data..."
                      : "Enter template content..."
                  }
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Metadata (JSON)
              </label>
              <textarea
                {...register("metadata")}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-xs"
                placeholder='{"key": "value"}'
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register("is_active")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Active Resource
              </label>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        {["document", "image", "video"].includes(resourceType) && (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div
              className={`text-center ${
                dragOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">
                    Upload files
                  </span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    accept={
                      resourceType === "image"
                        ? "image/*"
                        : resourceType === "video"
                        ? "video/*"
                        : ".pdf,.doc,.docx,.txt"
                    }
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
                <span className="text-gray-500"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {resourceType === "image" && "PNG, JPG, GIF up to 10MB"}
                {resourceType === "video" && "MP4, AVI, MOV up to 100MB"}
                {resourceType === "document" &&
                  "PDF, DOC, DOCX, TXT up to 25MB"}
              </p>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Uploaded Files:
                </h4>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <FaFile className="text-blue-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading && <ClipLoader color="white" size={16} className="mr-2" />}
            {resource ? "Update Resource" : "Create Resource"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourceForm;
