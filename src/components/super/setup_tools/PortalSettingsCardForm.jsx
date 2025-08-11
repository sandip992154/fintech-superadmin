import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const PortalSettingsCardForm = ({
  title,
  label,
  placeholder,
  name = "input",
  options = [],
  defaultValue = "",
}) => {
  const validationSchema = z.object({
    [name]: z.string().min(1, `${label} is required`),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      [name]: defaultValue,
    },
  });

  const onSubmit = (data) => {
    alert(`${title}: ${data[name]}`);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col justify-between bg-white dark:text-white p-5 rounded-xl shadow-md w-full h-full dark:bg-darkBlue/80"
    >
      <div className="flex flex-col gap-2 flex-grow">
        <h2 className="text-lg font-semibold">{title}</h2>

        <label className="text-sm dark:text-gray-300">{label}</label>

        {options.length > 0 ? (
          <select
            {...register(name)}
            className="w-full p-2 rounded-md border border-[#2A2D4A] dark:bg-transparent dark:text-white outline-none"
          >
            <option value="" className="dark:bg-darkBlue/80">
              Select {label}
            </option>
            {options.map((opt) => (
              <option key={opt} value={opt} className="dark:bg-darkBlue/80">
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder={placeholder}
            {...register(name)}
            className="w-full p-2 rounded-md border border-[#2A2D4A] dark:bg-transparent dark:text-white outline-none"
          />
        )}

        {touchedFields[name] && errors[name] && (
          <div className="text-red-400 text-sm">{errors[name]?.message}</div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <button
          type="submit"
          className="w-full bg-secondary hover:bg-slate-400 dark:text-white py-2 px-4 rounded-md"
        >
          Update Info
        </button>
      </div>
    </form>
  );
};
