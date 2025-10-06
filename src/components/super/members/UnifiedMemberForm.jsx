/**
 * Unified Member Creation Form Component - Fixed Version
 * Light theme, proper scrolling, backend-compatible fields
 */
import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router";
import { useMemberManagement } from "../../../hooks/useMemberManagement";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiCreditCard,
  FiUsers,
  FiArrowLeft,
} from "react-icons/fi";

// Backend-compatible validation schema
const createValidationSchema = (memberType) => {
  const baseSchema = {
    full_name: yup
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .required("Full name is required"),
    email: yup
      .string()
      .email("Please enter a valid email address")
      .required("Email is required"),
    phone: yup
      .string()
      .matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number")
      .required("Phone number is required"),
    mobile: yup
      .string()
      .matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number")
      .nullable(),
    address: yup
      .string()
      .min(10, "Please provide a complete address")
      .max(500, "Address must not exceed 500 characters")
      .required("Address is required"),
    pin_code: yup
      .string()
      .matches(/^\d{6}$/, "Please enter a valid 6-digit PIN code")
      .nullable(),
    shop_name: yup
      .string()
      .min(2, "Shop name must be at least 2 characters")
      .max(255, "Shop name must not exceed 255 characters")
      .required("Shop name is required"),
    company_name: yup
      .string()
      .max(255, "Company name must not exceed 255 characters")
      .nullable(),
    scheme: yup.string().required("Please select a scheme"),
    pan_card_number: yup
      .string()
      .matches(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "Please enter a valid PAN card number"
      )
      .nullable(),
    company_pan_card: yup
      .string()
      .matches(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        "Please enter a valid company PAN card number"
      )
      .nullable(),
    aadhaar_card_number: yup
      .string()
      .matches(/^\d{12}$/, "Please enter a valid 12-digit Aadhaar number")
      .nullable(),
    parent_id:
      memberType === "admin"
        ? yup.number().nullable()
        : yup.number().required("Parent selection is required"),
    role_name: yup.string().required("Role is required"),
  };

  return yup.object().shape(baseSchema);
};

// Member type configurations
const memberTypeConfig = {
  admin: {
    title: "Create Admin",
    role: "admin",
    backRoute: "/super/members/admin",
    color: "bg-blue-600 hover:bg-blue-700",
    icon: FiUser,
    showCompanyFields: true,
  },
  whitelabel: {
    title: "Create White Label",
    role: "whitelabel",
    backRoute: "/super/members/whitelabel",
    color: "bg-purple-600 hover:bg-purple-700",
    icon: FiBriefcase,
    showCompanyFields: true,
  },
  mds: {
    title: "Create MDS",
    role: "mds",
    backRoute: "/super/members/mds",
    color: "bg-blue-600 hover:bg-blue-700",
    icon: FiUsers,
    showCompanyFields: false,
  },
  retailer: {
    title: "Create Retailer",
    role: "retailer",
    backRoute: "/super/members/ds",
    color: "bg-green-600 hover:bg-green-700",
    icon: FiBriefcase,
    showCompanyFields: false,
  },
  customer: {
    title: "Create Customer",
    role: "customer",
    backRoute: "/super/members/retailer",
    color: "bg-orange-600 hover:bg-orange-700",
    icon: FiUser,
    showCompanyFields: false,
  },
};

