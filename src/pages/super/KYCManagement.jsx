import React, { useState, useEffect } from "react";
import {
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiUsers,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";
import KYCManagementService from "../../services/kycManagementService";

const KYCManagement = () => {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [kycStats, setKycStats] = useState({});
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchKYCData();
  }, [filter]);

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const [applications, stats] = await Promise.all([
        KYCManagementService.getPendingKYCApplications({ status: filter }),
        KYCManagementService.getKYCStats(),
      ]);

      setPendingApplications(applications.data || []);
      setKycStats(stats.data || {});
    } catch (error) {
      console.error("Error fetching KYC data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (userId) => {
    try {
      const response = await KYCManagementService.getKYCApplicationDetails(
        userId
      );
      setSelectedApplication(response.data);
    } catch (error) {
      console.error("Error fetching application details:", error);
    }
  };

  const handleApproveKYC = async (userId, comments = "") => {
    try {
      setActionLoading(true);
      await KYCManagementService.approveKYC(userId, comments);

      // Update the applications list
      setPendingApplications((prev) =>
        prev.map((app) =>
          app.user_id === userId ? { ...app, kyc_status: "approved" } : app
        )
      );

      setSelectedApplication(null);
      fetchKYCData(); // Refresh data
    } catch (error) {
      console.error("Error approving KYC:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKYC = async (userId, reason) => {
    try {
      setActionLoading(true);
      await KYCManagementService.rejectKYC(userId, reason);

      // Update the applications list
      setPendingApplications((prev) =>
        prev.map((app) =>
          app.user_id === userId ? { ...app, kyc_status: "rejected" } : app
        )
      );

      setSelectedApplication(null);
      fetchKYCData(); // Refresh data
    } catch (error) {
      console.error("Error rejecting KYC:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-100",
      under_review: "text-blue-600 bg-blue-100",
      approved: "text-green-600 bg-green-100",
      rejected: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  const filteredApplications = pendingApplications.filter(
    (app) =>
      app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          KYC Management
        </h1>
        <p className="text-gray-600">Review and approve KYC applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {kycStats.pending || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {kycStats.approved || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiX className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {kycStats.rejected || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {kycStats.total || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-4">
            {["pending", "under_review", "approved", "rejected"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              )
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FiUsers className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.user_code} • {application.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          application.kyc_status
                        )}`}
                      >
                        {application.kyc_status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          handleViewApplication(application.user_id)
                        }
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      {application.kyc_status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleApproveKYC(application.user_id)
                            }
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            <FiCheck className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleRejectKYC(
                                application.user_id,
                                "Documents need review"
                              )
                            }
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  KYC Application Details
                </h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Personal Information
                  </h4>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-sm font-medium">
                        {selectedApplication.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium">
                        {selectedApplication.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">Documents</h4>
                  <div className="mt-2 space-y-2">
                    {selectedApplication.documents &&
                      Object.entries(selectedApplication.documents).map(
                        ([docType, docUrl]) => (
                          <div
                            key={docType}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm capitalize">
                              {docType.replace("_", " ")}
                            </span>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FiFileText className="h-4 w-4" />
                            </a>
                          </div>
                        )
                      )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                  {selectedApplication.kyc_status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleRejectKYC(
                            selectedApplication.user_id,
                            "Documents need review"
                          )
                        }
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() =>
                          handleApproveKYC(selectedApplication.user_id)
                        }
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;
