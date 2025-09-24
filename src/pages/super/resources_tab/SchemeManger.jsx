import { useEffect, useState } from "react";
import { UsersData } from "../../../assets/assets";
import { SuperModal } from "../../../components/utility/SuperModel";
import CommissionTable from "../../../components/super/resource_tab/CommisonTable";
import { CommissionEditableForm } from "../../../components/super/resource_tab/CommissionEditableForm";
import CommissionDropdown from "../../../components/super/resource_tab/CommissionDropdown";
import FilterBar from "../../../components/utility/FilterBar";
import PaginatedTable from "../../../components/utility/PaginatedTable";
import { ToggleButton } from "../../../components/utility/ToggleButton";
import SchemeForm from "../../../components/super/resource_tab/SchmeForm";
import ResourceForm from "../../../components/super/resource_tab/ResourceForm";
import ResourceDetails from "../../../components/super/resource_tab/ResourceDetails";
import { resourceManagementService } from "../../../services/resourceManagementService";
import {
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaUpload,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";

const commissionDropdownOptions = [
  { label: "Mobile Recharge", modalKey: "MobileRecharge" },
  { label: "DTH Recharge", modalKey: "DTHRecharge" },
  { label: "Bill Payments", modalKey: "BillPayments" },
  { label: "AEPS", modalKey: "AEPS" },
];

export const SchemeManager = () => {
  // Loading states
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);

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

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    searchValue: "",
    userId: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalResources: 0,
    totalCategories: 0,
    activeResources: 0,
  });

  const pageSize = 10;

  // ✅ Generic input handler
  const handleInputChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    applyFilters();
    loadResourceData();
  }, [filters]);

  // Load resource management data
  const loadResourceData = async () => {
    try {
      setLoading(true);
      const [resourcesRes, categoriesRes, statsRes] = await Promise.all([
        resourceManagementService.getResources({
          page: currentPage,
          limit: pageSize,
        }),
        resourceManagementService.getCategories(),
        resourceManagementService.getDashboardStats(),
      ]);

      setResources(resourcesRes.data.items || []);
      setCategories(categoriesRes.data || []);
      setDashboardStats(statsRes.data || {});
    } catch (error) {
      console.error("Error loading resource data:", error);
    } finally {
      setLoading(false);
    }
  };

  // filters function
  const applyFilters = () => {
    let data = [...UsersData];

    if (filters.searchValue) {
      data = data.filter((d) =>
        d.name.toLowerCase().includes(String(filters.searchValue).toLowerCase())
      );
    }

    if (filters.userId) {
      data = data.filter((d) =>
        d.userId?.toLowerCase().includes(String(filters.userId).toLowerCase())
      );
    }

    if (filters.status) {
      data = data.filter((d) => d.status.toString() === filters.status);
    }
    setFilteredData(data);
    setCurrentPage(1);
  };

  const handleToggle = (indexInDisplay) => {
    const actualIndex = (currentPage - 1) * pageSize + indexInDisplay;
    const updated = [...filteredData];
    updated[actualIndex].status = !updated[actualIndex].status;
    setFilteredData(updated);
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
        { label: "true", value: "true" },
        { label: "false", value: "false" },
      ],
    },
  ];

  // utility for modal handlings
  const handleCommissionOptionClick = (modalKey) => {
    setIsModal((prev) => ({ ...prev, [modalKey]: true }));
  };

  const openAddModal = () => {
    setEditingScheme(null);
    setSchemeName("");
    setIsModal((prev) => ({ ...prev, AddNew: true }));
  };

  const openEditModal = (entry) => {
    setEditingScheme(entry);
    setSchemeName(entry.name);
    setIsModal((prev) => ({ ...prev, AddNew: true }));
  };

  const openViewCommissionModal = (commission) => {
    setSelectedCommission(commission || {});
    setIsModal((prev) => ({ ...prev, ViewCommision: true }));
  };

  // Resource Management Functions
  const openResourceManager = () => {
    setIsModal((prev) => ({ ...prev, ResourceManager: true }));
    loadResourceData();
  };

  const openCreateResource = () => {
    setSelectedResource(null);
    setIsModal((prev) => ({ ...prev, CreateResource: true }));
  };

  const openViewResource = (resource) => {
    setSelectedResource(resource);
    setIsModal((prev) => ({ ...prev, ViewResource: true }));
  };

  const handleDeleteResource = async (resourceId) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await resourceManagementService.deleteResource(resourceId);
        loadResourceData();
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
    }
  };

  const handleCreateResource = async (resourceData) => {
    try {
      await resourceManagementService.createResource(resourceData);
      setIsModal((prev) => ({ ...prev, CreateResource: false }));
      loadResourceData();
    } catch (error) {
      console.error("Error creating resource:", error);
    }
  };

  // table columns
  const columns = [
    {
      header: "#",
      accessor: "id",
    },
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Status",
      accessor: "status",
      render: (row, idx) => (
        <ToggleButton row={row} onchange={() => handleToggle(idx)} />
      ),
    },
    {
      header: "Action",
      accessor: "action",
      render: (row) => (
        <div className="space-x-2">
          <button className="btn-secondary" onClick={openEditModal}>
            Edit
          </button>
          <button
            className="btn-secondary"
            onClick={() => openViewCommissionModal(row.commission)}
          >
            View Commission
          </button>
          <CommissionDropdown
            commissions={row.commission}
            setSelectedCommission={setSelectedCommission}
            commissionDropdownOptions={commissionDropdownOptions}
            handleCommissionOptionClick={handleCommissionOptionClick}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="h-[90vh] 2xl:max-w-[80%] p-4 mx-8 bg-secondaryOne dark:bg-darkBlue/70 rounded-2xl 2xl:mx-auto text-gray-800 overflow-hidden overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      {/* Header with Resource Management Stats */}
      <div className="my-4 p-4 rounded-md bg-white dark:bg-transparent">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold dark:text-adminOffWhite">
              Scheme & Resource Manager
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage schemes, commissions, and comprehensive resource management
            </p>
          </div>

          {/* Resource Stats Cards */}
          <div className="flex space-x-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center min-w-[80px]">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {dashboardStats.totalResources}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Resources
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center min-w-[80px]">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {dashboardStats.totalCategories}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Categories
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center min-w-[80px]">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {dashboardStats.activeResources}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Active
              </div>
            </div>
          </div>
        </div>

        <FilterBar fields={fields} onSearch={applyFilters} />
      </div>

      <div className="p-6 rounded-md w-full bg-white dark:bg-transparent dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {/* Tab buttons */}
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              Schemes & Commission
            </button>
            <button
              onClick={openResourceManager}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <FaEye className="inline mr-2" />
              Resource Manager
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={openCreateResource}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              New Resource
            </button>
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
            filters={filters}
            onSearch={applyFilters}
            columns={columns}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
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
            setEditingScheme={setEditingScheme}
            filteredData={filteredData}
            setFilteredData={setFilteredData}
            setIsModal={setIsModal}
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
            onSubmit={(service) => {
              console.log("Submit clicked for:", service);
              // maybe call an API to save or just close
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
                onClose={() =>
                  setIsModal((prev) => ({ ...prev, [modalKey]: false }))
                }
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
