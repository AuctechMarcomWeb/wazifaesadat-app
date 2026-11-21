import { createAxiosInstance } from './apiConfig';

const dashboardApi = createAxiosInstance('dashboard');

/**
 * Get Admin Dashboard Data
 * Returns members, scholarships, disbursed status, fund summary, and collection data
 * @param {number} year - The year for dashboard data (e.g., 2026)
 * @returns { success, data, message }
 */
export const getAdminDashboard = async (year = new Date().getFullYear()) => {
  try {
    const response = await dashboardApi.get(`/admin?year=${year}`);

    if (response.data.success && response.data.data) {
      const dashboardData = response.data.data;
      
      console.log('✅ Admin Dashboard API Response:');
      console.log('   - Total Members:', dashboardData.members?.total?.totalMembers);
      console.log('   - Active Members:', dashboardData.members?.total?.activeMembers);
      console.log('   - Total Scholarships:', dashboardData.scholarships?.totalScholarships);
      console.log('   - Total Collection:', dashboardData.fundSummary?.totalCollection1);
      
      return {
        success: true,
        data: dashboardData,
        message: response.data.message,
      };
    }
    
    console.warn('Dashboard API error:', response.data.message);
    return { success: false, message: response.data.message || 'Failed to fetch dashboard' };
  } catch (error) {
    console.error('Dashboard error:', error.message);
    console.error('Dashboard error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error',
    };
  }
};

/**
 * Get Dashboard Members Data
 * @param {number} year - The year for data
 * @returns { success, members, message }
 */
export const getDashboardMembers = async (year = new Date().getFullYear()) => {
  try {
    const response = await dashboardApi.get(`/admin?year=${year}`);
    
    if (response.data.success && response.data.data?.members) {
      const membersData = response.data.data.members;
      
      console.log('✅ Members Data:');
      console.log('   - Total:', membersData.total?.totalMembers);
      console.log('   - Active:', membersData.total?.activeMembers);
      console.log('   - Suspended:', membersData.total?.suspendedMembers);
      console.log('   - Expired:', membersData.total?.expiredMembers);
      
      return {
        success: true,
        members: membersData,
        message: response.data.message,
      };
    }
    
    return { success: false, message: 'Failed to fetch members data' };
  } catch (error) {
    console.error('Members data error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Dashboard Scholarships Data
 * @param {number} year - The year for data
 * @returns { success, scholarships, message }
 */
export const getDashboardScholarships = async (year = new Date().getFullYear()) => {
  try {
    const response = await dashboardApi.get(`/admin?year=${year}`);
    
    if (response.data.success && response.data.data?.scholarships) {
      const scholarshipsData = response.data.data.scholarships;
      
      console.log('✅ Scholarships Data:');
      console.log('   - Total:', scholarshipsData.totalScholarships);
      console.log('   - Pending:', scholarshipsData.pendingScholarships);
      console.log('   - Approved:', scholarshipsData.approvedScholarships);
      console.log('   - Rejected:', scholarshipsData.rejectedScholarships);
      
      return {
        success: true,
        scholarships: scholarshipsData,
        message: response.data.message,
      };
    }
    
    return { success: false, message: 'Failed to fetch scholarships data' };
  } catch (error) {
    console.error('Scholarships data error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Dashboard Fund Summary Data
 * @param {number} year - The year for data
 * @returns { success, fundSummary, message }
 */
export const getDashboardFundSummary = async (year = new Date().getFullYear()) => {
  try {
    const response = await dashboardApi.get(`/admin?year=${year}`);
    
    if (response.data.success && response.data.data?.fundSummary) {
      const fundData = response.data.data.fundSummary;
      
      console.log('✅ Fund Summary Data:');
      console.log('   - Total Collection:', fundData.totalCollection1);
      console.log('   - Corpus Fund:', fundData.corpusFund);
      console.log('   - Reserve Fund:', fundData.reserveFund);
      console.log('   - Membership Donation:', fundData.membershipDonation);
      console.log('   - Others:', fundData.others);
      
      return {
        success: true,
        fundSummary: fundData,
        message: response.data.message,
      };
    }
    
    return { success: false, message: 'Failed to fetch fund summary data' };
  } catch (error) {
    console.error('Fund summary error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Dashboard Collection Data with Monthly Graph
 * @param {number} year - The year for data
 * @returns { success, collection, message }
 */
export const getDashboardCollection = async (year = new Date().getFullYear()) => {
  try {
    const response = await dashboardApi.get(`/admin?year=${year}`);
    
    if (response.data.success && response.data.data?.collection) {
      const collectionData = response.data.data.collection;
      
      console.log('✅ Collection Data:');
      console.log('   - Total Collection:', collectionData.totalCollection);
      console.log('   - Monthly Graph Points:', collectionData.monthlyGraph?.length);
      
      return {
        success: true,
        collection: collectionData,
        message: response.data.message,
      };
    }
    
    return { success: false, message: 'Failed to fetch collection data' };
  } catch (error) {
    console.error('Collection data error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Dashboard Disbursed Status
 * @param {number} year - The year for data
 * @returns { success, disbursedStatus, message }
 */
export const getDashboardDisbursedStatus = async (year = new Date().getFullYear()) => {
  try {
    const response = await dashboardApi.get(`/admin?year=${year}`);
    
    if (response.data.success && response.data.data?.disbursedStatus) {
      const statusData = response.data.data.disbursedStatus;
      
      console.log('✅ Disbursed Status:');
      console.log('   - Pending:', statusData.pending);
      console.log('   - Disbursed:', statusData.disbursed);
      console.log('   - Returned:', statusData.returned);
      console.log('   - Resend:', statusData.resend);
      
      return {
        success: true,
        disbursedStatus: statusData,
        message: response.data.message,
      };
    }
    
    return { success: false, message: 'Failed to fetch disbursed status' };
  } catch (error) {
    console.error('Disbursed status error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Dashboard for Super Admin
 * Returns the same data as admin dashboard but accessible to super admin role
 * @param {number} year - The year for dashboard data
 * @returns { success, data, message }
 */
export const getSuperAdminDashboard = async (year = new Date().getFullYear()) => {
  try {
    const response = await dashboardApi.get(`/admin?year=${year}`);

    if (response.data.success && response.data.data) {
      const dashboardData = response.data.data;
      
      console.log('✅ Super Admin Dashboard API Response:');
      console.log('   - Total Members:', dashboardData.members?.total?.totalMembers);
      console.log('   - Active Members:', dashboardData.members?.total?.activeMembers);
      console.log('   - Total Scholarships:', dashboardData.scholarships?.totalScholarships);
      
      return {
        success: true,
        data: dashboardData,
        message: response.data.message,
      };
    }
    
    return { success: false, message: response.data.message || 'Failed to fetch dashboard' };
  } catch (error) {
    console.error('Super Admin Dashboard error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error',
    };
  }
};
