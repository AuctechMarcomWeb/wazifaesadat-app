import { createAxiosInstance } from './apiConfig';

const donation = createAxiosInstance('');

export const getDonations = async ({
  page = 1,
  limit = 10,
  search = '',
  phone = '',
  email = '',
  fundType = '',
  paymentStatus = '',
  paymentGateway = '',
  paymentMode = '',
  sortBy = 'latest',
} = {}) => {
  try {
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
      },
    });

    return response.data;
  } catch (error) {
    console.error('Get Donations Error:', error);
    throw error;
  }
};
