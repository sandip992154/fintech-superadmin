/**
 * Enhanced useMemberManagement Hook
 * Optimized custom hook for managing member operations with role-based access
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import memberManagementService from "../services/memberManagementService.js";

export const useMemberManagement = (initialRole = null, currentUser = null) => {
  // ===== State Management =====
  const [members, setMembers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [availableParents, setAvailableParents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [parentsLoading, setParentsLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Error states
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Enhanced pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState({
    role: initialRole,
    search: "",
    status: "all",
    parent_id: null,
    scheme: "",
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Cache for preventing unnecessary API calls
  const lastRequestRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ===== Memoized Values =====

  const filteredMembers = useMemo(() => {
    if (!filters.search) return members;

    const searchTerm = filters.search.toLowerCase();
    return members.filter(
      (member) =>
        member.full_name?.toLowerCase().includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm) ||
        member.phone?.includes(searchTerm) ||
        member.user_code?.toLowerCase().includes(searchTerm)
    );
  }, [members, filters.search]);

  const roleBasedRequestData = useMemo(() => {
    if (!currentUser) return null;

    return memberManagementService.buildRoleBasedListRequest(currentUser, {
      ...filters,
      page: currentPage,
      limit: pageSize,
    });
  }, [currentUser, filters, currentPage, pageSize]);

  // ===== Helper Functions =====

  const handleError = useCallback((error, setErrorFn) => {
    const errorMessage = memberManagementService.handleApiError(error);
    setErrorFn(errorMessage);
    console.error("Member Management Error:", error);
  }, []);

  const clearErrors = useCallback(() => {
    setError(null);
    setActionError(null);
  }, []);

  // ===== Optimized Data Fetching Functions =====

  const fetchMembersWithRoleBasedAPI = useCallback(
    async (customFilters = {}) => {
      if (!currentUser || !roleBasedRequestData) return;

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      clearErrors();

      try {
        const requestData = {
          ...roleBasedRequestData,
          ...customFilters,
        };

        // Prevent duplicate requests
        const requestKey = JSON.stringify(requestData);
        if (lastRequestRef.current === requestKey && !customFilters.force) {
          setLoading(false);
          return;
        }
        lastRequestRef.current = requestKey;

        const response = await memberManagementService.getRoleBasedMembers(
          requestData
        );

        if (response.success && response.members) {
          const formattedMembers = response.members.map((member) =>
            memberManagementService.formatMemberForDisplay(member)
          );
          setMembers(formattedMembers);
          setTotalMembers(response.total);
          setTotalPages(Math.ceil(response.total / pageSize));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          handleError(error, setError);
          setMembers([]);
          setTotalMembers(0);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [currentUser, roleBasedRequestData, pageSize, handleError, clearErrors]
  );

  const fetchSchemes = useCallback(async () => {
    setSchemesLoading(true);

    try {
      const response = await memberManagementService.getSchemes();
      setSchemes(response.items || []);
    } catch (error) {
      handleError(error, setError);
      setSchemes([]);
    } finally {
      setSchemesLoading(false);
    }
  }, [handleError]);

  const fetchAvailableParents = useCallback(
    async (role) => {
      if (!role) {
        setAvailableParents([]);
        return;
      }

      setParentsLoading(true);

      try {
        const response = await memberManagementService.getAvailableParents(
          role
        );
        setAvailableParents(response.success ? response.parents : []);
      } catch (error) {
        handleError(error, setError);
        setAvailableParents([]);
      } finally {
        setParentsLoading(false);
      }
    },
    [handleError]
  );

  const fetchDashboardStats = useCallback(async () => {
    setDashboardLoading(true);

    try {
      const response = await memberManagementService.getDashboardStats();
      setDashboardStats(response);
    } catch (error) {
      handleError(error, setError);
      setDashboardStats(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [handleError]);

  // ===== Member CRUD Operations =====

  const createMember = useCallback(
    async (memberData) => {
      setActionLoading(true);
      clearErrors();

      try {
        // Validate form data
        const validation =
          memberManagementService.validateMemberForm(memberData);
        if (!validation.isValid) {
          return {
            success: false,
            errors: validation.errors,
            message: "Please fix validation errors",
          };
        }

        const response = await memberManagementService.createMember(memberData);

        // Refresh the list
        await fetchMembersWithRoleBasedAPI({ force: true });

        return {
          success: true,
          data: response,
          message: "Member created successfully",
        };
      } catch (error) {
        const errorMessage = memberManagementService.handleApiError(error);
        handleError(error, setActionError);
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
        };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchMembersWithRoleBasedAPI, handleError, clearErrors]
  );

  const updateMember = useCallback(
    async (memberId, memberData) => {
      setActionLoading(true);
      clearErrors();

      try {
        const response = await memberManagementService.updateMember(
          memberId,
          memberData
        );
        await fetchMembersWithRoleBasedAPI({ force: true });
        return {
          success: true,
          data: response,
          message: "Member updated successfully",
        };
      } catch (error) {
        const errorMessage = memberManagementService.handleApiError(error);
        handleError(error, setActionError);
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
        };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchMembersWithRoleBasedAPI, handleError, clearErrors]
  );

  const updateMemberStatus = useCallback(
    async (memberId, isActive) => {
      setActionLoading(true);
      clearErrors();

      try {
        await memberManagementService.updateMemberStatus(memberId, isActive);
        await fetchMembersWithRoleBasedAPI({ force: true });
        return {
          success: true,
          message: `Member ${
            isActive ? "activated" : "deactivated"
          } successfully`,
        };
      } catch (error) {
        const errorMessage = memberManagementService.handleApiError(error);
        handleError(error, setActionError);
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
        };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchMembersWithRoleBasedAPI, handleError, clearErrors]
  );

  const deleteMember = useCallback(
    async (memberId) => {
      setActionLoading(true);
      clearErrors();

      try {
        await memberManagementService.deleteMember(memberId);
        await fetchMembersWithRoleBasedAPI({ force: true });
        return {
          success: true,
          message: "Member deleted successfully",
        };
      } catch (error) {
        const errorMessage = memberManagementService.handleApiError(error);
        handleError(error, setActionError);
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
        };
      } finally {
        setActionLoading(false);
      }
    },
    [fetchMembersWithRoleBasedAPI, handleError, clearErrors]
  );

  // ===== Search and Filter Functions =====

  const applyFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      role: initialRole,
      search: "",
      status: "all",
      parent_id: null,
      scheme: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
    setCurrentPage(1);
  }, [initialRole]);

  // ===== Pagination Functions =====

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // ===== Effect Hooks =====

  // Fetch members when filters or pagination changes
  useEffect(() => {
    if (currentUser) {
      fetchMembersWithRoleBasedAPI();
    }
  }, [fetchMembersWithRoleBasedAPI]);

  // Initial data loading
  useEffect(() => {
    fetchSchemes();
    if (currentUser) {
      fetchDashboardStats();
    }
  }, [fetchSchemes, fetchDashboardStats, currentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ===== Return Hook Interface =====

  return {
    // Data
    members,
    filteredMembers,
    schemes,
    availableParents,
    dashboardStats,

    // Loading states
    loading,
    schemesLoading,
    parentsLoading,
    dashboardLoading,
    actionLoading,

    // Error states
    error,
    actionError,
    clearErrors,

    // Pagination
    currentPage,
    totalPages,
    totalMembers,
    pageSize,
    goToPage,
    nextPage,
    prevPage,

    // Filters
    filters,
    applyFilters,
    resetFilters,

    // CRUD operations
    createMember,
    updateMember,
    deleteMember,
    updateMemberStatus,

    // Fetch functions
    fetchMembers: fetchMembersWithRoleBasedAPI,
    fetchSchemes,
    fetchAvailableParents,
    fetchDashboardStats,

    // Utility
    refresh: () => fetchMembersWithRoleBasedAPI({ force: true }),
  };
};

export default useMemberManagement;
