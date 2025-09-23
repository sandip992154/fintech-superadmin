/**
 * API service for KYC management endpoints
 */
import apiClient from "./apiClient.js";

class KYCManagementService {
  // ===== KYC Document Submission =====

  /**
   * Submit KYC documents
   */
  async submitKYCDocuments(kycData) {
    try {
      const formData = new FormData();

      // Add text fields
      Object.keys(kycData).forEach((key) => {
        if (key !== "documents" && kycData[key]) {
          formData.append(key, kycData[key]);
        }
      });

      // Add file uploads
      if (kycData.documents) {
        Object.keys(kycData.documents).forEach((docType) => {
          if (kycData.documents[docType]) {
            formData.append(
              `documents[${docType}]`,
              kycData.documents[docType]
            );
          }
        });
      }

      const response = await apiClient.post("/kyc/submit-form", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      console.error("Error submitting KYC documents:", error);
      throw error;
    }
  }

  /**
   * Get user's KYC status and documents
   */
  async getKYCStatus(userId = null) {
    const endpoint = userId ? `/kyc/status/${userId}` : "/kyc/status";
    try {
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      throw error;
    }
  }

  // ===== KYC Review (Super Admin Only) =====

  /**
   * Get all KYC applications for management
   */
  async getKYCApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    try {
      const response = await apiClient.get(`/kyc/list/all?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching KYC applications:", error);
      throw error;
    }
  }

  /**
   * Get pending KYC applications for review
   */
  async getPendingKYCApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    try {
      const response = await apiClient.get(`/kyc/list/pending?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching pending KYC applications:", error);
      throw error;
    }
  }

  /**
   * Get specific KYC application details
   */
  async getKYCApplicationDetails(userId) {
    try {
      const response = await apiClient.request(`/api/v1/kyc/review/${userId}`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Error fetching KYC application details:", error);
      throw error;
    }
  }

  /**
   * Approve KYC application
   */
  async approveKYC(userCode, comments = "") {
    try {
      const response = await apiClient.post(`/kyc/${userCode}/verify`, {
        action: "accept",
        rejection_reason: null,
      });
      return response.data;
    } catch (error) {
      console.error("Error approving KYC:", error);
      throw error;
    }
  }

  /**
   * Reject KYC application
   */
  async rejectKYC(userCode, reason) {
    try {
      const response = await apiClient.post(`/kyc/${userCode}/verify`, {
        action: "reject",
        rejection_reason: reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      throw error;
    }
  }

  /**
   * Put KYC application on hold
   */
  async holdKYC(userCode, reason) {
    try {
      const response = await apiClient.post(`/kyc/${userCode}/verify`, {
        action: "hold",
        rejection_reason: reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error putting KYC on hold:", error);
      throw error;
    }
  }

  // ===== KYC Statistics =====

  /**
   * Get KYC statistics and analytics
   */
  async getKYCStats() {
    try {
      const response = await apiClient.request("/api/v1/kyc/stats", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Error fetching KYC stats:", error);
      throw error;
    }
  }

  /**
   * Get KYC applications history
   */
  async getKYCHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    try {
      const response = await apiClient.request(
        `/api/v1/kyc/history?${queryString}`,
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("Error fetching KYC history:", error);
      throw error;
    }
  }
}

export default new KYCManagementService();
