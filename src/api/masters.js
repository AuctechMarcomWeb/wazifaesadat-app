/**
 * Master Data API Functions - Simple CRUD
 * No hooks, no extra logic - just functions
 */

import { createAxiosInstance } from './apiConfig';
const api = createAxiosInstance('');

// ================================================================
// DESIGNATION
// ================================================================

export const getDesignations = async (page = 1, limit = 50, search = '', isActive = true) => {
  const response = await api.get(
    `designation?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const createDesignation = async data => {
  const response = await api.post('designation', data);
  return response.data;
};

export const updateDesignation = async (id, data) => {
  const response = await api.put(`designation/${id}`, data);
  return response.data;
};

export const deleteDesignation = async id => {
  const response = await api.delete(`designation/${id}`);
  return response.data;
};

// ================================================================
// TENURE YEAR
// ================================================================

export const getTenureYears = async (page = 1, limit = 50, search = '', isActive = true) => {
  const response = await api.get(
    `tenure-year?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const createTenureYear = async data => {
  const response = await api.post('tenure-year', data);
  return response.data;
};

export const updateTenureYear = async (id, data) => {
  const response = await api.put(`tenure-year/${id}`, data);
  return response.data;
};

export const deleteTenureYear = async id => {
  const response = await api.delete(`tenure-year/${id}`);
  return response.data;
};

// ================================================================
// COLLECTED BY (Executive Member)
// ================================================================

export const getCollectedBys = async (page = 1, limit = 50, search = '', isActive = true) => {
  const response = await api.get(
    `executive-member?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const getCollectedBy = getCollectedBys;

export const createCollectedBy = async data => {
  const response = await api.post('executive-member', data);
  return response.data;
};

export const updateCollectedBy = async (id, data) => {
  const response = await api.put(`executive-member/${id}`, data);
  return response.data;
};

export const deleteCollectedBy = async id => {
  const response = await api.delete(`executive-member/${id}`);
  return response.data;
};

// ================================================================
// BANK
// ================================================================

export const getBanks = async (page = 1, limit = 50, search = '', isActive = true) => {
  const response = await api.get(
    `bank?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const createBank = async data => {
  const response = await api.post('bank', data);
  return response.data;
};

export const updateBank = async (id, data) => {
  const response = await api.put(`bank/${id}`, data);
  return response.data;
};

export const deleteBank = async id => {
  const response = await api.delete(`bank/${id}`);
  return response.data;
};

// ================================================================
// FUND TYPE
// ================================================================

export const getFundTypes = async (page = 1, limit = 50, search = '', isActive = true) => {
  const response = await api.get(
    `fund-type?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const createFundType = async data => {
  const response = await api.post('fund-type', data);
  return response.data;
};

export const updateFundType = async (id, data) => {
  const response = await api.put(`fund-type/${id}`, data);
  return response.data;
};

export const deleteFundType = async id => {
  const response = await api.delete(`fund-type/${id}`);
  return response.data;
};

// ================================================================
// MODE OF PAYMENT
// ================================================================

export const getPaymentModes = async (page = 1, limit = 50, search = '', isActive = true) => {
  const response = await api.get(
    `mode-of-payment?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const getPaymentMode = getPaymentModes;

export const createPaymentMode = async data => {
  const response = await api.post('mode-of-payment', data);
  return response.data;
};

export const updatePaymentMode = async (id, data) => {
  const response = await api.put(`mode-of-payment/${id}`, data);
  return response.data;
};

export const deletePaymentMode = async id => {
  const response = await api.delete(`mode-of-payment/${id}`);
  return response.data;
};

// Backward compatibility - old name
export const getModeOfPayments = getPaymentModes;

// ================================================================
// EXPENSE
// ================================================================

export const getExpenses = async (page = 1, limit = 50, search = '', isActive = true) => {
  const response = await api.get(
    `expences?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const createExpense = async data => {
  const response = await api.post('expences', data);
  return response.data;
};

export const updateExpense = async (id, data) => {
  const response = await api.put(`expences/${id}`, data);
  return response.data;
};

export const deleteExpense = async id => {
  const response = await api.delete(`expences/${id}`);
  return response.data;
};

// ================================================================
// SCHOLARSHIP DATE
// ================================================================

export const getScholarshipDates = async (
  page = 1,
  limit = 50,
  search = '',
  isActive = true,
) => {
  const response = await api.get(
    `scholarship-date?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const getScholarshipDate = getScholarshipDates;

export const createScholarshipDate = async data => {
  const response = await api.post('scholarship-date', data);
  return response.data;
};

export const updateScholarshipDate = async (id, data) => {
  const response = await api.patch(`scholarship-date/${id}`, data);
  return response.data;
};

export const deleteScholarshipDate = async id => {
  const response = await api.delete(`scholarship-date/${id}`);
  return response.data;
};

// ================================================================
// SCHOLARSHIP RATE
// ================================================================

export const getScholarshipRates = async (
  page = 1,
  limit = 50,
  search = '',
  isActive = true,
) => {
  const response = await api.get(
    `course-with-rates?page=${page}&limit=${limit}&sortBy=recent${
      search ? `&search=${encodeURIComponent(search)}` : ''
    }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
  );
  return response.data?.data || {};
};

export const getScholarshipRate = getScholarshipRates;

export const createScholarshipRate = async data => {
  const response = await api.post('course-with-rates', data);
  return response.data;
};

export const updateScholarshipRate = async (id, data) => {
  const response = await api.put(`course-with-rates/${id}`, data);
  return response.data;
};

export const deleteScholarshipRate = async id => {
  const response = await api.delete(`course-with-rates/${id}`);
  return response.data;
};
