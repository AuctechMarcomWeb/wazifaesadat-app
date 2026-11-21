import { createAxiosInstance } from './apiConfig';

/**
 * Get All Expenses
 * Fetches all expense types from the system
 * Uses GET /api/expences endpoint
 * @returns { success, expenses, message }
 */
export const getExpenses = async () => {
  try {
    const expenseApi = createAxiosInstance('expences');

    const response = await expenseApi.get('?isPagination=false&isActive=true');

    if (response.data.statusCode === 200 && response.data.data?.expences) {
      const expenses = response.data.data.expences.map(expense => ({
        _id: expense._id,
        title: expense.title,
        isActive: expense.isActive,
      }));

      console.log('✅ Expenses Fetched:');
      console.log('   - Count:', expenses.length);

      return {
        success: true,
        expenses,
        message: 'Expenses fetched successfully',
      };
    }

    return {
      success: false,
      expenses: [],
      message: response.data.message || 'Failed to fetch expenses',
    };
  } catch (error) {
    console.error('Expenses fetch error:', error.message);
    return {
      success: false,
      expenses: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get All Mode of Payments
 * Fetches all payment modes (UPI, Cash, Cheque, etc.)
 * Uses GET /api/mode-of-payment endpoint
 * @returns { success, paymentModes, message }
 */
export const getModeOfPayments = async () => {
  try {
    const paymentApi = createAxiosInstance('mode-of-payment');

    const response = await paymentApi.get('?isPagination=false&sortBy=recent');

    if (response.data.statusCode === 200 && response.data.data?.data) {
      const paymentModes = response.data.data.data.map(mode => ({
        _id: mode._id,
        name: mode.name,
        isActive: mode.isActive,
      }));

      console.log('✅ Payment Modes Fetched:');
      console.log('   - Count:', paymentModes.length);

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
    console.error('Payment modes fetch error:', error.message);
    return {
      success: false,
      paymentModes: [],
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Upload Image
 * Uploads image file to Cloudinary for bill images
 * Uses POST /api/upload/uploadImage endpoint
 * @param {FormData} formData - Form data containing image file
 * @returns { success, imageUrl, message }
 */
export const uploadImage = async (formData) => {
  try {
    if (!formData) {
      return {
        success: false,
        imageUrl: null,
        message: 'Form data required',
      };
    }

    const uploadApi = createAxiosInstance('upload');

    const response = await uploadApi.post('/uploadImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.statusCode === 200 && response.data.data?.imageUrl) {
      console.log('✅ Image Uploaded:');
      console.log('   - URL:', response.data.data.imageUrl);

      return {
        success: true,
        imageUrl: response.data.data.imageUrl,
        message: response.data.message || 'Image uploaded successfully',
      };
    }

    return {
      success: false,
      imageUrl: null,
      message: response.data.message || 'Failed to upload image',
    };
  } catch (error) {
    console.error('Image upload error:', error.message);
    return {
      success: false,
      imageUrl: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Fetch Expenditures with Filters
 * Fetches expenditure list with filtering and pagination
 * Uses GET /api/expenditures endpoint
 * @param {object} filters - Filter parameters { expense, paymentMode, fromDate, toDate, page, limit }
 * @returns { success, expenditures, totalAmount, totalPages, currentPage, totalExpenditures, message }
 */
export const fetchExpenditures = async (filters = {}) => {
  try {
    const expenditureApi = createAxiosInstance('expenditures');

    // Build query string
    const queryParts = [];
    queryParts.push(`page=${filters.page || 1}`);
    queryParts.push(`limit=${filters.limit || 10}`);
    queryParts.push('isPagination=true');

    if (filters.expense && filters.expense !== 'All') {
      queryParts.push(`expense=${encodeURIComponent(filters.expense)}`);
    }

    if (filters.paymentMode && filters.paymentMode !== 'All') {
      queryParts.push(`paymentMode=${encodeURIComponent(filters.paymentMode)}`);
    }

    if (filters.fromDate) {
      queryParts.push(`fromDate=${encodeURIComponent(filters.fromDate)}`);
    }

    if (filters.toDate) {
      queryParts.push(`toDate=${encodeURIComponent(filters.toDate)}`);
    }

    const queryString = queryParts.join('&');
    console.log('📋 Fetching expenditures with query:', queryString);

    const response = await expenditureApi.get(`?${queryString}`);

    if (
      response.data.statusCode === 200 &&
      response.data.data?.expenditures
    ) {
      const expenditures = response.data.data.expenditures.map(exp => ({
        id: exp._id,
        title: exp.expenseTitle,
        date: exp.date,
        amount: exp.amount,
        paymentMode: exp.paymentMode,
        billImage: exp.billImage,
        description: exp.description,
        paidTo: exp.paidTo,
        billNo: exp.billNo,
        transactionId: exp.transactionId,
        remarks: exp.remarks,
      }));

      console.log('✅ Expenditures Fetched:');
      console.log('   - Count:', expenditures.length);
      console.log('   - Total Amount:', response.data.data.totalAmount);
      console.log('   - Page:', response.data.data.currentPage);

      return {
        success: true,
        expenditures,
        totalAmount: response.data.data.totalAmount,
        totalPages: response.data.data.totalPages,
        currentPage: response.data.data.currentPage,
        totalExpenditures: response.data.data.totalExpenditures,
        message: 'Expenditures fetched successfully',
      };
    }

    return {
      success: false,
      expenditures: [],
      totalAmount: 0,
      totalPages: 0,
      currentPage: 1,
      totalExpenditures: 0,
      message: response.data.message || 'Failed to fetch expenditures',
    };
  } catch (error) {
    console.error('Fetch expenditures error:', error.message);
    return {
      success: false,
      expenditures: [],
      totalAmount: 0,
      totalPages: 0,
      currentPage: 1,
      totalExpenditures: 0,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Create Expenditure
 * Creates a new expenditure record with all details
 * Uses POST /api/expenditures endpoint
 * @param {object} data - Expenditure data
 * @returns { success, expenditure, message }
 */
export const createExpenditure = async (data) => {
  try {
    if (!data.expense || !data.amount || !data.paymentMode || !data.paidTo) {
      return {
        success: false,
        expenditure: null,
        message: 'Missing required fields: expense, amount, paymentMode, paidTo',
      };
    }

    const expenditureApi = createAxiosInstance('expenditures');

    const payload = {
      expense: data.expense,
      date: data.date,
      amount: data.amount,
      paymentMode: data.paymentMode,
      paidTo: data.paidTo,
      transactionId: data.transactionId || '',
      billNo: data.billNo || '',
      billImage: data.billImage || '',
      description: data.description || '',
      remarks: data.remarks || '',
    };

    const response = await expenditureApi.post('', payload);

    if (response.data.statusCode === 201 && response.data.data) {
      const expenditure = response.data.data;
      const expenditureDetail = {
        id: expenditure._id,
        expense: expenditure.expense,
        expenseTitle: expenditure.expenseTitle,
        date: expenditure.date,
        amount: expenditure.amount,
        paymentMode: expenditure.paymentMode,
        paidTo: expenditure.paidTo,
        transactionId: expenditure.transactionId,
        billNo: expenditure.billNo,
        billImage: expenditure.billImage,
        description: expenditure.description,
        remarks: expenditure.remarks,
        createdAt: expenditure.createdAt,
      };

      console.log('✅ Expenditure Created:');
      console.log('   - Title:', expenditure.expenseTitle);
      console.log('   - Amount:', expenditure.amount);
      console.log('   - Date:', expenditure.date);

      return {
        success: true,
        expenditure: expenditureDetail,
        message: response.data.message || 'Expenditure created successfully',
      };
    }

    return {
      success: false,
      expenditure: null,
      message: response.data.message || 'Failed to create expenditure',
    };
  } catch (error) {
    console.error('Create expenditure error:', error.message);
    return {
      success: false,
      expenditure: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Update Expenditure
 * Updates an existing expenditure record
 * Uses PUT /api/expenditures/:id endpoint
 * @param {string} expenditureId - ID of expenditure to update
 * @param {object} data - Updated expenditure data
 * @returns { success, expenditure, message }
 */
export const updateExpenditure = async (expenditureId, data) => {
  try {
    if (!expenditureId) {
      return {
        success: false,
        expenditure: null,
        message: 'Expenditure ID is required',
      };
    }

    if (!data.amount || !data.paymentMode || !data.paidTo) {
      return {
        success: false,
        expenditure: null,
        message: 'Missing required fields: amount, paymentMode, paidTo',
      };
    }

    const expenditureApi = createAxiosInstance('expenditures');

    const payload = {
      expense: data.expense,
      date: data.date,
      amount: data.amount,
      paymentMode: data.paymentMode,
      paidTo: data.paidTo,
      transactionId: data.transactionId || '',
      billNo: data.billNo || '',
      billImage: data.billImage || '',
      description: data.description || '',
      remarks: data.remarks || '',
    };

    const response = await expenditureApi.put(`/${expenditureId}`, payload);

    if (response.data.statusCode === 200) {
      console.log('✅ Expenditure Updated:');
      console.log('   - ID:', expenditureId);
      console.log('   - Amount:', data.amount);

      return {
        success: true,
        expenditure: payload,
        message: response.data.message || 'Expenditure updated successfully',
      };
    }

    return {
      success: false,
      expenditure: null,
      message: response.data.message || 'Failed to update expenditure',
    };
  } catch (error) {
    console.error('Update expenditure error:', error.message);
    return {
      success: false,
      expenditure: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Delete Expenditure
 * Deletes an expenditure record
 * Uses DELETE /api/expenditures/:id endpoint
 * @param {string} expenditureId - ID of expenditure to delete
 * @returns { success, message }
 */
export const deleteExpenditure = async (expenditureId) => {
  try {
    if (!expenditureId) {
      return {
        success: false,
        message: 'Expenditure ID is required',
      };
    }

    const expenditureApi = createAxiosInstance('expenditures');

    const response = await expenditureApi.delete(`/${expenditureId}`);

    if (response.data.statusCode === 200) {
      console.log('✅ Expenditure Deleted:');
      console.log('   - ID:', expenditureId);

      return {
        success: true,
        message: response.data.message || 'Expenditure deleted successfully',
      };
    }

    return {
      success: false,
      message: response.data.message || 'Failed to delete expenditure',
    };
  } catch (error) {
    console.error('Delete expenditure error:', error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};
