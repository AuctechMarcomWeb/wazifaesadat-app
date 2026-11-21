/**
 * Activity Logs API Functions
 * Simple functions for fetching activity logs and stats
 */

import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// ================================================================
// GET ACTIVITY LOGS WITH PAGINATION & FILTERS
// ================================================================

export const getActivityLogs = async (
  page = 1,
  limit = 20,
  filters = {},
) => {
  try {
    const params = {
      page,
      limit,
      isPagination: true,
    };

    // Add filters if provided
    if (filters.userRole && filters.userRole !== 'All') {
      params.userRole = filters.userRole;
    }
    if (filters.action && filters.action !== 'All') {
      params.action = filters.action;
    }
    if (filters.module && filters.module !== 'All') {
      params.module = filters.module;
    }
    if (filters.dateFrom) {
      params.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
      params.dateTo = filters.dateTo;
    }
    if (filters.search) {
      params.search = filters.search;
    }

    const response = await api.get('activity-logs', { params });
    const data = response.data?.data || {};

    return {
      logs: data.logs || [],
      totalLogs: data.totalLogs || 0,
      totalPages: data.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    throw error;
  }
};

// ================================================================
// GET ACTIVITY LOGS STATS
// ================================================================

export const getActivityLogsStats = async (filters = {}) => {
  try {
    let url = 'activity-logs/stats';
    const params = [];

    if (filters.userRole && filters.userRole !== 'All') {
      params.push(`userRole=${filters.userRole}`);
    }
    if (filters.dateFrom) {
      params.push(`dateFrom=${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      params.push(`dateTo=${filters.dateTo}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    const response = await api.get(url);
    const data = response.data?.data || {};

    return {
      total: data.total || 0,
      successful: data.successful || 0,
      failed: data.failed || 0,
      unique: data.uniqueUsers || 0,
    };
  } catch (error) {
    console.error('Failed to fetch activity stats:', error);
    throw error;
  }
};

// ================================================================
// GET UNIQUE ACTIONS (for filter dropdown)
// ================================================================

export const getUniqueActions = async () => {
  try {
    const response = await api.get('activity-logs/actions');
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch actions:', error);
    return [];
  }
};

// ================================================================
// GET UNIQUE MODULES (for filter dropdown)
// ================================================================

export const getUniqueModules = async () => {
  try {
    const response = await api.get('activity-logs/modules');
    return response.data?.data || [];
  } catch (error) {
    console.error('Failed to fetch modules:', error);
    return [];
  }
};
