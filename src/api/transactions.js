import { createAxiosInstance } from './apiConfig';

/**
 * Fetch Transactions / Payment Entries
 * Fetches payment entries with comprehensive filtering and pagination
 * Uses GET /api/payment-entry endpoint
 * @param {object} filters - Filter parameters
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - search: Search by member name, code (optional)
 *   - memberCode: Filter by member code (optional)
 *   - paymentMode: Filter by payment mode - Cash, UPI, Cheque, RTGS, NEFT (optional)
 *   - fundType: Filter by fund type ID (optional)
 *   - fromDate: Start date in YYYY-MM-DD format (optional)
 *   - toDate: End date in YYYY-MM-DD format (optional)
 *   - paymentType: Filter by payment type - memberPayment, donation (optional)
 *   - sortBy: Sort order - recent, oldest, highest, lowest (default: recent)
 * @returns { success, transactions, totalAmount, totalPages, currentPage, totalTransactions, message }
 */
export const fetchTransactions = async (filters = {}) => {
  try {
    const transactionApi = createAxiosInstance('payment-entry');

    // Build query string
    const queryParts = [];
    queryParts.push(`page=${filters.page || 1}`);
    queryParts.push(`limit=${filters.limit || 10}`);
    queryParts.push('isPagination=true');
    queryParts.push(`sortBy=${filters.sortBy || 'recent'}`);

    // Add optional filters
    if (filters.search) {
      queryParts.push(`search=${encodeURIComponent(filters.search)}`);
    }

    if (filters.memberCode) {
      queryParts.push(`memberCode=${encodeURIComponent(filters.memberCode)}`);
    }

    if (filters.paymentMode && filters.paymentMode !== 'All Modes') {
      queryParts.push(`paymentMode=${encodeURIComponent(filters.paymentMode)}`);
    }

    if (filters.fundType && filters.fundType !== 'All Fund Types') {
      queryParts.push(`fundType=${encodeURIComponent(filters.fundType)}`);
    }

    if (filters.fromDate) {
      queryParts.push(`fromDate=${encodeURIComponent(filters.fromDate)}`);
    }

    if (filters.toDate) {
      queryParts.push(`toDate=${encodeURIComponent(filters.toDate)}`);
    }

    if (filters.paymentType) {
      queryParts.push(`paymentType=${encodeURIComponent(filters.paymentType)}`);
    }

    const queryString = queryParts.join('&');
    console.log('📋 Fetching transactions with query:', queryString);

    const response = await transactionApi.get(`?${queryString}`);

    if (response.data.statusCode === 200 && response.data.data?.data) {
      const transactions = response.data.data.data.map(txn => ({
        id: txn._id,
        memberName: txn.memberName || (txn.isAnonymous ? 'Anonymous' : 'N/A'),
        memberCode: txn.memberCode || 'N/A',
        memberType: txn.memberType || 'N/A',
        fundType: txn.fundType?.title || 'N/A',
        fundTypeId: txn.fundType?._id,
        amount: txn.amount,
        paymentMode: txn.paymentMode,
        collectedBy: txn.collectedBy,
        date: txn.date,
        receiptNo: txn.receiptNo,
        tallyNo: txn.tallyNo,
        remarks: txn.remarks,
        address: txn.address,
        city: txn.city,
        country: txn.country,
        isAnonymous: txn.isAnonymous,
        paymentStatus: txn.paymentStatus,
        paymentType: txn.paymentType,
        contributeType: txn.contributeType,
        createdAt: txn.createdAt,
        updatedAt: txn.updatedAt,
      }));

      console.log('✅ Transactions Fetched:');
      console.log('   - Count:', transactions.length);
      console.log('   - Total Amount:', response.data.data.totalAmount);
      console.log('   - Page:', response.data.data.currentPage);

      return {
        success: true,
        transactions,
        totalAmount: response.data.data.totalAmount || 0,
        totalPages: response.data.data.totalPages || 0,
        currentPage: response.data.data.currentPage || 1,
        totalTransactions: response.data.data.totalTransactions || 0,
        message: 'Transactions fetched successfully',
      };
    }

    return {
      success: false,
      transactions: [],
      totalAmount: 0,
      totalPages: 0,
      currentPage: 1,
      totalTransactions: 0,
      message: response.data.message || 'Failed to fetch transactions',
    };
  } catch (error) {
    console.error('❌ Fetch transactions error:', error.message);
    return {
      success: false,
      transactions: [],
      totalAmount: 0,
      totalPages: 0,
      currentPage: 1,
      totalTransactions: 0,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Transaction Detail
 * Fetches complete details of a single transaction
 * @param {string} transactionId - Transaction ID
 * @returns { success, transaction, message }
 */
export const getTransactionDetail = async transactionId => {
  try {
    if (!transactionId) {
      return {
        success: false,
        transaction: null,
        message: 'Transaction ID is required',
      };
    }

    const transactionApi = createAxiosInstance('payment-entry');
    const response = await transactionApi.get(`/${transactionId}`);

    if (response.data.statusCode === 200 && response.data.data) {
      const txn = response.data.data;
      const transaction = {
        id: txn._id,
        memberName: txn.memberName || (txn.isAnonymous ? 'Anonymous' : 'N/A'),
        memberCode: txn.memberCode || 'N/A',
        memberType: txn.memberType || 'N/A',
        fundType: txn.fundType?.title || 'N/A',
        fundTypeId: txn.fundType?._id,
        amount: txn.amount,
        paymentMode: txn.paymentMode,
        collectedBy: txn.collectedBy,
        collectedByMemberId: txn.collectedByMemberId,
        date: txn.date,
        receiptNo: txn.receiptNo,
        tallyNo: txn.tallyNo,
        remarks: txn.remarks,
        address: txn.address,
        city: txn.city,
        country: txn.country,
        isAnonymous: txn.isAnonymous,
        paymentStatus: txn.paymentStatus,
        paymentType: txn.paymentType,
        contributeType: txn.contributeType,
        wazifaName: txn.wazifaName,
        wazifaNumber: txn.wazifaNumber,
        accountNo: txn.accountNo,
        regitorNo: txn.regitorNo,
        createdAt: txn.createdAt,
        updatedAt: txn.updatedAt,
      };

      console.log('✅ Transaction Detail Fetched:', txn._id);

      return {
        success: true,
        transaction,
        message: 'Transaction detail fetched successfully',
      };
    }

    return {
      success: false,
      transaction: null,
      message: response.data.message || 'Failed to fetch transaction detail',
    };
  } catch (error) {
    console.error('❌ Get transaction detail error:', error.message);
    return {
      success: false,
      transaction: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Payment Modes
 * Fetches all available payment modes
 * Uses GET /api/mode-of-payment endpoint
 * @returns { success, paymentModes, message }
 */
export const getPaymentModes = async () => {
  try {
    const paymentApi = createAxiosInstance('mode-of-payment');
    const response = await paymentApi.get('?isPagination=false&sortBy=recent');

    if (response.data.statusCode === 200 && response.data.data?.data) {
      const paymentModes = response.data.data.data.map(mode => ({
        _id: mode._id,
        name: mode.name,
        isActive: mode.isActive,
      }));

      console.log('✅ Payment Modes Fetched:', paymentModes.length);

      return {
        success: true,
        paymentModes,
        message: 'Payment modes fetched successfully',
      };
    }

    return {
      success: false,
      paymentModes: [],
      message: response.data.message || 'Failed to fetch payment modes',
    };
  } catch (error) {
    console.error('❌ Get payment modes error:', error.message);
    return {
      success: false,
      paymentModes: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Fund Types
 * Fetches all available fund types
 * Uses GET /api/fund-type endpoint
 * @returns { success, fundTypes, message }
 */
export const getFundTypes = async () => {
  try {
    const fundApi = createAxiosInstance('fund-type');
    const response = await fundApi.get('?isPagination=false&isActive=true');

    if (response.data.statusCode === 200 && response.data.data?.data) {
      const fundTypes = response.data.data.data.map(fund => ({
        _id: fund._id,
        fundCode: fund.fundCode,
        title: fund.title,
        isActive: fund.isActive,
      }));

      console.log('✅ Fund Types Fetched:', fundTypes.length);

      return {
        success: true,
        fundTypes,
        message: 'Fund types fetched successfully',
      };
    }

    return {
      success: false,
      fundTypes: [],
      message: response.data.message || 'Failed to fetch fund types',
    };
  } catch (error) {
    console.error('❌ Get fund types error:', error.message);
    return {
      success: false,
      fundTypes: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get Summary / Dashboard Stats
 * Fetches transaction summary and statistics
 * Uses GET /api/payment-entry/summary endpoint
 * @param {object} filters - Optional filter parameters (fromDate, toDate, paymentMode, fundType)
 * @returns { success, summary, message }
 */
export const getTransactionSummary = async (filters = {}) => {
  try {
    const transactionApi = createAxiosInstance('payment-entry');

    // Build query string for summary
    const queryParts = [];
    if (filters.fromDate) {
      queryParts.push(`fromDate=${encodeURIComponent(filters.fromDate)}`);
    }
    if (filters.toDate) {
      queryParts.push(`toDate=${encodeURIComponent(filters.toDate)}`);
    }
    if (filters.paymentMode) {
      queryParts.push(`paymentMode=${encodeURIComponent(filters.paymentMode)}`);
    }
    if (filters.fundType) {
      queryParts.push(`fundType=${encodeURIComponent(filters.fundType)}`);
    }

    const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

    const response = await transactionApi.get(`/summary${queryString}`);

    if (response.data.statusCode === 200 && response.data.data) {
      const summary = {
        totalAmount: response.data.data.totalAmount || 0,
        totalTransactions: response.data.data.totalTransactions || 0,
        totalByMode: response.data.data.totalByMode || {},
        totalByFund: response.data.data.totalByFund || {},
        averageAmount: response.data.data.averageAmount || 0,
      };

      console.log('✅ Transaction Summary Fetched');

      return {
        success: true,
        summary,
        message: 'Transaction summary fetched successfully',
      };
    }

    return {
      success: false,
      summary: null,
      message: response.data.message || 'Failed to fetch transaction summary',
    };
  } catch (error) {
    console.error('❌ Get transaction summary error:', error.message);
    return {
      success: false,
      summary: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Export Transactions
 * Exports transactions to CSV or Excel
 * @param {object} filters - Filter parameters
 * @param {string} format - Export format: 'csv' or 'excel' (default: 'csv')
 * @returns { success, downloadUrl, message }
 */
export const exportTransactions = async (filters = {}, format = 'csv') => {
  try {
    const transactionApi = createAxiosInstance('payment-entry');

    // Build query string
    const queryParts = [];
    queryParts.push(`format=${format}`);

    if (filters.search) {
      queryParts.push(`search=${encodeURIComponent(filters.search)}`);
    }
    if (filters.paymentMode) {
      queryParts.push(`paymentMode=${encodeURIComponent(filters.paymentMode)}`);
    }
    if (filters.fundType) {
      queryParts.push(`fundType=${encodeURIComponent(filters.fundType)}`);
    }
    if (filters.fromDate) {
      queryParts.push(`fromDate=${encodeURIComponent(filters.fromDate)}`);
    }
    if (filters.toDate) {
      queryParts.push(`toDate=${encodeURIComponent(filters.toDate)}`);
    }

    const queryString = queryParts.join('&');

    const response = await transactionApi.get(`/export?${queryString}`, {
      responseType: 'blob',
    });

    console.log(`✅ Transactions exported as ${format.toUpperCase()}`);

    return {
      success: true,
      downloadUrl: response.data,
      message: `Transactions exported successfully as ${format}`,
    };
  } catch (error) {
    console.error('❌ Export transactions error:', error.message);
    return {
      success: false,
      downloadUrl: null,
      message: error.response?.data?.message || error.message,
    };
  }
};
