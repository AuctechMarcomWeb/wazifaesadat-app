import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// ============================================================
// ORGANIZATION STRUCTURE APIS
// ============================================================

/**
 * Get all organization structures with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 * @returns {Promise}
 */
export const getOrganizationStructures = async (
  page = 1,
  limit = 10,
  search = '',
) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    params.append('isPagination', true);
    if (search?.trim()) {
      params.append('search', search);
    }

    const response = await api.get(
      `organization/get-structures?${params.toString()}`,
    );
    return {
      success: response.data?.statusCode === 200,
      structures: response.data?.data || [],
      total: response.data?.total || 0,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching organization structures:', error);
    return {
      success: false,
      structures: [],
      message: error.message,
    };
  }
};

/**
 * Get single organization structure by ID
 * @param {string} id - Structure ID
 * @returns {Promise}
 */
export const getOrganizationStructureById = async id => {
  try {
    const response = await api.get(`organization/structure/${id}`);
    return {
      success: response.data?.statusCode === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching organization structure:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Create new organization structure
 * @param {object} structureData - Structure data
 * @returns {Promise}
 */
export const createOrganizationStructure = async structureData => {
  try {
    const response = await api.post(
      'organization/create-structure',
      structureData,
    );
    return {
      success:
        response.data?.statusCode === 201 || response.data?.statusCode === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error creating organization structure:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Update organization structure
 * @param {string} id - Structure ID
 * @param {object} structureData - Updated data
 * @returns {Promise}
 */
export const updateOrganizationStructure = async (id, structureData) => {
  try {
    const response = await api.put(
      `organization/update-structure/${id}`,
      structureData,
    );
    return {
      success: response.data?.statusCode === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error updating organization structure:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Delete organization structure
 * @param {string} id - Structure ID
 * @returns {Promise}
 */
export const deleteOrganizationStructure = async id => {
  try {
    const response = await api.delete(`organization/delete-structure/${id}`);
    return {
      success: response.data?.statusCode === 200,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error deleting organization structure:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================================
// OFFICE BEARER APIS
// ============================================================

/**
 * Get all office bearers with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 * @returns {Promise}
 */
export const getOfficeBearers = async (page = 1, limit = 50, search = '') => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search?.trim()) {
      params.append('search', search);
    }

    const response = await api.get(
      `office-bearer?${params.toString()}`,
    );
    
    // Transform data to extract nested objects
    const bearers = (response.data?.data?.bearers || response.data?.bearers || response.data?.data || []).map(bearer => ({
      ...bearer,
      designation: bearer.designation?.name || bearer.designation || '-',
      tenure: bearer.tenureYear?.name || bearer.tenure || '-',
    }));
    
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      bearers,
      total: response.data?.data?.total || response.data?.total || 0,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching office bearers:', error);
    return {
      success: false,
      bearers: [],
      message: error.message,
    };
  }
};

/**
 * Get office bearer by ID
 * @param {string} id - Bearer ID
 * @returns {Promise}
 */
export const getOfficeBearerById = async id => {
  try {
    const response = await api.get(`office-bearer/${id}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching office bearer:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Create new office bearer
 * @param {object} bearerData - Bearer data
 * @returns {Promise}
 */
export const createOfficeBearer = async bearerData => {
  try {
    const response = await api.post(
      'office-bearer',
      bearerData,
    );
    return {
      success:
        response.data?.statusCode === 201 ||
        response.data?.statusCode === 200 ||
        response.status === 201 ||
        response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error creating office bearer:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Update office bearer
 * @param {string} id - Bearer ID
 * @param {object} bearerData - Updated data
 * @returns {Promise}
 */
export const updateOfficeBearer = async (id, bearerData) => {
  try {
    const response = await api.put(
      `office-bearer/${id}`,
      bearerData,
    );
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error updating office bearer:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Delete office bearer
 * @param {string} id - Bearer ID
 * @returns {Promise}
 */
export const deleteOfficeBearer = async id => {
  try {
    const response = await api.delete(`office-bearer/${id}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error deleting office bearer:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================================
// EXECUTIVE MEMBERS APIS
// ============================================================

/**
 * Get all executive members with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 * @returns {Promise}
 */
export const getExecutiveMembers = async (
  page = 1,
  limit = 50,
  search = '',
) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search?.trim()) {
      params.append('search', search);
    }

    const response = await api.get(`executive-member?${params.toString()}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      members:
        response.data?.data?.members ||
        response.data?.members ||
        response.data?.data ||
        [],
      total: response.data?.data?.total || response.data?.total || 0,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching executive members:', error);
    return {
      success: false,
      members: [],
      message: error.message,
    };
  }
};

/**
 * Get executive member by ID
 * @param {string} id - Member ID
 * @returns {Promise}
 */
export const getExecutiveMemberById = async id => {
  try {
    const response = await api.get(`executive-member/${id}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching executive member:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Create new executive member
 * @param {object} memberData - Member data
 * @returns {Promise}
 */
export const createExecutiveMember = async memberData => {
  try {
    const response = await api.post('executive-member', memberData);
    return {
      success:
        response.data?.statusCode === 201 ||
        response.data?.statusCode === 200 ||
        response.status === 201 ||
        response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error creating executive member:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Update executive member
 * @param {string} id - Member ID
 * @param {object} memberData - Updated data
 * @returns {Promise}
 */
export const updateExecutiveMember = async (id, memberData) => {
  try {
    const response = await api.put(`executive-member/${id}`, memberData);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error updating executive member:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Delete executive member
 * @param {string} id - Member ID
 * @returns {Promise}
 */
export const deleteExecutiveMember = async id => {
  try {
    const response = await api.delete(`executive-member/${id}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error deleting executive member:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================================
// LOCAL SECRETARIES APIS
// ============================================================

/**
 * Get all local secretaries with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search query
 * @returns {Promise}
 */
export const getLocalSecretaries = async (
  page = 1,
  limit = 50,
  search = '',
) => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search?.trim()) {
      params.append('search', search);
    }

    const response = await api.get(`local-secretary?${params.toString()}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      secretaries:
        response.data?.data?.members ||
        response.data?.members ||
        response.data?.data ||
        [],
      total: response.data?.data?.total || response.data?.total || 0,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching local secretaries:', error);
    return {
      success: false,
      secretaries: [],
      message: error.message,
    };
  }
};

/**
 * Get local secretary by ID
 * @param {string} id - Secretary ID
 * @returns {Promise}
 */
export const getLocalSecretaryById = async id => {
  try {
    const response = await api.get(`local-secretary/${id}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error fetching local secretary:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Create new local secretary
 * @param {object} secretaryData - Secretary data
 * @returns {Promise}
 */
export const createLocalSecretary = async secretaryData => {
  try {
    const response = await api.post('local-secretary', secretaryData);
    return {
      success:
        response.data?.statusCode === 201 ||
        response.data?.statusCode === 200 ||
        response.status === 201 ||
        response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error creating local secretary:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Update local secretary
 * @param {string} id - Secretary ID
 * @param {object} secretaryData - Updated data
 * @returns {Promise}
 */
export const updateLocalSecretary = async (id, secretaryData) => {
  try {
    const response = await api.put(`local-secretary/${id}`, secretaryData);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error updating local secretary:', error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

/**
 * Delete local secretary
 * @param {string} id - Secretary ID
 * @returns {Promise}
 */
export const deleteLocalSecretary = async id => {
  try {
    const response = await api.delete(`local-secretary/${id}`);
    return {
      success: response.data?.statusCode === 200 || response.status === 200,
      message: response.data?.message,
    };
  } catch (error) {
    console.error('❌ Error deleting local secretary:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};
