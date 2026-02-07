/**
 * Scheme Management API Service
 * Handles all API calls for schemes, commissions, operators, and AEPS slabs
 */
import apiClient from "./apiClient.js";

// Note: apiClient already has baseURL set to /api/v1, so paths should NOT include it
class SchemeManagementService {
  constructor() {
    this.baseURL = ""; // Empty since apiClient handles the prefix
  }

  // Helper method to build endpoint - no prefix needed
  buildEndpoint(path) {
    return path; // apiClient's baseURL will be prepended
  }

  // ==================== SCHEMES API ====================

  /**
   * Get all schemes with comprehensive filtering and error handling
   */
  async getSchemes(params = {}) {
    try {
      const endpoint = this.buildEndpoint("/schemes");
      const response = await apiClient.get(endpoint, { params });

      // Ensure response has expected structure
      return {
        items: response.data.items || response.data || [],
        total:
          response.data.total ||
          (Array.isArray(response.data) ? response.data.length : 0),
        page: response.data.page || 1,
        pageSize: response.data.pageSize || 10,
      };
    } catch (error) {
      // Handle 404 gracefully - return empty list instead of error
      if (error.response?.status === 404) {
        console.warn("Schemes endpoint not found or no data available");
        return {
          items: [],
          total: 0,
          page: params.page || 1,
          pageSize: params.limit || 10,
        };
      }
      
      // Log error but return empty result instead of throwing
      console.error("Error fetching schemes:", error);
      return {
        items: null, // Return null to indicate error, not empty array
        total: 0,
        error: error.message,
        page: params.page || 1,
        pageSize: params.limit || 10,
      };
    }
  }

