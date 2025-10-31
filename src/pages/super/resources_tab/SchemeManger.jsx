import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";

// Hooks and Utils
import { useRolePermissions } from "../../../hooks/useRolePermissions";
import {
  useLoadingState,
  withErrorHandling,
  ValidationErrorDisplay,
} from "../../../utils/errorHandling";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

// Modular Components
import { SchemeHeader } from "../../../components/super/resource_tab/scheme/SchemeHeader";
import { SchemeFilters } from "../../../components/super/resource_tab/scheme/SchemeFilters";
import { SchemeTableHeader } from "../../../components/super/resource_tab/scheme/SchemeTableHeader";
import { SchemeTableRow } from "../../../components/super/resource_tab/scheme/SchemeTableRow";

// Existing Components
import { SuperModal } from "../../../components/utility/SuperModel";
import PaginatedTable from "../../../components/utility/PaginatedTable";
import SchemeForm from "../../../components/super/resource_tab/SchmeForm";
import CommissionTable from "../../../components/super/resource_tab/CommisonTable";
import CommissionEditableForm from "../../../components/super/resource_tab/CommissionEditableForm";

// Services
import schemeManagementService from "../../../services/schemeManagementService";

/**
 * Enhanced SchemeManager Component - Refactored and Modular
 *
 * Features:
 * ✅ Clean, modular component structure
 * ✅ Enhanced UI matching design specifications
 * ✅ Role-based hierarchical access control
 * ✅ Comprehensive error handling
 * ✅ Performance optimized with useCallback and useMemo
 * ✅ Responsive design with dark mode support
 */
