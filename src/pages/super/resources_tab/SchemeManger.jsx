import { useEffect, useState, useCallback, useMemo } from "react";
import { UsersData } from "../../../assets/assets";
import { SuperModal } from "../../../components/utility/SuperModel";
import CommissionTable from "../../../components/super/resource_tab/CommisonTable";
import CommissionEditableForm from "../../../components/super/resource_tab/CommissionEditableForm";
import CommissionDropdown from "../../../components/super/resource_tab/CommissionDropdown";
import FilterBar from "../../../components/utility/FilterBar";
import PaginatedTable from "../../../components/utility/PaginatedTable";
import { ToggleButton } from "../../../components/utility/ToggleButton";
import SchemeForm from "../../../components/super/resource_tab/SchmeForm";
import ResourceDetails from "../../../components/super/resource_tab/ResourceDetails";
import schemeManagementService from "../../../services/schemeManagementService";
import { useRolePermissions } from "../../../hooks/useRolePermissions";
import { toast } from "react-toastify";
import {
  handleApiError,
  withErrorHandling,
  useLoadingState,
  LoadingSpinner,
  ValidationErrorDisplay,
} from "../../../utils/errorHandling";

import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";

/**
 * Enhanced SchemeManager Component with Hierarchical Role Access Control
 *
 * Role Hierarchy & Access Rules:
 * 🔥 SUPERADMIN (Level 0): Full access to ALL schemes and operations
 * 👨‍💼 ADMIN (Level 1): Can manage schemes created by whitelabel(2) and below
 * 🏢 WHITELABEL (Level 2): Can manage schemes created by masterdistributor(3) and below
 * 📊 MASTERDISTRIBUTOR (Level 3): Can manage schemes created by distributor(4) and below
 * 🏪 DISTRIBUTOR (Level 4): Can manage schemes created by retailer(5) and below
 * 🛒 RETAILER (Level 5): Can manage schemes created by customer/user(6) only
 * 👤 CUSTOMER/USER (Level 6): Can only manage their own schemes
 *
 * Access Control Logic:
 * ✅ Own schemes: Users can always access schemes they own or created
 * ✅ Hierarchical access: Parent roles can access child role schemes (userLevel < creatorLevel)
 * ✅ SUPERADMIN override: Superadmin has access to everything regardless of creator
 * ✅ Operations: Edit, Delete, View Commission, Manage Commission follow same rules
 *
 * Performance Optimizations:
 * ✅ useCallback for functions to prevent unnecessary re-renders
 * ✅ useMemo for expensive computations (fields, columns, dropdown options)
 * ✅ Enhanced error handling with user-friendly messages
 * ✅ Comprehensive filtering system with date ranges and user hierarchy
 */
