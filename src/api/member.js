import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// ============================================================
// 1. FETCH MEMBERSHIP LIST
// ============================================================
export const fetchMembersList = async (filters = {}) => {
  try {
    console.log('📋 Fetching members list...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
    };

    // Add optional filters
    if (filters.search) {
      queryParams.search = filters.search;
    }
    if (filters.memberType && filters.memberType !== 'All Types') {
      queryParams.memberType = filters.memberType;
    }
    if (filters.status && filters.status !== 'All Status') {
      queryParams.status = filters.status;
    }
    if (filters.citizenship && filters.citizenship !== 'All') {
      queryParams.citizenship = filters.citizenship;
    }

    // Build query string
    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`membership?${queryString}`);

    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      const members = (data?.members || []).map(item => ({
        ...item,
        _id: item._id,
        memberId: item.memberId || '-',
        uniqueId: item.uniqueId || '-',
        acountNo: item.acountNo || '-',
        fullName: item.fullName || '-',
        fatherName: item.fatherName || '-',
        memberType: item.memberType || '-',
        mobileNumber: item.mobileNumber || '-',
        email: item.email || '-',
        address: item.residentialAddress || item.address || '-',
        citizenship: item.citizenship || '-',
        status: item.status || 'Active',
        introducedBy: item.introducedBy || '-',
        membershipDate: item.membershipDate || '-',
        renewDate: item.renewDate || '-',
      }));

      console.log('✅ Members list fetched successfully');
      return {
        success: true,
        members,
        total: data?.total || 0,
        page: data?.page || 1,
        limit: data?.limit || 50,
        totalPages: Math.ceil((data?.total || 0) / (data?.limit || 50)),
      };
    }

    return {
      success: false,
      message: 'Failed to fetch members',
      members: [],
      total: 0,
      totalPages: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching members list:', error);
    return {
      success: false,
      message: error.message || 'Error fetching members',
      members: [],
      total: 0,
      totalPages: 0,
    };
  }
};

// ============================================================
// 2. GET SINGLE MEMBER
// ============================================================
export const getMember = async memberId => {
  try {
    console.log('📄 Fetching member detail...');

    const response = await api.get(`membership/${memberId}`);
    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      console.log('✅ Member detail fetched successfully');
      return {
        success: true,
        member: data,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch member',
    };
  } catch (error) {
    console.error('❌ Error fetching member:', error);
    return {
      success: false,
      message: error.message || 'Error fetching member',
    };
  }
};

// ============================================================
// 3. CREATE MEMBER
// ============================================================
export const createMember = async memberData => {
  try {
    console.log('➕ Creating member...');

    const response = await api.post('membership', memberData);

    if (
      response?.data?.statusCode === 200 ||
      response?.data?.statusCode === 201
    ) {
      console.log('✅ Member created successfully');
      return {
        success: true,
        message: 'Member created successfully',
        member: response?.data?.data,
      };
    }

    return {
      success: false,
      message: response?.data?.message || 'Failed to create member',
    };
  } catch (error) {
    console.error('❌ Error creating member:', error);
    return {
      success: false,
      message: error.message || 'Error creating member',
    };
  }
};

// ============================================================
// 4. UPDATE MEMBER
// ============================================================
export const updateMember = async (memberId, memberData) => {
  try {
    console.log('✏️  Updating member...');

    const response = await api.put(`membership/${memberId}`, memberData);

    if (
      response?.data?.statusCode === 200 ||
      response?.data?.statusCode === 201
    ) {
      console.log('✅ Member updated successfully');
      return {
        success: true,
        message: 'Member updated successfully',
        member: response?.data?.data,
      };
    }

    return {
      success: false,
      message: response?.data?.message || 'Failed to update member',
    };
  } catch (error) {
    console.error('❌ Error updating member:', error);
    return {
      success: false,
      message: error.message || 'Error updating member',
    };
  }
};

// ============================================================
// 5. DELETE MEMBER
// ============================================================
export const deleteMember = async memberId => {
  try {
    console.log('🗑️  Deleting member...');

    const response = await api.delete(`membership/${memberId}`);

    if (
      response?.data?.statusCode === 200 ||
      response?.data?.statusCode === 204
    ) {
      console.log('✅ Member deleted successfully');
      return {
        success: true,
        message: 'Member deleted successfully',
      };
    }

    return {
      success: false,
      message: response?.data?.message || 'Failed to delete member',
    };
  } catch (error) {
    console.error('❌ Error deleting member:', error);
    return {
      success: false,
      message: error.message || 'Error deleting member',
    };
  }
};

// ============================================================
// 6. FETCH MEMBER SUGGESTIONS (For AutoComplete)
// ============================================================
export const fetchMemberSuggestions = async (searchQuery = '') => {
  try {
    console.log('🔍 Fetching member suggestions...');

    let queryParams = 'membership?isPagination=false&limit=20';
    if (searchQuery.trim()) {
      queryParams += `&search=${encodeURIComponent(searchQuery)}`;
    }

    const response = await api.get(queryParams);
    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      const members = (data?.members || []).map(item => ({
        _id: item._id,
        memberId: item.memberId || '-',
        fullName: item.fullName || '-',
      }));

      console.log('✅ Member suggestions fetched:', members.length);
      return {
        success: true,
        members,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch suggestions',
      members: [],
    };
  } catch (error) {
    console.error('❌ Error fetching member suggestions:', error);
    return {
      success: false,
      message: error.message || 'Error fetching suggestions',
      members: [],
    };
  }
};

// ============================================================
// 7. FETCH PAYMENT MODES
// ============================================================
export const fetchPaymentModes = async () => {
  try {
    console.log('💳 Fetching payment modes...');

    const response = await api.get(
      'mode-of-payment?isActive=true&isPagination=false',
    );
    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      const modes = Array.isArray(data?.data) ? data?.data : data || [];

      console.log('✅ Payment modes fetched:', modes.length);
      return {
        success: true,
        modes,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch payment modes',
      modes: [],
    };
  } catch (error) {
    console.error('❌ Error fetching payment modes:', error);
    return {
      success: false,
      message: error.message || 'Error fetching payment modes',
      modes: [],
    };
  }
};

// ============================================================
// 8. FETCH MEMBERSHIP DASHBOARD (Stats)
// ============================================================
export const fetchMembershipDashboard = async () => {
  try {
    console.log('📊 Fetching membership dashboard...');

    const response = await api.get('membership/getMembershipDashboard');
    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      // Transform membershipStats array into object with memberType as key
      const statsArray = data?.membershipStats || [];
      const statsObject = {};

      statsArray.forEach(stat => {
        statsObject[stat.memberType] = {
          total: stat.totalCount || 0,
          active: stat.statusWise?.Active || 0,
          suspended: stat.statusWise?.Suspended || 0,
          expired: stat.statusWise?.Expired || 0,
        };
      });

      console.log('✅ Membership dashboard fetched');
      return {
        success: true,
        dashboard: data,
        recentMembers: data?.recentMembers || [],
        stats: statsObject,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch dashboard',
      dashboard: null,
      recentMembers: [],
      stats: {},
    };
  } catch (error) {
    console.error('❌ Error fetching dashboard:', error);
    return {
      success: false,
      message: error.message || 'Error fetching dashboard',
      dashboard: null,
      recentMembers: [],
      stats: {},
    };
  }
};