  /**
   * Get schemes with advanced filtering options
   * @param {Object} filters - Filter options
   * @param {string} filters.search - Search term for name/description
   * @param {boolean} filters.is_active - Filter by active status
   * @param {number} filters.filter_user_id - Filter by user and their hierarchy
   * @param {string} filters.from_date - Filter from creation date
   * @param {string} filters.to_date - Filter to creation date
   * @param {number} filters.skip - Pagination offset
   * @param {number} filters.limit - Page size
   */
  async getSchemesWithFilters(filters = {}) {
    try {
      const cleanFilters = {};

      // Only include non-empty values
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "all"
        ) {
          cleanFilters[key] = value;
        }
      });

      const result = await this.getSchemes(cleanFilters);
      
      // If items is null (error occurred), return the error response
      if (result.items === null) {
        console.warn("Filtered schemes request encountered an error");
      }
      
      return result;
    } catch (error) {
      console.error("Error fetching filtered schemes:", error);
      // Return null for error cases instead of throwing
      return {
        items: null,
        total: 0,
        error: error.message,
        page: filters.page || 1,
        pageSize: filters.limit || 10,
      };
    }
  }

  /**
   * Get scheme by ID with error handling
   */
  async getSchemeById(id) {
    try {
      if (!id) {
        throw new Error("Scheme ID is required");
      }
      const endpoint = this.buildEndpoint(`/schemes/${id}`);
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scheme ${id}:`, error);
      throw new Error(`Failed to fetch scheme: ${error.message}`);
    }
  }

  /**
   * Create new scheme with enhanced error handling
   */
  async createScheme(schemeData) {
    try {
      if (!schemeData || !schemeData.name) {
        throw new Error("Scheme name is required");
      }

      const endpoint = this.buildEndpoint("/schemes");
      const response = await apiClient.post(endpoint, schemeData);
      return response.data;
    } catch (error) {
      console.error("Error creating scheme:", error);
      throw new Error(`Failed to create scheme: ${error.message}`);
    }
  }

  /**
   * Update scheme with enhanced error handling
   */
  async updateScheme(id, schemeData) {
    try {
      if (!id) {
        throw new Error("Scheme ID is required");
      }

      const endpoint = this.buildEndpoint(`/schemes/${id}`);
      const response = await apiClient.put(endpoint, schemeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating scheme ${id}:`, error);
      throw new Error(`Failed to update scheme: ${error.message}`);
    }
  }

  /**
   * Delete scheme with enhanced error handling
   */
  async deleteScheme(id) {
    try {
      if (!id) {
        throw new Error("Scheme ID is required");
      }

      const endpoint = this.buildEndpoint(`/schemes/${id}`);
      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error deleting scheme ${id}:`, error);
      throw new Error(`Failed to delete scheme: ${error.message}`);
    }
  }

  /**
   * Update scheme status (activate/deactivate) with enhanced error handling
   */
  async updateSchemeStatus(id, isActive) {
    try {
      if (!id) {
        throw new Error("Scheme ID is required");
      }

      const endpoint = this.buildEndpoint(`/schemes/${id}/status`);
      const response = await apiClient.patch(endpoint, { is_active: isActive });
      return response.data;
    } catch (error) {
      console.error(`Error updating scheme status ${id}:`, error);
      throw new Error(`Failed to update scheme status: ${error.message}`);
    }
  }

  // ==================== SERVICE OPERATORS API ====================

  /**
   * Get all service operators with enhanced error handling
   */
  async getServiceOperators(params = {}) {
    try {
      const endpoint = this.buildEndpoint("/operators");
      const response = await apiClient.get(endpoint, { params });

      return {
        items: response.data.items || response.data || [],
        total:
          response.data.total ||
          (Array.isArray(response.data) ? response.data.length : 0),
      };
    } catch (error) {
      console.error("Error fetching service operators:", error);
      throw new Error(`Failed to fetch service operators: ${error.message}`);
    }
  }

  /**
   * Get operators by service type with enhanced error handling
   */
  async getOperatorsByService(serviceType) {
    try {
      if (!serviceType) {
        throw new Error("Service type is required");
      }

      const endpoint = this.buildEndpoint("/operators");
      const response = await apiClient.get(endpoint, {
        params: { service_type: serviceType },
      });
      return response.data.items || response.data || [];
    } catch (error) {
      console.error(
        `Error fetching operators for service ${serviceType}:`,
        error
      );
      throw new Error(`Failed to fetch operators: ${error.message}`);
    }
  }

  /**
   * Create new operator with enhanced error handling
   */
  async createOperator(operatorData) {
    try {
      if (!operatorData || !operatorData.name) {
        throw new Error("Operator name is required");
      }

      const endpoint = this.buildEndpoint("/operators");
      const response = await apiClient.post(endpoint, operatorData);
      return response.data;
    } catch (error) {
      console.error("Error creating operator:", error);
      throw new Error(`Failed to create operator: ${error.message}`);
    }
  }

  /**
   * Update operator with enhanced error handling
   */
  async updateOperator(id, operatorData) {
    try {
      if (!id) {
        throw new Error("Operator ID is required");
      }

      const endpoint = this.buildEndpoint(`/operators/${id}`);
      const response = await apiClient.put(endpoint, operatorData);
      return response.data;
    } catch (error) {
      console.error(`Error updating operator ${id}:`, error);
      throw new Error(`Failed to update operator: ${error.message}`);
    }
  }

  /**
   * Delete operator with enhanced error handling
   */
  async deleteOperator(id) {
    try {
      if (!id) {
        throw new Error("Operator ID is required");
      }

      const endpoint = this.buildEndpoint(`/operators/${id}`);
      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error deleting operator ${id}:`, error);
      throw new Error(`Failed to delete operator: ${error.message}`);
    }
  }

  /**
   * Bulk create operators with enhanced error handling
   */
  async bulkCreateOperators(operatorsData) {
    try {
      if (
        !operatorsData ||
        !Array.isArray(operatorsData) ||
        operatorsData.length === 0
      ) {
        throw new Error("Valid operators data array is required");
      }

      const endpoint = this.buildEndpoint("/operators/bulk");
      const response = await apiClient.post(endpoint, operatorsData);
      return response.data;
    } catch (error) {
      console.error("Error bulk creating operators:", error);
      throw new Error(`Failed to bulk create operators: ${error.message}`);
    }
  }

  // ==================== COMMISSIONS API ====================

  /**
   * Get all commissions with comprehensive filtering and error handling
   */
  async getCommissions(params = {}) {
    try {
      const endpoint = this.buildEndpoint("/commissions");
      const response = await apiClient.get(endpoint, { params });

      return {
        items: response.data.items || response.data || [],
        total:
          response.data.total ||
          (Array.isArray(response.data) ? response.data.length : 0),
      };
    } catch (error) {
      console.error("Error fetching commissions:", error);
      throw new Error(`Failed to fetch commissions: ${error.message}`);
    }
  }

  /**
   * Get commissions by scheme with enhanced error handling
   */
  async getCommissionsByScheme(schemeId) {
    try {
      if (!schemeId) {
        throw new Error("Scheme ID is required");
      }

      const endpoint = this.buildEndpoint(`/schemes/${schemeId}/commissions`);
      const response = await apiClient.get(endpoint);
      return response.data.items || response.data || [];
    } catch (error) {
      console.error(
        `Error fetching commissions for scheme ${schemeId}:`,
        error
      );
      throw new Error(`Failed to fetch commissions: ${error.message}`);
    }
  }

  /**
   * Get commissions for all services by scheme ID
   */
  async getAllCommissionsByScheme(schemeId) {
    try {
      if (!schemeId) {
        throw new Error("Scheme ID is required");
      }

      const serviceTypes = this.getServiceTypes();
      const allCommissions = {};

      // Fetch commissions for each service type
      for (const serviceType of serviceTypes) {
        try {
          const endpoint = this.buildEndpoint(
            `/schemes/${schemeId}/commissions`
          );
          const response = await apiClient.get(endpoint, {
            params: { service: serviceType.value },
          });

          // Store commissions by service type label
          allCommissions[serviceType.label] =
            response.data.entries || response.data.items || response.data || [];
        } catch (error) {
          console.warn(
            `No commissions found for service ${serviceType.label}:`,
            error.message
          );
          // Set empty array for services with no commissions
          allCommissions[serviceType.label] = [];
        }
      }

      return allCommissions;
    } catch (error) {
      console.error(
        `Error fetching all commissions for scheme ${schemeId}:`,
        error
      );
      throw new Error(`Failed to fetch commissions: ${error.message}`);
    }
  }

  /**
   * Get commissions for a specific scheme and service type
   * Used for editing existing commissions
   */
  async getCommissionsBySchemeAndService(schemeId, serviceType) {
    try {
      if (!schemeId) {
        throw new Error("Scheme ID is required");
      }
      if (!serviceType) {
        throw new Error("Service type is required");
      }

      const endpoint = this.buildEndpoint(`/schemes/${schemeId}/commissions`);
      const response = await apiClient.get(endpoint, {
        params: { service: serviceType },
      });

      return (
        response.data.entries || response.data.items || response.data || []
      );
    } catch (error) {
      console.error(
        `Error fetching commissions for scheme ${schemeId} and service ${serviceType}:`,
        error
      );
      // Return empty array if no commissions found (404) or other errors
      if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        console.log(
          `No existing commissions found for scheme ${schemeId} and service ${serviceType}`
        );
        return [];
      }
      throw new Error(`Failed to fetch commissions: ${error.message}`);
    }
  }

  /**
   * Create new commission with enhanced error handling
   */
  async createCommission(commissionData) {
    try {
      if (!commissionData) {
        throw new Error("Commission data is required");
      }

      const endpoint = this.buildEndpoint("/commissions");
      const response = await apiClient.post(endpoint, commissionData);
      return response.data;
    } catch (error) {
      console.error("Error creating commission:", error);
      throw new Error(`Failed to create commission: ${error.message}`);
    }
  }

  /**
   * Update commission with enhanced error handling
   */
  async updateCommission(id, commissionData) {
    try {
      if (!id) {
        throw new Error("Commission ID is required");
      }

      const endpoint = this.buildEndpoint(`/commissions/${id}`);
      const response = await apiClient.put(endpoint, commissionData);
      return response.data;
    } catch (error) {
      console.error(`Error updating commission ${id}:`, error);
      throw new Error(`Failed to update commission: ${error.message}`);
    }
  }

  /**
   * Delete commission with enhanced error handling
   */
  async deleteCommission(id) {
    try {
      if (!id) {
        throw new Error("Commission ID is required");
      }

      const endpoint = this.buildEndpoint(`/commissions/${id}`);
      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error deleting commission ${id}:`, error);
      throw new Error(`Failed to delete commission: ${error.message}`);
    }
  }

  /**
   * Bulk create commissions with enhanced error handling
   */
  async bulkCreateCommissions(commissionsData) {
    try {
      if (!commissionsData) {
        throw new Error("Commissions data is required");
      }

      if (!commissionsData.scheme_id) {
        throw new Error("Scheme ID is required");
      }

      // Extract scheme_id for path and remove it from body
      const { scheme_id, ...bodyData } = commissionsData;

      const endpoint = this.buildEndpoint(
        `/schemes/${scheme_id}/commissions/bulk`
      );
      const response = await apiClient.post(endpoint, bodyData);
      return response.data;
    } catch (error) {
      console.error("Error bulk creating commissions:", error);
      throw new Error(`Failed to bulk create commissions: ${error.message}`);
    }
  }

  /**
   * Bulk update existing commissions with enhanced error handling
   */
  async bulkUpdateCommissions(commissionsData) {
    try {
      if (!commissionsData) {
        throw new Error("Commissions data is required");
      }

      if (!commissionsData.scheme_id) {
        throw new Error("Scheme ID is required");
      }

      // Extract scheme_id for path and remove it from body
      const { scheme_id, ...bodyData } = commissionsData;

      const endpoint = this.buildEndpoint(
        `/schemes/${scheme_id}/commissions/bulk-update`
      );
      const response = await apiClient.put(endpoint, bodyData);
      return response.data;
    } catch (error) {
      console.error("Error bulk updating commissions:", error);
      throw new Error(`Failed to bulk update commissions: ${error.message}`);
    }
  }

  /**
   * Bulk create and update commissions (mixed operations) with enhanced error handling
   */
  async bulkCreateAndUpdateCommissions(commissionsData) {
    try {
      if (!commissionsData) {
        throw new Error("Commissions data is required");
      }

      if (!commissionsData.scheme_id) {
        throw new Error("Scheme ID is required");
      }

      // Separate create and update entries
      const createEntries = commissionsData.entries.filter(
        (entry) => !entry.isExisting
      );
      const updateEntries = commissionsData.entries.filter(
        (entry) => entry.isExisting
      );

      const results = {
        total_entries: commissionsData.entries.length,
        successful_entries: 0,
        failed_entries: 0,
        created_entries: 0,
        updated_entries: 0,
        errors: [],
      };

      // Process creates if any
      if (createEntries.length > 0) {
        try {
          const createData = {
            ...commissionsData,
            entries: createEntries,
          };
          const createResult = await this.bulkCreateCommissions(createData);

          results.successful_entries += createResult.successful_entries || 0;
          results.failed_entries += createResult.failed_entries || 0;
          results.created_entries +=
            createResult.created_entries ||
            createResult.successful_entries ||
            0;
          results.errors.push(...(createResult.errors || []));
        } catch (error) {
          results.failed_entries += createEntries.length;
          results.errors.push(`Bulk create failed: ${error.message}`);
        }
      }

      // Process updates if any
      if (updateEntries.length > 0) {
        try {
          const updateData = {
            ...commissionsData,
            entries: updateEntries,
          };
          const updateResult = await this.bulkUpdateCommissions(updateData);

          results.successful_entries += updateResult.successful_entries || 0;
          results.failed_entries += updateResult.failed_entries || 0;
          results.updated_entries +=
            updateResult.updated_entries ||
            updateResult.successful_entries ||
            0;
          results.errors.push(...(updateResult.errors || []));
        } catch (error) {
          results.failed_entries += updateEntries.length;
          results.errors.push(`Bulk update failed: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      console.error("Error bulk creating and updating commissions:", error);
      throw new Error(
        `Failed to bulk create and update commissions: ${error.message}`
      );
    }
  }

  /**
   * Calculate commission for amount with enhanced error handling
   */
  async calculateCommission(params) {
    try {
      if (!params) {
        throw new Error("Calculation parameters are required");
      }

      const endpoint = this.buildEndpoint("/commissions/calculate");
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error calculating commission:", error);
      throw new Error(`Failed to calculate commission: ${error.message}`);
    }
  }

  /**
   * Export commissions with enhanced error handling
   */
  async exportCommissions(schemeId, format = "csv", filters = {}) {
    try {
      if (!schemeId) {
        throw new Error("Scheme ID is required");
      }

      const endpoint = this.buildEndpoint(
        `/schemes/${schemeId}/commissions/export`
      );
      const response = await apiClient.get(endpoint, {
        params: { format, ...filters },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error exporting commissions for scheme ${schemeId}:`,
        error
      );
      throw new Error(`Failed to export commissions: ${error.message}`);
    }
  }

  /**
   * Import commissions with enhanced error handling
   */
  async importCommissions(schemeId, file, format = "csv") {
    try {
      if (!schemeId) {
        throw new Error("Scheme ID is required");
      }

      if (!file) {
        throw new Error("File is required");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", format);

      const endpoint = this.buildEndpoint(
        `/schemes/${schemeId}/commissions/import`
      );
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error importing commissions for scheme ${schemeId}:`,
        error
      );
      throw new Error(`Failed to import commissions: ${error.message}`);
    }
  }

  // ==================== REPORTS API ====================

  /**
   * Get commission report with enhanced error handling
   */
  async getCommissionReport(params = {}) {
    try {
      const endpoint = this.buildEndpoint("/commissions/report");
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching commission report:", error);
      throw new Error(`Failed to fetch commission report: ${error.message}`);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get service types
   */
  getServiceTypes() {
    return [
      { value: "mobile_recharge", label: "Mobile Recharge" },
      { value: "dth_recharge", label: "DTH Recharge" },
      { value: "bill_payments", label: "Bill Payments" },
      { value: "aeps", label: "AEPS" },
      { value: "dmt", label: "DMT" },
      { value: "micro_atm", label: "Micro ATM" },
    ];
  }

  /**
   * Get commission types
   */
  getCommissionTypes() {
    return [
      { value: "percentage", label: "Percentage (%)" },
      { value: "fixed", label: "Fixed Amount (₹)" },
      { value: "slab_based", label: "Slab Based (AEPS)" },
    ];
  }

  /**
   * Get role hierarchy
   */
  getRoleHierarchy() {
    return [
      { value: "superadmin", label: "Super Admin", level: 0 },
      { value: "admin", label: "Admin", level: 1 },
      { value: "whitelabel", label: "White Label", level: 2 },
      { value: "masterdistributor", label: "Master Distributor", level: 3 },
      { value: "distributor", label: "Distributor", level: 4 },
      { value: "retailer", label: "Retailer", level: 5 },
      { value: "customer", label: "Customer", level: 6 },
    ];
  }

  /**
   * Format date for API calls
   */
  formatDateForAPI(date) {
    if (!date) return null;
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
    }
    return date;
  }

  /**
   * Build filter object for API calls
   */
  buildFilterParams(filters = {}) {
    const params = {};

    // Handle search
    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }

    // Handle active status
    if (
      filters.is_active !== undefined &&
      filters.is_active !== "" &&
      filters.is_active !== "all"
    ) {
      params.is_active =
        filters.is_active === "true" || filters.is_active === true;
    }

    // Handle date filters
    if (filters.from_date) {
      params.from_date = this.formatDateForAPI(filters.from_date);
    }

    if (filters.to_date) {
      params.to_date = this.formatDateForAPI(filters.to_date);
    }

    // Handle user filter
    if (filters.filter_user_id) {
      params.filter_user_id = filters.filter_user_id;
    }

    // Handle pagination
    if (filters.skip !== undefined) {
      params.skip = filters.skip;
    }

    if (filters.limit !== undefined) {
      params.limit = filters.limit;
    }

    // Handle service type
    if (filters.service_type && filters.service_type !== "all") {
      params.service_type = filters.service_type;
    }

    // Handle scheme ID
    if (filters.scheme_id) {
      params.scheme_id = filters.scheme_id;
    }

    return params;
  }

  /**
   * Validate required fields for scheme creation/update
   */
  validateSchemeData(schemeData, isUpdate = false) {
    const errors = [];

    if (!isUpdate && (!schemeData.name || schemeData.name.trim() === "")) {
      errors.push("Scheme name is required");
    }

    if (schemeData.name && schemeData.name.length > 255) {
      errors.push("Scheme name must be less than 255 characters");
    }

    if (schemeData.description && schemeData.description.length > 1000) {
      errors.push("Description must be less than 1000 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== COMMISSION SLABS API ====================

  /**
   * Get commission slabs for a commission with enhanced error handling
   */
  async getCommissionSlabs(commissionId) {
    try {
      if (!commissionId) {
        throw new Error("Commission ID is required");
      }

      const endpoint = this.buildEndpoint(`/commissions/${commissionId}/slabs`);
      const response = await apiClient.get(endpoint);
      return {
        items: response.data.items || response.data || [],
        total:
          response.data.total ||
          (Array.isArray(response.data) ? response.data.length : 0),
      };
    } catch (error) {
      console.error(
        `Error fetching commission slabs for commission ${commissionId}:`,
        error
      );
      throw new Error(`Failed to fetch commission slabs: ${error.message}`);
    }
  }

  /**
   * Create new commission slab with enhanced error handling
   */
  async createCommissionSlab(slabData) {
    try {
      if (!slabData) {
        throw new Error("Commission slab data is required");
      }

      if (!slabData.commission_id) {
        throw new Error("Commission ID is required");
      }

      const endpoint = this.buildEndpoint("/commission-slabs");
      const response = await apiClient.post(endpoint, slabData);
      return response.data;
    } catch (error) {
      console.error("Error creating commission slab:", error);
      throw new Error(`Failed to create commission slab: ${error.message}`);
    }
  }

  /**
   * Update commission slab with enhanced error handling
   */
  async updateCommissionSlab(slabId, slabData) {
    try {
      if (!slabId) {
        throw new Error("Commission slab ID is required");
      }

      const endpoint = this.buildEndpoint(`/commission-slabs/${slabId}`);
      const response = await apiClient.put(endpoint, slabData);
      return response.data;
    } catch (error) {
      console.error(`Error updating commission slab ${slabId}:`, error);
      throw new Error(`Failed to update commission slab: ${error.message}`);
    }
  }

  /**
   * Delete commission slab with enhanced error handling
   */
  async deleteCommissionSlab(slabId) {
    try {
      if (!slabId) {
        throw new Error("Commission slab ID is required");
      }

      const endpoint = this.buildEndpoint(`/commission-slabs/${slabId}`);
      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error deleting commission slab ${slabId}:`, error);
      throw new Error(`Failed to delete commission slab: ${error.message}`);
    }
  }

  /**
   * Calculate AEPS commission for amount with enhanced error handling
   */
  async calculateAEPSCommission(commissionId, amount, role) {
    try {
      if (!commissionId || !amount || !role) {
        throw new Error("Commission ID, amount, and role are required");
      }

      const endpoint = this.buildEndpoint("/commissions/calculate-aeps");
      const response = await apiClient.get(endpoint, {
        params: {
          commission_id: commissionId,
          amount: amount.toString(),
          role: role,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error calculating AEPS commission:", error);
      throw new Error(`Failed to calculate AEPS commission: ${error.message}`);
    }
  }

  /**
   * Validate commission slab data
   */
  validateCommissionSlabData(slabData, existingSlabs = []) {
    const errors = [];

    if (!slabData.slab_min && slabData.slab_min !== 0) {
      errors.push("Minimum amount is required");
    }

    if (!slabData.slab_max) {
      errors.push("Maximum amount is required");
    }

    if (slabData.slab_min < 0) {
      errors.push("Minimum amount cannot be negative");
    }

    if (slabData.slab_max <= slabData.slab_min) {
      errors.push("Maximum amount must be greater than minimum");
    }

    // Check for overlapping ranges
    const hasOverlap = existingSlabs.some(
      (existing) =>
        existing.id !== slabData.id &&
        slabData.slab_min < existing.slab_max &&
        slabData.slab_max > existing.slab_min
    );

    if (hasOverlap) {
      errors.push("Slab range overlaps with existing slab");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create and export singleton instance
const schemeManagementService = new SchemeManagementService();
export default schemeManagementService;
