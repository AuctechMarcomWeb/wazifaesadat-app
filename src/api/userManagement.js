import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// Normalize API response
const normalizeResponse = response => {
  const root = response?.data || {};
  const data = root.data || {};

  const users = Array.isArray(data.users)
    ? data.users
    : Array.isArray(data.staff)
    ? data.staff
    : Array.isArray(root.users)
    ? root.users
    : Array.isArray(root.staff)
    ? root.staff
    : [];

  return {
    users,
    total:
      data.total ??
      data.totalStaff ??
      root.total ??
      root.totalStaff ??
      users.length,
    totalPages: data.totalPages ?? root.totalPages ?? 1,
    currentPage: data.currentPage ?? root.currentPage ?? 1,
  };
};

// ======================================================
// GET USERS BY ROLE - ALL THREE TABS
// ======================================================

export const getUsersByRole = async (
  role,
  page = 1,
  limit = 20,
  search = '',
  statusFilter = 'All Status',
) => {
  try {
    // 1. STAFF TAB
    if (role === 'Staff') {
      const params = {
        isPagination: false,
        sortBy: 'recent',
        // role: 'Office Bearers',
      };

      if (search?.trim()) {
        params.search = search.trim();
      }

      if (statusFilter === 'Active') {
        params.isSuspended = false;
      } else if (statusFilter === 'Suspended') {
        params.isSuspended = true;
      }

      const response = await api.get('staff/all', { params });

      return normalizeResponse(response);
    }

    // 2. MEMBERSHIP TAB
    // 3. WAZIFA USER TAB

    const apiRole = role === 'Wazifa User' ? 'WazifaUser' : role;

    const response = await api.get('staff/users-by-role', {
      params: {
        role: apiRole,
        page,
        limit,
        isPagination: true,
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
    });

    const result = normalizeResponse(response);

    // Apply status filter locally for these two tabs
    if (statusFilter !== 'All Status') {
      const wantSuspended = statusFilter === 'Suspended';

      const filteredUsers = result.users.filter(
        user => Boolean(user.isSuspended) === wantSuspended,
      );

      return {
        ...result,
        users: filteredUsers,
        total: filteredUsers.length,
      };
    }

    return result;
  } catch (error) {
    console.error(
      `getUsersByRole Error (${role}):`,
      error?.response?.data || error.message,
    );

    throw error;
  }
};

// ======================================================
// GET ALL STAFF
// ======================================================

export const getAllStaff = async (
  page = 1,
  limit = 20,
  search = '',
  sortBy = 'recent',
) => {
  try {
    const response = await api.get('staff/all', {
      params: {
        isPagination: true,
        page,
        limit,
        sortBy,
        ...(search ? { search } : {}),
      },
    });

    return normalizeResponse(response);
  } catch (error) {
    throw error;
  }
};

// ======================================================
// UPDATE USER
// ======================================================

export const updateUser = async (userId, data) => {
  const response = await api.put(`staff/users-by-role/${userId}`, data);
  return response.data;
};

// ======================================================
// RESET PASSWORD
// ======================================================

export const resetPassword = async (userId, password) => {
  const response = await api.put(`staff/users-by-role/${userId}`, { password });
  return response.data;
};

// ======================================================
// SUSPEND USER
// ======================================================

export const suspendUser = async (userId, isSuspended = true) => {
  const response = await api.put(`staff/users-by-role/${userId}`, {
    isSuspended,
  });
  return response.data;
};

// ======================================================
// ACTIVATE USER
// ======================================================

export const activateUser = async userId => {
  return suspendUser(userId, false);
};

// ======================================================
// GET STAFF BY ROLE
// ======================================================

export const getStaffByRole = async (
  role,
  page = 1,
  limit = 20,
  search = '',
) => {
  return getUsersByRole(role, page, limit, search);
};

// ======================================================
// GET STAFF PERMISSIONS
// ======================================================

export const getStaffPermissions = async userId => {
  const response = await api.get(`staff/${userId}`);
  return response.data?.data?.permissions || [];
};

// ======================================================
// CREATE STAFF
// ======================================================

export const createStaff = async staffData => {
  const response = await api.post('staff/create', staffData);
  return response.data;
};
