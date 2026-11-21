import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// ============================================================
// 1. FETCH WAZIFA APPLICATIONS
// ============================================================
export const fetchWazifaApplications = async (filters = {}) => {
  try {
    console.log('📋 Fetching wazifa applications...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
    };

    // Add optional filters
    if (filters.search) {
      queryParams.search = filters.search;
    }
    if (filters.status && filters.status !== 'All Status') {
      queryParams.status = filters.status;
    }
    if (filters.formType && filters.formType !== 'All Types') {
      queryParams.formType = filters.formType;
    }
    if (filters.courseType && filters.courseType !== 'All') {
      queryParams.courseType = filters.courseType;
    }
    // session should be _id from tenure-year API
    if (filters.session && filters.session !== 'All Sessions') {
      queryParams.session = filters.session; // Pass session _id here
    }
    if (filters.fromDate) {
      queryParams.fromDate = filters.fromDate;
    }
    if (filters.toDate) {
      queryParams.toDate = filters.toDate;
    }

    // Build query string
    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`scholarshipForm?${queryString}`);

    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      const applications = (data?.forms || []).map(item => ({
        ...item,
        courseOfStudy: item.courseOfStudy?.name || item.courseOfStudy || '-',
        sessionName: item.session?.name || item.session || '-',
      }));

      console.log('✅ Wazifa applications fetched successfully');
      return {
        success: true,
        applications,
        total: data?.total || 0,
        page: data?.page || 1,
        limit: data?.limit || 10,
        totalPages: Math.ceil((data?.total || 0) / (data?.limit || 10)),
      };
    }

    return {
      success: false,
      message: 'Failed to fetch applications',
      applications: [],
      total: 0,
      totalPages: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching wazifa applications:', error);
    return {
      success: false,
      message: error.message || 'Error fetching applications',
      applications: [],
      total: 0,
      totalPages: 0,
    };
  }
};

