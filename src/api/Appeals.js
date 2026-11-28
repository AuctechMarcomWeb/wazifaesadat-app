import { createAxiosInstance } from './apiConfig';

const appealApi = createAxiosInstance('appeals');
export const getAllAppeals = async ({
  search = '',
  status = '',
  fromDate = '',
  toDate = '',
  sortBy = 'latest',
  isPagination = true,
  page = 1,
  limit = 10,
} = {}) => {
  try {
    const response = await appealApi.get('', {
      params: {
        ...(search && { search }),
        ...(status && { status }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        sortBy,
        isPagination,
        page,
        limit,
      },
    });

    const result = response.data.data;

    return {
      success: true,
      data: result.appeals || [],
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get All Appeals Error:', error);

    return {
      success: false,
      data: [],
      pagination: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// GET APPEAL BY ID
// Method: GET
// Endpoint: /api/appeals/:id

export const getAppealById = async id => {
  try {
    const response = await appealApi.get(`/${id}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Appeal By ID Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// UPDATE APPEAL
// Method: PUT
// Endpoint: /api/appeals/:id (Protected - JWT)

export const updateAppeal = async (id, appealData) => {
  try {
    const response = await appealApi.put(`/${id}`, appealData);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Update Appeal Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// DELETE APPEAL
// Method: DELETE
// Endpoint: /api/appeals/:id (Protected - JWT)

export const deleteAppeal = async id => {
  try {
    const response = await appealApi.delete(`/${id}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Delete Appeal Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// GET APPEAL DONATIONS
// Method: GET
// Endpoint: /api/appeals/:id/donations
// Protected: JWT
// Query: status, page, limit

export const getAppealDonations = async (
  id,
  { status = '', page = 1, limit = 20 } = {},
) => {
  try {
    const response = await appealApi.get(`/${id}/donations`, {
      params: {
        ...(status && { status }),
        page,
        limit,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Appeal Donations Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// INITIATE APPEAL DONATION
// Method: POST
// Endpoint: /api/appeals/:id/donate
// Public API
// Payload: amount, donorName, donorEmail,
//          donorPhone, userId, surl, furl

export const initiateAppealDonation = async (id, donationData) => {
  try {
    const response = await appealApi.post(`/${id}/donate`, donationData);

    return {
      success: true,
      data: response.data.data,
      payuUrl: response.data.data.payuUrl,
      paymentData: response.data.data.paymentData,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Initiate Appeal Donation Error:', error);

    return {
      success: false,
      data: null,
      payuUrl: null,
      paymentData: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// APPEAL DONATION SUCCESS
// Method: POST
// Endpoint: /api/appeals/:id/success
// Public PayU Callback
// Payload: PayU response fields

export const appealDonationSuccess = async paymentData => {
  try {
    const response = await appealApi.post('/donation-success', paymentData);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Appeal Donation Success Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// APPEAL DONATION FAILURE
// Method: POST
// Endpoint: /api/appeals/:id/failure
// Public PayU Callback
// Payload: { txnid }

export const appealDonationFailure = async paymentData => {
  try {
    const response = await appealApi.post('/donation-failure', paymentData);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Appeal Donation Failure Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};
