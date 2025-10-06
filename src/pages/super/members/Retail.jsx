import { useState, useEffect } from "react";
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
import SchemeManager from "../../../components/super/members/retailer/SchemeManager";

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

export const Retail = () => {
  // Use the member management hook with retailer role
  const {
    members,
    loading,
    actionLoading,
    error,
    actionError,
    clearErrors,
    totalMembers,
    updateMemberStatus,
    exportMembers,
    refresh,
    applyFilters: applyMemberFilters,
  } = useMemberManagement("retailer");

  // Local state for UI
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    searchValue: "",
    userId: "",
    status: "",
    product: "",
  });

  const [filteredData, setFilteredData] = useState([]);
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const pageSize = 10;
  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState(null);

  // Handle errors with toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearErrors();
    }
    if (actionError) {
      toast.error(actionError);
      clearErrors();
    }
  }, [error, actionError, clearErrors]);

  // Transform API data to match existing component structure
  useEffect(() => {
    if (members && members.length > 0) {
      const transformedData = members.map((member) => ({
        id: member.id,
        status: member.status,
        date: new Date(member.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        username: member.full_name,
        mobile: member.phone_number,
        email: member.email,
        type: member.role,
        parentName: member.parent_name,
        parentMobile: member.parent_user_code,
        parentRole: "Distributor",
        registrationDate: new Date(member.created_at).toLocaleDateString(
          "en-GB"
        ),
        website: "nkpay4all.com/",
        mainBalance: member.wallet_balance || 0,
        aepsBalance: member.aeps_balance || 0,
        commission: 0.2,
        retailer: 1,
        user_code: member.user_code,
        scheme_name: member.scheme_name,
        state: member.state,
        city: member.city,
      }));
      setFilteredData(transformedData);
    }
  }, [members]);

  const handleInputChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    let filtered = [...filteredData];

    if (filters.userId) {
      filtered = filtered.filter(
        (d) =>
          String(d.id).includes(String(filters.userId)) ||
          d.user_code?.toLowerCase().includes(filters.userId.toLowerCase())
      );
    }

    if (filters.searchValue) {
      const val = filters.searchValue.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.username?.toLowerCase().includes(val) ||
          d.mobile?.includes(val) ||
          d.email?.toLowerCase().includes(val)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((d) =>
        filters.status === "active" ? d.status : !d.status
      );
    }

    const apiFilters = {};
    if (filters.fromDate) apiFilters.fromDate = filters.fromDate;
    if (filters.toDate) apiFilters.toDate = filters.toDate;

    if (apiFilters.fromDate || apiFilters.toDate) {
      applyMemberFilters(apiFilters);
    }

    setFilteredData(filtered);
    setLocalCurrentPage(1);
    return filtered;
  };

  const handleToggle = async (indexInDisplay) => {
    const actualIndex = (localCurrentPage - 1) * pageSize + indexInDisplay;
    const memberData = filteredData[actualIndex];

    if (!memberData) return;

    const newStatus = !memberData.status;

    try {
      const result = await updateMemberStatus(memberData.id, newStatus);
      if (result.success) {
        const updated = [...filteredData];
        updated[actualIndex].status = newStatus;
        setFilteredData(updated);
        toast.success(
          `Retailer member ${
            newStatus ? "activated" : "deactivated"
          } successfully`
        );
      } else {
        toast.error(result.error || "Failed to update member status");
      }
    } catch (error) {
      toast.error("Failed to update member status");
    }
  };

  const handleEditClick = (title, row) => {
    setEditData(row);
    setEditModal(title);
  };

  const handleFormSubmit = (formData) => {
    console.log("Edited Data:", formData);
    setEditModal(null);
  };

  const handleExport = async () => {
    try {
      const result = await exportMembers("excel");
      if (result.success) {
        toast.success("Export completed successfully");
      } else {
        toast.error(result.error || "Export failed");
      }
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  const fields = [
    {
      name: "fromDate",
      type: "date",
      placeholder: "From Date",
      value: filters.fromDate || "",
      onChange: (val) => handleInputChange("fromDate", val),
    },
    {
      name: "toDate",
      type: "date",
      placeholder: "To Date",
      value: filters.toDate || "",
      onChange: (val) => handleInputChange("toDate", val),
    },
    {
      name: "searchValue",
      type: "text",
      placeholder: "Search Value",
      value: filters.searchValue || "",
      onChange: (val) => handleInputChange("searchValue", val),
    },
    {
      name: "userId",
      type: "text",
      placeholder: "Agent/Parent",
      value: filters.userId || "",
      onChange: (val) => handleInputChange("userId", val),
    },
    {
      name: "status",
      type: "select",
      placeholder: "Select Status",
      value: filters.status || "",
      onChange: (val) => handleInputChange("status", val),
      options: [
        { label: "Select Status", value: "" },
        { label: "Active", value: "active" },
        { label: "Block", value: "block" },
      ],
    },
  ];

  const actions = [
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
  ];

  const reports = [
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
  ];

  const columns = [
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
      header: "ACTION",
      accessor: "action",
      render: (row) => (
        <div className="flex flex-col gap-2">
          <ActionDropdown items={actions} row={row} />
          <ActionDropdown items={reports} row={row} buttonLabel="Reports" />
        </div>
      ),
    },
  ];

  const user = {
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
  };

  return (
    <div className="h-[90vh] 2xl:max-w-[80%] p-4 mx-8 dark:bg-darkBlue/70 rounded-2xl 2xl:mx-auto text-gray-800 overflow-hidden overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <div className="my-4 p-4 rounded-md bg-white dark:bg-transparent">
        <div className="flex gap-3 justify-between">
          <h2 className="text-2xl font-bold dark:text-adminOffWhite">
            Retailer List {totalMembers > 0 && `(${totalMembers})`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="btn-24 text-adminOffWhite bg-accentRed"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              className="btn-24 text-adminOffWhite bg-accentBlue"
              onClick={handleExport}
              disabled={actionLoading}
            >
              {actionLoading ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
        <FilterBar fields={fields} onSearch={applyFilters} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="">
          {loading && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading retailer members...
            </div>
          )}
        </div>
        <Link to="create" className="btn-24 bg-accentGreen">
          Add New
        </Link>
      </div>

      <PaginatedTable
        data={filteredData}
        filters={filters}
        onSearch={applyFilters}
        columns={columns}
        currentPage={localCurrentPage}
        setCurrentPage={setLocalCurrentPage}
        pageSize={pageSize}
      />

      {editModal != null && (
        <SuperModal onClose={() => setEditModal(null)}>
          {editModal == "fund_Transfer" && (
            <FundActionForm
              onClose={() => setEditModal(null)}
              onSubmit={handleFormSubmit}
            />
          )}

          {editModal == "Scheme" && (
            <SchemeManager onClose={() => setEditModal(null)} />
          )}

          {editModal == "Permission" && <CheckBoxPermissionForm />}

          {editModal == "Kyc_Manager" && <KycStatusForm />}
          {editModal == "View_Profile" && <ProfileSettings user={user} />}
        </SuperModal>
      )}
    </div>
  );
};
