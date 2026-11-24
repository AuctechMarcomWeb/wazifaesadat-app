import axios from 'axios';
import { createAxiosInstance, JOBS_BASE_URL } from './apiConfig';

// Jobs API uses a separate server, so create a separate Axios instance.
const jobsApi = axios.create({
  baseURL: `${JOBS_BASE_URL}/jobs`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token
jobsApi.interceptors.request.use(
  async config => {
    try {
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('authToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Jobs Token Error:', error);
    }

    return config;
  },
  error => Promise.reject(error),
);

// GET PERSONALIZED JOBS
// Method: GET
// Endpoint: /api/jobs/personalized
// Authentication: Bearer Token

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

    if (search) params.search = search;
    if (jobCategory) params.jobCategory = jobCategory;
    if (jobType) params.jobType = jobType;
    if (workMode) params.workMode = workMode;
    if (location) params.location = location;

    if (minSalary !== '') params.minSalary = minSalary;
    if (maxSalary !== '') params.maxSalary = maxSalary;
    if (experience !== '') params.experience = experience;

    if (Array.isArray(skills) && skills.length > 0) {
      params.skills = skills.join(',');
    } else if (typeof skills === 'string' && skills) {
      params.skills = skills;
    }

    const response = await jobsApi.get('/personalized', {
      params,
    });

    const result = response.data?.data || {};

    return {
      success: true,
      data: result.jobs || [],
      isPersonalized: result.isPersonalized ?? false,
      matchType: result.matchType ?? null,
      pagination: {
        currentPage: result.pagination?.currentPage ?? page,
        totalPages: result.pagination?.totalPages ?? 0,
        totalJobs: result.pagination?.totalJobs ?? 0,
        limit: result.pagination?.limit ?? limit,
      },
      message: response.data?.message || 'Jobs fetched successfully',
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