export const SchemeManager = () => {
  // Role-based permissions hook
  const {
    user,
    permissions,
    hasSchemePermission,
    hasCommissionPermission,
    canAccessScheme,
    filterAccessibleSchemes,
    roleInfo,
    userRole,
  } = useRolePermissions();

  // Memoize commission dropdown options to prevent unnecessary re-creation
  const commissionDropdownOptions = useMemo(
    () => [
      { label: "Mobile Recharge", modalKey: "MobileRecharge" },
      { label: "DTH Recharge", modalKey: "DTHRecharge" },
      { label: "Bill Payments", modalKey: "BillPayments" },
      { label: "AEPS", modalKey: "AEPS" },
    ],
    []
  );
  // Loading states using centralized error handling
  const {
    setLoading: setOperationLoading,
    isLoading: isOperationLoading,
    hasAnyLoading,
  } = useLoadingState({
    schemes: false,
    create: false,
    update: false,
    delete: false,
    commission: false,
  });

  // Legacy loading state (maintain compatibility)
  const [loading, setLoading] = useState(false);

  // Enhanced error state
  const [errors, setErrors] = useState({
    general: null,
    validation: [],
  });

  const [schemes, setSchemes] = useState([]);
  const [totalSchemes, setTotalSchemes] = useState(0);

  console.log(schemes);

  // All modals open close State
  const [isModal, setIsModal] = useState({
    AddNew: false,
    ViewCommision: false,
    "Commision/Charge": false,
    MobileRecharge: false,
    AEPS: false,
    DTHRecharge: false,
    MicroATM: false,
    BillPayments: false,
    ResourceManager: false,
    CreateResource: false,
    ViewResource: false,
  });

  //modales state
  const [schemeName, setSchemeName] = useState("");
  const [editingScheme, setEditingScheme] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState({});
  const [currentSchemeForCommission, setCurrentSchemeForCommission] =
    useState(null);

  const [filters, setFilters] = useState({
    searchValue: "",
    is_active: "all",
    from_date: "",
    to_date: "",
    filter_user_id: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
  });

  const pageSize = 10;

  // Enhanced role level mapping with proper hierarchy
  const getRoleLevel = useCallback((role) => {
    if (!role) return 999;
    const normalizedRole = role.toLowerCase();
    switch (normalizedRole) {
      case "superadmin":
      case "super_admin":
        return 0; // Highest level - can access everything
      case "admin":
        return 1; // Can access whitelabel and below
      case "whitelabel":
        return 2; // Can access masterdistributor and below
      case "masterdistributor":
      case "mds":
        return 3; // Can access distributor and below
      case "distributor":
        return 4; // Can access retailer and below
      case "retailer":
        return 5; // Can access customer/user only
      case "customer":
      case "user": // Handle generic "user" role as lowest level
        return 6; // Lowest level
      default:
        return 999; // Unknown role - no access
    }
  }, []);

  // Enhanced role hierarchy access control for scheme operations
  const canUserAccessScheme = useCallback(
    (scheme) => {
      if (!userRole || !user) return false;

      console.log("Access Control Debug:", {
        userRole,
        userId: user.id,
        schemeId: scheme.id,
        schemeName: scheme.name,
        schemeCreatedBy: scheme.created_by,
        schemeCreatorRole: scheme.created_by_role,
        schemeOwnerId: scheme.owner_id,
      });

      // SUPERADMIN has full access to everything
      if (userRole === "superadmin" || userRole === "super_admin") {
        console.log("✅ SUPERADMIN - Full access granted");
        return true;
      }

      // User is the owner of the scheme
      if (scheme.owner_id === user.id) {
        console.log("✅ OWNER - Access granted");
        return true;
      }

      // User is the creator of the scheme
      if (scheme.created_by === user.id) {
        console.log("✅ CREATOR - Access granted");
        return true;
      }

      // Hierarchical access based on role levels
      const userLevel = getRoleLevel(userRole);
      const schemeCreatorLevel = getRoleLevel(scheme.created_by_role || "user");

      // Parent role can access child role schemes
      if (userLevel < schemeCreatorLevel) {
        console.log("✅ PARENT ROLE - Access granted", {
          userLevel,
          schemeCreatorLevel,
        });
        return true;
      }

      console.log("❌ NO ACCESS - Access denied", {
        userLevel,
        schemeCreatorLevel,
      });
      return false;
    },
    [user, userRole, getRoleLevel]
  );

  // Optimized loadSchemeData function with useCallback - moved early to prevent initialization errors
  const loadSchemeData = useCallback(async () => {
    try {
      setLoading(true);

      // Build filter parameters using the service helper
      const filterParams = schemeManagementService.buildFilterParams({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        search: filters.searchValue,
        is_active: filters.is_active,
        from_date: filters.from_date,
        to_date: filters.to_date,
        filter_user_id: filters.filter_user_id,
      });

      // Use the new enhanced getSchemes method
      const response = await schemeManagementService.getSchemesWithFilters(
        filterParams
      );

      console.log("API Response Debug:", {
        responseStructure: {
          items: response.items?.length || 0,
          total: response.total,
          page: response.page,
          size: response.size,
          pages: response.pages,
        },
        sampleScheme: response.items?.[0] || null,
      });

      let schemesData = response.items || response || [];

      // Apply client-side role-based filtering if needed
      // if (Array.isArray(schemesData)) {
      //   schemesData = filterAccessibleSchemes(schemesData);
      // }

      console.log(schemesData);

      setSchemes(schemesData);
      console.log("schemes", schemes);
      setFilteredData(schemesData);
      setTotalSchemes(response.total || schemesData.length);

      // Update dashboard stats
      setDashboardStats({
        totalSchemes: response.total || schemesData.length,
        activeSchemes: schemesData.filter((s) => s.is_active).length,
      });
    } catch (error) {
      console.error("Error loading scheme data:", error);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Failed to load schemes. Please try again.";
      toast.error(errorMessage);

      // Reset data on error
      setSchemes([]);
      setFilteredData([]);
      setTotalSchemes(0);
      setDashboardStats({
        totalSchemes: 0,
        activeSchemes: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, filterAccessibleSchemes]); // Dependencies for useCallback

  // Optimized generic input handler with useCallback
  const handleInputChange = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []); // No dependencies needed as we use functional updates

  // Optimized toggle scheme status with enhanced error handling
  const handleToggle = useCallback(
    async (scheme, index) => {
      console.log("=== TOGGLE DEBUG START ===");
      console.log("Original scheme:", scheme);
      console.log("Current is_active:", scheme.is_active);
      console.log("Index:", index);

      const result = await withErrorHandling(
        async () => {
          setOperationLoading("update", true);
          setLoading(true);

          const newStatus = !scheme.is_active;
          console.log("Toggling to:", newStatus);

          // Call the specific status update endpoint
          const updatedScheme =
            await schemeManagementService.updateSchemeStatus(
              scheme.id,
              newStatus
            );
          console.log("Server response:", updatedScheme);

          // Safety check: Use the actual response from server to determine the final state
          const actualStatus = updatedScheme.is_active;
          console.log("Actual status from server:", actualStatus);

          // Update local state with the actual server response
          const updated = [...filteredData];
          updated[index] = {
            ...scheme,
            is_active: actualStatus,
            updated_at: updatedScheme.updated_at || new Date().toISOString(),
          };
          setFilteredData(updated);
          console.log("Updated filteredData:", updated[index]);

          // Also update the schemes state to keep them in sync
          const updatedSchemes = schemes.map((s) =>
            s.id === scheme.id
              ? {
                  ...s,
                  is_active: actualStatus,
                  updated_at:
                    updatedScheme.updated_at || new Date().toISOString(),
                }
              : s
          );
          setSchemes(updatedSchemes);

          // Update dashboard stats
          setDashboardStats((prev) => ({
            ...prev,
            activeSchemes: updatedSchemes.filter((s) => s.is_active).length,
          }));

          // If the server state doesn't match what we expected, show a warning
          if (actualStatus !== newStatus) {
            console.warn(
              `Expected status: ${newStatus}, but server returned: ${actualStatus}`
            );
            toast.warning(
              `Status updated, but server returned different state than expected`
            );
          }

          return updatedScheme;
        },
        {
          successMessage: `Scheme ${
            !scheme.is_active ? "activated" : "deactivated"
          } successfully`,
          errorMessage: "Failed to update scheme status",
          onError: (error) => {
            // Optionally reload data to ensure consistency
            if (
              error.type === "AUTHENTICATION" ||
              error.type === "AUTHORIZATION"
            ) {
              // Reload scheme data to ensure UI is in sync with server
              loadSchemeData();
            }
          },
        }
      );

      setOperationLoading("update", false);
      setLoading(false);
      console.log("=== TOGGLE DEBUG END ===");
    },
    [filteredData, schemes, setOperationLoading]
  );

  // Simplified delete scheme with proper access control
  const handleDelete = useCallback(
    async (scheme) => {
      // Check if user can access this scheme
      if (!canUserAccessScheme(scheme)) {
        toast.error("You don't have permission to delete this scheme");
        return;
      }

      if (window.confirm(`Are you sure you want to delete "${scheme.name}"?`)) {
        try {
          await schemeManagementService.deleteScheme(scheme.id);
          toast.success("Scheme deleted successfully");
          loadSchemeData(); // Refresh data
        } catch (error) {
          console.error("Error deleting scheme:", error);
          toast.error("Failed to delete scheme");
        }
      }
    },
    [canUserAccessScheme]
  ); // Dependencies for useCallback

  // Memoized filter fields configuration for better performance
  const fields = useMemo(
    () => [
      {
        name: "searchValue",
        type: "text",
        placeholder: "Search schemes by name or description...",
        value: filters.searchValue || "",
        onChange: (val) => handleInputChange("searchValue", val),
      },
      {
        name: "is_active",
        type: "select",
        placeholder: "Status",
        value: filters.is_active || "all",
        onChange: (val) => handleInputChange("is_active", val),
        options: [
          { label: "All Status", value: "all" },
          { label: "Active", value: "true" },
          { label: "Inactive", value: "false" },
        ],
      },
      {
        name: "from_date",
        type: "date",
        placeholder: "From Date",
        value: filters.from_date || "",
        onChange: (val) => handleInputChange("from_date", val),
        label: "From Date",
      },
      {
        name: "to_date",
        type: "date",
        placeholder: "To Date",
        value: filters.to_date || "",
        onChange: (val) => handleInputChange("to_date", val),
        label: "To Date",
      },
      {
        name: "filter_user_id",
        type: "number",
        placeholder: "Filter by User ID (includes hierarchy)",
        value: filters.filter_user_id || "",
        onChange: (val) => handleInputChange("filter_user_id", val),
        label: "User ID Filter",
      },
    ],
    [filters]
  );

  useEffect(() => {
    loadSchemeData();
  }, [filters, currentPage]);

  // Load scheme management data with enhanced filtering and error handling
  // utility for modal handlings - memoized to prevent unnecessary re-renders
  const handleCommissionOptionClick = useCallback((modalKey, scheme = null) => {
    if (scheme) {
      setCurrentSchemeForCommission(scheme);
    }
    setIsModal((prev) => ({ ...prev, [modalKey]: true }));
  }, []);

  const openAddModal = useCallback(() => {
    setEditingScheme(null);
    setSchemeName("");
    setIsModal((prev) => ({ ...prev, AddNew: true }));
  }, []);

  const openEditModal = useCallback((entry) => {
    setEditingScheme(entry);
    setSchemeName(entry.name);
    setIsModal((prev) => ({ ...prev, AddNew: true }));
  }, []);

  const openViewCommissionModal = useCallback(
    async (scheme) => {
      try {
        // Show loading state
        setIsModal((prev) => ({ ...prev, ViewCommision: true }));
        setSelectedCommission({}); // Reset commission data
        setOperationLoading("commission", true); // Start loading

        if (!scheme || !scheme.id) {
          console.error("Invalid scheme object:", scheme);
          setSelectedCommission({});
          setOperationLoading("commission", false);
          return;
        }

        // Fetch commission data for all services for the scheme
        const commissionData =
          await schemeManagementService.getAllCommissionsByScheme(scheme.id);

        console.log("Fetched commission data:", commissionData);
        setSelectedCommission(commissionData);
      } catch (error) {
        console.error("Error fetching commission data:", error);
        // Set empty data on error
        setSelectedCommission({});
      } finally {
        // Always stop loading
        setOperationLoading("commission", false);
      }
    },
    [setOperationLoading]
  );

  // Memoized callback for closing commission modal
  const handleCloseCommissionModal = useCallback((modalKey) => {
    setIsModal((prev) => ({ ...prev, [modalKey]: false }));
  }, []);

  // Resource Management Functions
  const openCreateResource = useCallback(() => {
    setIsModal((prev) => ({ ...prev, CreateResource: true }));
  }, []);

  const openViewResource = useCallback((resource) => {
    setSelectedResource(resource);
    setIsModal((prev) => ({ ...prev, ViewResource: true }));
  }, []);

  const handleCreateResource = useCallback(async (resourceData) => {
    try {
      // Implement resource creation logic here
      console.log("Creating resource:", resourceData);
      toast.success("Resource created successfully");
      setIsModal((prev) => ({ ...prev, CreateResource: false }));
      // Reload resources if needed
    } catch (error) {
      console.error("Error creating resource:", error);
      toast.error("Failed to create resource");
    }
  }, []);

  const handleDeleteResource = useCallback(
    async (resourceId) => {
      if (!window.confirm("Are you sure you want to delete this resource?")) {
        return;
      }

      const result = await withErrorHandling(
        async () => {
          setOperationLoading("delete", true);

          // Implement resource deletion logic here
          console.log("Deleting resource:", resourceId);

          // Here you would call the actual delete API
          // const response = await schemeManagementService.deleteResource(resourceId);

          // For now, just simulate success
          return { success: true };
        },
        {
          successMessage: "Resource deleted successfully",
          errorMessage: "Failed to delete resource",
        }
      );

      setOperationLoading("delete", false);

      if (result.success) {
        // Reload resources if needed after successful deletion
        // loadSchemeData();
      }
    },
    [setOperationLoading]
  );

  // Memoized table columns configuration for better performance
  const columns = useMemo(
    () => [
      {
        header: "ID",
        accessor: "id",
        render: (row) => `#${row.id}`,
      },
      {
        header: "Scheme Name",
        accessor: "name",
        render: (row) => (
          <div className="font-medium text-gray-900 dark:text-white">
            {row.name}
          </div>
        ),
      },
      {
        header: "Description",
        accessor: "description",
        render: (row) => (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {row.description || "No description"}
          </div>
        ),
      },
      {
        header: "Status",
        accessor: "is_active",
        render: (row, idx) => (
          <ToggleButton
            row={row}
            onchange={() => handleToggle(row, idx)}
            checked={Boolean(row.is_active)}
          />
        ),
      },
      {
        header: "Creator Role",
        accessor: "created_by_role",
        render: (row) => {
          const role = row.created_by_role || "unknown";
          const displayRole =
            role === "super_admin"
              ? "Super Admin"
              : role === "user"
              ? "User"
              : role.charAt(0).toUpperCase() + role.slice(1);
          return (
            <span
              className={`px-2 py-1 text-xs rounded ${
                role === "super_admin"
                  ? "bg-purple-100 text-purple-800"
                  : role === "admin"
                  ? "bg-blue-100 text-blue-800"
                  : role === "user"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {displayRole}
            </span>
          );
        },
      },
      {
        header: "Owner",
        accessor: "owner_id",
        render: (row) => {
          if (!row.owner_id) {
            return (
              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                No Owner
              </span>
            );
          }
          return (
            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
              User #{row.owner_id}
            </span>
          );
        },
      },
      {
        header: "Created",
        accessor: "created_at",
        render: (row) => {
          if (!row.created_at) return "N/A";
          return new Date(row.created_at).toLocaleDateString();
        },
      },
      {
        header: "Actions",
        accessor: "actions",
        width: "200px", // Add fixed width to ensure actions column is visible
        render: (row) => {
          // Enhanced access control for actions
          const hasSchemeAccess = canUserAccessScheme(row);

          // SUPERADMIN gets all permissions
          const isSuperAdmin =
            userRole === "superadmin" || userRole === "super_admin";

          // Permission logic based on role hierarchy and scheme access
          const canEdit =
            isSuperAdmin || (hasSchemeAccess && hasSchemePermission("update"));
          const canDelete =
            isSuperAdmin || (hasSchemeAccess && hasSchemePermission("delete"));
          const canViewCommission =
            isSuperAdmin ||
            (hasSchemeAccess && hasCommissionPermission("read"));
          const canManageCommission =
            isSuperAdmin ||
            (hasSchemeAccess && hasCommissionPermission("update"));

          // Show at least one action if user has scheme access
          const showAnyAction =
            canEdit || canDelete || canViewCommission || canManageCommission;

          // Debug permissions (remove when stable)
          console.log("Action Permissions Debug:", {
            schemeId: row.id,
            schemeName: row.name,
            userRole,
            isSuperAdmin,
            hasSchemeAccess,
            canEdit,
            canDelete,
            canViewCommission,
            canManageCommission,
            showAnyAction,
          });

          // Don't render action buttons if user has no permissions
          if (!showAnyAction) {
            return (
              <div className="flex space-x-2 min-w-fit">
                <span className="text-gray-400 text-xs">No Actions</span>
              </div>
            );
          }

          return (
            <div className="flex space-x-2 min-w-fit">
              {/* Edit Button */}
              {canEdit && (
                <button
                  className="text-green-600 hover:text-green-800 p-1 rounded border border-green-300 hover:bg-green-50"
                  onClick={() => openEditModal(row)}
                  title="Edit Scheme"
                >
                  <FaEdit />
                </button>
              )}

              {/* View Commission Button */}
              {canViewCommission && (
                <button
                  className="text-blue-600 hover:text-blue-800 p-1 rounded border border-blue-300 hover:bg-blue-50"
                  onClick={() => openViewCommissionModal(row)}
                  title="View Commission"
                >
                  <FaEye />
                </button>
              )}

              {/* Delete Button */}
              {canDelete && (
                <button
                  className="text-red-600 hover:text-red-800 p-1 rounded border border-red-300 hover:bg-red-50"
                  onClick={() => handleDelete(row)}
                  title="Delete Scheme"
                >
                  <FaTrash />
                </button>
              )}

              {/* Commission Dropdown */}
              {canManageCommission && (
                <div className="inline-block">
                  <CommissionDropdown
                    commissions={row.commissions || []}
                    setSelectedCommission={setSelectedCommission}
                    commissionDropdownOptions={commissionDropdownOptions}
                    handleCommissionOptionClick={handleCommissionOptionClick}
                    scheme={row}
                  />
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [
      user,
      userRole,
      getRoleLevel,
      canUserAccessScheme,
      handleToggle,
      handleDelete,
      hasSchemePermission,
      hasCommissionPermission,
      setSelectedCommission,
      commissionDropdownOptions,
      handleCommissionOptionClick,
      openEditModal,
      openViewCommissionModal,
    ]
  ); // Dependencies for useMemo

  return (
    <div className="h-[90vh] 2xl:max-w-[80%] p-4 mx-8 bg-secondaryOne dark:bg-darkBlue/70 rounded-2xl 2xl:mx-auto text-gray-800 overflow-hidden overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      {/* Global Error Display */}
      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm font-medium">
            {errors.general}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      <ValidationErrorDisplay errors={errors.validation} className="mb-4" />

      {/* Loading Overlay */}
      {hasAnyLoading() && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <LoadingSpinner
              size="lg"
              message={
                isOperationLoading("schemes")
                  ? "Loading schemes..."
                  : isOperationLoading("create")
                  ? "Creating scheme..."
                  : isOperationLoading("update")
                  ? "Updating scheme..."
                  : isOperationLoading("delete")
                  ? "Deleting resource..."
                  : isOperationLoading("commission")
                  ? "Processing commission..."
                  : "Processing..."
              }
            />
          </div>
        </div>
      )}

      {/* Header with Resource Management Stats */}
      <div className="my-4 p-4 rounded-md bg-white dark:bg-transparent">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold dark:text-adminOffWhite">
              Scheme Manager
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage schemes and commissions
            </p>
          </div>

          {/* Scheme Stats Cards */}
          <div className="flex space-x-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center min-w-[80px]">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {dashboardStats.totalSchemes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Schemes
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center min-w-[80px]">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {dashboardStats.activeSchemes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex justify-between items-center mb-4">
          {/* Summary Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span>Total: {totalSchemes} schemes</span>
            {filters.searchValue && (
              <span> (filtered by: "{filters.searchValue}")</span>
            )}
          </div>
        </div>

        <FilterBar fields={fields} onSearch={loadSchemeData} />
      </div>

      <div className="p-6 rounded-md w-full bg-white dark:bg-transparent dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Schemes & Commission</h3>
          </div>

          <div className="flex space-x-2">
            <button
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white btn-md flex items-center"
              onClick={openAddModal}
            >
              <FaPlus className="mr-2" />
              Add Scheme
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <ClipLoader color="#3B82F6" size={35} />
          </div>
        ) : (
          <PaginatedTable
            data={filteredData}
            columns={columns}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            totalItems={totalSchemes}
          />
        )}
      </div>

      {/* Add/Edit New Modal */}
      {isModal["AddNew"] && (
        <SuperModal
          onClose={() => {
            setIsModal((prev) => ({ ...prev, AddNew: false }));
            setEditingScheme(null);
            setSchemeName("");
          }}
        >
          <SchemeForm
            editingScheme={editingScheme}
            onSchemeUpdate={loadSchemeData}
            onClose={() => {
              setIsModal((prev) => ({ ...prev, AddNew: false }));
              setEditingScheme(null);
              setSchemeName("");
            }}
          />
        </SuperModal>
      )}

      {/* view commision */}
      {isModal["ViewCommision"] && (
        <SuperModal
          onClose={() =>
            setIsModal((prev) => ({ ...prev, ViewCommision: false }))
          }
        >
          <CommissionTable
            title="View Commission"
            data={selectedCommission} // <-- your real API data
            isLoading={isOperationLoading("commission")}
            onSubmit={() => {
              setIsModal((prev) => ({ ...prev, ViewCommision: false }));
            }}
          />
        </SuperModal>
      )}

      {/* commission/charges */}
      {commissionDropdownOptions.map(
        ({ modalKey, label }) =>
          isModal[modalKey] && (
            <SuperModal
              key={modalKey}
              onClose={() =>
                setIsModal((prev) => ({ ...prev, [modalKey]: false }))
              }
            >
              <div className="text-lg font-semibold mb-4">
                {label} Commission{" "}
              </div>
              {/* Replace with a dynamic component based on modalKey */}
              <CommissionEditableForm
                serviceKey={modalKey}
                commission={selectedCommission}
                setSelectedCommission={setSelectedCommission}
                schemeId={currentSchemeForCommission?.id}
                serviceType={modalKey}
                onClose={() => handleCloseCommissionModal(modalKey)}
              />
            </SuperModal>
          )
      )}

      {/* Resource Manager Modal */}
      {isModal["ResourceManager"] && (
        <SuperModal
          onClose={() =>
            setIsModal((prev) => ({ ...prev, ResourceManager: false }))
          }
          className="max-w-6xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Resource Management</h2>
              <button
                onClick={openCreateResource}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <FaPlus className="mr-2" />
                Create Resource
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <ClipLoader color="#3B82F6" size={40} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Categories Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Categories ({categories.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: category.color || "#3B82F6",
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{category.name}</h4>
                            <p className="text-sm text-gray-500">
                              {category.resources_count || 0} resources
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              category.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {category.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources Section */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Resources ({resources.length})
                  </h3>
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FaEye className="text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{resource.name}</h4>
                              <p className="text-sm text-gray-500">
                                {resource.category_name} •{" "}
                                {resource.resource_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                resource.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {resource.status}
                            </span>
                            <button
                              onClick={() => openViewResource(resource)}
                              className="text-blue-600 hover:text-blue-800 p-2"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleDeleteResource(resource.id)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SuperModal>
      )}

      {/* Create Resource Modal */}
      {isModal["CreateResource"] && (
        <SuperModal
          onClose={() =>
            setIsModal((prev) => ({ ...prev, CreateResource: false }))
          }
          className="max-w-2xl"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Create New Resource</h2>
            <ResourceForm
              categories={categories}
              onSubmit={handleCreateResource}
              onCancel={() =>
                setIsModal((prev) => ({ ...prev, CreateResource: false }))
              }
            />
          </div>
        </SuperModal>
      )}

      {/* View Resource Modal */}
      {isModal["ViewResource"] && selectedResource && (
        <SuperModal
          onClose={() =>
            setIsModal((prev) => ({ ...prev, ViewResource: false }))
          }
          className="max-w-3xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Resource Details</h2>
              <div className="flex space-x-2">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
                  <FaEdit className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteResource(selectedResource.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <FaTrash className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
            <ResourceDetails resource={selectedResource} />
          </div>
        </SuperModal>
      )}
    </div>
  );
};
