/**
 * Role Hierarchy Utilities for Frontend
 * Mirrors the backend role hierarchy system for consistent permission handling
 */

// Role hierarchy mapping (same as backend)
export const ROLE_HIERARCHY = {
  super_admin: 0,
  superadmin: 0, // Alias for super_admin
  admin: 1,
  whitelabel: 2,
  mds: 3,
  masterdistributor: 3, // Alias for mds
  distributor: 4,
  retailer: 5,
  customer: 6,
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  super_admin: "Super Admin",
  superadmin: "Super Admin",
  admin: "Admin",
  whitelabel: "Whitelabel",
  mds: "Master Distributor",
  masterdistributor: "Master Distributor",
  distributor: "Distributor",
  retailer: "Retailer",
  customer: "Customer",
};

// Commission editable fields by role
export const COMMISSION_EDITABLE_FIELDS = {
  super_admin: [
    "superadmin",
    "admin",
    "whitelabel",
    "masterdistributor",
    "distributor",
    "retailer",
    "customer",
  ],
  superadmin: [
    "superadmin",
    "admin",
    "whitelabel",
    "masterdistributor",
    "distributor",
    "retailer",
    "customer",
  ],
  admin: [
    "superadmin",
    "admin",
    "whitelabel",
    "masterdistributor",
    "distributor",
    "retailer",
    "customer",
  ],
  whitelabel: ["masterdistributor", "distributor", "retailer", "customer"],
  mds: [],
  masterdistributor: [],
  distributor: [],
  retailer: [],
  customer: [],
};

export class RoleHierarchyUtils {
  /**
   * Get role level from hierarchy
   * @param {string} role - Role name
   * @returns {number} Role level (0 = highest, 6 = lowest)
   */
  static getRoleLevel(role) {
    const normalizedRole = role?.toLowerCase();
    return ROLE_HIERARCHY[normalizedRole] ?? 999;
  }

  /**
   * Check if user role can manage target role
   * @param {string} userRole - User's role
   * @param {string} targetRole - Target role to manage
   * @returns {boolean} True if user can manage target role
   */
  static canManageRole(userRole, targetRole) {
    const userLevel = this.getRoleLevel(userRole);
    const targetLevel = this.getRoleLevel(targetRole);
    return userLevel < targetLevel;
  }

  /**
   * Get roles that user can manage (downstream roles)
   * @param {string} userRole - User's role
   * @returns {string[]} Array of manageable roles
   */
  static getManageableRoles(userRole) {
    const userLevel = this.getRoleLevel(userRole);
    return Object.keys(ROLE_HIERARCHY).filter(
      (role) => ROLE_HIERARCHY[role] > userLevel
    );
  }

  /**
   * Check if user has scheme permissions
   * @param {string} userRole - User's role
   * @param {string} action - Action (create, read, update, delete)
   * @returns {boolean} True if user has permission
   */
  static hasSchemePermission(userRole, action) {
    const userLevel = this.getRoleLevel(userRole);

    switch (action) {
      case "create":
      case "update":
      case "delete":
        return userLevel <= 2; // super_admin, admin, whitelabel
      case "read":
        return true; // All roles can read
      default:
        return false;
    }
  }

  /**
   * Check if user has commission permissions
   * @param {string} userRole - User's role
   * @param {string} action - Action (create, read, update, delete)
   * @returns {boolean} True if user has permission
   */
  static hasCommissionPermission(userRole, action) {
    const userLevel = this.getRoleLevel(userRole);

    switch (action) {
      case "create":
      case "update":
        return userLevel <= 2; // super_admin, admin, whitelabel
      case "delete":
        return userLevel <= 1; // super_admin, admin only
      case "read":
        return true; // All roles can read
      default:
        return false;
    }
  }

  /**
   * Get editable commission fields for user role
   * @param {string} userRole - User's role
   * @returns {string[]} Array of editable commission fields
   */
  static getEditableCommissionFields(userRole) {
    const normalizedRole = userRole?.toLowerCase();
    return COMMISSION_EDITABLE_FIELDS[normalizedRole] || [];
  }

  /**
   * Check if user can edit specific commission field
   * @param {string} userRole - User's role
   * @param {string} field - Commission field name
   * @returns {boolean} True if user can edit the field
   */
  static canEditCommissionField(userRole, field) {
    const editableFields = this.getEditableCommissionFields(userRole);
    return editableFields.includes(field);
  }

  /**
   * Validate commission hierarchy (parent >= child)
   * @param {Object} commissionData - Commission data object
   * @returns {boolean} True if hierarchy is valid
   */
  static validateCommissionHierarchy(commissionData) {
    const hierarchy = [
      commissionData.admin || 0,
      commissionData.whitelabel || 0,
      commissionData.masterdistributor || 0,
      commissionData.distributor || 0,
      commissionData.retailer || 0,
      commissionData.customer || 0,
    ];

    // Check that each parent role commission >= child role commission
    for (let i = 0; i < hierarchy.length - 1; i++) {
      if (hierarchy[i] < hierarchy[i + 1]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get role display name
   * @param {string} role - Role name
   * @returns {string} Display name for role
   */
  static getRoleDisplayName(role) {
    const normalizedRole = role?.toLowerCase();
    return ROLE_DISPLAY_NAMES[normalizedRole] || role;
  }

  /**
   * Check if user can access scheme based on ownership
   * @param {Object} user - User object with role and id
   * @param {Object} scheme - Scheme object with owner info
   * @returns {boolean} True if user can access scheme
   */
  static canAccessScheme(user, scheme) {
    if (!user || !scheme) return false;

    // Owner always has access
    if (scheme.owner_id === user.id) return true;

    // Check if scheme is shared with user
    if (scheme.shared_with && Array.isArray(scheme.shared_with)) {
      const sharedWithUser = scheme.shared_with.find(
        (share) => share.user_id === user.id
      );
      if (sharedWithUser) return true;
    }

    // Higher roles can access lower role schemes
    const userLevel = this.getRoleLevel(user.role?.name || user.role);
    const schemeOwnerLevel = this.getRoleLevel(
      scheme.owner?.role?.name || scheme.owner_role
    );

    return userLevel < schemeOwnerLevel;
  }

  /**
   * Filter schemes based on user permissions
   * @param {Array} schemes - Array of scheme objects
   * @param {Object} user - User object
   * @returns {Array} Filtered schemes user can access
   */
  static filterAccessibleSchemes(schemes, user) {
    if (!Array.isArray(schemes) || !user) return [];

    return schemes.filter((scheme) => this.canAccessScheme(user, scheme));
  }

  /**
   * Get commission field validation rules for user
   * @param {string} userRole - User's role
   * @returns {Object} Validation rules for commission fields
   */
  static getCommissionFieldRules(userRole) {
    const editableFields = this.getEditableCommissionFields(userRole);
    const rules = {};

    // Set all fields as readonly by default
    Object.keys(COMMISSION_EDITABLE_FIELDS.super_admin).forEach((field) => {
      rules[field] = {
        editable: editableFields.includes(field),
        required: false,
        min: 0,
        max: 100,
      };
    });

    return rules;
  }
}

export default RoleHierarchyUtils;
