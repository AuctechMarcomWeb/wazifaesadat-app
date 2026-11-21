import { createAxiosInstance } from './apiConfig';

const api = createAxiosInstance('');

// ============================================================
// 1. EXECUTIVE MEMBERS (Office Bearers)
// ============================================================
export const getExecutiveMembers = async () => {
  try {
    const response = await api.get('executive-member?isPagination=false');
    const data = response.data;

    if (data.statusCode === 200 && data.data?.members) {
      return {
        success: true,
        members: data.data.members,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch executive members',
    };
  } catch (error) {
    console.error('❌ Error fetching executive members:', error);
    return {
      success: false,
      message: error.message || 'Error fetching executive members',
    };
  }
};

// ============================================================
// 2. OFFICE BEARERS (Designations + Tenure)
// ============================================================
export const getOfficeBearers = async () => {
  try {
    const response = await api.get(
      'office-bearer?isPagination=false&sortBy=recent',
    );
    const data = response.data;

    if (data.statusCode === 200 && data.data?.bearers) {
      return {
        success: true,
        bearers: data.data.bearers,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch office bearers',
    };
  } catch (error) {
    console.error('❌ Error fetching office bearers:', error);
    return {
      success: false,
      message: error.message || 'Error fetching office bearers',
    };
  }
};

// ============================================================
// 3. LOCAL SECRETARIES
// ============================================================
export const getLocalSecretaries = async () => {
  try {
    const response = await api.get('local-secretary?isPagination=false');
    const data = response.data;

    if (data.statusCode === 200 && data.data?.members) {
      return {
        success: true,
        members: data.data.members,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch local secretaries',
    };
  } catch (error) {
    console.error('❌ Error fetching local secretaries:', error);
    return {
      success: false,
      message: error.message || 'Error fetching local secretaries',
    };
  }
};

// ============================================================
// 4. FUND TYPES
// ============================================================
export const getFundTypes = async () => {
  try {
    const response = await api.get(
      'fund-type?isActive=true&isPagination=false',
    );
    const data = response.data;

    if (data.statusCode === 200 && data.data?.fundTypes) {
      return {
        success: true,
        fundTypes: data.data.fundTypes,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch fund types',
    };
  } catch (error) {
    console.error('❌ Error fetching fund types:', error);
    return {
      success: false,
      message: error.message || 'Error fetching fund types',
    };
  }
};

// ============================================================
// 5. PAYMENT MODES
// ============================================================
export const getPaymentModes = async () => {
  try {
    const response = await api.get(
      'mode-of-payment?isActive=true&isPagination=false',
    );
    const data = response.data;

    if (data.statusCode === 200 && data.data?.data) {
      return {
        success: true,
        paymentModes: data.data.data,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch payment modes',
    };
  } catch (error) {
    console.error('❌ Error fetching payment modes:', error);
    return {
      success: false,
      message: error.message || 'Error fetching payment modes',
    };
  }
};

// ============================================================
// 6. MEMBERS (All Members for Collection)
// ============================================================
export const getMembers = async (params = {}) => {
  try {
    const queryString = new URLSearchParams({
      sortBy: params.sortBy || 'recent',
      isPagination:
        params.isPagination !== undefined ? params.isPagination : false,
      page: params.page || 1,
      limit: params.limit || 50,
    }).toString();

    const response = await api.get(`membership?${queryString}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data?.members) {
      return {
        success: true,
        members: data.data.members,
        stats: data.data.stats || {},
      };
    }

    return {
      success: false,
      message: 'Failed to fetch members',
    };
  } catch (error) {
    console.error('❌ Error fetching members:', error);
    return {
      success: false,
      message: error.message || 'Error fetching members',
    };
  }
};

// ============================================================
// 7. CREATE PAYMENT ENTRY (Main Collection API)
// ============================================================
export const createPaymentEntry = async payload => {
  try {
    console.log('📤 Creating payment entry...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await api.post('payment-entry', payload);
    const data = response.data;

    if (data.statusCode === 201 || data.statusCode === 200) {
      console.log('✅ Payment entry created successfully');
      return {
        success: true,
        message: 'Payment recorded successfully',
        data: data.data,
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to create payment entry',
    };
  } catch (error) {
    console.error('❌ Error creating payment entry:', error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to create payment entry',
    };
  }
};

// ============================================================
// 8. FETCH PAYMENTS (List all payments with filters)
// ============================================================
export const fetchPayments = async (filters = {}) => {
  try {
    const queryString = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 10,
      sortBy: filters.sortBy || 'recent',
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
      ...(filters.collectedBy && { collectedBy: filters.collectedBy }),
      ...(filters.paymentMode && { paymentMode: filters.paymentMode }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
      ...(filters.memberCode && { memberCode: filters.memberCode }),
    }).toString();

    const response = await api.get(`payment-entry?${queryString}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data?.payments) {
      return {
        success: true,
        payments: data.data.payments,
        currentPage: data.data.currentPage || 1,
        totalPages: data.data.totalPages || 1,
        totalAmount: data.data.totalAmount || 0,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch payments',
    };
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return {
      success: false,
      message: error.message || 'Error fetching payments',
    };
  }
};

// ============================================================
// 9. GET SINGLE PAYMENT ENTRY
// ============================================================
export const getPaymentEntry = async paymentId => {
  try {
    const response = await api.get(`payment-entry/${paymentId}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      return {
        success: true,
        payment: data.data,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch payment entry',
    };
  } catch (error) {
    console.error('❌ Error fetching payment entry:', error);
    return {
      success: false,
      message: error.message || 'Error fetching payment entry',
    };
  }
};

// ============================================================
// 10. UPDATE PAYMENT ENTRY
// ============================================================
export const updatePaymentEntry = async (paymentId, payload) => {
  try {
    console.log('📝 Updating payment entry...');

    const response = await api.put(`payment-entry/${paymentId}`, payload);
    const data = response.data;

    if (data.statusCode === 200) {
      console.log('✅ Payment entry updated successfully');
      return {
        success: true,
        message: 'Payment updated successfully',
        data: data.data,
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to update payment entry',
    };
  } catch (error) {
    console.error('❌ Error updating payment entry:', error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to update payment entry',
    };
  }
};

// ============================================================
// 11. DELETE PAYMENT ENTRY
// ============================================================
export const deletePaymentEntry = async paymentId => {
  try {
    console.log('🗑️ Deleting payment entry...');

    const response = await api.delete(`payment-entry/${paymentId}`);
    const data = response.data;

    if (data.statusCode === 200) {
      console.log('✅ Payment entry deleted successfully');
      return {
        success: true,
        message: 'Payment deleted successfully',
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to delete payment entry',
    };
  } catch (error) {
    console.error('❌ Error deleting payment entry:', error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Failed to delete payment entry',
    };
  }
};

// ============================================================
// 12. UPLOAD PAYMENT RECEIPT / DOCUMENT
// ============================================================
export const uploadPaymentDocument = async formData => {
  try {
    console.log('📤 Uploading payment document...');

    const response = await api.post('payment-entry/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = response.data;

    if (data.statusCode === 200 || data.statusCode === 201) {
      console.log('✅ Document uploaded successfully');
      return {
        success: true,
        documentUrl: data.data?.documentUrl || data.data?.url,
      };
    }

    return {
      success: false,
      message: 'Failed to upload document',
    };
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    return {
      success: false,
      message: error.message || 'Error uploading document',
    };
  }
};

// ============================================================
// 13. COLLECTION REPORT / SUMMARY
// ============================================================
export const getCollectionReport = async (filters = {}) => {
  try {
    const queryString = new URLSearchParams({
      fromDate: filters.fromDate || '',
      toDate: filters.toDate || '',
      collectedBy: filters.collectedBy || '',
      paymentMode: filters.paymentMode || '',
    }).toString();

    const response = await api.get(`payment-entry/report?${queryString}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      return {
        success: true,
        report: data.data,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch collection report',
    };
  } catch (error) {
    console.error('❌ Error fetching collection report:', error);
    return {
      success: false,
      message: error.message || 'Error fetching collection report',
    };
  }
};

// ============================================================
// 16. COLLECTION REPORT WITH PAGINATION & FILTERS
// ============================================================
export const fetchCollectionReportData = async (filters = {}) => {
  try {
    console.log('📊 Fetching collection report data...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
      ...(filters.collectedBy && { collectedBy: filters.collectedBy }),
      ...(filters.search && { search: filters.search }),
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(
      `payment-entry/collection-report?${queryString}`,
    );
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      console.log('✅ Collection report fetched successfully');
      return {
        success: true,
        docs: data.data?.docs || [],
        fundTypes: data.data?.fundTypes || [],
        grandTotals: data.data?.grandTotals || {},
        overallTotal: data.data?.overallTotal || 0,
        members: data.data?.members || [],
        anonymousDonors: data.data?.Anonymousdonors || [],
        total: data.data?.total || 0,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch collection report',
      docs: [],
      fundTypes: [],
      grandTotals: {},
      overallTotal: 0,
      members: [],
      anonymousDonors: [],
    };
  } catch (error) {
    console.error('❌ Error fetching collection report data:', error);
    return {
      success: false,
      message: error.message || 'Error fetching collection report',
      docs: [],
      fundTypes: [],
      grandTotals: {},
      overallTotal: 0,
      members: [],
      anonymousDonors: [],
    };
  }
};

// ============================================================
// 14. SEARCH MEMBERS BY NAME OR CODE
// ============================================================
export const searchMembers = async searchTerm => {
  try {
    const response = await api.get(
      `membership/search?q=${encodeURIComponent(searchTerm)}`,
    );
    const data = response.data;

    if (data.statusCode === 200 && data.data?.members) {
      return {
        success: true,
        members: data.data.members,
      };
    }

    return {
      success: false,
      message: 'No members found',
    };
  } catch (error) {
    console.error('❌ Error searching members:', error);
    return {
      success: false,
      message: error.message || 'Error searching members',
    };
  }
};

// ============================================================
// 15. GET COLLECTED BY OPTIONS (Collectors/Users)
// ============================================================
export const getCollectors = async () => {
  try {
    // Get executive members, office bearers, and local secretaries
    const [executiveRes, bearersRes, secretariesRes] = await Promise.all([
      getExecutiveMembers(),
      getOfficeBearers(),
      getLocalSecretaries(),
    ]);

    const collectorMap = new Map(); // Use Map to avoid duplicates

    // Add executive members
    if (executiveRes.success && executiveRes.members) {
      executiveRes.members.forEach(m => {
        const key = m._id; // Use _id as unique key
        if (!collectorMap.has(key)) {
          collectorMap.set(key, {
            _id: m._id,
            name: m.name,
            type: 'Executive Member',
            memberId: m.memberId,
            city: m.city,
          });
        }
      });
    }

    // Add office bearers
    if (bearersRes.success && bearersRes.bearers) {
      bearersRes.bearers.forEach(b => {
        const key = b._id;
        if (!collectorMap.has(key)) {
          collectorMap.set(key, {
            _id: b._id,
            name: b.name,
            type: 'Office Bearer',
            designation: b.designation?.name,
          });
        }
      });
    }

    // Add local secretaries
    if (secretariesRes.success && secretariesRes.members) {
      secretariesRes.members.forEach(s => {
        const key = s._id;
        if (!collectorMap.has(key)) {
          collectorMap.set(key, {
            _id: s._id,
            name: s.name,
            type: 'Local Secretary',
            memberId: s.memberId,
            city: s.city,
          });
        }
      });
    }

    const collectors = Array.from(collectorMap.values());

    console.log('✅ Collectors loaded (no duplicates):', collectors.length);

    return {
      success: true,
      collectors,
    };
  } catch (error) {
    console.error('❌ Error fetching collectors:', error);
    return {
      success: false,
      message: error.message || 'Error fetching collectors',
    };
  }
};

// ============================================================
// HELPER: Prepare Payment Payload
// ============================================================
export const preparePaymentPayload = formData => {
  return {
    date: formData.date, // YYYY-MM-DD
    regNo: formData.regNo || '',
    receiptNo: formData.receiptNo || '',
    tallyNo: formData.tallyNo || '',
    collectedBy: formData.collectedBy,
    collectedByMemberId: formData.collectedByMemberId || '',
    paymentMode: formData.paymentMode,
    amountDetails: (formData.funds || []).map(f => ({
      fundType: f.type,
      amount: parseFloat(f.amount),
      paymentType: 'memberPayment',
    })),
    isAnonymous: formData.isAnonymous || false,
    memberCode: formData.memberCode || '',
    memberName: formData.memberName || '',
    memberType: formData.memberType || '',
    address: formData.address || '',
    city: formData.city || '',
    country: formData.country || 'India',
    remarks: formData.remarks || '',
  };
};

// ============================================================
// 19. GET REFERRAL LINK PEOPLE (Office Bearers, Executives, Secretaries)
// ============================================================
export const getReferralLinkPeople = async (filters = {}) => {
  try {
    console.log('👥 Fetching referral link people...');

    const queryParams = {
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : false,
      page: filters.page || 1,
      limit: filters.limit || 100,
      sortBy: filters.sortBy || 'recent',
    };

    const queryString = new URLSearchParams(queryParams).toString();

    // Get data from three sources: office bearers, executives, and local secretaries
    const [bearersResponse, executiveResponse, secretariesResponse] =
      await Promise.all([
        api.get(`office-bearer?${queryString}`),
        api.get(`executive-member?${queryString}`),
        api.get(`local-secretary?${queryString}`),
      ]);

    const bearers = bearersResponse?.data?.data?.bearers || [];
    const executives = executiveResponse?.data?.data?.members || [];
    const secretaries = secretariesResponse?.data?.data?.members || [];

    // Combine all into one list with proper formatting
    const allPeople = [
      ...bearers.map(b => ({
        _id: b._id,
        id: b._id,
        name: b.name,
        designation: b.designation?.name || 'Office Bearer',
        city: b.city || '',
        type: 'office-bearer',
        phone: b.phone || b.mobileNumber || '',
        source: 'office-bearer',
      })),
      ...executives.map(e => ({
        _id: e._id,
        id: e._id,
        name: e.name,
        designation: 'Executive Member',
        city: e.city || '',
        type: 'executive-member',
        phone: e.phone || e.mobileNumber || '',
        memberId: e.memberId,
        source: 'executive-member',
      })),
      ...secretaries.map(s => ({
        _id: s._id,
        id: s._id,
        name: s.name,
        designation: 'Local Secretary',
        city: s.city || '',
        type: 'local-secretary',
        phone: s.phone || s.mobileNumber || '',
        memberId: s.memberId,
        source: 'local-secretary',
      })),
    ];

    console.log('✅ Referral people fetched successfully');
    return {
      success: true,
      people: allPeople,
      total: allPeople.length,
    };
  } catch (error) {
    console.error('❌ Error fetching referral people:', error);
    return {
      success: false,
      message: error.message || 'Error fetching referral people',
      people: [],
      total: 0,
    };
  }
};

// ============================================================
// INCOME & EXPENDITURE SUMMARY FUNCTIONS
// ============================================================

/**
 * Fetch Income & Expenditure Statements with filters
 * @param {Object} filters - Filter parameters
 * @param {string} filters.fromDate - From date (YYYY-MM-DD)
 * @param {string} filters.toDate - To date (YYYY-MM-DD)
 * @param {string} filters.status - Status filter (Draft, Submitted, Approved)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Records per page (default: 50)
 * @returns {Promise} Statements data
 */
export const fetchIncomeExpenditureStatements = async (filters = {}) => {
  try {
    console.log('📊 Fetching Income & Expenditure statements...', filters);

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      isPagination: filters.isPagination !== undefined ? filters.isPagination : true,
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
      ...(filters.status && filters.status !== 'All Status' && { status: filters.status }),
    };

    // Remove empty params
    Object.keys(queryParams).forEach(key => !queryParams[key] && delete queryParams[key]);

    const queryString = new URLSearchParams(queryParams).toString();
    console.log('Query string:', queryString);

    const response = await api.get(`income-expendature?${queryString}`);
    const data = response.data;

    console.log('✅ Raw response:', data);

    // Handle different response formats
    if (data.statusCode === 200 && data.data) {
      console.log('✅ Income & Expenditure statements fetched (format 1)');
      return {
        success: true,
        statements: data.data.statements || [],
        total: data.data.total || 0,
        totalPages: data.data.totalPages || 1,
        currentPage: data.data.currentPage || 1,
      };
    }

    // Alternative format: direct array response
    if (Array.isArray(data)) {
      console.log('✅ Income & Expenditure statements fetched (format 2 - array)');
      return {
        success: true,
        statements: data,
        total: data.length,
        totalPages: 1,
        currentPage: 1,
      };
    }

    // Alternative format: data.data is array
    if (Array.isArray(data.data)) {
      console.log('✅ Income & Expenditure statements fetched (format 3 - data.data array)');
      return {
        success: true,
        statements: data.data,
        total: data.data.length,
        totalPages: 1,
        currentPage: 1,
      };
    }

    console.log('⚠️ Unexpected response format:', data);

    return {
      success: false,
      message: 'Failed to fetch Income & Expenditure statements - unexpected format',
      statements: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
    };
  } catch (error) {
    console.error('❌ Error fetching Income & Expenditure statements:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error fetching statements',
      statements: [],
      total: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
};

/**
 * Get single Income & Expenditure Statement
 * @param {string} statementId - Statement ID
 * @returns {Promise} Statement data
 */
export const getIncomeExpenditureStatement = async (statementId) => {
  try {
    console.log('📄 Fetching Income & Expenditure statement...');

    const response = await api.get(`income-expendature/${statementId}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      console.log('✅ Statement fetched successfully');
      return {
        success: true,
        statement: data.data,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch statement',
      statement: null,
    };
  } catch (error) {
    console.error('❌ Error fetching statement:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error fetching statement',
      statement: null,
    };
  }
};

/**
 * Create new Income & Expenditure Statement
 * @param {Object} payload - Statement data
 * @returns {Promise} Created statement
 */
export const createIncomeExpenditureStatement = async (payload) => {
  try {
    console.log('📝 Creating Income & Expenditure statement...');

    const response = await api.post('income-expendature', payload);
    const data = response.data;

    if (data.statusCode === 201 || data.statusCode === 200) {
      console.log('✅ Statement created successfully');
      return {
        success: true,
        message: 'Statement created successfully',
        statement: data.data,
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to create statement',
      statement: null,
    };
  } catch (error) {
    console.error('❌ Error creating statement:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to create statement',
      statement: null,
    };
  }
};

/**
 * Update Income & Expenditure Statement
 * @param {string} statementId - Statement ID
 * @param {Object} payload - Updated data
 * @returns {Promise} Updated statement
 */
export const updateIncomeExpenditureStatement = async (statementId, payload) => {
  try {
    console.log('✏️ Updating Income & Expenditure statement...');

    const response = await api.put(`income-expendature/${statementId}`, payload);
    const data = response.data;

    if (data.statusCode === 200) {
      console.log('✅ Statement updated successfully');
      return {
        success: true,
        message: 'Statement updated successfully',
        statement: data.data,
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to update statement',
      statement: null,
    };
  } catch (error) {
    console.error('❌ Error updating statement:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to update statement',
      statement: null,
    };
  }
};

/**
 * Delete Income & Expenditure Statement
 * @param {string} statementId - Statement ID
 * @returns {Promise} Success response
 */
export const deleteIncomeExpenditureStatement = async (statementId) => {
  try {
    console.log('🗑️ Deleting Income & Expenditure statement...');

    const response = await api.delete(`income-expendature/${statementId}`);
    const data = response.data;

    if (data.statusCode === 200) {
      console.log('✅ Statement deleted successfully');
      return {
        success: true,
        message: 'Statement deleted successfully',
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to delete statement',
    };
  } catch (error) {
    console.error('❌ Error deleting statement:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to delete statement',
    };
  }
};


export const buildReferralUrl = (person, fundType = 'corpus') => {
  const BASE_CORPUS = 'https://wazifaesadat.org/';
  const BASE_MEMBERSHIP = 'https://wazifaesadat.in/MakeaDonationorPayKhums';

  const id = person?._id || person?.id || '';
  const name = encodeURIComponent(person?.name || person?.fullName || '');

  if (fundType === 'membership' || fundType === 'donation') {
    return `${BASE_MEMBERSHIP}?ref=${id}&refName=${name}`;
  }

  // Default to corpus
  return `${BASE_CORPUS}?ref=${id}&refName=${name}`;
};

// ============================================================
// PAYMENTS API
// ============================================================
export const fetchPaymentsList = async (filters = {}) => {
  try {
    console.log('👤 Fetching payments list...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
      search: filters.search || '',
      paymentStatus: filters.paymentStatus || '',
      paymentGateway: filters.paymentGateway || '',
      fromDate: filters.fromDate || '',
      toDate: filters.toDate || '',
    };

    // Remove empty params
    Object.keys(queryParams).forEach(
      key => !queryParams[key] && delete queryParams[key],
    );

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`payment?${queryString}`);

    const payments = response?.data?.data?.data || [];
    const total = response?.data?.data?.total || 0;
    const totalPages = response?.data?.data?.totalPages || 1;
    const currentPage = response?.data?.data?.currentPage || 1;

    console.log('✅ Payments fetched successfully');
    return {
      success: true,
      payments,
      total,
      totalPages,
      currentPage,
    };
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return {
      success: false,
      message: error.message || 'Error fetching payments',
      payments: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
};

// ============================================================
// MEMBER COLLECTION REPORTS API
// ============================================================
export const fetchMemberCollectionReports = async (filters = {}) => {
  try {
    console.log('📊 Fetching member collection reports...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
      search: filters.search || '',
    };

    // Add date filters if provided
    if (filters.fromDate) {
      queryParams.fromDate = filters.fromDate;
    }
    if (filters.toDate) {
      queryParams.toDate = filters.toDate;
    }
    if (filters.status && filters.status !== 'All Status') {
      queryParams.status = filters.status;
    }

    // Remove empty params
    Object.keys(queryParams).forEach(
      key => !queryParams[key] && delete queryParams[key],
    );

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`member-collection-reports?${queryString}`);

    const reports = response?.data?.data?.reports || [];
    const totalReports = response?.data?.data?.totalReports || 0;
    const totalPages = response?.data?.data?.totalPages || 1;
    const currentPage = response?.data?.data?.currentPage || 1;

    console.log('✅ Collection reports fetched successfully');
    return {
      success: true,
      reports,
      totalReports,
      totalPages,
      currentPage,
    };
  } catch (error) {
    console.error('❌ Error fetching collection reports:', error);
    return {
      success: false,
      message: error.message || 'Error fetching collection reports',
      reports: [],
      totalReports: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
};

export const createMemberCollectionReport = async reportData => {
  try {
    console.log('📝 Creating member collection report...');

    const response = await api.post('member-collection-reports', reportData);

    const report = response?.data?.data || {};

    console.log('✅ Collection report created successfully');
    return {
      success: true,
      report,
      message: 'Report created successfully',
    };
  } catch (error) {
    console.error('❌ Error creating collection report:', error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Error creating report',
      report: null,
    };
  }
};

// ============================================================
// HELPER: Format collectors for display (name + type)
// ============================================================
export const formatCollectorsForDisplay = collectors => {
  return collectors.map(c => ({
    _id: c._id,
    displayName: `${c.name} (${c.type})`,
    name: c.name,
    type: c.type,
  }));
};

// ============================================================
// HELPER: Format fund types for display
// ============================================================
export const formatFundTypesForDisplay = fundTypes => {
  return fundTypes.map(f => ({
    _id: f._id,
    displayName: f.title,
    title: f.title,
    amount: f.amount,
  }));
};

// ============================================================
// 17. SEARCH SCHOLARSHIP FORMS / WAZIFA
// ============================================================
export const searchScholarshipForms = async (searchTerm = '', options = {}) => {
  try {
    console.log('🔍 Searching scholarship forms...');

    const queryParams = {
      search: searchTerm,
      isPagination:
        options.isPagination !== undefined ? options.isPagination : true,
      limit: options.limit || 20,
      sortBy: options.sortBy || 'recent',
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`scholarshipForm?${queryString}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data?.forms) {
      console.log('✅ Scholarship forms fetched successfully');
      return {
        success: true,
        forms: data.data.forms,
        currentPage: data.data.currentPage || 1,
        totalPages: data.data.totalPages || 1,
        total: data.data.total || 0,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch scholarship forms',
      forms: [],
    };
  } catch (error) {
    console.error('❌ Error searching scholarship forms:', error);
    return {
      success: false,
      message: error.message || 'Error searching scholarship forms',
      forms: [],
    };
  }
};

// ============================================================
// 18. FETCH WAZIFA LEDGER (Ledger of Wazifadar)
// ============================================================
export const fetchWazifaLedger = async (filters = {}) => {
  try {
    console.log('📊 Fetching wazifa ledger...');

    const queryParams = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      sortBy: filters.sortBy || 'recent',
      isPagination:
        filters.isPagination !== undefined ? filters.isPagination : true,
      paymentType: 'wazifaPayment',
      ...(filters.search && { search: filters.search }),
      ...(filters.wazifaNumber && { wazifaNumber: filters.wazifaNumber }),
      ...(filters.paymentMode && { paymentMode: filters.paymentMode }),
      ...(filters.status && { status: filters.status }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const response = await api.get(`payment-entry?${queryString}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      console.log('✅ Wazifa ledger fetched successfully');

      // Calculate credit/debit totals
      let totalCredit = 0;
      let totalDebit = 0;
      const ledgerData = data.data.data || [];

      ledgerData.forEach(row => {
        const amount = Number(row.amount) || 0;
        if (row.paymentEntryType === 'credit') {
          totalCredit += amount;
        } else if (row.paymentEntryType === 'debit') {
          totalDebit += amount;
        }
      });

      return {
        success: true,
        ledger: ledgerData,
        currentPage: data.data.currentPage || 1,
        totalPages: data.data.totalPages || 1,
        total: data.data.total || 0,
        totalCredit,
        totalDebit,
        balance: totalDebit - totalCredit,
      };
    }

    return {
      success: false,
      message: 'Failed to fetch wazifa ledger',
      ledger: [],
      totalCredit: 0,
      totalDebit: 0,
      balance: 0,
    };
  } catch (error) {
    console.error('❌ Error fetching wazifa ledger:', error);
    return {
      success: false,
      message: error.message || 'Error fetching wazifa ledger',
      ledger: [],
      totalCredit: 0,
      totalDebit: 0,
      balance: 0,
    };
  }
};

/* ═══════════════════════════════════════════════════════
   INCOME & EXPENDITURE FORM HELPER FUNCTIONS
═══════════════════════════════════════════════════════ */

/**
 * Get Opening Balance for Income & Expenditure form
 * @returns {Promise} Opening balance data
 */
export const getOpeningBalance = async () => {
  try {
    console.log('💰 Fetching opening balance...');

    const response = await api.get('income-expendature/opening-balance');
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      console.log('✅ Opening balance fetched');
      return {
        success: true,
        openingBalance: data.data.openingBalance || 0,
        previousStatementDate: data.data.previousStatementDate || '',
      };
    }

    return {
      success: false,
      message: 'Failed to fetch opening balance',
      openingBalance: 0,
      previousStatementDate: '',
    };
  } catch (error) {
    console.error('❌ Error fetching opening balance:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error fetching opening balance',
      openingBalance: 0,
      previousStatementDate: '',
    };
  }
};

/**
 * Get Fund Type Report (Income data for date range)
 * @param {string} fromDate - From date (YYYY-MM-DD)
 * @param {string} toDate - To date (YYYY-MM-DD)
 * @returns {Promise} Income data by fund type
 */
export const getFundTypeReport = async (fromDate, toDate) => {
  try {
    console.log('📊 Fetching fund type report...');

    const queryString = new URLSearchParams({
      fromDate,
      toDate,
    }).toString();

    const response = await api.get(`payment-entry/fund-type-report?${queryString}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      console.log('✅ Fund type report fetched');
      return {
        success: true,
        fundTypes: data.data.fundTypes || [],
        summary: data.data.summary || { grandTotal: 0 },
      };
    }

    return {
      success: false,
      message: 'Failed to fetch fund type report',
      fundTypes: [],
      summary: { grandTotal: 0 },
    };
  } catch (error) {
    console.error('❌ Error fetching fund type report:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error fetching fund type report',
      fundTypes: [],
      summary: { grandTotal: 0 },
    };
  }
};

/**
 * Get Expenditure Report (Expense data for date range)
 * @param {string} fromDate - From date (YYYY-MM-DD)
 * @param {string} toDate - To date (YYYY-MM-DD)
 * @returns {Promise} Expenditure data by expense type
 */
export const getExpenditureReport = async (fromDate, toDate) => {
  try {
    console.log('📊 Fetching expenditure report...');

    const queryString = new URLSearchParams({
      fromDate,
      toDate,
    }).toString();

    const response = await api.get(`expenditures/report?${queryString}`);
    const data = response.data;

    if (data.statusCode === 200 && data.data) {
      console.log('✅ Expenditure report fetched');
      return {
        success: true,
        expenses: data.data.expenses || [],
        summary: data.data.summary || { grandTotal: 0 },
      };
    }

    return {
      success: false,
      message: 'Failed to fetch expenditure report',
      expenses: [],
      summary: { grandTotal: 0 },
    };
  } catch (error) {
    console.error('❌ Error fetching expenditure report:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Error fetching expenditure report',
      expenses: [],
      summary: { grandTotal: 0 },
    };
  }
};
