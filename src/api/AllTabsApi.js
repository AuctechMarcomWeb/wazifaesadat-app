import { createAxiosInstance } from './apiConfig';

// =====================================================
// POSTS API
// Base Endpoint: /api/posts
// =====================================================

const postsApi = createAxiosInstance('posts');

// GET ALL POSTS
// Method: GET
// Endpoint: /api/posts
// Supports: Search, Date Filter, Sorting, Pagination

export const getAllPosts = async ({
  search = '',
  fromDate = '',
  toDate = '',
  sortBy = 'latest',
  isPagination = true,
  page = 1,
  limit = 10,
} = {}) => {
  try {
    const response = await postsApi.get('', {
      params: {
        ...(search && { search }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        sortBy,
        isPagination,
        page,
        limit,
      },
    });

    return {
      success: true,
      data: response.data.data.posts,
      pagination: {
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages,
      },
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Posts Error:', error);

    return {
      success: false,
      data: null,
      pagination: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// GET POST BY ID
// Method: GET
// Endpoint: /api/posts/:id

export const getPostById = async id => {
  try {
    const response = await postsApi.get(`/${id}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Post By ID Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// LIKE / UNLIKE POST
// Method: POST
// Endpoint: /api/posts/:id/like

export const likePost = async id => {
  try {
    const response = await postsApi.post(`/${id}/like`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Like Post Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// SHARE POST
// Method: POST
// Endpoint: /api/posts/:id/share

export const sharePost = async (id, payload = {}) => {
  try {
    const response = await postsApi.post(`/${id}/share`, {
      shareUrl: payload?.shareUrl || '',
      platform: payload?.platform || 'native_share',
      title: payload?.title || '',
      ...payload,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Share Post Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// =====================================================
// BLOGS API
// Base Endpoint: /api/blogs
// =====================================================

const blogsApi = createAxiosInstance('blogs');

// GET ALL BLOGS
// Method: GET
// Endpoint: /api/blogs?page=1&limit=10&isPagination=true&sortBy=latest

export const getAllBlogs = async ({
  page = 1,
  limit = 10,
  isPagination = true,
  sortBy = 'latest',
} = {}) => {
  try {
    const response = await blogsApi.get('', {
      params: {
        page,
        limit,
        isPagination,
        sortBy,
      },
    });

    return {
      success: true,
      data: response.data.data.blogs,
      pagination: {
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
        totalPages: response.data.data.totalPages,
      },
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Blogs Error:', error);

    return {
      success: false,
      data: null,
      pagination: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// GET BLOG BY ID
// Method: GET
// Endpoint: /api/blogs/:id
// Authentication: Optional

export const getBlogById = async id => {
  try {
    const response = await blogsApi.get(`/${id}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get Blog By ID Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// ==========================================
// LIKE / UNLIKE BLOG
// Method: POST
// Endpoint: /api/blogs/:id/like
// Authentication: Required (JWT)
// ==========================================

export const likeBlog = async id => {
  try {
    const response = await blogsApi.post(`/${id}/like`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error(
      'Like / Unlike Blog Error:',
      error.response?.data || error.message,
    );

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// ==========================================
// SHARE BLOG
// Method: POST
// Endpoint: /api/blogs/:id/share
// Authentication: Not required in the provided route
// ==========================================

export const shareBlog = async (id, payload = {}) => {
  try {
    const response = await blogsApi.post(`/${id}/share`, {
      shareUrl: payload?.shareUrl || '',
      platform: payload?.platform || 'native_share',
      title: payload?.title || '',
      ...payload,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Share Blog Error:', error.response?.data || error.message);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// ==========================================
// JOBS API
// Base Endpoint: /api/jobs
// ==========================================

const jobsApi = createAxiosInstance('jobs');

// GET PERSONALIZED JOBS
// Method: GET
// Endpoint: /api/jobs/personalized
// Supports: Dynamic Query Parameters, Pagination

export const getPersonalizedJobs = async ({
  page = 1,
  limit = 10,
  search = '',
  jobCategory = '',
  jobType = '',
  workMode = '',
  location = '',
  minSalary = '',
  maxSalary = '',
  experience = '',
  skills = [],
  ...otherParams
} = {}) => {
  try {
    const params = {
      page,
      limit,
      ...otherParams,
    };

    // Optional query parameters
    if (search) params.search = search;
    if (jobCategory) params.jobCategory = jobCategory;
    if (jobType) params.jobType = jobType;
    if (workMode) params.workMode = workMode;
    if (location) params.location = location;
    if (minSalary !== '') params.minSalary = minSalary;
    if (maxSalary !== '') params.maxSalary = maxSalary;
    if (experience !== '') params.experience = experience;

    if (skills.length > 0) {
      params.skills = Array.isArray(skills) ? skills.join(',') : skills;
    }

    const response = await jobsApi.get('/personalized', {
      params,
    });

    const result = response.data.data;

    return {
      success: true,
      data: result.jobs || [],
      isPersonalized: result.isPersonalized,
      matchType: result.matchType,
      pagination: {
        currentPage: result.pagination?.currentPage || page,
        totalPages: result.pagination?.totalPages || 0,
        totalJobs: result.pagination?.totalJobs || 0,
        limit: result.pagination?.limit || limit,
      },
      message: response.data.message,
    };
  } catch (error) {
    console.error(
      'Get Personalized Jobs Error:',
      error.response?.data || error.message,
    );

    return {
      success: false,
      data: [],
      isPersonalized: false,
      matchType: null,
      pagination: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

const appealApi = createAxiosInstance('appeals');

// GET ALL APPEALS
// Method: GET
// Endpoint: /api/appeals
// Query: search, status, fromDate, toDate,
//        sortBy, isPagination, page, limit

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

// =====================================================
// NEWS & EVENTS API
// Base Endpoint: /api/news-events
// =====================================================

const newsEventsApi = createAxiosInstance('news-events');

// GET ALL NEWS & EVENTS
// Method: GET
// Endpoint: /api/news-events
// Supports: Pagination, Sorting, Status Filter, Type Filter

export const getAllNewsEvents = async ({
  page = 1,
  limit = 10,
  isPagination = true,
  sortBy = 'latest',
  status = 'published',
  type = '', // 'news', 'event', or '' for both
  search = '',
  fromDate = '',
  toDate = '',
} = {}) => {
  try {
    const response = await newsEventsApi.get('', {
      params: {
        page,
        limit,
        isPagination,
        sortBy,
        ...(status && { status }),
        ...(type && { type }),
        ...(search && { search }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      },
    });

    return {
      success: true,
      data: response.data?.data || [],
      pagination: response.data?.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      message: response.data?.message || 'News & Events fetched successfully',
    };
  } catch (error) {
    console.error('Get News & Events Error:', error);

    return {
      success: false,
      data: [],
      pagination: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// GET NEWS BY ID
// Method: GET
// Endpoint: /api/news-events/:id

export const getNewsEventById = async id => {
  try {
    const response = await newsEventsApi.get(`/${id}`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Get News Event By ID Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// LIKE NEWS/EVENT
// Method: POST
// Endpoint: /api/news-events/:id/like

export const likeNewsEvent = async id => {
  try {
    const response = await newsEventsApi.post(`/${id}/like`);

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Like News Event Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};

// SHARE NEWS/EVENT
// Method: POST
// Endpoint: /api/news-events/:id/share

export const shareNewsEvent = async (id, payload = {}) => {
  try {
    const response = await newsEventsApi.post(`/${id}/share`, {
      shareUrl: payload?.shareUrl || '',
      platform: payload?.platform || 'native_share',
      title: payload?.title || '',
      ...payload,
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Share News Event Error:', error);

    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message,
    };
  }
};
