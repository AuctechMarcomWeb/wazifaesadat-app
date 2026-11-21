import { createAxiosInstance } from './apiConfig';

const membershipApi = createAxiosInstance('membership');


export const getMasterRegister = async (
  page = 1,
  limit = 5,
  search = '',
  isPagination = false,
) => {
  try {
    const params = new URLSearchParams({
      page,
      limit,
      isPagination,
    });

    if (search) {
      params.append('search', search);
    }

    const response = await membershipApi.get(`/profileAc?${params.toString()}`);

    if (response.data.success && response.data.data) {
      const memberships = response.data.data.memberships || [];

      console.log('✅ Master Register API Response:');
      console.log('   - Total Members:', memberships.length);
      console.log('   - Page:', page);
      console.log('   - Search:', search || 'none');

      // Transform API data to UI format
      const transformedData = memberships.map(member => ({
        id: member.relationships?.[0]?.applicationNo || member.acountNo,
        name: member.fullName || '',
        wmrn: member.acountNo || '',
        type: member.relationships?.[0]?.relationship || 'Member',
        date: member.createdAt?.split('T')[0] || '',
        phone: member.mobileNumber || '',
        email: member.email || '',
        address: member.permanentAddress || '',
        pinCode: member.pinCode || '',
        fatherName: member.fatherName || member.relationships?.[0]?.fatherName || '',
        courseOfStudy: member.relationships?.[0]?.courseOfStudy?.name || '',
        institutionName: member.relationships?.[0]?.institutionName || '',
        disbursedStatus: member.relationships?.[0]?.disbursedStatus || 'Pending',
        applicationStatus: member.relationships?.[0]?.status || 'Pending',
        rawData: member, // Store raw data for detailed view
      }));

      return {
        success: true,
        memberships: transformedData,
        totalCount: response.data.data.totalCount || memberships.length,
        message: response.data.message,
      };
    }

    console.warn('Master Register API error:', response.data.message);
    return {
      success: false,
      memberships: [],
      totalCount: 0,
      message: response.data.message || 'Failed to fetch members',
    };
  } catch (error) {
    console.error('Master Register error:', error.message);
    console.error('Master Register error response:', error.response?.data);
    return {
      success: false,
      memberships: [],
      totalCount: 0,
      message: error.response?.data?.message || error.message || 'Network error',
    };
  }
};

/**
 * Get Member Profile with Details
 * Returns detailed information about a specific member
 * @param {string} acountNo - Account number (WMRN)
 * @returns { success, member, relationships, message }
 */