export const SchemeManager = () => {
  // ============================================================================
  // HOOKS & CONTEXT
  // ============================================================================
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

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ general: null, validation: [] });
  const [schemes, setSchemes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState("");

  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    totalSchemes: 0,
    activeSchemes: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({
    searchValue: "",
    is_active: "all",
    from_date: "",
    to_date: "",
    filter_user_id: "",
  });

  // Modal states
  const [isModal, setIsModal] = useState({
    AddNew: false,
    ViewCommision: false,
    MobileRecharge: false,
    AEPS: false,
    DTHRecharge: false,
    MicroATM: false,
    BillPayments: false,
    DMT: false,
  });

  // Form states
  const [editingScheme, setEditingScheme] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState({});
  const [currentSchemeForCommission, setCurrentSchemeForCommission] =
    useState(null);

  const pageSize = 10;

  // ============================================================================
  // COMMISSION DROPDOWN OPTIONS - Memoized
  // ============================================================================
  const commissionDropdownOptions = useMemo(
    () => [
      { label: "Mobile Recharge", modalKey: "MobileRecharge" },
      { label: "DTH Recharge", modalKey: "DTHRecharge" },
      { label: "Bill Payments", modalKey: "BillPayments" },
      { label: "AEPS", modalKey: "AEPS" },
      { label: "DMT", modalKey: "DMT" },
      { label: "Micro ATM", modalKey: "MicroATM" },
    ],
    []
  );

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Role level mapping for hierarchy
  const getRoleLevel = useCallback((role) => {
    if (!role) return 999;
    const normalizedRole = role.toLowerCase();
    const roleMap = {
      superadmin: 0,
      super_admin: 0,
      admin: 1,
      whitelabel: 2,
      masterdistributor: 3,
      mds: 3,
      distributor: 4,
      retailer: 5,
      customer: 6,
      user: 6,
    };
    return roleMap[normalizedRole] ?? 999;
  }, []);

  // Check if user can access a scheme
  const canUserAccessScheme = useCallback(
    (scheme) => {
      if (!userRole || !user) return false;

      // SUPERADMIN has full access
      if (userRole === "superadmin" || userRole === "super_admin") {
        return true;
      }

      // Owner access
      if (scheme.owner_id === user.id) {
        return true;
      }

      // Creator access
      if (scheme.created_by === user.id) {
        return true;
      }

      // Hierarchical access
      const userLevel = getRoleLevel(userRole);
      const schemeCreatorLevel = getRoleLevel(scheme.created_by_role || "user");

      return userLevel < schemeCreatorLevel;
    },
    [user, userRole, getRoleLevel]
  );

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadSchemeData = useCallback(async () => {
    try {
      setOperationLoading("schemes", true);
      setLoading(true);
      setErrors({ general: null, validation: [] });

      // Build filter params properly
      const filterParams = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
      };

      // Add search filter if provided
      if (filters.searchValue && filters.searchValue.trim()) {
        filterParams.search = filters.searchValue.trim();
      }

      // Add status filter - convert string to boolean properly
      if (filters.is_active && filters.is_active !== "all") {
        filterParams.is_active = filters.is_active === "true";
      }

      // Add date filters
      if (filters.from_date) {
        filterParams.from_date = filters.from_date;
      }

      if (filters.to_date) {
        filterParams.to_date = filters.to_date;
      }

      // Add user filter
      if (filters.filter_user_id) {
        filterParams.filter_user_id = filters.filter_user_id;
      }

      console.log("Loading schemes with filters:", filterParams);

      const response = await schemeManagementService.getSchemesWithFilters(
        filterParams
      );

      console.log("Schemes response:", response);

      let schemesData = response.items || response || [];

      setSchemes(schemesData);
      setFilteredData(schemesData);
      setTotalSchemes(response.total || schemesData.length || 0);

      // Update dashboard stats
      const activeCount = schemesData.filter((s) => s.is_active).length;
      setDashboardStats({
        totalSchemes: response.total || schemesData.length || 0,
        activeSchemes: activeCount,
      });

      // Update last updated time
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString("en-US", { hour12: false }));
    } catch (error) {
      console.error("Error loading schemes:", error);
      setErrors({
        general: error.message || "Failed to load schemes",
        validation: [],
      });
      toast.error("Failed to load schemes");
    } finally {
      setOperationLoading("schemes", false);
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, setOperationLoading]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((name, value) => {
    console.log(`Filter changed - ${name}:`, value);
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchValue: "",
      is_active: "all",
      from_date: "",
      to_date: "",
      filter_user_id: "",
    });
    setCurrentPage(1);
    // Auto-reload after clearing
    setTimeout(() => loadSchemeData(), 100);
  }, [loadSchemeData]);

  const handleToggle = useCallback(
    async (scheme, index) => {
      console.log("=== TOGGLE DEBUG START ===");
      console.log("Original scheme:", scheme);
      console.log("Current is_active:", scheme.is_active);
      console.log("Index:", index);
      console.log("New is_active will be:", !scheme.is_active);

      const newActiveState = !scheme.is_active;

      try {
        setOperationLoading("update", true);

        const updatedScheme = {
          ...scheme,
          is_active: newActiveState,
        };

        console.log("Sending to backend:", updatedScheme);

        const response = await schemeManagementService.updateScheme(
          scheme.id,
          updatedScheme
        );

        console.log("Backend response:", response);

        if (response.success || response) {
          // Update filteredData immediately
          setFilteredData((prev) => {
            const updated = prev.map((s) =>
              s.id === scheme.id ? { ...s, is_active: newActiveState } : s
            );
            console.log("Updated filteredData:", updated);
            return updated;
          });

          // Update schemes array
          setSchemes((prev) => {
            const updated = prev.map((s) =>
              s.id === scheme.id ? { ...s, is_active: newActiveState } : s
            );
            console.log("Updated schemes:", updated);
            return updated;
          });

          // Update dashboard stats
          setDashboardStats((prev) => {
            const newActiveCount = newActiveState
              ? prev.activeSchemes + 1
              : prev.activeSchemes - 1;
            return {
              ...prev,
              activeSchemes: newActiveCount,
            };
          });

          toast.success(
            `Scheme ${
              newActiveState ? "activated" : "deactivated"
            } successfully`
          );
        } else {
          throw new Error("Failed to update scheme status");
        }
      } catch (error) {
        console.error("Toggle error:", error);
        toast.error(error.message || "Failed to update scheme status");
        setErrors({
          general: error.message || "Failed to update scheme status",
          validation: [],
        });
      } finally {
        setOperationLoading("update", false);
        console.log("=== TOGGLE DEBUG END ===");
      }
    },
    [setOperationLoading]
  );

  const handleDelete = useCallback(
    async (scheme) => {
      if (!canUserAccessScheme(scheme)) {
        toast.error("You do not have permission to delete this scheme");
        return;
      }

      if (window.confirm(`Are you sure you want to delete "${scheme.name}"?`)) {
        await withErrorHandling(
          async () => {
            await schemeManagementService.deleteScheme(scheme.id);
            await loadSchemeData();
          },
          {
            successMessage: "Scheme deleted successfully",
            errorMessage: "Failed to delete scheme",
          }
        );
      }
    },
    [canUserAccessScheme, loadSchemeData]
  );

  // ============================================================================
  // MODAL HANDLERS
  // ============================================================================

  const openAddModal = useCallback(() => {
    setEditingScheme(null);
    setIsModal((prev) => ({ ...prev, AddNew: true }));
  }, []);

  const openEditModal = useCallback((scheme) => {
    setEditingScheme(scheme);
    setIsModal((prev) => ({ ...prev, AddNew: true }));
  }, []);

  const closeModal = useCallback((modalKey) => {
    setIsModal((prev) => ({ ...prev, [modalKey]: false }));
    if (modalKey === "AddNew") {
      setEditingScheme(null);
    }
  }, []);

  const openViewCommissionModal = useCallback(
    async (scheme) => {
      try {
        setOperationLoading("commission", true);
        const response =
          await schemeManagementService.getAllCommissionsByScheme(scheme.id);

        if (response) {
          setSelectedCommission(response);
          setCurrentSchemeForCommission(scheme);
          setIsModal((prev) => ({ ...prev, ViewCommision: true }));
        }
      } catch (error) {
        console.error("Error loading commissions:", error);
        toast.error("Failed to load commissions");
      } finally {
        setOperationLoading("commission", false);
      }
    },
    [setOperationLoading]
  );

  const handleCommissionOptionClick = useCallback((modalKey, scheme = null) => {
    if (scheme) {
      setCurrentSchemeForCommission(scheme);
    }
    setIsModal((prev) => ({ ...prev, [modalKey]: true }));
  }, []);

  const handleCloseCommissionModal = useCallback((modalKey) => {
    setIsModal((prev) => ({ ...prev, [modalKey]: false }));
  }, []);

  // ============================================================================
  // TABLE COLUMNS CONFIGURATION - Memoized
  // ============================================================================
  const columns = useMemo(
    () => [
      {
        header: "ID",
        accessor: "id",
        render: (row) => (
          <span className="font-medium text-gray-900 dark:text-white">
            #{row.id}
          </span>
        ),
      },
      {
        header: "Scheme Name",
        accessor: "name",
        render: (row) => (
          <div className="font-semibold text-gray-900 dark:text-white">
            {row.name}
          </div>
        ),
      },
      {
        header: "Description",
        accessor: "description",
        render: (row) => (
          <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
            {row.description || "No description"}
          </div>
        ),
      },
      {
        header: "Status",
        accessor: "is_active",
        render: (row, index) => (
          <SchemeTableRow
            scheme={row}
            index={index}
            onToggle={handleToggle}
            renderOnly="status"
          />
        ),
      },
      {
        header: "Creator Role",
        accessor: "created_by_role",
        render: (row) => <SchemeTableRow scheme={row} renderOnly="role" />,
      },
      {
        header: "Owner",
        accessor: "owner_id",
        render: (row) => <SchemeTableRow scheme={row} renderOnly="owner" />,
      },
      {
        header: "Created",
        accessor: "created_at",
        render: (row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {row.created_at
              ? new Date(row.created_at).toLocaleDateString()
              : "N/A"}
          </span>
        ),
      },
      {
        header: "Actions",
        accessor: "actions",
        render: (row) => {
          const hasSchemeAccess = canUserAccessScheme(row);
          const isSuperAdmin =
            userRole === "superadmin" || userRole === "super_admin";

          const permissions = {
            canEdit:
              isSuperAdmin ||
              (hasSchemeAccess && hasSchemePermission("update")),
            canDelete:
              isSuperAdmin ||
              (hasSchemeAccess && hasSchemePermission("delete")),
            canViewCommission:
              isSuperAdmin ||
              (hasSchemeAccess && hasCommissionPermission("read")),
            canManageCommission:
              isSuperAdmin ||
              (hasSchemeAccess && hasCommissionPermission("update")),
          };

          return (
            <SchemeTableRow
              scheme={row}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onViewCommission={openViewCommissionModal}
              {...permissions}
              commissionDropdownOptions={commissionDropdownOptions}
              handleCommissionOptionClick={handleCommissionOptionClick}
              setSelectedCommission={setSelectedCommission}
              renderOnly="actions"
            />
          );
        },
      },
    ],
    [
      handleToggle,
      canUserAccessScheme,
      userRole,
      hasSchemePermission,
      hasCommissionPermission,
      openEditModal,
      handleDelete,
      openViewCommissionModal,
      commissionDropdownOptions,
      handleCommissionOptionClick,
    ]
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial load on mount
  useEffect(() => {
    loadSchemeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload on page change
  useEffect(() => {
    if (currentPage > 1) {
      loadSchemeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Only reload on page change, not on filter change (use Search button)

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-[90vh] overflow-y-auto bg-secondaryOne dark:bg-darkBlue/70 rounded-2xl mx-8 my-4 2xl:max-w-[80%] 2xl:mx-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <div className="p-6">
        {/* Global Error Display */}
        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-700 dark:text-red-400 text-sm font-medium">
              {errors.general}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        <ValidationErrorDisplay errors={errors.validation} className="mb-4" />

        {/* Loading Overlay */}
        {hasAnyLoading() && (
          <div className="fixed inset-0 bg-white/50 bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex flex-col items-center space-y-4">
                <LoadingSpinner size="large" color="primary" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {isOperationLoading("schemes")
                    ? "Loading schemes..."
                    : isOperationLoading("create")
                    ? "Creating scheme..."
                    : isOperationLoading("update")
                    ? "Updating scheme..."
                    : isOperationLoading("delete")
                    ? "Deleting resource..."
                    : isOperationLoading("commission")
                    ? "Processing commission..."
                    : "Processing..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card Container */}
        <div className="bg-white dark:bg-transparent rounded-lg border-l-4 border-blue-500 overflow-visible">
          {/* Header Section with Stats */}
          <SchemeHeader
            userRole={userRole}
            dashboardStats={dashboardStats}
            lastUpdated={lastUpdated}
          />

          {/* Filters Section */}
          <div className="px-6 pb-4">
            <SchemeFilters
              filters={filters}
              handleInputChange={handleInputChange}
              onSearch={loadSchemeData}
              onClear={handleClearFilters}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-6 overflow-visible">
          {/* Table Header */}
          <SchemeTableHeader onAddScheme={openAddModal} userRole={userRole} />

          {/* Paginated Table */}
          <PaginatedTable
            data={filteredData}
            columns={columns}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            totalItems={totalSchemes}
          />
        </div>

        {/* ====================================================================== */}
        {/* MODALS */}
        {/* ====================================================================== */}

        {/* Add/Edit Scheme Modal */}
        {isModal.AddNew && (
          <SuperModal onClose={() => closeModal("AddNew")}>
            <SchemeForm
              editingScheme={editingScheme}
              onSchemeUpdate={loadSchemeData}
              onClose={() => closeModal("AddNew")}
            />
          </SuperModal>
        )}

        {/* View Commission Modal */}
        {isModal.ViewCommision && (
          <SuperModal onClose={() => closeModal("ViewCommision")}>
            <CommissionTable
              title="View Commission"
              data={selectedCommission}
              isLoading={isOperationLoading("commission")}
              onSubmit={() => closeModal("ViewCommision")}
            />
          </SuperModal>
        )}

        {/* Commission Edit Modals */}
        {commissionDropdownOptions.map(
          ({ modalKey, label }) =>
            isModal[modalKey] && (
              <SuperModal key={modalKey} onClose={() => closeModal(modalKey)}>
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
      </div>
    </div>
  );
};