const UnifiedMemberForm = ({ memberType = "admin", onSubmit }) => {
  const navigate = useNavigate();
  const config = memberTypeConfig[memberType];
  const schema = useMemo(
    () => createValidationSchema(memberType),
    [memberType]
  );

  // Get member management functionality
  const {
    schemes,
    schemesLoading,
    availableParents,
    parentsLoading,
    fetchAvailableParents,
    createMember,
    actionLoading,
    error,
    clearErrors,
  } = useMemberManagement(memberType);

  // Local state
  const [submitError, setSubmitError] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      mobile: "",
      address: "",
      pin_code: "",
      shop_name: "",
      company_name: "",
      scheme: "",
      pan_card_number: "",
      company_pan_card: "",
      aadhaar_card_number: "",
      parent_id: null,
      role_name: config.role,
    },
  });

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsInitialLoading(true);
        // Load schemes and other data
        clearErrors();

        // Fetch available parents for non-admin roles
        if (memberType !== "admin") {
          await fetchAvailableParents(config.role);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setSubmitError(
          "Failed to load form data. Please refresh and try again."
        );
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, [clearErrors, fetchAvailableParents, memberType, config.role]);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      setSubmitError(null);

      // Prepare data for backend
      const memberData = {
        ...formData,
        role_name: config.role,
        // Convert empty strings to null for optional fields
        mobile: formData.mobile || null,
        pin_code: formData.pin_code || null,
        company_name: formData.company_name || null,
        pan_card_number: formData.pan_card_number || null,
        company_pan_card: formData.company_pan_card || null,
        aadhaar_card_number: formData.aadhaar_card_number || null,
        // For Admin, parent_id will be automatically determined by backend (SuperAdmin)
        // For other roles, use selected parent_id
        parent_id: memberType === "admin" ? null : formData.parent_id || null,
      };

      const result = await createMember(memberData);

      if (result.success) {
        toast.success(`${config.title} created successfully!`);
        reset();
        if (onSubmit) onSubmit(result.data);
      } else {
        const errorMessage = result.error || `Failed to create ${memberType}`;
        setSubmitError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(`Error creating ${memberType}:`, error);
      const errorMessage = error.message || `Failed to create ${memberType}`;
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Common input styles for light theme
  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";
  const errorClass = "text-red-600 text-sm mt-1";

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[90vh] bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 min-h-full">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${config.color}`}>
                  <config.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {config.title}
                  </h1>
                  <p className="text-gray-600">
                    Fill in the details to create a new {memberType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-600">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800 text-sm">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiUser className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className={labelClass}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("full_name")}
                    className={inputClass}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && (
                    <p className={errorClass}>{errors.full_name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className={inputClass}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className={errorClass}>{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    className={inputClass}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                  />
                  {errors.phone && (
                    <p className={errorClass}>{errors.phone.message}</p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className={labelClass}>Mobile Number</label>
                  <input
                    type="tel"
                    {...register("mobile")}
                    className={inputClass}
                    placeholder="Enter alternative mobile number"
                    maxLength="10"
                  />
                  {errors.mobile && (
                    <p className={errorClass}>{errors.mobile.message}</p>
                  )}
                </div>

                {/* Shop Name */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Shop/Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("shop_name")}
                    className={inputClass}
                    placeholder="Enter shop or business name"
                  />
                  {errors.shop_name && (
                    <p className={errorClass}>{errors.shop_name.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiMapPin className="w-5 h-5 mr-2 text-blue-600" />
                Address Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("address")}
                    className={inputClass}
                    placeholder="Enter complete address"
                    rows="3"
                  />
                  {errors.address && (
                    <p className={errorClass}>{errors.address.message}</p>
                  )}
                </div>

                {/* PIN Code */}
                <div>
                  <label className={labelClass}>PIN Code</label>
                  <input
                    type="text"
                    {...register("pin_code")}
                    className={inputClass}
                    placeholder="Enter 6-digit PIN code"
                    maxLength="6"
                  />
                  {errors.pin_code && (
                    <p className={errorClass}>{errors.pin_code.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Information (for admin and whitelabel) */}
          {config.showCompanyFields && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FiBriefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Company Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Name */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>Company Name</label>
                    <input
                      type="text"
                      {...register("company_name")}
                      className={inputClass}
                      placeholder="Enter company name"
                    />
                    {errors.company_name && (
                      <p className={errorClass}>
                        {errors.company_name.message}
                      </p>
                    )}
                  </div>

                  {/* Company PAN */}
                  <div>
                    <label className={labelClass}>Company PAN Card</label>
                    <input
                      type="text"
                      {...register("company_pan_card")}
                      className={inputClass}
                      placeholder="Enter company PAN card"
                      maxLength="10"
                      style={{ textTransform: "uppercase" }}
                    />
                    {errors.company_pan_card && (
                      <p className={errorClass}>
                        {errors.company_pan_card.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FiCreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Document Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PAN Card */}
                <div>
                  <label className={labelClass}>PAN Card Number</label>
                  <input
                    type="text"
                    {...register("pan_card_number")}
                    className={inputClass}
                    placeholder="Enter PAN card number"
                    maxLength="10"
                    style={{ textTransform: "uppercase" }}
                  />
                  {errors.pan_card_number && (
                    <p className={errorClass}>
                      {errors.pan_card_number.message}
                    </p>
                  )}
                </div>

                {/* Aadhaar Card */}
                <div>
                  <label className={labelClass}>Aadhaar Card Number</label>
                  <input
                    type="text"
                    {...register("aadhaar_card_number")}
                    className={inputClass}
                    placeholder="Enter Aadhaar card number"
                    maxLength="12"
                  />
                  {errors.aadhaar_card_number && (
                    <p className={errorClass}>
                      {errors.aadhaar_card_number.message}
                    </p>
                  )}
                </div>

                {/* Scheme */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Scheme <span className="text-red-500">*</span>
                  </label>
                  <select {...register("scheme")} className={inputClass}>
                    <option value="">Select Scheme</option>
                    {schemes.map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </option>
                    ))}
                  </select>
                  {errors.scheme && (
                    <p className={errorClass}>{errors.scheme.message}</p>
                  )}
                </div>

                {/* Parent Selection */}
                {memberType !== "admin" ? (
                  // Show parent dropdown for non-admin roles
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Parent/Supervisor{" "}
                      {memberType === "whitelabel" || memberType === "mds" ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        ""
                      )}
                    </label>
                    <select
                      {...register("parent_id")}
                      className={inputClass}
                      disabled={parentsLoading}
                    >
                      <option value="">
                        {parentsLoading
                          ? "Loading parents..."
                          : "Select Parent"}
                      </option>
                      {availableParents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name} ({parent.user_code}) -{" "}
                          {parent.role_name}
                        </option>
                      ))}
                    </select>
                    {errors.parent_id && (
                      <p className={errorClass}>{errors.parent_id.message}</p>
                    )}
                  </div>
                ) : (
                  // Show note for admin users
                  <div className="md:col-span-2">
                    <label className={labelClass}>Parent Assignment</label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Automatic Assignment:</strong> SuperAdmin will
                        be automatically assigned as the parent for this Admin
                        user.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={`px-6 py-3 ${config.color} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                `Create ${config.title.replace("Create ", "")}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedMemberForm;
