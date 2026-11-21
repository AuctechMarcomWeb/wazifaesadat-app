/**
 * User Access Management API Functions — React Native
 * Handles staff/user management, permissions, and access control
 *
 * Endpoints:
 * - GET /staff/all - Get all staff members
 * - GET /staff/:id - Get single staff
 * - GET /staff/:id/credentials - Get user login credentials
 * - PATCH /staff/:id/suspend - Toggle login access
 * - PATCH /staff/:id/permissions - Save menu permissions
 * - PATCH /staff/:id - Update staff details
 * - PUT /users/:id - Update user info
 * - PATCH /users/:id/reset-password - Reset password
 * - DELETE /staff/:id - Delete staff member
 */

import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('staff');

/* ═══════════════════════════════════════════════════════
   STAFF RETRIEVAL & LISTING
═══════════════════════════════════════════════════════ */

/**
 * Get all staff members with optional pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Records per page (default: 200)
 * @param {boolean} params.isPagination - Enable pagination (default: false)
 * @param {string} params.search - Search query
 * @param {string} params.role - Filter by role
 * @param {boolean} params.isActive - Filter by active status
 * @returns {Promise} Array of staff members or paginated response
 */
export const getAllStaff = async (params = {}) => {
  const defaultParams = {
    isPagination: false,
    limit: 200,
    ...params,
  };

  const queryString = new URLSearchParams(defaultParams).toString();

  try {
    const response = await api.get(`all?${queryString}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ getAllStaff error:', error);
    throw error;
  }
};

/**
 * Get single staff member details
 * @param {string} staffId - Staff member ID
 * @returns {Promise} Staff data with permissions
 */
export const getStaffById = async staffId => {
  try {
    const response = await api.get(`${staffId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ getStaffById error:', error);
    throw error;
  }
};

/**
 * Get staff credentials (User ID + Password)
 * @param {string} staffId - Staff member ID
 * @returns {Promise} { userId, password }
 */
export const getStaffCredentials = async staffId => {
  try {
    const response = await api.get(`${staffId}/credentials`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ getStaffCredentials error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   LOGIN ACCESS CONTROL
═══════════════════════════════════════════════════════ */

/**
 * Toggle staff login access (suspend/unsuspend)
 * @param {string} staffId - Staff member ID
 * @param {Object} payload - Suspension details
 * @param {boolean} payload.isSuspended - Suspend status
 * @param {string} payload.suspendedReason - Reason for suspension
 * @returns {Promise} Updated staff data
 */
export const toggleStaffLoginAccess = async (staffId, payload) => {
  try {
    console.log('🔄 toggleStaffLoginAccess called:', { staffId, payload });

    const response = await api.patch(`${staffId}/suspend`, {
      isSuspended: payload.isSuspended,
      suspendedReason: payload.suspendedReason || '',
    });

    console.log('✅ toggleStaffLoginAccess response:', response.data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ toggleStaffLoginAccess error:', error);
    throw error;
  }
};

/**
 * Suspend a staff member (disable login)
 * @param {string} staffId - Staff member ID
 * @param {string} reason - Reason for suspension
 * @returns {Promise} Updated staff data
 */
export const suspendStaff = async (staffId, reason = '') => {
  return toggleStaffLoginAccess(staffId, {
    isSuspended: true,
    suspendedReason: reason || 'Login disabled by SuperAdmin',
  });
};

/**
 * Unsuspend a staff member (enable login)
 * @param {string} staffId - Staff member ID
 * @returns {Promise} Updated staff data
 */
export const unsuspendStaff = async staffId => {
  return toggleStaffLoginAccess(staffId, {
    isSuspended: false,
    suspendedReason: '',
  });
};

/* ═══════════════════════════════════════════════════════
   MENU ACCESS & PERMISSIONS
═══════════════════════════════════════════════════════ */

/**
 * Save menu permissions for a staff member
 * @param {string} staffId - Staff member ID
 * @param {Array} permissions - Array of permission objects
 * @param {string} permissions[].module - Module key
 * @param {boolean} permissions[].canView - View permission
 * @param {boolean} permissions[].canCreate - Create permission
 * @param {boolean} permissions[].canEdit - Edit permission
 * @param {boolean} permissions[].canDelete - Delete permission
 * @returns {Promise} Saved permissions
 */
export const saveStaffPermissions = async (staffId, permissions) => {
  try {
    console.log('💾 saveStaffPermissions called:', {
      staffId,
      permissionsCount: permissions?.length,
      samplePerms: permissions?.slice(0, 3),
    });

    const response = await api.patch(`${staffId}/permissions`, {
      permissions: permissions || [],
    });

    console.log('✅ saveStaffPermissions response:', response.data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ saveStaffPermissions error:', error);
    throw error;
  }
};

/**
 * Get staff permissions
 * @param {string} staffId - Staff member ID
 * @returns {Promise} Array of permissions
 */
export const getStaffPermissions = async staffId => {
  try {
    const response = await api.get(`${staffId}/permissions`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ getStaffPermissions error:', error);
    throw error;
  }
};

/**
 * Assign role-based default permissions
 * @param {string} staffId - Staff member ID
 * @param {string} role - Role name (SuperAdmin, Admin, etc.)
 * @returns {Promise} Assigned permissions
 */
export const assignRolePermissions = async (staffId, role) => {
  try {
    const response = await api.patch(`${staffId}/assign-role-permissions`, {
      role,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ assignRolePermissions error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   STAFF UPDATE & EDIT
═══════════════════════════════════════════════════════ */

/**
 * Update staff member details
 * @param {string} staffId - Staff member ID
 * @param {Object} updates - Fields to update
 * @param {string} updates.name - Full name
 * @param {string} updates.email - Email address
 * @param {string} updates.phone - Phone number
 * @param {string} updates.role - Staff role
 * @param {string} updates.status - Active/Inactive
 * @returns {Promise} Updated staff data
 */
export const updateStaffDetails = async (staffId, updates) => {
  try {
    console.log('✏️ updateStaffDetails called:', { staffId, updates });

    const response = await api.put(`${staffId}`, updates);

    console.log('✅ updateStaffDetails response:', response.data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ updateStaffDetails error:', error);
    throw error;
  }
};

/**
 * Update user information (alternative endpoint)
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Updated user data
 */
export const updateUserInfo = async (userId, updates) => {
  try {
    const usersApi = createAxiosInstance('users');
    const response = await usersApi.put(`${userId}`, updates);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ updateUserInfo error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   PASSWORD MANAGEMENT
═══════════════════════════════════════════════════════ */

/**
 * Reset staff member password
 * @param {string} staffId - Staff member ID
 * @param {string} newPassword - New password
 * @returns {Promise} Success response
 */
export const resetStaffPassword = async (staffId, newPassword) => {
  try {
    console.log('🔐 resetStaffPassword called for staff:', staffId);

    const response = await api.put(`${staffId}`, {
      newPassword,
    });

    console.log('✅ resetStaffPassword response:', response.data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ resetStaffPassword error:', error);
    throw error;
  }
};

/**
 * Reset user password (alternative endpoint)
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise} Success response
 */
export const resetUserPassword = async (userId, newPassword) => {
  try {
    const usersApi = createAxiosInstance('users');
    const response = await usersApi.patch(`${userId}/reset-password`, {
      newPassword,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ resetUserPassword error:', error);
    throw error;
  }
};

/**
 * Change password (user changing their own password)
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} Success response
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const usersApi = createAxiosInstance('users');
    const response = await usersApi.patch(`${userId}/change-password`, {
      currentPassword,
      newPassword,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ changePassword error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   STAFF DELETION & MANAGEMENT
═══════════════════════════════════════════════════════ */

/**
 * Delete a staff member permanently
 * @param {string} staffId - Staff member ID
 * @returns {Promise} Success response
 */
export const deleteStaff = async staffId => {
  try {
    console.log('🗑️ deleteStaff called for staff:', staffId);

    const response = await api.delete(`${staffId}`);

    console.log('✅ deleteStaff response:', response.data);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ deleteStaff error:', error);
    throw error;
  }
};

/**
 * Soft delete staff (mark as deleted, don't remove data)
 * @param {string} staffId - Staff member ID
 * @param {string} reason - Reason for deletion
 * @returns {Promise} Updated staff data
 */
export const softDeleteStaff = async (staffId, reason = '') => {
  try {
    const response = await api.patch(`${staffId}/soft-delete`, {
      reason,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ softDeleteStaff error:', error);
    throw error;
  }
};

/**
 * Restore a deleted staff member
 * @param {string} staffId - Staff member ID
 * @returns {Promise} Restored staff data
 */
export const restoreStaff = async staffId => {
  try {
    const response = await api.patch(`${staffId}/restore`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ restoreStaff error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   BULK OPERATIONS
═══════════════════════════════════════════════════════ */

/**
 * Bulk update staff permissions
 * @param {Array} updates - Array of { staffId, permissions }
 * @returns {Promise} Array of updated staff
 */
export const bulkUpdatePermissions = async updates => {
  try {
    const response = await api.patch(`bulk/permissions`, {
      updates,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ bulkUpdatePermissions error:', error);
    throw error;
  }
};

/**
 * Bulk suspend/unsuspend staff
 * @param {Array} staffIds - Array of staff IDs
 * @param {boolean} suspend - Suspend (true) or unsuspend (false)
 * @returns {Promise} Updated staff array
 */
export const bulkUpdateLoginAccess = async (staffIds, suspend) => {
  try {
    const response = await api.patch(`bulk/login-access`, {
      staffIds,
      isSuspended: suspend,
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ bulkUpdateLoginAccess error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   EXPORT & REPORTING
═══════════════════════════════════════════════════════ */

/**
 * Export staff list as CSV
 * @param {Object} filters - Filter options
 * @returns {Promise} CSV data
 */
export const exportStaffAsCSV = async (filters = {}) => {
  try {
    const response = await api.get('export/csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('❌ exportStaffAsCSV error:', error);
    throw error;
  }
};

/**
 * Export staff permissions report
 * @param {string} staffId - Optional: export for single staff
 * @returns {Promise} Report data
 */
export const exportPermissionsReport = async (staffId = null) => {
  try {
    const url = staffId
      ? `${staffId}/permissions/report`
      : 'permissions/report';
    const response = await api.get(url);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ exportPermissionsReport error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   AUDIT & LOGGING
═══════════════════════════════════════════════════════ */

/**
 * Get staff activity log
 * @param {string} staffId - Staff member ID
 * @param {Object} params - Query params (limit, offset, etc.)
 * @returns {Promise} Activity logs
 */
export const getStaffActivityLog = async (staffId, params = {}) => {
  try {
    const response = await api.get(`${staffId}/activity-log`, { params });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ getStaffActivityLog error:', error);
    throw error;
  }
};

/**
 * Get permission change history
 * @param {string} staffId - Staff member ID
 * @returns {Promise} Permission history
 */
export const getPermissionHistory = async staffId => {
  try {
    const response = await api.get(`${staffId}/permission-history`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ getPermissionHistory error:', error);
    throw error;
  }
};

/* ═══════════════════════════════════════════════════════
   VALIDATION & CHECKS
═══════════════════════════════════════════════════════ */

/**
 * Check if staff ID exists
 * @param {string} staffId - Staff ID to check
 * @returns {Promise} { exists: boolean }
 */
export const checkStaffExists = async staffId => {
  try {
    const response = await api.head(`${staffId}`);
    return { exists: response.status === 200 };
  } catch (error) {
    if (error.response?.status === 404) {
      return { exists: false };
    }
    throw error;
  }
};

/**
 * Validate permissions structure
 * @param {Array} permissions - Permissions to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validatePermissions = permissions => {
  const errors = [];

  if (!Array.isArray(permissions)) {
    errors.push('Permissions must be an array');
    return { valid: false, errors };
  }

  permissions.forEach((perm, idx) => {
    if (!perm.module) errors.push(`Permission ${idx}: missing module`);
    if (typeof perm.canView !== 'boolean')
      errors.push(`Permission ${idx}: invalid canView`);
    if (typeof perm.canCreate !== 'boolean')
      errors.push(`Permission ${idx}: invalid canCreate`);
    if (typeof perm.canEdit !== 'boolean')
      errors.push(`Permission ${idx}: invalid canEdit`);
    if (typeof perm.canDelete !== 'boolean')
      errors.push(`Permission ${idx}: invalid canDelete`);
  });

  return { valid: errors.length === 0, errors };
};

export default {
  getAllStaff,
  getStaffById,
  getStaffCredentials,
  toggleStaffLoginAccess,
  suspendStaff,
  unsuspendStaff,
  saveStaffPermissions,
  getStaffPermissions,
  assignRolePermissions,
  updateStaffDetails,
  updateUserInfo,
  resetStaffPassword,
  resetUserPassword,
  changePassword,
  deleteStaff,
  softDeleteStaff,
  restoreStaff,
  bulkUpdatePermissions,
  bulkUpdateLoginAccess,
  exportStaffAsCSV,
  exportPermissionsReport,
  getStaffActivityLog,
  getPermissionHistory,
  checkStaffExists,
  validatePermissions,
};
