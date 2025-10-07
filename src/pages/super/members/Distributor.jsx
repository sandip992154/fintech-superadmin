import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import PaginatedTable from "../../../components/utility/PaginatedTable";
import FilterBar from "../../../components/utility/FilterBar";
import { SuperModal } from "../../../components/utility/SuperModel";
import { ToggleButton } from "../../../components/utility/ToggleButton";
import { FiRepeat, FiSettings, FiUserPlus, FiShield } from "react-icons/fi";
import ActionDropdown from "../../../components/utility/ActionDropDown";
import FundActionForm from "../../../components/super/members/utility_components/FundActionForm";
import { CheckBoxPermissionForm } from "../../../components/super/members/utility_components/CheckBoxPermissionForm";
import KycStatusForm from "../../../components/super/members/utility_components/KycManager";
import { Link } from "react-router";
import ProfileSettings from "../../../components/super/members/utility_components/ProfileSettings";
import StockTableForm from "../../../components/super/members/ds/StockTableForm";
import SchemeManager from "../../../components/super/members/ds/SchemeManager";
import { useAuth } from "../../../contexts/AuthContext";

import {
  FiFileText, // For BillPayment
  FiSmartphone, // For Recharge
  FiUserCheck, // For AEPS
  FiSend, // For Money Transfer
  FiCreditCard, // For UTI Pancard
  FiBarChart2, // For Account Statement
  FiDatabase, // For AEPS Wallet
  FiTrendingUp, // For Commission Wallet
} from "react-icons/fi";
import { useMemberManagement } from "../../../hooks/useMemberManagement";
import { toast } from "react-toastify";

