import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { toast } from "react-toastify";
import schemeManagementService from "../../../services/schemeManagementService";
import ExcelToJsonWithExcelJS from "../../utility/ExcelToJsonWithExcelJS";
import AEPSSlabManager from "./AEPSSlabManager";
import CommissionImportExport from "./CommissionImportExport";
import { SuperModal } from "../../utility/SuperModel";
import { useRolePermissions } from "../../../hooks/useRolePermissions";

const CommissionEditableForm = memo(
  ({
    serviceKey,
    commission = [],
    onClose,
    setSelectedCommission,
    schemeId = null,
    serviceType = null,
  }) => {
    // Role-based permissions
    const {
      canEditCommissionField,
      commissionFieldRules,
      validateCommissionHierarchy,
      roleInfo,
      hasCommissionPermission,
    } = useRolePermissions();

    // Memoize safe commission to prevent unnecessary re-computations
    const safeCommission = useMemo(
      () => (Array.isArray(commission) ? commission : []),
      [commission]
    );

    // Memoize commission field rules
    const fieldRules = useMemo(
      () => commissionFieldRules || {},
      [commissionFieldRules]
    );

    // Memoize visible columns based on user role
    const visibleColumns = useMemo(() => {
      const allColumns = [
        { key: "admin", label: "Admin" },
        { key: "whitelabel", label: "Whitelabel" },
        { key: "masterdistributor", label: "MD" },
        { key: "distributor", label: "Distributor" },
        { key: "retailer", label: "Retailer" },
        { key: "customer", label: "Customer" },
      ];

      // Show columns that user can edit or view
      return allColumns.filter(
        (col) =>
          canEditCommissionField(col.key) || fieldRules[col.key]?.editable
      );
    }, [canEditCommissionField, fieldRules]);

    // Check if user has permission to edit commissions
    const canEditCommissions = hasCommissionPermission("update");

    // Memoize service type mapping to prevent recreating object on every render
    const serviceTypeMap = useMemo(
      () => ({
        MobileRecharge: "mobile_recharge",
        DTHRecharge: "dth_recharge",
        BillPayments: "bill_payments",
        AEPS: "aeps",
      }),
      []
    );

    const [editableCommission, setEditableCommission] = useState([]);
    const [operators, setOperators] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAEPSSlabs, setShowAEPSSlabs] = useState(false);
    const [showImportExport, setShowImportExport] = useState(false);

    // Memoize mapped service type to prevent recalculation
    const mappedServiceType = useMemo(
      () => serviceTypeMap[serviceKey] || serviceType,
      [serviceKey, serviceType, serviceTypeMap]
    );

    // Load operators for the service type
    useEffect(() => {
      const loadOperators = async () => {
        try {
          setIsLoading(true);
          console.log("Loading operators for service:", mappedServiceType);

          if (!mappedServiceType) {
            console.warn("No service type provided");
            setOperators([]);
            setEditableCommission([]);
            return;
          }

          const operatorsData =
            await schemeManagementService.getOperatorsByService(
              mappedServiceType
            );

          console.log("Loaded operators:", operatorsData);
          setOperators(operatorsData || []);

          // If no commission data provided, create empty commission structure for each operator
          if (!safeCommission || safeCommission.length === 0) {
            const emptyCommissions = (operatorsData || []).map((operator) => ({
              operator_id: operator.id,
              provider: operator.name,
              service_type: mappedServiceType,
              commission_type: "percentage", // Use consistent enum value
              admin: "",
              whitelabel: "",
              masterdistributor: "",
              distributor: "",
              retailer: "",
              customer: "",
              is_active: true,
              // Add slabs for AEPS service
              ...(mappedServiceType === "aeps" && { slabs: [] }),
            }));
            console.log("Created empty commissions:", emptyCommissions);
            setEditableCommission(emptyCommissions);
          } else {
            console.log("Using provided commission data:", safeCommission);
            setEditableCommission(safeCommission);
          }
        } catch (error) {
          console.error("Error loading operators:", error);
          toast.error(
            `Failed to load operators: ${error.message || "Unknown error"}`
          );
          setOperators([]);
          setEditableCommission([]);
        } finally {
          setIsLoading(false);
        }
      };

      if (mappedServiceType) {
        loadOperators();
      } else {
        console.warn("No mapped service type available");
        setIsLoading(false);
      }
    }, [mappedServiceType, safeCommission]);

    // Handle input/select changes - memoized to prevent unnecessary re-renders
    const handleChange = useCallback((index, field, value) => {
      setEditableCommission((prev) =>
        Array.isArray(prev)
          ? prev.map((row, i) =>
              i === index ? { ...row, [field]: value } : row
            )
          : []
      );
    }, []);

    // Handle Excel import completion
    const handleImportComplete = useCallback(
      (importedData) => {
        console.log("Import completed with data:", importedData);

        if (!Array.isArray(importedData) || importedData.length === 0) {
          toast.error("No valid data found in the imported file");
          return;
        }

        try {
          // Map imported data to commission structure
          // ExcelToJsonWithExcelJS uses: provider, type,  admin, whitelable, md, distributor, retailer
          const mappedCommissions = importedData.map((row, index) => {
            // Find matching operator by name (exact match)
            const matchingOperator = operators.find(
              (op) => op.name.toLowerCase() === row.provider?.toLowerCase()
            );

            if (!matchingOperator) {
              console.warn(
                `No matching operator found for provider: ${row.provider}`
              );
            }

            return {
              operator_id: matchingOperator?.id || null,
              provider: row.provider || `Unknown Operator ${index + 1}`,
              service_type: mappedServiceType,
              commission_type:
                row.type === "percentage" || row.type === "Percentage"
                  ? "percentage" // Use consistent enum value
                  : "fixed", // Use consistent enum value
              admin: row.admin || "",
              whitelabel: row.whitelable || "", // Note: ExcelToJsonWithExcelJS uses "whitelable" (typo in original)
              masterdistributor: row.md || "",
              distributor: row.distributor || "",
              retailer: row.retailer || "",
              customer: "",
              is_active: true,
            };
          });

          console.log("Mapped commissions:", mappedCommissions);
          setEditableCommission(mappedCommissions);
          toast.success(
            `Successfully imported ${mappedCommissions.length} commission records`
          );
        } catch (error) {
          console.error("Error processing imported data:", error);
          toast.error("Failed to process imported data");
        }
      },
      [operators, mappedServiceType]
    );

    // Reload operators function for external calls
    const reloadOperators = useCallback(async () => {
      try {
        setIsLoading(true);
        console.log("Reloading operators for service:", mappedServiceType);

        if (!mappedServiceType) {
          console.warn("No service type provided for reload");
          return;
        }

        const operatorsData =
          await schemeManagementService.getOperatorsByService(
            mappedServiceType
          );

        console.log("Reloaded operators:", operatorsData);
        setOperators(operatorsData || []);

        // Update existing commission data with new operators if needed
        if (
          Array.isArray(editableCommission) &&
          editableCommission.length > 0
        ) {
          const updatedCommissions = editableCommission.map((commission) => {
            const matchingOperator = (operatorsData || []).find(
              (op) => op.name === commission.provider
            );
            return {
              ...commission,
              operator_id: matchingOperator?.id || commission.operator_id,
            };
          });
          setEditableCommission(updatedCommissions);
        }

        toast.success("Operators reloaded successfully");
      } catch (error) {
        console.error("Error reloading operators:", error);
        toast.error(
          `Failed to reload operators: ${error.message || "Unknown error"}`
        );
      } finally {
        setIsLoading(false);
      }
    }, [mappedServiceType, editableCommission]);
    const handleSubmit = useCallback(async () => {
      if (!schemeId) {
        toast.error("Scheme ID is required to save commissions");
        return;
      }

      // Ensure schemeId is a valid integer
      const schemeIdInt = parseInt(schemeId);
      if (isNaN(schemeIdInt)) {
        toast.error("Invalid Scheme ID format");
        return;
      }

      // Validate service type
      if (!mappedServiceType) {
        toast.error("Service type is required to save commissions");
        return;
      }

      if (!canEditCommissions) {
        toast.error("You don't have permission to edit commissions");
        return;
      }

      setIsSubmitting(true);

      try {
        // Validate commission data
        const invalidRows = Array.isArray(editableCommission)
          ? editableCommission.filter((row) => {
              const commissionValues = [
                row.admin,
                row.whitelabel,
                row.masterdistributor,
                row.distributor,
                row.retailer,
                row.customer,
              ];
              return commissionValues.some(
                (val) => val !== "" && (isNaN(val) || val < 0)
              );
            })
          : [];

        if (invalidRows.length > 0) {
          toast.error(
            "Please enter valid commission values (positive numbers only)"
          );
          return;
        }

        // Validate commission hierarchy for each row
        const hierarchyViolations = Array.isArray(editableCommission)
          ? editableCommission.filter((row) => {
              const commissionData = {
                admin: parseFloat(row.admin) || 0,
                whitelabel: parseFloat(row.whitelabel) || 0,
                masterdistributor: parseFloat(row.masterdistributor) || 0,
                distributor: parseFloat(row.distributor) || 0,
                retailer: parseFloat(row.retailer) || 0,
                customer: parseFloat(row.customer) || 0,
              };
              return !validateCommissionHierarchy(commissionData);
            })
          : [];

        if (hierarchyViolations.length > 0) {
          toast.error(
            "Commission hierarchy violation: Parent role commission must be greater than or equal to child role commission"
          );
          return;
        }

        // Submit commissions to API
        const commissionsToSubmit = Array.isArray(editableCommission)
          ? editableCommission
              .filter((row) => {
                // Only submit rows with at least one commission value and valid operator
                if (!row.operator_id) {
                  console.warn("Skipping row with missing operator_id:", row);
                  return false;
                }

                const commissionValues = [
                  row.admin,
                  row.whitelabel,
                  row.masterdistributor,
                  row.distributor,
                  row.retailer,
                  row.customer,
                ];
                return commissionValues.some(
                  (val) => val !== "" && !isNaN(val)
                );
              })
              .map((row) => {
                const entry = {
                  operator: row.provider,
                  commission_type:
                    row.commission_type === "percentage" ||
                    row.commission_type === "percent"
                      ? "percentage" // Use schema/database enum value
                      : row.commission_type === "fixed" ||
                        row.commission_type === "flat"
                      ? "fixed" // Use schema/database enum value
                      : row.commission_type || "fixed", // Default to fixed
                  admin: parseFloat(row.admin) || 0,
                  whitelabel: parseFloat(row.whitelabel) || 0,
                  masterdistributor: parseFloat(row.masterdistributor) || 0,
                  distributor: parseFloat(row.distributor) || 0,
                  retailer: parseFloat(row.retailer) || 0,
                  customer: parseFloat(row.customer) || 0,
                };

                console.log(
                  "Processing commission entry for operator:",
                  row.operator_id,
                  {
                    original: row,
                    mapped: entry,
                    serviceType: mappedServiceType,
                  }
                );
                // Only add slabs field for AEPS service
                if (mappedServiceType === "aeps") {
                  entry.slabs = row.slabs || [];
                }

                return entry;
              })
          : [];

        if (commissionsToSubmit.length === 0) {
          toast.error("Please add commission values for at least one operator");
          return;
        }

        // Debug logging
        console.log("Submitting commission data:", {
          scheme_id: schemeIdInt,
          service: mappedServiceType,
          entries: commissionsToSubmit,
          firstEntry: commissionsToSubmit[0],
        });

        // Use bulk create API with correct format
        await schemeManagementService.bulkCreateCommissions({
          scheme_id: schemeIdInt,
          service: mappedServiceType,
          entries: commissionsToSubmit,
        });

        toast.success(
          `${commissionsToSubmit.length} commission(s) saved successfully!`
        );

        // Update parent component
        if (setSelectedCommission) {
          setSelectedCommission(editableCommission);
        }

        onClose(); // close modal
      } catch (error) {
        console.error("Error saving commissions:", error);
        toast.error(error.message || "Failed to save commissions");
      } finally {
        setIsSubmitting(false);
      }
    }, [
      schemeId,
      editableCommission,
      setSelectedCommission,
      onClose,
      mappedServiceType,
    ]);

    // Memoize provider list to prevent unnecessary recalculations
    const providerList = useMemo(
      () =>
        Array.isArray(editableCommission)
          ? editableCommission.map((item) => item.provider)
          : [],
      [editableCommission]
    );

    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-32 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-600">
            Loading operators for {mappedServiceType}...
          </span>
          <span className="text-xs text-gray-400">
            Service Key: {serviceKey}
          </span>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {serviceKey.replace(/([A-Z])/g, " $1").trim()} Commission
                Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set commission rates for each operator. Leave empty fields to
                skip operators.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {mappedServiceType === "aeps" &&
                hasCommissionPermission("update") && (
                  <button
                    type="button"
                    onClick={() => setShowAEPSSlabs(true)}
                    className="btn-secondary text-sm"
                  >
                    AEPS Slabs
                  </button>
                )}
              {hasCommissionPermission("create") && (
                <button
                  type="button"
                  onClick={() => setShowImportExport(true)}
                  className="btn-secondary text-sm"
                >
                  Import/Export
                </button>
              )}
            </div>
          </div>
        </div>

        {/* <ExcelToJsonWithExcelJS
          requiredColumns={[
            "provider",
            "commission_type",
            "admin",
            "whitelabel",
            "masterdistributor",
            "distributor",
            "retailer",
            "customer",
          ]}
          provider={providerList}
          setSelectedCommission={handleImportComplete}
          onDataProcessed={handleImportComplete}
          validProviders={operators.map((op) => op.name)}
        /> */}

        <form className="space-y-4 max-w-full">
          <div className="max-h-[60vh] overflow-y-auto ring-1 ring-gray-700 rounded-md">
            <table className="w-full text-sm table-auto border border-gray-700 border-collapse">
              <thead className="text-gray-400 uppercase bg-darkBlue sticky -top-1 z-10">
                <tr>
                  <th className="py-3 px-4 text-left border border-gray-700">
                    Operator
                  </th>
                  <th className="py-3 px-4 text-left border border-gray-700">
                    Type
                  </th>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className="py-3 px-4 text-left border border-gray-700"
                    >
                      {column.label}
                      {!canEditCommissionField(column.key) && (
                        <span className="ml-1 text-xs text-gray-400">
                          (View Only)
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editableCommission?.map((row, i) => (
                  <tr
                    key={i}
                    className="dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-2 px-4 border border-gray-700 font-medium">
                      {row.provider}
                    </td>
                    <td className="py-2 px-4 border border-gray-700">
                      <select
                        value={row.commission_type || "percentage"}
                        onChange={(e) =>
                          handleChange(i, "commission_type", e.target.value)
                        }
                        className="w-full dark:bg-darkBlue dark:text-white ring-1 ring-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (₹)</option>
                        {serviceKey === "AEPS" && (
                          <option value="slab_based">Slab Based</option>
                        )}
                      </select>
                    </td>
                    {visibleColumns.map((column) => {
                      const canEdit = canEditCommissionField(column.key);
                      const value = row[column.key] || "";

                      return (
                        <td
                          key={column.key}
                          className="py-2 px-4 border border-gray-700"
                        >
                          {canEdit ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={value}
                              onChange={(e) =>
                                handleChange(i, column.key, e.target.value)
                              }
                              className="w-full dark:bg-darkBlue dark:text-white ring-1 ring-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          ) : (
                            <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
                              {value || "0.00"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Array.isArray(editableCommission) &&
            editableCommission.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2">
                  No operators found for this service type.
                </div>
                <div className="text-sm">
                  Service: {mappedServiceType} | Operators Available:{" "}
                  {operators.length}
                </div>
                {operators.length > 0 && (
                  <button
                    onClick={reloadOperators}
                    className="mt-2 text-blue-500 hover:text-blue-700 text-sm underline"
                  >
                    Reload Operators
                  </button>
                )}
              </div>
            )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                !canEditCommissions ||
                isSubmitting ||
                !Array.isArray(editableCommission) ||
                editableCommission.length === 0
              }
              className={`px-6 py-2 rounded-md font-medium text-white ${
                !canEditCommissions ||
                isSubmitting ||
                !Array.isArray(editableCommission) ||
                editableCommission.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#7C5CFC] hover:bg-[#6938EF]"
              }`}
              title={
                !canEditCommissions
                  ? "You don't have permission to edit commissions"
                  : ""
              }
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Commissions"
              )}
            </button>
          </div>
        </form>

        {/* AEPS Slab Manager Modal */}
        {showAEPSSlabs && (
          <SuperModal
            onClose={() => setShowAEPSSlabs(false)}
            className="max-w-6xl"
          >
            <AEPSSlabManager
              commissionId={editableCommission[0]?.id}
              schemeId={schemeId}
              onClose={() => setShowAEPSSlabs(false)}
            />
          </SuperModal>
        )}

        {/* Import/Export Modal */}
        {showImportExport && (
          <SuperModal
            onClose={() => setShowImportExport(false)}
            className="max-w-4xl"
          >
            <CommissionImportExport
              schemeId={schemeId}
              serviceType={mappedServiceType}
              operators={operators}
              onClose={() => setShowImportExport(false)}
              onImportComplete={(importedData) => {
                handleImportComplete(importedData);
                setShowImportExport(false);
              }}
              onReloadNeeded={reloadOperators}
            />
          </SuperModal>
        )}
      </>
    );
  }
);

// Add display name for better debugging
CommissionEditableForm.displayName = "CommissionEditableForm";

export default CommissionEditableForm;
