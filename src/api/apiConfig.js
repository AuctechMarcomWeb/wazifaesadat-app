
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Main API URL
export const BASE_URL = 'http://192.168.1.9:9004/api';

// Jobs API URL
export const JOBS_BASE_URL = 'https://jobsapi.wazifaesadat.org/api';

let _cachedToken = null;

export const setCachedToken = token => {
  _cachedToken = token;
};

export const clearCachedToken = () => {
  _cachedToken = null;
};

// Preload token on app start
export const preloadToken = async () => {
  try {
    _cachedToken = await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.log('Preload Token Error:', error);
  }
};

// Create Axios Instance
export const createAxiosInstance = (endpoint = '') => {
  const instance = axios.create({
    baseURL: `${BASE_URL}/${endpoint}`,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Attach JWT Token
  instance.interceptors.request.use(
    async config => {
      try {
        if (!_cachedToken) {
          _cachedToken = await AsyncStorage.getItem('authToken');
        }

        if (_cachedToken) {
          config.headers.Authorization = `Bearer ${_cachedToken}`;
        }
      } catch (error) {
        console.log('Token Fetch Error:', error);
      }

      return config;
    },
    error => Promise.reject(error),
  );

  // Handle Unauthorized Response
  instance.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        clearCachedToken();

        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      }

      return Promise.reject(error);
    },
  );

  return instance;
};