// ============================================================
// 2. FETCH COURSES WITH RATES
// ============================================================
export const fetchCoursesWithRates = async (filters = {}) => {
  try {
    console.log('📚 Fetching courses with rates...');

    const queryParams = {
      isPagination: false,
      isActive: true,
    };

    // Add optional filters
    if (filters.session) {
      queryParams.session = filters.session;
    }
    if (filters.courseType) {
      queryParams.courseType = filters.courseType;
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`course-with-rates?${queryString}`);

    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      const courses = Array.isArray(data) ? data : data?.data || [];

      console.log('✅ Courses fetched successfully');
      return {
        success: true,
        courses,
        total: response?.data?.total || courses.length,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch courses',
      courses: [],
      total: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    return {
      success: false,
      message: error.message || 'Error fetching courses',
      courses: [],
      total: 0,
    };
  }
};

// ============================================================
// 3. FETCH SESSIONS / TENURE YEARS
// ============================================================
export const fetchSessions = async () => {
  try {
    console.log('📅 Fetching sessions...');

    const response = await api.get('tenure-year?isPagination=false');
    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      const sessions = Array.isArray(data) ? data : data?.data || [];

      console.log('✅ Sessions fetched successfully');
      return {
        success: true,
        sessions,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch sessions',
      sessions: [],
    };
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    return {
      success: false,
      message: error.message || 'Error fetching sessions',
      sessions: [],
    };
  }
};

// ============================================================
// 4. GET SINGLE WAZIFA APPLICATION
// ============================================================
export const getWazifaApplication = async applicationId => {
  try {
    console.log('📄 Fetching wazifa application detail...');

    const response = await api.get(`scholarshipForm/${applicationId}`);
    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      console.log('✅ Application detail fetched successfully');
      return {
        success: true,
        application: data,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch application',
    };
  } catch (error) {
    console.error('❌ Error fetching application:', error);
    return {
      success: false,
      message: error.message || 'Error fetching application',
    };
  }
};

// ============================================================
// 5. UPDATE WAZIFA APPLICATION STATUS
// ============================================================
export const updateWazifaStatus = async (applicationId, statusData) => {
  try {
    console.log('🔄 Updating wazifa application status...', statusData);

    // Check if it's a status update or disbursed status update
    let endpoint;

    if (statusData.disburseStatus) {
      // Disbursed Status Update Endpoint
      endpoint = `scholarshipForm/${applicationId}/disbursed-status`;
      console.log('📤 Using endpoint: /disbursed-status');
    } else if (statusData.status) {
      // Status Update Endpoint
      endpoint = `scholarshipForm/${applicationId}/status`;
      console.log('📤 Using endpoint: /status');
    } else {
      return {
        success: false,
        message:
          'Invalid payload: must contain either status or disburseStatus',
      };
    }

    const response = await api.patch(endpoint, statusData);

    if (
      response?.data?.statusCode === 200 ||
      response?.data?.statusCode === 201
    ) {
      console.log('✅ Application status updated successfully');
      return {
        success: true,
        message: 'Status updated successfully',
      };
    }

    return {
      success: false,
      message: response?.data?.message || 'Failed to update status',
    };
  } catch (error) {
    console.error('❌ Error updating status:', error);
    return {
      success: false,
      message: error.message || 'Error updating status',
    };
  }
};

// ============================================================
// 6. DELETE WAZIFA APPLICATION
// ============================================================
export const deleteWazifaApplication = async applicationId => {
  try {
    console.log('🗑️  Deleting wazifa application...');

    const response = await api.delete(`scholarshipForm/${applicationId}`);

    if (
      response?.data?.statusCode === 200 ||
      response?.data?.statusCode === 204
    ) {
      console.log('✅ Application deleted successfully');
      return {
        success: true,
        message: 'Application deleted successfully',
      };
    }

    return {
      success: false,
      message: response?.data?.message || 'Failed to delete application',
    };
  } catch (error) {
    console.error('❌ Error deleting application:', error);
    return {
      success: false,
      message: error.message || 'Error deleting application',
    };
  }
};

// ============================================================
// 7. CREATE WAZIFA APPLICATION
// ============================================================
export const createWazifaApplication = async applicationData => {
  try {
    console.log('➕ Creating wazifa application...');

    const response = await api.post('scholarshipForm', applicationData);

    if (
      response?.data?.statusCode === 200 ||
      response?.data?.statusCode === 201
    ) {
      console.log('✅ Application created successfully');
      return {
        success: true,
        message: 'Application created successfully',
        application: response?.data?.data,
      };
    }

    return {
      success: false,
      message: response?.data?.message || 'Failed to create application',
    };
  } catch (error) {
    console.error('❌ Error creating application:', error);
    return {
      success: false,
      message: error.message || 'Error creating application',
    };
  }
};

// ============================================================
// 8. UPDATE WAZIFA APPLICATION
// ============================================================
export const updateWazifaApplication = async (
  applicationId,
  applicationData,
) => {
  try {
    console.log('✏️  Updating wazifa application...');

    const response = await api.put(
      `scholarshipForm/${applicationId}`,
      applicationData,
    );

    if (
      response?.data?.statusCode === 200 ||
      response?.data?.statusCode === 201
    ) {
      console.log('✅ Application updated successfully');
      return {
        success: true,
        message: 'Application updated successfully',
        application: response?.data?.data,
      };
    }

    return {
      success: false,
      message: response?.data?.message || 'Failed to update application',
    };
  } catch (error) {
    console.error('❌ Error updating application:', error);
    return {
      success: false,
      message: error.message || 'Error updating application',
    };
  }
};

// ============================================================
// 9. FETCH VERIFIED/APPROVED WAZIFA APPLICATIONS
// ============================================================
export const fetchVerifiedWazifaApplications = async (filters = {}) => {
  try {
    console.log('📋 Fetching verified wazifa applications...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
      status: 'Approved', // Only approved applications
    };

    if (filters.search) queryParams.search = filters.search;
    if (filters.disbursedStatus)
      queryParams.disbursedStatus = filters.disbursedStatus;
    if (filters.formType && filters.formType !== 'All')
      queryParams.formType = filters.formType;
    if (filters.fromDate) queryParams.fromDate = filters.fromDate;
    if (filters.toDate) queryParams.toDate = filters.toDate;

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`scholarshipForm?${queryString}`);

    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      const applications = (data?.forms || []).map(item => ({
        ...item,
        courseOfStudy: item.courseOfStudy?.name || item.courseOfStudy || '-',
        sessionName: item.session?.name || item.session || '-',
      }));

      console.log('✅ Verified applications fetched successfully');
      return {
        success: true,
        applications,
        total: data?.total || 0,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch verified applications',
      applications: [],
      total: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching verified applications:', error);
    return {
      success: false,
      message: error.message || 'Error fetching verified applications',
      applications: [],
      total: 0,
    };
  }
};

// ============================================================
// 10. FETCH WAZIFA DUE REPORTS
// ============================================================
export const fetchWazifaDueReport = async (filters = {}) => {
  try {
    console.log('📊 Fetching wazifa due report...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
    };

    if (filters.search) queryParams.search = filters.search;
    if (filters.fromDate) queryParams.fromDate = filters.fromDate;
    if (filters.toDate) queryParams.toDate = filters.toDate;

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`wazifa-due-report?${queryString}`);

    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      console.log('✅ Due report fetched successfully');
      return {
        success: true,
        data: data?.reports || data,
        total: data?.total || 0,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch due report',
      data: [],
      total: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching due report:', error);
    return {
      success: false,
      message: error.message || 'Error fetching due report',
      data: [],
      total: 0,
    };
  }
};

// ============================================================
// 11. FETCH WAZIFADAR LEDGER
// ============================================================
export const fetchWazifadarLedger = async (filters = {}) => {
  try {
    console.log('📖 Fetching wazifadar ledger...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
    };

    if (filters.search) queryParams.search = filters.search;
    if (filters.fromDate) queryParams.fromDate = filters.fromDate;
    if (filters.toDate) queryParams.toDate = filters.toDate;

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`ledger-wazifadar?${queryString}`);

    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      console.log('✅ Ledger fetched successfully');
      return {
        success: true,
        ledger: data?.ledger || data,
        total: data?.total || 0,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch ledger',
      ledger: [],
      total: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching ledger:', error);
    return {
      success: false,
      message: error.message || 'Error fetching ledger',
      ledger: [],
      total: 0,
    };
  }
};

// ============================================================
// 12. FETCH WAZIFADAR RECENT TRANSACTIONS
// ============================================================
export const fetchWazifadarTransactions = async (filters = {}) => {
  try {
    console.log('💳 Fetching wazifadar transactions...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
    };

    if (filters.search) queryParams.search = filters.search;
    if (filters.transactionType)
      queryParams.transactionType = filters.transactionType;
    if (filters.fromDate) queryParams.fromDate = filters.fromDate;
    if (filters.toDate) queryParams.toDate = filters.toDate;

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`transactions-wazifadar?${queryString}`);

    const data = response?.data?.data;

    if (response?.data?.statusCode === 200 && data) {
      console.log('✅ Transactions fetched successfully');
      return {
        success: true,
        transactions: data?.transactions || data,
        total: data?.total || 0,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch transactions',
      transactions: [],
      total: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    return {
      success: false,
      message: error.message || 'Error fetching transactions',
      transactions: [],
      total: 0,
    };
  }
};
