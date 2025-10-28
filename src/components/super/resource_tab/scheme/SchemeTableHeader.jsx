import React from "react";
import { FaPlus } from "react-icons/fa";

/**
 * SchemeTableHeader Component
 * Table header with title, subtitle, and action buttons
 */
export const SchemeTableHeader = ({ onAddScheme }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-sm p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Scheme Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Full administrative control over all schemes
          </p>
        </div>

        <button
          onClick={onAddScheme}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-sm flex items-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <FaPlus className="text-sm" />
          <span>Add Scheme</span>
        </button>
      </div>
    </div>
  );
};
