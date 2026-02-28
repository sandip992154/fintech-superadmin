import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";

// Yup validation schema
const schema = yup.object().shape({
  shopName: yup.string().required("Shop name is required"),
  gstNumber: yup
    .string()
    .matches(/^[0-9A-Z]{15}$/, "Invalid GST number")
    .required("GST number is required"),
  aadharNumber: yup
    .string()
    .matches(/^\d{12}$/, "Must be 12 digits")
    .required("Aadhar number is required"),
  panNumber: yup
    .string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number")
    .required("PAN number is required"),
  securityPin: yup
    .string()
    .matches(/^\d{4,6}$/, "PIN must be 4 to 6 digits")
    .required("Security PIN is required"),
  passportPhoto: yup
    .mixed()
    .nullable()
    .notRequired(),
});

const KYCDetails = ({
  initialData,
  onSubmit,
  loading = false,
  error = null,
}) => {
  const [previewUrl, setPreviewUrl] = useState(
    initialData?.passportPhoto || null
  );

  const {
    register,
    handleSubmit,
    setValue,
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
    // Transform field names from camelCase to snake_case for backend
    const transformedData = {
      shop_name: data.shopName,
      gst_number: data.gstNumber,
      aadhar_number: data.aadharNumber,
      pan_number: data.panNumber,
      security_pin: data.securityPin,
    };

    if (onSubmit) {
      await onSubmit(transformedData);
    } else {
      console.log("Form Submitted:", transformedData);
    }
  };

  const handleImagePreview = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setValue("passportPhoto", e.target.files);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      toast.error("Please select a valid image file.");
      setValue("passportPhoto", null);
      setPreviewUrl(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
    >
      {/* Error display */}
      {error && (
        <div className="md:col-span-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Shop Name */}
      <div>
        <label className="block text-sm mb-1">Shop Name</label>
        <input
          {...register("shopName")}
          className="w-full px-3 py-2 rounded  dark:text-white border border-gray-600"
        />
        <p className="text-red-500 text-xs mt-2">{errors.shopName?.message}</p>
      </div>

      {/* GST */}
      <div>
        <label className="block text-sm mb-1">GST Number</label>
        <input
          {...register("gstNumber")}
          className="w-full px-3 py-2 rounded  dark:text-white border border-gray-600"
        />
        <p className="text-red-500 text-xs mt-2">{errors.gstNumber?.message}</p>
      </div>

      {/* Aadhar */}
      <div>
        <label className="block text-sm mb-1">Aadhar Card Number</label>
        <input
          {...register("aadharNumber")}
          inputMode="numeric"
          maxLength="12"
          className="w-full px-3 py-2 rounded  dark:text-white border border-gray-600"
          onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
        />
        <p className="text-red-500 text-xs mt-2">
          {errors.aadharNumber?.message}
        </p>
      </div>

      {/* PAN */}
      <div>
        <label className="block text-sm mb-1">PAN Card Number</label>
        <input
          {...register("panNumber")}
          maxLength="10"
          className="w-full px-3 py-2 rounded uppercase dark:text-white border border-gray-600"
        />
        <p className="text-red-500 text-xs mt-2">{errors.panNumber?.message}</p>
      </div>

      {/* Security PIN */}
      <div>
        <label className="block text-sm mb-1">Security PIN (MPIN)</label>
        <input
          {...register("securityPin")}
          type="password"
          inputMode="numeric"
          maxLength="6"
          placeholder="Enter 4-6 digit PIN"
          className="w-full px-3 py-2 rounded  dark:text-white border border-gray-600"
          onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
        />
        <p className="text-red-500 text-xs mt-2">
          {errors.securityPin?.message}
        </p>
      </div>

      {/* Passport Photo */}
      <div>
        <label className="block text-sm mb-1">Passport Size Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImagePreview}
          className="block text-sm text-gray-300 file:mr-4 file:py-2 file:px-3
              file:rounded file:border-0 file:text-sm file:font-semibold
              file:bg-gray-500 file:text-white hover:file:bg-gray-600"
        />

        {!previewUrl && (
          <div className=" dark:text-white p-4 rounded-md text-sm w-fit">
            <p className="font-semibold text-base">Note :-</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>
                Image will be uploaded only once, Kindly upload the proper image
              </li>
              <li>
                Size: <span className="font-medium">60px X 80px</span> (passport
                size)
              </li>
            </ul>
          </div>
        )}

        {previewUrl && (
          <div className="mt-2 w-24 h-24 rounded border border-gray-400 overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="md:col-span-3">
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
            "Update KYC Details"
          )}
        </button>
      </div>
    </form>
  );
};

export default KYCDetails;
