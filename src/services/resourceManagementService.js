/**
 * Resource Management Service for Frontend
 * =======================================
 *
 * Service layer for handling all resource management API calls
 * with proper error handling and response formatting.
 */

import axios from "axios";
import modernNotify from "./modernNotificationService";

const notificationService = modernNotify;

// Base URL for API calls
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class ResourceManagementService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/v1/resources`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // CATEGORY MANAGEMENT
  // ============================================================================

  async getCategories(params = {}) {
    try {
      const response = await this.api.get("/categories", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw this.handleError(error);
    }
  }

  async getCategoryById(id) {
    try {
      const response = await this.api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw this.handleError(error);
    }
  }

  async createCategory(categoryData) {
    try {
      const response = await this.api.post("/categories", categoryData);
      notificationService.success("Category created successfully");
      return response.data;
    } catch (error) {
      console.error("Error creating category:", error);
      throw this.handleError(error);
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const response = await this.api.put(`/categories/${id}`, categoryData);
      notificationService.success("Category updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating category:", error);
      throw this.handleError(error);
    }
  }

  async deleteCategory(id) {
    try {
      const response = await this.api.delete(`/categories/${id}`);
      notificationService.success("Category deleted successfully");
      return response.data;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // RESOURCE MANAGEMENT
  // ============================================================================

  async getResources(params = {}) {
    try {
      const response = await this.api.get("/resources", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw this.handleError(error);
    }
  }

  async getResourceById(id) {
    try {
      const response = await this.api.get(`/resources/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching resource:", error);
      throw this.handleError(error);
    }
  }

  async createResource(resourceData) {
    try {
      const response = await this.api.post("/resources", resourceData);
      notificationService.success("Resource created successfully");
      return response.data;
    } catch (error) {
      console.error("Error creating resource:", error);
      throw this.handleError(error);
    }
  }

  async updateResource(id, resourceData) {
    try {
      const response = await this.api.put(`/resources/${id}`, resourceData);
      notificationService.success("Resource updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating resource:", error);
      throw this.handleError(error);
    }
  }

  async deleteResource(id) {
    try {
      const response = await this.api.delete(`/resources/${id}`);
      notificationService.success("Resource deleted successfully");
      return response.data;
    } catch (error) {
      console.error("Error deleting resource:", error);
      throw this.handleError(error);
    }
  }

  async bulkUpdateResources(updates) {
    try {
      const response = await this.api.post("/resources/bulk-update", updates);
      notificationService.success(
        `${updates.length} resources updated successfully`
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk updating resources:", error);
      throw this.handleError(error);
    }
  }

  async duplicateResource(id) {
    try {
      const response = await this.api.post(`/resources/${id}/duplicate`);
      notificationService.success("Resource duplicated successfully");
      return response.data;
    } catch (error) {
      console.error("Error duplicating resource:", error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // FILE MANAGEMENT
  // ============================================================================

  async uploadFile(resourceId, file, fileType = "attachment") {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", fileType);

      const response = await this.api.post(
        `/resources/${resourceId}/files`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // You can emit this progress to show upload progress
            console.log(`Upload Progress: ${percentCompleted}%`);
          },
        }
      );

      notificationService.success("File uploaded successfully");
      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw this.handleError(error);
    }
  }

  async deleteFile(fileId) {
    try {
      const response = await this.api.delete(`/files/${fileId}`);
      notificationService.success("File deleted successfully");
      return response.data;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw this.handleError(error);
    }
  }

  async getResourceFiles(resourceId) {
    try {
      const response = await this.api.get(`/resources/${resourceId}/files`);
      return response.data;
    } catch (error) {
      console.error("Error fetching resource files:", error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  async getResourcePermissions(resourceId) {
    try {
      const response = await this.api.get(
        `/resources/${resourceId}/permissions`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw this.handleError(error);
    }
  }

  async updateResourcePermissions(resourceId, permissions) {
    try {
      const response = await this.api.post(
        `/resources/${resourceId}/permissions`,
        permissions
      );
      notificationService.success("Permissions updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating permissions:", error);
      throw this.handleError(error);
    }
  }

  async checkResourceAccess(resourceId, permission = "read") {
    try {
      const response = await this.api.get(
        `/resources/${resourceId}/check-access`,
        { params: { permission } }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking resource access:", error);
      return { success: false, has_access: false };
    }
  }

  // ============================================================================
  // AUDIT & ACTIVITY LOGS
  // ============================================================================

  async getAuditLogs(params = {}) {
    try {
      const response = await this.api.get("/audit-logs", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      throw this.handleError(error);
    }
  }

  async getResourceAuditLogs(resourceId, params = {}) {
    try {
      const response = await this.api.get(
        `/resources/${resourceId}/audit-logs`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching resource audit logs:", error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // SEARCH & FILTERING
  // ============================================================================

  async searchResources(query, filters = {}) {
    try {
      const params = {
        search: query,
        ...filters,
      };
      const response = await this.api.get("/resources/search", { params });
      return response.data;
    } catch (error) {
      console.error("Error searching resources:", error);
      throw this.handleError(error);
    }
  }

  async getFilterOptions() {
    try {
      const response = await this.api.get("/resources/filter-options");
      return response.data;
    } catch (error) {
      console.error("Error fetching filter options:", error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // DASHBOARD & STATISTICS
  // ============================================================================

  async getDashboardStats() {
    try {
      const response = await this.api.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw this.handleError(error);
    }
  }

  async getRecentResources(limit = 5) {
    try {
      const response = await this.api.get("/resources", {
        params: {
          limit,
          sort_by: "created_at",
          sort_order: "desc",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching recent resources:", error);
      throw this.handleError(error);
    }
  }

  async getRecentActivity(limit = 10) {
    try {
      const response = await this.api.get("/audit-logs", {
        params: {
          limit,
          sort_by: "created_at",
          sort_order: "desc",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async getTemplates(params = {}) {
    try {
      const response = await this.api.get("/templates", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw this.handleError(error);
    }
  }

  async createTemplate(templateData) {
    try {
      const response = await this.api.post("/templates", templateData);
      notificationService.success("Template created successfully");
      return response.data;
    } catch (error) {
      console.error("Error creating template:", error);
      throw this.handleError(error);
    }
  }

  async applyTemplate(templateId, resourceData) {
    try {
      const response = await this.api.post(
        `/templates/${templateId}/apply`,
        resourceData
      );
      notificationService.success("Template applied successfully");
      return response.data;
    } catch (error) {
      console.error("Error applying template:", error);
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  handleError(error) {
    let message = "An unexpected error occurred";

    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === "string") {
        message = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        message = error.response.data.detail
          .map((err) => err.msg || err)
          .join(", ");
      }
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    notificationService.error(message);
    return new Error(message);
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Format date for display
  formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  // Generate resource URL for preview
  getResourcePreviewUrl(resource) {
    if (resource.preview_url) {
      return resource.preview_url;
    }
    return `${API_BASE_URL}/api/v1/resources/${resource.id}/preview`;
  }
}

// Export singleton instance
export const resourceManagementService = new ResourceManagementService();
