/**
 * Resource Management Integration Test
 * ==================================
 *
 * Simple test component to verify backend API integration
 * and basic functionality of the resource management system.
 */

import React, { useState } from "react";
import { ClipLoader } from "react-spinners";
import { resourceManagementService } from "../../../services/resourceManagementService";
import { FaPlay, FaCheck, FaTimes } from "react-icons/fa";

const ResourceIntegrationTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const tests = [
    {
      name: "Get Categories",
      test: async () => {
        const response = await resourceManagementService.getCategories();
        return { success: true, data: response.data?.length || 0 };
      },
    },
    {
      name: "Get Resources",
      test: async () => {
        const response = await resourceManagementService.getResources({
          limit: 5,
        });
        return { success: true, data: response.data?.items?.length || 0 };
      },
    },
    {
      name: "Get Dashboard Stats",
      test: async () => {
        const response = await resourceManagementService.getDashboardStats();
        return { success: true, data: response.data || {} };
      },
    },
    {
      name: "Test Create Category",
      test: async () => {
        const testCategory = {
          name: "Test Category",
          description: "Test category for integration testing",
          color: "#FF0000",
          is_active: true,
        };
        const response = await resourceManagementService.createCategory(
          testCategory
        );
        return { success: true, data: response.data };
      },
    },
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      try {
        console.log(`Running test: ${test.name}`);
        const result = await test.test();
        results.push({
          name: test.name,
          success: true,
          data: result.data,
          error: null,
        });
      } catch (error) {
        console.error(`Test failed: ${test.name}`, error);
        results.push({
          name: test.name,
          success: false,
          data: null,
          error: error.message,
        });
      }
      setTestResults([...results]);
    }

    setIsRunning(false);
  };

  const TestResult = ({ result }) => (
    <div
      className={`border rounded-lg p-4 ${
        result.success
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center space-x-2">
        {result.success ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
        <span
          className={`font-medium ${
            result.success ? "text-green-900" : "text-red-900"
          }`}
        >
          {result.name}
        </span>
      </div>

      {result.success ? (
        <div className="mt-2 text-sm text-green-700">
          <strong>Success:</strong> {JSON.stringify(result.data, null, 2)}
        </div>
      ) : (
        <div className="mt-2 text-sm text-red-700">
          <strong>Error:</strong> {result.error}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Resource Management Integration Test
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Test backend API integration and verify functionality
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <ClipLoader color="white" size={16} className="mr-2" />
              Running Tests...
            </>
          ) : (
            <>
              <FaPlay className="mr-2" />
              Run Integration Tests
            </>
          )}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Test Results ({testResults.filter((r) => r.success).length}/
            {testResults.length} passed)
          </h3>

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <TestResult key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {!isRunning && testResults.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Click "Run Integration Tests" to test the backend API connection
        </div>
      )}
    </div>
  );
};

export default ResourceIntegrationTest;
