/**
 * Enhanced Member Creation Form Component
 * Optimized form with new fields, validation, and parent selection
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiCreditCard,
  FiUsers,
} from "react-icons/fi";
import { useMemberManagement } from "../../../hooks/useMemberManagement.js";

// Enhanced validation schema
const createMemberSchema = yup.object().shape({
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
    .matches(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian mobile number"
    )
    .required("Phone number is required"),

  mobile: yup
    .string()
    .matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number")
    .nullable(),

  address: yup
    .string()
    .min(10, "Please provide a complete address (minimum 10 characters)")
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
    .required("Shop/Business name is required"),

  company_name: yup
    .string()
    .max(255, "Company name must not exceed 255 characters")
    .nullable(),

  pan_card_number: yup
    .string()
    .matches(
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      "Please enter a valid PAN card number (e.g., ABCDE1234F)"
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

  role_name: yup.string().required("Please select a role"),

  parent_id: yup
    .number()
    .nullable()
    .when("role_name", {
      is: (role) =>
        ["WhiteLabel", "Distributor", "Retailer", "CustomerSupport"].includes(
          role
        ),
      then: yup.number().required("Parent selection is required for this role"),
      otherwise: yup.number().nullable(),
    }),

  scheme: yup.string().nullable(),
});

const EnhancedMemberForm = React.memo(
  ({
    onSubmit,
    onCancel,
    currentUser,
    loading = false,
    schemes = [],
    availableParents = [],
    onRoleChange,
    onFetchParents,
  }) => {
    const [selectedRole, setSelectedRole] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
      register,
      handleSubmit,
      formState: { errors, isValid, touchedFields },
      setValue,
      watch,
      reset,
      trigger,
    } = useForm({
      resolver: yupResolver(createMemberSchema),
      mode: "onChange",
      defaultValues: {
        full_name: "",
        email: "",
        phone: "",
        mobile: "",
        address: "",
        pin_code: "",
        shop_name: "",
        company_name: "",
        pan_card_number: "",
        company_pan_card: "",
        aadhaar_card_number: "",
        role_name: "",
        parent_id: null,
        scheme: "",
      },
    });

    const watchedRole = watch("role_name");

    // Available roles based on current user
    const availableRoles = useMemo(() => {
      if (!currentUser) return [];

      const roleMap = {
        SuperAdmin: [
          "Admin",
          "WhiteLabel",
          "Distributor",
          "Retailer",
          "CustomerSupport",
        ],
        Admin: ["WhiteLabel", "Distributor", "Retailer", "CustomerSupport"],
        WhiteLabel: ["Distributor", "Retailer"],
        Distributor: ["Retailer"],
        Retailer: ["CustomerSupport"],
      };

      return roleMap[currentUser.role] || [];
    }, [currentUser]);

    // Handle role selection change
    const handleRoleChange = useCallback(
      async (e) => {
        const newRole = e.target.value;
        setSelectedRole(newRole);
        setValue("role_name", newRole);
        setValue("parent_id", null); // Reset parent selection

        // Auto-assign parent for Admin role
        if (newRole === "Admin" && currentUser?.role === "SuperAdmin") {
          setValue("parent_id", currentUser.id);
        } else if (newRole && onFetchParents) {
          await onFetchParents(newRole);
        }

        if (onRoleChange) {
          onRoleChange(newRole);
        }

        await trigger("parent_id");
      },
      [setValue, currentUser, onFetchParents, onRoleChange, trigger]
    );

    // Format phone number input
    const handlePhoneInput = useCallback(
      (field) => (e) => {
        let value = e.target.value.replace(/\D/g, "").slice(0, 10);
        setValue(field, value);
        trigger(field);
      },
      [setValue, trigger]
    );

    // Format PAN input
    const handlePanInput = useCallback(
      (field) => (e) => {
        let value = e.target.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 10);
        setValue(field, value);
        trigger(field);
      },
      [setValue, trigger]
    );

    // Handle form submission
    const handleFormSubmit = useCallback(
      async (data) => {
        setIsSubmitting(true);

        try {
          const result = await onSubmit(data);

          if (result.success) {
            toast.success(result.message || "Member created successfully!");
            reset();
            setSelectedRole("");
          } else {
            toast.error(result.message || "Failed to create member");

            // Handle validation errors
            if (result.errors) {
              Object.entries(result.errors).forEach(([field, message]) => {
                toast.error(`${field}: ${message}`);
              });
            }
          }
        } catch (error) {
          toast.error("An unexpected error occurred");
          console.error("Form submission error:", error);
        } finally {
          setIsSubmitting(false);
        }
      },
      [onSubmit, reset]
    );

    // Get field error styling
    const getFieldError = useCallback(
      (fieldName) => {
        return errors[fieldName] && touchedFields[fieldName];
      },
      [errors, touchedFields]
    );

    const getFieldClass = useCallback(
      (fieldName, baseClass = "form-control") => {
        const hasError = getFieldError(fieldName);
        return `${baseClass} ${
          hasError ? "is-invalid" : touchedFields[fieldName] ? "is-valid" : ""
        }`;
      },
      [getFieldError, touchedFields]
    );

    return (
      <div className="enhanced-member-form">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="row g-3">
          {/* Personal Information Section */}
          <div className="col-12">
            <h6 className="section-title">
              <FiUser className="me-2" />
              Personal Information
            </h6>
          </div>

          <div className="col-md-6">
            <label htmlFor="full_name" className="form-label">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              className={getFieldClass("full_name")}
              placeholder="Enter full name"
              {...register("full_name")}
            />
            {errors.full_name && (
              <div className="invalid-feedback">{errors.full_name.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="email" className="form-label">
              Email Address <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <FiMail />
              </span>
              <input
                type="email"
                id="email"
                className={getFieldClass("email")}
                placeholder="Enter email address"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <div className="invalid-feedback d-block">
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="phone" className="form-label">
              Phone Number <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <FiPhone />
              </span>
              <input
                type="tel"
                id="phone"
                className={getFieldClass("phone")}
                placeholder="10-digit mobile number"
                onChange={handlePhoneInput("phone")}
                maxLength={10}
              />
            </div>
            {errors.phone && (
              <div className="invalid-feedback d-block">
                {errors.phone.message}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="mobile" className="form-label">
              Alternative Mobile
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <FiPhone />
              </span>
              <input
                type="tel"
                id="mobile"
                className={getFieldClass("mobile")}
                placeholder="Alternative mobile number"
                onChange={handlePhoneInput("mobile")}
                maxLength={10}
              />
            </div>
            {errors.mobile && (
              <div className="invalid-feedback d-block">
                {errors.mobile.message}
              </div>
            )}
          </div>

          {/* Address Information Section */}
          <div className="col-12">
            <h6 className="section-title">
              <FiMapPin className="me-2" />
              Address Information
            </h6>
          </div>

          <div className="col-md-8">
            <label htmlFor="address" className="form-label">
              Complete Address <span className="text-danger">*</span>
            </label>
            <textarea
              id="address"
              className={getFieldClass("address")}
              placeholder="Enter complete address with city, state"
              rows={3}
              {...register("address")}
            />
            {errors.address && (
              <div className="invalid-feedback">{errors.address.message}</div>
            )}
          </div>

          <div className="col-md-4">
            <label htmlFor="pin_code" className="form-label">
              PIN Code
            </label>
            <input
              type="text"
              id="pin_code"
              className={getFieldClass("pin_code")}
              placeholder="6-digit PIN"
              maxLength={6}
              {...register("pin_code")}
            />
            {errors.pin_code && (
              <div className="invalid-feedback">{errors.pin_code.message}</div>
            )}
          </div>

          {/* Business Information Section */}
          <div className="col-12">
            <h6 className="section-title">
              <FiBuilding className="me-2" />
              Business Information
            </h6>
          </div>

          <div className="col-md-6">
            <label htmlFor="shop_name" className="form-label">
              Shop/Business Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="shop_name"
              className={getFieldClass("shop_name")}
              placeholder="Enter shop or business name"
              {...register("shop_name")}
            />
            {errors.shop_name && (
              <div className="invalid-feedback">{errors.shop_name.message}</div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="company_name" className="form-label">
              Company Name
            </label>
            <input
              type="text"
              id="company_name"
              className={getFieldClass("company_name")}
              placeholder="Enter company name (if applicable)"
              {...register("company_name")}
            />
            {errors.company_name && (
              <div className="invalid-feedback">
                {errors.company_name.message}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="scheme" className="form-label">
              Scheme
            </label>
            <select
              id="scheme"
              className={getFieldClass("scheme", "form-select")}
              {...register("scheme")}
            >
              <option value="">Select Scheme</option>
              {schemes.map((scheme) => (
                <option key={scheme.id || scheme.name} value={scheme.name}>
                  {scheme.name}
                </option>
              ))}
            </select>
            {errors.scheme && (
              <div className="invalid-feedback">{errors.scheme.message}</div>
            )}
          </div>

          {/* KYC Information Section */}
          <div className="col-12">
            <h6 className="section-title">
              <FiCreditCard className="me-2" />
              KYC Information
            </h6>
          </div>

          <div className="col-md-6">
            <label htmlFor="pan_card_number" className="form-label">
              Personal PAN Card
            </label>
            <input
              type="text"
              id="pan_card_number"
              className={getFieldClass("pan_card_number")}
              placeholder="ABCDE1234F"
              maxLength={10}
              onChange={handlePanInput("pan_card_number")}
            />
            {errors.pan_card_number && (
              <div className="invalid-feedback">
                {errors.pan_card_number.message}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="company_pan_card" className="form-label">
              Company PAN Card
            </label>
            <input
              type="text"
              id="company_pan_card"
              className={getFieldClass("company_pan_card")}
              placeholder="ABCDF5678G"
              maxLength={10}
              onChange={handlePanInput("company_pan_card")}
            />
            {errors.company_pan_card && (
              <div className="invalid-feedback">
                {errors.company_pan_card.message}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="aadhaar_card_number" className="form-label">
              Aadhaar Card Number
            </label>
            <input
              type="text"
              id="aadhaar_card_number"
              className={getFieldClass("aadhaar_card_number")}
              placeholder="12-digit Aadhaar number"
              maxLength={12}
              {...register("aadhaar_card_number")}
            />
            {errors.aadhaar_card_number && (
              <div className="invalid-feedback">
                {errors.aadhaar_card_number.message}
              </div>
            )}
          </div>

          {/* Role and Hierarchy Section */}
          <div className="col-12">
            <h6 className="section-title">
              <FiUsers className="me-2" />
              Role & Hierarchy
            </h6>
          </div>

          <div className="col-md-6">
            <label htmlFor="role_name" className="form-label">
              Role <span className="text-danger">*</span>
            </label>
            <select
              id="role_name"
              className={getFieldClass("role_name", "form-select")}
              value={selectedRole}
              onChange={handleRoleChange}
            >
              <option value="">Select Role</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role_name && (
              <div className="invalid-feedback">{errors.role_name.message}</div>
            )}
          </div>

          {selectedRole &&
            [
              "WhiteLabel",
              "Distributor",
              "Retailer",
              "CustomerSupport",
            ].includes(selectedRole) && (
              <div className="col-md-6">
                <label htmlFor="parent_id" className="form-label">
                  Parent {selectedRole === "WhiteLabel" ? "Admin" : "User"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <select
                  id="parent_id"
                  className={getFieldClass("parent_id", "form-select")}
                  {...register("parent_id", { valueAsNumber: true })}
                >
                  <option value="">Select Parent</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} ({parent.user_code}) - {parent.role_name}
                    </option>
                  ))}
                </select>
                {errors.parent_id && (
                  <div className="invalid-feedback">
                    {errors.parent_id.message}
                  </div>
                )}
              </div>
            )}

          {selectedRole === "Admin" && (
            <div className="col-md-6">
              <div className="alert alert-info">
                <small>
                  <strong>Note:</strong> SuperAdmin will be automatically
                  assigned as parent for Admin role.
                </small>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="col-12">
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={isSubmitting || loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isValid || isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating...
                  </>
                ) : (
                  "Create Member"
                )}
              </button>
            </div>
          </div>
        </form>

        <style jsx>{`
          .enhanced-member-form {
            max-width: 100%;
            padding: 1.5rem;
          }

          .section-title {
            color: #495057;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e9ecef;
            font-weight: 600;
          }

          .form-label {
            font-weight: 500;
            color: #212529;
            margin-bottom: 0.5rem;
          }

          .input-group-text {
            background-color: #f8f9fa;
            border-color: #ced4da;
          }

          .is-valid {
            border-color: #198754;
          }

          .is-invalid {
            border-color: #dc3545;
          }

          .alert {
            margin-bottom: 0;
          }

          @media (max-width: 768px) {
            .enhanced-member-form {
              padding: 1rem;
            }

            .section-title {
              font-size: 1rem;
            }
          }
        `}</style>
      </div>
    );
  }
);

EnhancedMemberForm.displayName = "EnhancedMemberForm";

export default EnhancedMemberForm;