export const Distributor = () => {
  // Get current user from auth context
  const { user: currentUser } = useAuth();

  // Refs for performance optimization
  const mountedRef = useRef(true);
  const dataTransformRef = useRef(new Map());

  // Enhanced loading states
  const [initialLoading, setInitialLoading] = useState(true);

  // Early return with loading state if currentUser is not available
  if (!currentUser) {
    return (
      <div className="h-[90vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading user information...
          </p>
        </div>
      </div>
    );
  }

  const {
    members,
    schemes,
    availableParents,
    locationOptions,
    loading,
    actionLoading,
    schemesLoading,
    parentsLoading,
    error,
    actionError,
    clearErrors,
    currentPage,
    totalPages,
    totalMembers,
    pageSize,
    filters,
    updateFilters,
    applyFilters,
    resetFilters,
    fetchMembers,
    fetchSchemes,
    fetchAvailableParents,
    createMember,
    updateMember,
    deleteMember,
    updateMemberStatus,
    updatePage,
    goToPage,
    refreshData,
    bulkUpdateStatus,
    isLoading,
    hasError,
  } = useMemberManagement("distributor", currentUser) || {
    // Fallback object in case hook fails
    members: [],
    schemes: [],
    availableParents: [],
    locationOptions: [],
    loading: false,
    actionLoading: false,
    schemesLoading: false,
    parentsLoading: false,
    error: null,
    actionError: null,
    clearErrors: () => {},
    currentPage: 1,
    totalPages: 1,
    totalMembers: 0,
    pageSize: 20,
    filters: {},
    updateFilters: () => {},
    applyFilters: () => {},
    resetFilters: () => {},
    fetchMembers: async () => {},
    fetchSchemes: async () => {},
    fetchAvailableParents: async () => {},
    createMember: async () => ({
      success: false,
      error: "Service unavailable",
    }),
    updateMember: async () => ({
      success: false,
      error: "Service unavailable",
    }),
    deleteMember: async () => ({
      success: false,
      error: "Service unavailable",
    }),
    updateMemberStatus: async () => ({
      success: false,
      error: "Service unavailable",
    }),
    updatePage: () => {},
    goToPage: () => {},
    refreshData: async () => {},
    bulkUpdateStatus: async () => ({
      success: false,
      error: "Service unavailable",
    }),
    isLoading: false,
    hasError: false,
  };

  // State for enhanced form modal
  const [showEnhancedForm, setShowEnhancedForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Edit modal states
  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced error handling with useCallback
  const handleError = useCallback(
    (error, context = "") => {
      if (!mountedRef.current) return;

      const errorMessage = error?.message || error || "An error occurred";
      console.error(`Distributor component error ${context}:`, error);

      // Show user-friendly error messages
      if (error?.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
      } else if (error?.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else if (error?.response?.status === 404) {
        toast.error("The requested resource was not found.");
      } else if (error?.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(errorMessage);
      }

      clearErrors();
    },
    [clearErrors]
  );

  // Enhanced action handlers with better error handling
  const handleActionWithLoading = useCallback(
    async (action, successMessage, errorContext) => {
      if (!mountedRef.current) return;

      try {
        const result = await action();
        if (result?.success) {
          toast.success(successMessage);
          return result;
        } else {
          handleError(result?.error || "Operation failed", errorContext);
          return result;
        }
      } catch (error) {
        handleError(error, errorContext);
        return { success: false, error };
      }
    },
    [handleError]
  );

  // Initial data fetch effect
  useEffect(() => {
    if (currentUser && mountedRef.current) {
      const initializeData = async () => {
        setInitialLoading(true);
        try {
          // Fetch initial data in parallel
          const promises = [
            fetchMembers({ force: true }).catch((err) => {
              console.warn("Failed to fetch members:", err);
              return null;
            }),
            fetchSchemes().catch((err) => {
              console.warn("Failed to fetch schemes:", err);
              return null;
            }),
            // For Distributor creation, fetch MDS parents created by current user
            fetchAvailableParents("distributor").catch((err) => {
              console.warn("Failed to fetch available parents:", err);
              return null;
            }),
          ];

          await Promise.allSettled(promises);
        } catch (error) {
          console.error("Failed to initialize distributor data:", error);
          handleError(error, "initialization");
        } finally {
          if (mountedRef.current) {
            setInitialLoading(false);
          }
        }
      };

      initializeData();
    }
  }, [
    currentUser,
    fetchMembers,
    fetchSchemes,
    fetchAvailableParents,
    handleError,
  ]);

  // Handle errors with toast notifications
  useEffect(() => {
    if (error) {
      handleError(error, "in hook");
    }
    if (actionError) {
      handleError(actionError, "in action");
    }
  }, [error, actionError, handleError]);

  // Memoized data transformation
  const transformedData = useMemo(() => {
    if (!members || members.length === 0) return [];

    // Use cache to avoid re-transformation of same data
    const cacheKey = JSON.stringify(
      members.map((m) => ({ id: m.id, updated_at: m.updated_at }))
    );
    if (dataTransformRef.current.has(cacheKey)) {
      return dataTransformRef.current.get(cacheKey);
    }

    const transformed = members.map((member) => ({
      id: member.id,
      status: member.is_active,
      date: new Date(member.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      username: member.full_name || "N/A",
      mobile: member.phone || member.phone_number || "N/A",
      email: member.email || "N/A",
      type: member.role_name || member.role || "distributor",
      parentName: member.parent_name || "MDS",
      parentMobile: member.parent_user_code || "MDS",
      parentRole: "MDS",
      registrationDate: new Date(member.created_at).toLocaleDateString("en-GB"),
      website: "nkpay4all.com/",
      mainBalance: member.wallet_balance || 0,
      aepsBalance: member.aeps_balance || 0,
      commission: member.commission_balance || 0,
      md: member.md_stock || 0,
      distributor: member.distributor_stock || 0,
      retailer: member.retailer_stock || 0,
      // Additional fields for profile
      user_code: member.user_code || "",
      scheme_name: member.scheme_name || "N/A",
      state: member.state || "",
      city: member.city || "",
      is_active: member.is_active,
      // Original member data for operations
      originalData: member,
    }));

    // Cache the result
    dataTransformRef.current.set(cacheKey, transformed);
    return transformed;
  }, [members]);

  // Enhanced form handlers with improved error handling
  const handleEnhancedFormSubmit = useCallback(
    async (formData) => {
      const action = editingMember ? "updated" : "created";

      return handleActionWithLoading(
        async () => {
          let result;
          if (editingMember) {
            result = await updateMember(editingMember.id, formData);
          } else {
            result = await createMember(formData);
          }

          if (result.success && mountedRef.current) {
            setShowEnhancedForm(false);
            setEditingMember(null);
            // Refresh data to show updated member
            await refreshData();
          }

          return result;
        },
        `Distributor member ${action} successfully`,
        `form submit ${action}`
      );
    },
    [
      editingMember,
      updateMember,
      createMember,
      refreshData,
      handleActionWithLoading,
    ]
  );

  // Enhanced edit handler
  const handleEdit = useCallback((member) => {
    if (!mountedRef.current) return;
    setEditingMember(member.originalData || member);
    setShowEnhancedForm(true);
  }, []);

  // Enhanced delete handler
  const handleDelete = useCallback(
    async (memberId) => {
      if (!mountedRef.current) return;

      const confirmed = window.confirm(
        "Are you sure you want to delete this distributor member? This action cannot be undone."
      );
      if (!confirmed) return;

      return handleActionWithLoading(
        async () => {
          const result = await deleteMember(memberId);
          if (result.success) {
            await refreshData();
          }
          return result;
        },
        "Distributor member deleted successfully",
        "delete member"
      );
    },
    [deleteMember, refreshData, handleActionWithLoading]
  );

  // Enhanced bulk status update handler
  const handleBulkStatusUpdate = useCallback(
    async (memberIds, newStatus) => {
      return handleActionWithLoading(
        async () => {
          const result = await bulkUpdateStatus(memberIds, newStatus);
          if (result.success) {
            await refreshData();
          }
          return result;
        },
        `Distributor members ${
          newStatus ? "activated" : "deactivated"
        } successfully`,
        "bulk status update"
      );
    },
    [bulkUpdateStatus, refreshData, handleActionWithLoading]
  );

  // Optimized form submission handler
  const handleFormSubmit = useCallback((formData) => {
    console.log("Distributor form submitted:", formData);
    setEditModal(null);
  }, []);

  const handleStockSubmit = useCallback((type, value) => {
    console.log(`Distributor stock submitted [${type}]: ${value}`);
  }, []);

  // Enhanced toggle handler for member status
  const handleToggle = useCallback(
    async (indexInDisplay) => {
      const member = transformedData[indexInDisplay];
      if (!member) return;

      const newStatus = !member.status;

      return handleActionWithLoading(
        async () => {
          const result = await updateMemberStatus(member.id, newStatus);
          if (result.success) {
            await refreshData();
          }
          return result;
        },
        `Distributor member ${
          newStatus ? "activated" : "deactivated"
        } successfully`,
        "toggle member status"
      );
    },
    [transformedData, updateMemberStatus, refreshData, handleActionWithLoading]
  );

  // Enhanced pagination handler
  const handlePageChange = useCallback(
    async (newPage) => {
      if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
        return;
      }

      try {
        await goToPage(newPage);
      } catch (error) {
        handleError(error, "pagination");
      }
    },
    [currentPage, totalPages, goToPage, handleError]
  );

  // Enhanced filter change handler with debouncing
  const handleFilterChange = useCallback(
    (name, value) => {
      updateFilters({ [name]: value });
      // Reset to first page when filters change
      if (currentPage !== 1) {
        updatePage(1);
      }
    },
    [updateFilters, currentPage, updatePage]
  );

  // Enhanced search with loading state
  const handleSearch = useCallback(async () => {
    try {
      await applyFilters();
    } catch (error) {
      handleError(error, "search");
    }
  }, [applyFilters, handleError]);

  // Enhanced reset filters
  const handleResetFilters = useCallback(async () => {
    try {
      await resetFilters();
    } catch (error) {
      handleError(error, "reset filters");
    }
  }, [resetFilters, handleError]);

  // Enhanced export with proper feedback
  const handleExport = useCallback(async () => {
    return handleActionWithLoading(
      async () => {
        const csvContent = [
          [
            "ID",
            "Username",
            "Mobile",
            "Email",
            "Role",
            "Parent",
            "State",
            "City",
            "Status",
            "Main Balance",
            "AEPS Balance",
            "Commission",
            "Registration Date",
          ],
          ...transformedData.map((member) => [
            member.id,
            member.username,
            member.mobile,
            member.email,
            member.type,
            member.parentName,
            member.state,
            member.city,
            member.status ? "Active" : "Inactive",
            member.mainBalance,
            member.aepsBalance,
            member.commission,
            member.registrationDate,
          ]),
        ]
          .map((row) => row.join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `distributor_members_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        return { success: true };
      },
      "Distributor members exported successfully",
      "export"
    );
  }, [transformedData, handleActionWithLoading]);

  // Enhanced refresh with proper feedback
  const handleRefresh = useCallback(async () => {
    return handleActionWithLoading(
      async () => {
        await refreshData();
        return { success: true };
      },
      "Distributor data refreshed successfully",
      "refresh"
    );
  }, [refreshData, handleActionWithLoading]);

  // Optimized edit click handler
  const handleEditClick = useCallback((title, row) => {
    setEditData(row);
    setEditModal(title);
  }, []);

  // Enhanced filter fields configuration with proper data binding
  const fields = useMemo(
    () => [
      {
        name: "fromDate",
        type: "date",
        placeholder: "From Date",
        value: filters.date_from || "",
        onChange: (val) => handleFilterChange("date_from", val),
      },
      {
        name: "toDate",
        type: "date",
        placeholder: "To Date",
        value: filters.date_to || "",
        onChange: (val) => handleFilterChange("date_to", val),
      },
      {
        name: "searchValue",
        type: "text",
        placeholder: "Search Name, Email, Phone, User Code",
        value: filters.search || "",
        onChange: (val) => handleFilterChange("search", val),
      },
      {
        name: "status",
        type: "select",
        placeholder: "Select Status",
        value:
          filters.is_active !== undefined
            ? filters.is_active
              ? "active"
              : "inactive"
            : "",
        onChange: (val) => {
          if (val === "") {
            handleFilterChange("is_active", undefined);
          } else {
            handleFilterChange("is_active", val === "active");
          }
        },
        options: [
          { label: "All Status", value: "" },
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
      {
        name: "scheme",
        type: "select",
        placeholder: "Select Scheme",
        value: filters.scheme || "",
        onChange: (val) => handleFilterChange("scheme", val),
        options: [
          { label: "All Schemes", value: "" },
          ...schemes.map((scheme) => ({
            label: scheme.name || scheme.scheme_name || "Unknown",
            value: scheme.id || scheme.scheme_id || scheme.name,
          })),
        ],
      },
    ],
    [filters, handleFilterChange, schemes]
  );

  // Memoized actions for the dropdown
  const actions = useMemo(
    () => [
      {
        label: "Fund Transfer / Return",
        icon: <FiRepeat />,
        onClick: (row) => handleEditClick("fund_Transfer", row),
      },
      {
        label: "Scheme",
        icon: <FiSettings />,
        onClick: (row) => handleEditClick("Scheme", row),
      },
      {
        label: "Add Id Stock",
        icon: <FiUserPlus />,
        onClick: (row) => handleEditClick("Add_ID_Stock", row),
      },
      {
        label: "Permission",
        icon: <FiShield />,
        onClick: (row) => handleEditClick("Permission", row),
      },
      {
        label: "View Profile",
        icon: <FiUserPlus />,
        onClick: (row) => handleEditClick("View_Profile", row),
      },
      {
        label: "Kyc Manager",
        icon: <FiShield />,
        onClick: (row) => handleEditClick("Kyc_Manager", row),
      },
    ],
    [handleEditClick]
  );

  // Memoized reports for user roles
  const reports = useMemo(
    () => [
      {
        label: "BillPayment",
        icon: <FiFileText />,
        onClick: (row) => handleEditClick("billpayment", row),
      },
      {
        label: "Recharge",
        icon: <FiSmartphone />,
        onClick: (row) => handleEditClick("recharge", row),
      },
      {
        label: "AEPS",
        icon: <FiUserCheck />,
        onClick: (row) => handleEditClick("aeps", row),
      },
      {
        label: "Money Transfer",
        icon: <FiSend />,
        onClick: (row) => handleEditClick("money_transfer", row),
      },
      {
        label: "UTI Pancard",
        icon: <FiCreditCard />,
        onClick: (row) => handleEditClick("uti_pancard", row),
      },
      {
        label: "Account Statement",
        icon: <FiBarChart2 />,
        onClick: (row) => handleEditClick("account_statement", row),
      },
      {
        label: "AEPS Wallet",
        icon: <FiDatabase />,
        onClick: (row) => handleEditClick("aeps_wallet", row),
      },
      {
        label: "Commission Wallet",
        icon: <FiTrendingUp />,
        onClick: (row) => handleEditClick("commission_wallet", row),
      },
    ],
    [handleEditClick]
  );

  // Memoized table columns configuration
  const columns = useMemo(
    () => [
      {
        header: "#",
        accessor: "id",
        render: (row, idx) => (
          <div className="flex flex-col">
            <div className="flex gap-2 items-center">
              <ToggleButton row={row} onchange={() => handleToggle(idx)} />
              <span>{row.id}</span>
            </div>
            <span>{row.date}</span>
          </div>
        ),
      },
      {
        header: "NAME",
        accessor: "name",
        render: (row) => (
          <div className="flex flex-col">
            <span>{row.username}</span>
            <span>{row.mobile}</span>
            <span>{row.type}</span>
          </div>
        ),
      },
      {
        header: "PARENT DETAILS",
        accessor: "parentDetails",
        render: (row) => (
          <div className="flex flex-col">
            <span>{row.parentName}</span>
            <span>{row.parentMobile}</span>
            <span>{row.parentRole}</span>
          </div>
        ),
      },
      {
        header: "COMPANY PROFILE",
        accessor: "companyProfile",
        render: (row) => (
          <div className="flex flex-col">
            <span>{row.registrationDate}</span>
            <span className="text-blue-400">{row.website}</span>
          </div>
        ),
      },
      {
        header: "WALLET DETAILS",
        accessor: "walletDetails",
        render: (row) => (
          <div className="flex flex-col">
            <span>Main : {row.mainBalance} ₹/-</span>
            <span>Aeps : {row.aepsBalance} ₹/-</span>
            <span>Commission : {row.commission} ₹/-</span>
          </div>
        ),
      },
      {
        header: "ID STOCK",
        accessor: "idStock",
        render: (row) => (
          <div className="flex flex-col">
            <span>Md - {row.md}</span>
            <span>Distributor - {row.distributor}</span>
            <span>Retailer - {row.retailer}</span>
          </div>
        ),
      },
      {
        header: "ACTION",
        accessor: "action",
        render: (row) => (
          <div className="flex flex-col gap-2">
            <ActionDropdown items={actions} row={row} />
            <ActionDropdown items={reports} row={row} buttonLabel="Reports" />
          </div>
        ),
      },
    ],
    [actions, reports, handleToggle]
  );

  // Memoized user profile data
  const user = useMemo(
    () => ({
      Profile_Details: {
        name: "BANDARU KISHORE BABU",
        mobile: "7997991899",
        state: "Telangana",
        city: "HYDERABAD",
        gender: "",
        pinCode: "500089",
        email: "support@phonepays.in",
        securityPin: "",
        address: "7-15/62,PLOT NO 62,ROAD NO 4.SI",
      },
      KYC_Profile: {
        shopName: "",
        gstNumber: "",
        aadharNumber: "",
        panNumber: "",
        securityPin: "",
        passportPhoto: "",
      },
      Password_Manager: {
        newPassword: "",
        confirmPassword: "",
        securityPin: "",
      },
      Pin_Manager: {
        newPin: "",
        confirmPin: "",
        otp: "",
      },
      Bank_Details: {
        accountNUmber: "",
        bankName: "",
        ifscCode: "",
        securityPin: "",
      },
      Cetificate_Manager: {
        cmo: "",
        coo: "",
      },
      Role_Manager: {
        membersRole: "",
        securityPin: "",
      },
      Mapping_Manager: {
        parentMember: "",
        securityPin: "",
      },
    }),
    []
  );

  return (
    <div className="h-[90vh] 2xl:max-w-[80%] p-4 mx-8 dark:bg-darkBlue/70 rounded-2xl 2xl:mx-auto text-gray-800 overflow-hidden overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <div className="my-4 p-4 rounded-md bg-white dark:bg-transparent">
        <div className="flex gap-3 justify-between">
          <h2 className="text-2xl font-bold dark:text-adminOffWhite">
            Distributor List {totalMembers > 0 && `(${totalMembers})`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="btn-24 text-adminOffWhite bg-accentRed"
              onClick={handleRefresh}
              disabled={loading || actionLoading}
            >
              {loading || actionLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              className="btn-24 text-adminOffWhite bg-accentGreen"
              onClick={handleExport}
              disabled={actionLoading}
            >
              {actionLoading ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
        <FilterBar
          fields={fields}
          onSearch={handleSearch}
          onReset={handleResetFilters}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="">
          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading distributor members...
            </div>
          )}
          {initialLoading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Initializing data...
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to="create"
            className="px-2 py-1 cursor-pointer bg-accentPurple rounded text-adminOffWhite"
          >
            Create Distributor
          </Link>
        </div>
      </div>

      <PaginatedTable
        data={transformedData}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
        pageSize={pageSize}
      />

      {/* Enhanced Member Form Modal */}
      {showEnhancedForm && (
        <SuperModal onClose={() => setShowEnhancedForm(false)}>
          <UnifiedMemberForm
            initialData={editingMember}
            onSubmit={handleEnhancedFormSubmit}
            onCancel={() => setShowEnhancedForm(false)}
            isEditing={!!editingMember}
            targetRole="distributor"
            availableParents={availableParents}
            schemes={schemes}
            locationOptions={locationOptions}
            loading={actionLoading}
          />
        </SuperModal>
      )}

      {editModal != null && (
        <SuperModal onClose={() => setEditModal(null)}>
          {/* Fund Transfer */}
          {editModal == "fund_Transfer" && (
            <FundActionForm
              onClose={() => setEditModal(null)}
              onSubmit={handleFormSubmit}
            />
          )}

          {/* Scheme Manager */}
          {editModal == "Scheme" && (
            <SchemeManager onClose={() => setEditModal(null)} />
          )}

          {/* Stock table forms */}
          {editModal == "Add_ID_Stock" && (
            <StockTableForm
              onClose={() => setEditModal(null)}
              onSubmitRow={handleStockSubmit}
            />
          )}

          {/* Permissions */}
          {editModal == "Permission" && <CheckBoxPermissionForm />}

          {/* Kyc_Manager */}
          {editModal == "Kyc_Manager" && <KycStatusForm />}
          {editModal == "View_Profile" && <ProfileSettings user={user} />}
        </SuperModal>
      )}
    </div>
  );
};
