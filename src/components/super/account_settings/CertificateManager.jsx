import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Yup Validation Schema
const schema = yup.object().shape({
  cmo: yup.string().required("CMO Name is required"),
  coo: yup.string().required("COO Name is required"),
  securityPin: yup
    .string()
    .matches(/^\d{4,6}$/, "PIN must be 4 to 6 digits")
    .required("Security PIN is required"),
});

const CertificateManager = ({
  initialData,
  onSubmit,
  loading = false,
  error = null,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
    resolver: yupResolver(schema),
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data) => {
    // Transform to snake_case for backend
    const transformedData = {
      cmo: data.cmo,
      coo: data.coo,
      security_pin: data.securityPin,
    };

    if (onSubmit) {
      await onSubmit(transformedData);
    } else {
      console.log("Submitted data:", transformedData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl"
    >
      {/* Error display */}
      {error && (
        <div className="md:col-span-2 lg:col-span-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* CMO */}
      <div>
        <label className="block text-sm mb-1">
          CMO (Chief Marketing Officer)
        </label>
        <input
          type="text"
          placeholder="Enter CMO Name"
          {...register("cmo")}
          className="w-full px-3 py-2 rounded  dark:text-white border border-gray-600"
        />
        <p className="text-sm text-red-500 mt-1">{errors.cmo?.message}</p>
        <h6 className="text-blue-400 mt-1">Certificate</h6>
      </div>

      {/* COO */}
      <div>
        <label className="block text-sm mb-1">
          COO (Chief Operating Officer)
        </label>
        <input
          type="text"
          placeholder="Enter COO Name"
          {...register("coo")}
          className="w-full px-3 py-2 rounded  dark:text-white border border-gray-600"
        />
        <p className="text-sm text-red-500 mt-1">{errors.coo?.message}</p>
        <h6 className="text-blue-400 mt-1">ID Card</h6>
      </div>

      {/* Security PIN */}
      <div>
        <label className="block text-sm mb-1">Security PIN (MPIN)</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength="6"
          placeholder="Enter 4-6 digit PIN"
          {...register("securityPin")}
          className="w-full px-3 py-2 rounded  dark:text-white border border-gray-600"
          onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
        />
        <p className="text-sm text-red-500 mt-1">
          {errors.securityPin?.message}
        </p>
      </div>

      {/* Submit Button */}
      <div className="md:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-secondary text-white rounded hover:bg-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Updating...
            </>
          ) : (
            "Update"
          )}
        </button>
      </div>
    </form>
  );
};

export default CertificateManager;
