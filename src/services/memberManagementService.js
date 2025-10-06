/**
 * Unified Member Management Service
 * Optimized service for unified member routes with role-based access control
 * Eliminates redundancy and improves performance through intelligent caching
 */
import apiClient from "./apiClient.js";

// ===== Constants and Configuration =====
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const ACCESS_LEVELS = {
  BASIC: "basic",
  ENHANCED: "enhanced",
  ADMIN: "admin",
  SUPER: "super",
};

const ROLE_ACCESS_MAP = {
  SuperAdmin: ACCESS_LEVELS.SUPER,
  Admin: ACCESS_LEVELS.ADMIN,
  WhiteLabel: ACCESS_LEVELS.ENHANCED,
  MDS: ACCESS_LEVELS.ENHANCED,
  Distributor: ACCESS_LEVELS.BASIC,
  Retailer: ACCESS_LEVELS.BASIC,
  Customer: ACCESS_LEVELS.BASIC,
};

class UnifiedMemberManagementService {
  constructor() {
    this.cache = new Map();
    this.requestCache = new Map();
    this.abortControllers = new Map();
  }

  // ===== Utility Methods =====

  /**
   * Get user's access level based on role
   */
  getUserAccessLevel(userRole) {
    return ROLE_ACCESS_MAP[userRole] || ACCESS_LEVELS.BASIC;
  }

  /**
   * Build optimized parameters based on user role and access level
   */
  buildOptimizedParams(baseParams = {}, userRole, requestType = "list") {
    const accessLevel = this.getUserAccessLevel(userRole);
    const params = { ...baseParams };

    // Automatically include role-appropriate features
    switch (accessLevel) {
      case ACCESS_LEVELS.SUPER:
      case ACCESS_LEVELS.ADMIN:
        params.include_transaction_summary = true;
        params.include_financial_data = true;
      // Fall through
      case ACCESS_LEVELS.ENHANCED:
        params.include_wallet_data = true;
        params.include_parent_info = true;
        break;
      case ACCESS_LEVELS.BASIC:
      default:
        // Basic access - no additional parameters
        break;
    }

    return params;
  }

  /**
   * Cancel ongoing request for a specific operation
   */
  cancelRequest(operationKey) {
    if (this.abortControllers.has(operationKey)) {
      this.abortControllers.get(operationKey).abort();
      this.abortControllers.delete(operationKey);
    }
  }

