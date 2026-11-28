/**
 * Scholarship API Functions
 * WazifaESadat App
 */
import axios from 'axios';
import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// ================================================================
// WAZIFA USER AUTHENTICATION API
// ================================================================

/**
 * Wazifa User Login
 * POST /scholarshipForm/wazifa-login
 *
 * @param {Object} credentials
 * @param {string} credentials.contactNo
 * @param {string} credentials.dateOfBirth
 */

export const wazifaLogin = async ({ contactNo, dateOfBirth }) => {
  try {
    const response = await api.post('scholarshipForm/wazifa-login', {
      contactNo,
      dateOfBirth,
    });

    return response.data;
  } catch (error) {
    console.error('Wazifa Login Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get Logged-in Wazifa User Scholarship Form
 * GET /scholarshipForm/my-form
 *
 * Requires Bearer Token in header
 * @param {string} authToken
 * @param {string} accountNo - Account number to pass in custom header
 */

export const getMyScholarshipForm = async (authToken, accountNo) => {
  try {
    console.log('API Call: getMyScholarshipForm', {
      tokenExists: !!authToken,
      accountNo,
    });

    const config = {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };

    // Add account number as custom header
    if (accountNo) {
      config.headers['X-Account-No'] = accountNo;
      console.log('Added X-Account-No header:', accountNo);
    }

    const response = await api.get('scholarshipForm/my-form', config);

    console.log('API Response received:', response.status);
    return response.data;
  } catch (error) {
    console.error('Get My Scholarship Form Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

// ================================================================
// SCHOLARSHIP DATE API
// ================================================================

/**
 * Fetch scholarship dates with pagination and filtering
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
 */

export const getScholarshipDatesByCategory = async (
  category,
  isActive = true,
) => {
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
 */

export const createScholarshipDate = async data => {
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
 */

export const deleteScholarshipDate = async id => {
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
 * Fetch scholarship rates with pagination
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
 */

export const getScholarshipRateById = async id => {
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
 */

export const createScholarshipRate = async data => {
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
 */

export const deleteScholarshipRate = async id => {
  try {
    const response = await api.delete(`course-with-rates/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting scholarship rate:', error);
    throw error;
  }
};

// ================================================================
// TENURE YEAR API
// ================================================================

/**
 * Fetch tenure years with pagination and filtering
 */

export const getTenureYears = async (
  page = 1,
  limit = 50,
  search = '',
  isActive = true,
) => {
  try {
    const response = await api.get(
      `tenure-year?page=${page}&limit=${limit}&sortBy=recent${
        search ? `&search=${encodeURIComponent(search)}` : ''
      }${isActive !== undefined ? `&isActive=${isActive}` : ''}`,
    );

    return response.data?.data || {};
  } catch (error) {
    console.error('Error fetching tenure years:', error);
    throw error;
  }
};

export const getScholarshipFormLookup = async accountNo => {
  try {
    if (!accountNo) {
      throw new Error('Account number is required');
    }

    const response = await api.get(
      `scholarshipForm/lookup/${encodeURIComponent(accountNo)}`,
    );

    return response.data;
  } catch (error) {
    console.error(
      'Scholarship Form Lookup Error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

/**
 * PUT /scholarshipForm/renew/:wazifaNo
 */
export const renewScholarshipForm = async (wazifaNo, payload) => {
  try {
    const response = await api.put(
      `scholarshipForm/renew/${encodeURIComponent(wazifaNo)}`,
      payload,
    );

    return response.data;
  } catch (error) {
    console.error(
      'Scholarship Renewal Error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const createScholarshipForm = async payload => {
  try {
    const response = await api.post('scholarshipForm', payload);

    return response.data;
  } catch (error) {
    console.error(
      'Create Scholarship Form Error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const uploadImage = async file => {
  try {
    // For React Native, we need to be careful with FormData
    const formData = new FormData();

    // Append file with proper structure for React Native
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `image-${Date.now()}.jpg`,
    });

    console.log('📤 Starting upload:', {
      name: file.name,
      type: file.type,
      uri: file.uri.substring(0, 50) + '...',
    });

    // Create a special instance for upload
    const uploadInstance = axios.create({
      baseURL: 'https://api.wazifaesadat.org/api',
      timeout: 30000,
    });

    // Add auth token to upload request
    uploadInstance.interceptors.request.use(
      async config => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.log('Token fetch error:', err);
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Don't manually set Content-Type for FormData - let axios handle it
    const response = await uploadInstance.post('/upload/uploadImage', formData);

    console.log('📤 Upload response:', response.data);

    if (response.data.success && response.data.data?.imageUrl) {
      return {
        success: true,
        imageUrl: response.data.data.imageUrl,
        message: response.data.message || 'Image uploaded successfully',
      };
    }
    return {
      success: false,
      message: response.data.message || 'Upload failed',
    };
  } catch (error) {
    console.error('❌ Upload error - Message:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Response status:', error.response.status);
    } else if (error.request) {
      console.error('   No response received - Network error');
      console.error('   Request URL:', error.config?.url);
      console.error('   Request method:', error.config?.method);
    }

    return {
      success: false,
      message:
        error.response?.data?.message || error.message || 'Upload failed',
    };
  }
};
