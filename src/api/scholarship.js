/**
 * Scholarship API Functions
 * WazifaESadat App
 */

import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// ================================================================
// SCHOLARSHIP DATE API
// ================================================================

/**
 * Fetch scholarship dates with pagination and filtering
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Records per page (default: 50)
 * @param {string} search - Search term (optional)
 * @param {boolean} isActive - Filter by active status (optional)
 * @returns {Promise} Scholarship dates data
 */
export const getScholarshipDates = async (
  page = 1,
  limit = 50,
  search = '',
  isActive = true,
) => {
  try {
    const response = await api.get(
      `scholarship-date?page=${page}&limit=${limit}&sortBy=recent${
        search ? `&search=${encodeURIComponent(search)}` : ''
      }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
    );
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching scholarship dates:', error);
    throw error;
  }
};

/**
 * Fetch scholarship dates by category
 * @param {string} category - Category name (e.g., 'Junior', 'Senior')
 * @param {boolean} isActive - Filter by active status
 * @returns {Promise} Filtered scholarship dates
 */
export const getScholarshipDatesByCategory = async (category, isActive = true) => {
  try {
    const response = await api.get(
      `scholarship-date?category=${encodeURIComponent(category)}${
        isActive !== undefined ? `&isActive=${isActive}` : ''
      }`,
    );
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching scholarship dates by category:', error);
    throw error;
  }
};

/**
 * Create a new scholarship date
 * @param {Object} data - Scholarship date data
 * @param {string} data.category - Category (Junior, Senior, etc.)
 * @param {string} data.startDate - Start date (YYYY-MM-DD format)
 * @param {string} data.endDate - End date (YYYY-MM-DD format)
 * @param {string} data.remarks - Remarks/Notes
 * @param {boolean} data.isActive - Active status
 * @returns {Promise} Created scholarship date object
 */
export const createScholarshipDate = async (data) => {
  try {
    const response = await api.post('scholarship-date', data);
    return response.data;
  } catch (error) {
    console.error('Error creating scholarship date:', error);
    throw error;
  }
};

/**
 * Update an existing scholarship date
 * @param {string} id - Scholarship date ID
 * @param {Object} data - Updated data
 * @returns {Promise} Updated scholarship date object
 */
export const updateScholarshipDate = async (id, data) => {
  try {
    const response = await api.patch(`scholarship-date/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating scholarship date:', error);
    throw error;
  }
};

/**
 * Delete a scholarship date
 * @param {string} id - Scholarship date ID
 * @returns {Promise} Delete response
 */
export const deleteScholarshipDate = async (id) => {
  try {
    const response = await api.delete(`scholarship-date/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting scholarship date:', error);
    throw error;
  }
};

// ================================================================
// SCHOLARSHIP RATE API
// ================================================================

/**
 * Fetch scholarship rates (course with rates) with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Records per page (default: 50)
 * @param {string} search - Search term (optional)
 * @param {boolean} isActive - Filter by active status (optional)
 * @returns {Promise} Scholarship rates data
 */
export const getScholarshipRates = async (
  page = 1,
  limit = 50,
  search = '',
  isActive = true,
) => {
  try {
    const response = await api.get(
      `course-with-rates?page=${page}&limit=${limit}&sortBy=recent${
        search ? `&search=${encodeURIComponent(search)}` : ''
      }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
    );
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching scholarship rates:', error);
    throw error;
  }
};

/**
 * Fetch a single scholarship rate by ID
 * @param {string} id - Scholarship rate ID
 * @returns {Promise} Scholarship rate object
 */
export const getScholarshipRateById = async (id) => {
  try {
    const response = await api.get(`course-with-rates/${id}`);
    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching scholarship rate by ID:', error);
    throw error;
  }
};

/**
 * Create a new scholarship rate
 * @param {Object} data - Scholarship rate data
 * @param {string} data.courseName - Course name
 * @param {number} data.rate - Scholarship rate
 * @param {string} data.remarks - Remarks/Notes
 * @param {boolean} data.isActive - Active status
 * @returns {Promise} Created scholarship rate object
 */
export const createScholarshipRate = async (data) => {
  try {
    const response = await api.post('course-with-rates', data);
    return response.data;
  } catch (error) {
    console.error('Error creating scholarship rate:', error);
    throw error;
  }
};

/**
 * Update an existing scholarship rate
 * @param {string} id - Scholarship rate ID
 * @param {Object} data - Updated data
 * @returns {Promise} Updated scholarship rate object
 */
export const updateScholarshipRate = async (id, data) => {
  try {
    const response = await api.put(`course-with-rates/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating scholarship rate:', error);
    throw error;
  }
};

/**
 * Delete a scholarship rate
 * @param {string} id - Scholarship rate ID
 * @returns {Promise} Delete response
 */
export const deleteScholarshipRate = async (id) => {
  try {
    const response = await api.delete(`course-with-rates/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting scholarship rate:', error);
    throw error;
  }
};