  /**
   * Check cache for valid data
   */
  getCachedData(key) {
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Store data in cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // ===== Unified Member Operations =====

  /**
   * Unified member listing with automatic role-based optimization
   */
  async getMembers(requestData = {}, options = {}) {
    const { useCache = true } = options;
    const userRole = requestData.userRole || "Customer";
    const params = { ...requestData };
    delete params.userRole; // Remove userRole from params before sending to API

    const cacheKey = `members_${JSON.stringify(params)}_${userRole}`;

    // Check cache first
    if (useCache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
    }

    // Cancel any existing request for this operation
    const operationKey = `getMembers_${userRole}`;
    this.cancelRequest(operationKey);

    try {
      // Create new abort controller
      const abortController = new AbortController();
      this.abortControllers.set(operationKey, abortController);

      // Build optimized parameters
      const optimizedParams = this.buildOptimizedParams(
        params,
        userRole,
        "list"
      );
      const queryString = new URLSearchParams(optimizedParams).toString();

      const response = await apiClient.get(
        `/api/v1/members/list?${queryString}`,
        { signal: abortController.signal }
      );

      // Cache successful response
      if (useCache) {
        this.setCachedData(cacheKey, response.data);
      }

      // Clean up abort controller
      this.abortControllers.delete(operationKey);

      return response.data;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request cancelled");
        return null;
      }
      console.error("Error fetching members:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get member by ID with role-based data access
   */
  async getMember(memberId, userRole = "Customer", includeSensitive = false) {
    try {
      const accessLevel = this.getUserAccessLevel(userRole);
      const params = new URLSearchParams();

      // Only include sensitive data for admin+ users
      if (
        includeSensitive &&
        [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.SUPER].includes(accessLevel)
      ) {
        params.append("include_sensitive_data", "true");
      }

      const queryString = params.toString();
      const url = `/api/v1/members/${memberId}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching member:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Create new member with unified endpoint
   */
  async createMember(memberData, userRole = "Customer") {
    try {
      // Validate data before sending
      const validationResult = this.validateMemberForm(memberData);
      if (!validationResult.isValid) {
        throw new Error(
          `Validation failed: ${Object.values(validationResult.errors).join(
            ", "
          )}`
        );
      }

      const preparedData = this.prepareMemberData(memberData);
      const response = await apiClient.post(
        "/api/v1/members/create",
        preparedData
      );

      // Clear related cache entries
      this.clearMemberCache();

      return response.data;
    } catch (error) {
      console.error("Error creating member:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Update member with optimized data handling
   */
  async updateMember(memberId, memberData, userRole = "Customer") {
    try {
      const preparedData = this.prepareMemberData(memberData);
      const response = await apiClient.put(
        `/api/v1/members/${memberId}`,
        preparedData
      );

      // Clear related cache entries
      this.clearMemberCache();

      return response.data;
    } catch (error) {
      console.error("Error updating member:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Update member status with immediate cache invalidation
   */
  async updateMemberStatus(memberId, isActive) {
    try {
      const response = await apiClient.patch(
        `/api/v1/members/${memberId}/status`,
        {
          is_active: isActive,
        }
      );

      // Clear cache to ensure fresh data
      this.clearMemberCache();

      return response.data;
    } catch (error) {
      console.error("Error updating member status:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete member with cache management
   */
  async deleteMember(memberId) {
    try {
      const response = await apiClient.delete(`/api/v1/members/${memberId}`);

      // Clear cache
      this.clearMemberCache();

      return response.data;
    } catch (error) {
      console.error("Error deleting member:", error);
      throw this.handleApiError(error);
    }
  }

  // ===== Advanced Operations (Role-Gated) =====

  /**
   * Perform bulk actions with role validation
   */
  async performBulkAction(actionData, userRole = "Customer") {
    const accessLevel = this.getUserAccessLevel(userRole);

    // Validate access level for bulk operations
    if (
      ![
        ACCESS_LEVELS.ENHANCED,
        ACCESS_LEVELS.ADMIN,
        ACCESS_LEVELS.SUPER,
      ].includes(accessLevel)
    ) {
      throw new Error(
        "Bulk operations require Enhanced access level or higher"
      );
    }

    // Validate role change operations
    if (
      actionData.action === "change_role" &&
      ![ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.SUPER].includes(accessLevel)
    ) {
      throw new Error(
        "Role change operations require Admin access level or higher"
      );
    }

    try {
      const response = await apiClient.post(
        "/api/v1/members/bulk-action",
        actionData
      );

      // Clear cache after bulk operations
      this.clearMemberCache();

      return response.data;
    } catch (error) {
      console.error("Error performing bulk action:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Export members with role-based data access
   */
  async exportMembers(exportRequest, userRole = "Customer") {
    const accessLevel = this.getUserAccessLevel(userRole);

    // Validate access level for export
    if (
      ![
        ACCESS_LEVELS.ENHANCED,
        ACCESS_LEVELS.ADMIN,
        ACCESS_LEVELS.SUPER,
      ].includes(accessLevel)
    ) {
      throw new Error(
        "Export functionality requires Enhanced access level or higher"
      );
    }

    // Validate financial data export
    if (
      exportRequest.include_financial_data &&
      ![ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.SUPER].includes(accessLevel)
    ) {
      throw new Error(
        "Financial data export requires Admin access level or higher"
      );
    }

    try {
      const response = await apiClient.post(
        "/api/v1/members/export",
        exportRequest
      );
      return response.data;
    } catch (error) {
      console.error("Error exporting members:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get dashboard statistics with role-based metrics
   */
  async getDashboardStats(requestData = {}, options = {}) {
    const { useCache = true } = options;
    const userRole = requestData.userRole || "Customer";
    const includeFinancial = requestData.includeFinancial || false;
    const includeSystemWide = requestData.includeSystemWide || false;

    const accessLevel = this.getUserAccessLevel(userRole);

    // Validate access level for dashboard
    if (
      ![
        ACCESS_LEVELS.ENHANCED,
        ACCESS_LEVELS.ADMIN,
        ACCESS_LEVELS.SUPER,
      ].includes(accessLevel)
    ) {
      throw new Error(
        "Dashboard access requires Enhanced access level or higher"
      );
    }

    const cacheKey = `dashboard_${userRole}_${includeFinancial}_${includeSystemWide}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      const params = new URLSearchParams();

      // Add financial metrics for admin+ users
      if (
        includeFinancial &&
        [ACCESS_LEVELS.ADMIN, ACCESS_LEVELS.SUPER].includes(accessLevel)
      ) {
        params.append("include_financial_metrics", "true");
      }

      // Add system-wide stats for super admin only
      if (includeSystemWide && accessLevel === ACCESS_LEVELS.SUPER) {
        params.append("include_system_wide_stats", "true");
      }

      const queryString = params.toString();
      const url = `/api/v1/members/dashboard${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await apiClient.get(url);

      // Cache dashboard data for shorter time (2 minutes)
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw this.handleApiError(error);
    }
  }

  // ===== Reference Data Operations =====

  /**
   * Get available parents with caching and search optimization
   */
  async getAvailableParents(roleName = null, search = null, useCache = true) {
    const cacheKey = `parents_${roleName}_${search}`;

    if (useCache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
    }

    try {
      const params = new URLSearchParams();
      if (roleName) params.append("role", roleName);
      if (search) params.append("search", search);

      const response = await apiClient.get(
        `/api/v1/members/parents?${params.toString()}`
      );

      if (useCache) {
        this.setCachedData(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching available parents:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get user role permissions with caching
   */
  async getUserRolePermissions(useCache = true) {
    const cacheKey = "user_permissions";

    if (useCache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
    }

    try {
      const response = await apiClient.get("/api/v1/members/permissions");

      if (useCache) {
        this.setCachedData(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get available schemes with caching
   */
  async getSchemes(useCache = true) {
    const cacheKey = "schemes";

    if (useCache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
    }

    try {
      // Updated to use the correct scheme endpoint
      const response = await apiClient.get("/api/v1/schemes", {
        params: {
          page: 1,
          size: 100, // Get all schemes
          is_active: true, // Only active schemes
        },
      });

      if (useCache) {
        this.setCachedData(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching schemes:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get location options with caching
   */
  async getLocationOptions(useCache = true) {
    const cacheKey = "locations";

    if (useCache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
    }

    try {
      // Try the locations endpoint, fallback to empty array if not available
      const response = await apiClient.get("/api/v1/locations");

      if (useCache) {
        this.setCachedData(cacheKey, response.data);
      }

      return response.data || [];
    } catch (error) {
      console.warn(
        "Location options endpoint not available:",
        error.response?.status
      );

      // Return empty array as fallback instead of throwing error
      const fallbackData = [];
      if (useCache) {
        this.setCachedData(cacheKey, fallbackData);
      }
      return fallbackData;
    }
  }

  // ===== Cache Management =====

  /**
   * Clear member-related cache entries
   */
  clearMemberCache() {
    const memberKeys = Array.from(this.cache.keys()).filter(
      (key) => key.startsWith("members_") || key.startsWith("dashboard_")
    );
    memberKeys.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Cancel all ongoing requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  // ===== Enhanced Form Validation and Utilities =====

  /**
   * Validate member creation form data
   */
  validateMemberForm(formData) {
    const errors = {};

    // Required field validations
    if (!formData.full_name?.trim()) {
      errors.full_name = "Full name is required";
    } else if (formData.full_name.length < 2) {
      errors.full_name = "Full name must be at least 2 characters";
    }

    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.phone?.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/[^0-9]/g, ""))) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number";
    }

    if (!formData.address?.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.length < 10) {
      errors.address =
        "Please provide a complete address (minimum 10 characters)";
    }

    if (!formData.shop_name?.trim()) {
      errors.shop_name = "Shop/Business name is required";
    }

    // PAN Card validation
    if (
      formData.pan_card_number &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_card_number)
    ) {
      errors.pan_card_number =
        "Please enter a valid PAN card number (e.g., ABCDE1234F)";
    }

    // Company PAN validation
    if (
      formData.company_pan_card &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.company_pan_card)
    ) {
      errors.company_pan_card = "Please enter a valid company PAN card number";
    }

    // Aadhaar validation
    if (
      formData.aadhaar_card_number &&
      !/^\d{12}$/.test(formData.aadhaar_card_number)
    ) {
      errors.aadhaar_card_number =
        "Please enter a valid 12-digit Aadhaar number";
    }

    // PIN code validation
    if (formData.pin_code && !/^\d{6}$/.test(formData.pin_code)) {
      errors.pin_code = "Please enter a valid 6-digit PIN code";
    }

    // Role validation
    if (!formData.role_name) {
      errors.role_name = "Please select a role";
    }

    // Parent validation for specific roles
    if (
      ["WhiteLabel", "Distributor", "Retailer", "CustomerSupport"].includes(
        formData.role_name
      ) &&
      !formData.parent_id
    ) {
      errors.parent_id = "Parent selection is required for this role";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Format phone number for display and validation
   */
  formatPhoneNumber(phone) {
    if (!phone) return "";

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, "");

    // Remove country code if present
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return cleaned.substring(2);
    }

    return cleaned;
  }

  /**
   * Prepare member data for API submission
   */
  prepareMemberData(formData) {
    return {
      full_name: formData.full_name?.trim(),
      email: formData.email?.trim().toLowerCase(),
      phone: this.formatPhoneNumber(formData.phone),
      mobile: formData.mobile ? this.formatPhoneNumber(formData.mobile) : null,
      address: formData.address?.trim(),
      pin_code: formData.pin_code?.trim(),
      shop_name: formData.shop_name?.trim(),
      company_name: formData.company_name?.trim() || null,
      scheme: formData.scheme?.trim() || null,
      pan_card_number: formData.pan_card_number?.trim().toUpperCase() || null,
      company_pan_card: formData.company_pan_card?.trim().toUpperCase() || null,
      aadhaar_card_number: formData.aadhaar_card_number?.trim() || null,
      role_name: formData.role_name,
      parent_id: formData.parent_id || null,
      password: formData.password?.trim() || null,
    };
  }

  /**
   * Get role-based member list request data
   */
  buildRoleBasedListRequest(currentUser, filters = {}) {
    return {
      requesting_role: currentUser.role,
      requesting_user_id: currentUser.id,
      role_filter: filters.role || null,
      search_query: filters.search || null,
      status_filter: filters.status || "all",
      parent_filter: filters.parent_id || null,
      scheme_filter: filters.scheme || null,
      page: filters.page || 1,
      limit: filters.limit || 20,
      sort_by: filters.sort_by || "created_at",
      sort_order: filters.sort_order || "desc",
    };
  }

  /**
   * Build filter parameters for legacy API compatibility
   */
  buildFilterParams(filters) {
    const params = {};

    if (filters.searchValue) params.search = filters.searchValue;
    if (filters.role) params.role = filters.role;
    if (filters.status) params.status = filters.status;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;
    if (filters.scheme) params.scheme = filters.scheme;
    if (filters.parentRole) params.parent_role = filters.parentRole;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return params;
  }

  /**
   * Format member data for display
   */
  formatMemberForDisplay(member) {
    return {
      ...member,
      displayPhone: member.phone?.startsWith("+91")
        ? member.phone
        : `+91${member.phone}`,
      displayMobile: member.mobile?.startsWith("+91")
        ? member.mobile
        : `+91${member.mobile}`,
      statusBadge: member.is_active ? "Active" : "Inactive",
      joinDate: new Date(member.created_at).toLocaleDateString(),
      lastUpdate: new Date(member.updated_at).toLocaleDateString(),
    };
  }

  /**
   * Enhanced error handling with specific form field mapping
   */
  handleApiError(error) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    } else if (error.response?.status === 403) {
      return "You don't have permission to perform this action.";
    } else if (error.response?.status === 404) {
      return "Member not found.";
    } else if (error.response?.status === 409) {
      return "This operation conflicts with existing data.";
    } else if (error.response?.status === 422) {
      return "Invalid data provided. Please check your inputs.";
    } else if (error.message) {
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  }
}

export default new UnifiedMemberManagementService();