export const getMemberProfile = async (acountNo) => {
  try {
    const response = await membershipApi.get(`/profileAc?page=1&limit=1&search=${acountNo}`);

    if (response.data.success && response.data.data?.memberships?.length > 0) {
      const member = response.data.data.memberships[0];

      console.log('✅ Member Profile API Response:');
      console.log('   - Member:', member.fullName);
      console.log('   - WMRN:', member.acountNo);
      console.log('   - Relationships:', member.relationships?.length || 0);

      return {
        success: true,
        member: {
          id: member.acountNo,
          fullName: member.fullName || '',
          fatherName: member.fatherName || '',
          mobileNumber: member.mobileNumber || '',
          email: member.email || '',
          pinCode: member.pinCode || '',
          permanentAddress: member.permanentAddress || '',
          createdAt: member.createdAt || '',
          acountNo: member.acountNo || '',
        },
        relationships: member.relationships || [],
        message: response.data.message,
      };
    }

    return {
      success: false,
      member: null,
      relationships: [],
      message: 'Member not found',
    };
  } catch (error) {
    console.error('Member profile error:', error.message);
    return {
      success: false,
      member: null,
      relationships: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Search Members by Name or WMRN
 * @param {string} searchQuery - Search term (name or WMRN)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns { success, memberships, message }
 */
export const searchMembers = async (searchQuery, page = 1, limit = 10) => {
  try {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return {
        success: false,
        memberships: [],
        message: 'Search query required',
      };
    }

    const response = await membershipApi.get(
      `/profileAc?page=${page}&limit=${limit}&search=${searchQuery}&isPagination=false`,
    );

    if (response.data.success && response.data.data?.memberships) {
      const memberships = response.data.data.memberships.map(member => ({
        id: member.relationships?.[0]?.applicationNo || member.acountNo,
        name: member.fullName || '',
        wmrn: member.acountNo || '',
        type: member.relationships?.[0]?.relationship || 'Member',
        date: member.createdAt?.split('T')[0] || '',
        phone: member.mobileNumber || '',
        email: member.email || '',
      }));

      console.log('✅ Search Results:');
      console.log('   - Found:', memberships.length);
      console.log('   - Query:', searchQuery);

      return {
        success: true,
        memberships,
        message: response.data.message,
      };
    }

    return {
      success: false,
      memberships: [],
      message: 'No results found',
    };
  } catch (error) {
    console.error('Search error:', error.message);
    return {
      success: false,
      memberships: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Members by Type/Relationship
 * @param {string} memberType - Type of member ('Wazifadar', 'Life Member', etc.)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns { success, memberships, message }
 */
export const getMembersByType = async (memberType, page = 1, limit = 10) => {
  try {
    // Get all members and filter by type client-side
    const response = await membershipApi.get(
      `/profileAc?page=${page}&limit=${limit}&isPagination=false`,
    );

    if (response.data.success && response.data.data?.memberships) {
      const memberships = response.data.data.memberships
        .filter(member => {
          if (memberType === 'All Types') return true;
          return member.relationships?.some(r => r.relationship === memberType);
        })
        .map(member => ({
          id: member.relationships?.[0]?.applicationNo || member.acountNo,
          name: member.fullName || '',
          wmrn: member.acountNo || '',
          type: member.relationships?.[0]?.relationship || 'Member',
          date: member.createdAt?.split('T')[0] || '',
          phone: member.mobileNumber || '',
          email: member.email || '',
        }));

      console.log('✅ Members by Type:');
      console.log('   - Type:', memberType);
      console.log('   - Found:', memberships.length);

      return {
        success: true,
        memberships,
        message: response.data.message,
      };
    }

    return {
      success: false,
      memberships: [],
      message: 'Failed to fetch members',
    };
  } catch (error) {
    console.error('Get by type error:', error.message);
    return {
      success: false,
      memberships: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Members by Date Range
 * @param {string} fromDate - Start date (YYYY-MM-DD)
 * @param {string} toDate - End date (YYYY-MM-DD)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns { success, memberships, message }
 */
export const getMembersByDateRange = async (
  fromDate,
  toDate,
  page = 1,
  limit = 10,
) => {
  try {
    const response = await membershipApi.get(
      `/profileAc?page=${page}&limit=${limit}&isPagination=false`,
    );

    if (response.data.success && response.data.data?.memberships) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      const memberships = response.data.data.memberships
        .filter(member => {
          const memberDate = new Date(member.createdAt);
          return memberDate >= from && memberDate <= to;
        })
        .map(member => ({
          id: member.relationships?.[0]?.applicationNo || member.acountNo,
          name: member.fullName || '',
          wmrn: member.acountNo || '',
          type: member.relationships?.[0]?.relationship || 'Member',
          date: member.createdAt?.split('T')[0] || '',
          phone: member.mobileNumber || '',
          email: member.email || '',
        }));

      console.log('✅ Members by Date Range:');
      console.log('   - From:', fromDate);
      console.log('   - To:', toDate);
      console.log('   - Found:', memberships.length);

      return {
        success: true,
        memberships,
        message: response.data.message,
      };
    }

    return {
      success: false,
      memberships: [],
      message: 'Failed to fetch members',
    };
  } catch (error) {
    console.error('Get by date error:', error.message);
    return {
      success: false,
      memberships: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Members with Filters (Type + Date Range)
 * Sends filters as URL query parameters to backend
 * @param {string} memberType - Member type
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns { success, memberships, message }
 */
export const getMembersFiltered = async (
  memberType = 'All Types',
  fromDate = null,
  toDate = null,
  page = 1,
  limit = 10,
) => {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page,
      limit,
      isPagination: false,
    });

    // Add member type filter if not 'All Types'
    if (memberType && memberType !== 'All Types') {
      params.append('memberType', memberType);
    }

    // Add date range filters
    if (fromDate) {
      const fromDateStr = fromDate instanceof Date 
        ? fromDate.toISOString().split('T')[0]
        : fromDate;
      params.append('fromDate', fromDateStr);
    }

    if (toDate) {
      const toDateStr = toDate instanceof Date 
        ? toDate.toISOString().split('T')[0]
        : toDate;
      params.append('toDate', toDateStr);
    }

    console.log('📤 Filtered Members Request:', `/profileAc?${params.toString()}`);

    const response = await membershipApi.get(
      `/profileAc?${params.toString()}`,
    );

    if (response.data.success && response.data.data?.memberships) {
      const memberships = response.data.data.memberships.map(member => ({
        id: member.relationships?.[0]?.applicationNo || member.acountNo,
        name: member.fullName || '',
        wmrn: member.acountNo || '',
        type: member.relationships?.[0]?.relationship || 'Member',
        date: member.createdAt?.split('T')[0] || '',
        phone: member.mobileNumber || '',
        email: member.email || '',
      }));

      console.log('✅ Filtered Members Response:');
      console.log('   - Type:', memberType);
      console.log('   - From:', fromDate || 'any');
      console.log('   - To:', toDate || 'any');
      console.log('   - Found:', memberships.length);

      return {
        success: true,
        memberships,
        message: response.data.message,
      };
    }

    return {
      success: false,
      memberships: [],
      message: 'Failed to fetch members',
    };
  } catch (error) {
    console.error('Filter error:', error.message);
    console.error('Filter error response:', error.response?.data);
    return {
      success: false,
      memberships: [],
      message: error.response?.data?.message || error.message,
    };
  }
};
