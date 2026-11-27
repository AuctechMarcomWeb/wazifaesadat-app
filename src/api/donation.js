import { createAxiosInstance, BASE_URL } from './apiConfig';

const donation = createAxiosInstance('');

export const getDonations = async ({
  page = 1,
  limit = 10,
  search = '',
  phone = '',
  email = '',
  fundType = '',
  paymentStatus = 'paid',
  paymentGateway = '',
  paymentMode = '',
  sortBy = 'latest',
} = {}) => {
  try {
    console.log('📞 Fetching donations with params:', {
      page,
      limit,
      phone,
      email,
      paymentStatus,
    });

    const response = await donation.get('/payment', {
      params: {
        page,
        limit,
        search,
        phone,
        email,
        fundType,
        paymentStatus,
        paymentGateway,
        paymentMode,
        sortBy,
        isPagination: 'true',
      },
    });

    console.log('✅ Get Donations Success:', response.data);
    return response.data;
  } catch (error) {
    console.error(
      '❌ Get Donations Error:',
      error?.response?.data || error?.message,
    );
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to fetch donations',
      data: null,
    };
  }
};

export const getFundTypes = async () => {
  try {
    const response = await donation.get('/fund-type', {
      params: {
        isPagination: false,
        isActive: true,
      },
    });

    console.log('✅ Get Fund Types Success:', response.data);

    return response.data;
  } catch (error) {
    console.error(
      '❌ Get Fund Types Error:',
      error?.response?.data || error?.message,
    );

    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to fetch fund types',
      data: null,
    };
  }
};


export const createPayuDonation = async (payload) => {
  try {
    console.log('📞 Creating PayU Donation:', payload);

    const response = await donation.post(
      '/donation/payu/create',
      payload
    );

    console.log('✅ PayU Donation Created:', response.data);

    return response.data;
  } catch (error) {
    console.error(
      '❌ PayU Donation Error:',
      error?.response?.data || error?.message
    );

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        'Failed to create PayU donation',
      data: null,
    };
  }
};

export const createRazorpayDonation = async (payload) => {
  try {
    console.log('📞 Creating Razorpay Donation:', payload);

    const response = await donation.post(
      '/donation/razorpay/create',
      payload
    );

    console.log('✅ Razorpay Donation Created:', response.data);

    return response.data;
  } catch (error) {
    console.error(
      '❌ Razorpay Donation Error:',
      error?.response?.data || error?.message
    );

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        'Failed to create Razorpay donation',
      data: null,
    };
  }
};

export const verifyPayment = async (payload) => {
  try {
    console.log('📞 Verifying Payment:', payload);

    const response = await donation.post(
      '/donation/razorpay/verify',
      payload
    );

    console.log('✅ Payment Verified:', response.data);

    return response.data;
  } catch (error) {
    console.error(
      '❌ Payment Verification Error:',
      error?.response?.data || error?.message
    );

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        'Failed to verify payment',
      data: null,
    };
  }
};