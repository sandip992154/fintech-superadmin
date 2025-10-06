/**
 * Enhanced Member Management Service
 * Handles all member-related API calls including CRUD operations, filtering, and bulk actions
 */
import apiClient from "./apiClient.js";

class MemberManagementService {
  // ===== Base Member Operations =====

  /**
   * Get all members with filtering and pagination (Enhanced Role-based)
   */
  async getMembers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `/api/v1/members/list?${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching members:", error);
      throw error;
    }
  }

  /**
   * Get role-based member list with enhanced filtering
   */
  async getRoleBasedMembers(requestData) {
    try {
      const response = await apiClient.post(
        "/api/v1/members/list/role-based",
        requestData
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching role-based members:", error);
      throw error;
    }
  }

  /**
   * Get available parents for a specific role
   */
  async getAvailableParents(roleName, search = null) {
    try {
      const params = new URLSearchParams();
      if (roleName) params.append("role", roleName);
      if (search) params.append("search", search);

      const response = await apiClient.get(
        `/api/v1/members/parents?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching available parents:", error);
      throw error;
    }
  }

  /**
   * Get member by ID
   */
  async getMember(memberId) {
    try {
      const response = await apiClient.get(`/api/v1/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching member:", error);
      throw error;
    }
  }

  /**
   * Create new member with enhanced validation
   */
  async createMember(memberData) {
    try {
      const preparedData = this.prepareMemberData(memberData);
      const response = await apiClient.post(
        "/api/v1/members/create",
        preparedData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating member:", error);
      throw error;
    }
  }

  /**
   * Update member
   */
  async updateMember(memberId, memberData) {
    try {
      const preparedData = this.prepareMemberData(memberData);
      const response = await apiClient.put(
        `/api/v1/members/${memberId}`,
        preparedData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating member:", error);
      throw error;
    }
  }

  /**
   * Update member status (activate/deactivate)
   */
  async updateMemberStatus(memberId, isActive) {
    try {
      const response = await apiClient.patch(
        `/api/v1/members/${memberId}/status`,
        {
          is_active: isActive,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating member status:", error);
      throw error;
    }
  }

  /**
   * Delete member
   */
  async deleteMember(memberId) {
    try {
      const response = await apiClient.delete(`/api/v1/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting member:", error);
      throw error;
    }
  }

  // ===== Role-specific Member Operations =====

  /**
   * Get members by role with enhanced filtering
   */
  async getMembersByRole(role, filters = {}) {
    try {
      const params = {
        role: role,
        ...filters,
      };
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `/api/v1/members/list?${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${role} members:`, error);
      throw error;
    }
  }

  // ===== Utility and Reference Data =====

  /**
   * Get user role permissions
   */
  async getUserRolePermissions() {
    try {
      const response = await apiClient.get("/api/v1/members/role-permissions");
      return response.data;
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      throw error;
    }
  }

  /**
   * Get available schemes
   */
  async getSchemes() {
    try {
      const response = await apiClient.get("/api/v1/schemes");
      return response.data;
    } catch (error) {
      console.error("Error fetching schemes:", error);
      throw error;
    }
  }

  /**
   * Get location options (states and cities)
   */
  async getLocationOptions() {
    try {
      const response = await apiClient.get("/api/v1/members/locations");
      return response.data;
    } catch (error) {
      console.error("Error fetching location options:", error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await apiClient.get("/api/v1/members/admin/dashboard");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
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

export default new MemberManagementService();
