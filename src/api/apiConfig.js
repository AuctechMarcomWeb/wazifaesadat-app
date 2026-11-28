import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Main API URL - Use env variable with fallback
// export const BASE_URL = 'https://api.wazifaesadat.org/api';
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
    console.log('🔐 [apiConfig] Token preloaded:', {
      tokenExists: !!_cachedToken,
      tokenLength: _cachedToken?.length,
    });
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
        console.log('🔐 [apiConfig] Request interceptor:', {
          endpoint,
          url: config.url,
          cachedTokenExists: !!_cachedToken,
          cachedTokenLength: _cachedToken?.length,
        });

        if (!_cachedToken) {
          console.log(
            '🔐 [apiConfig] No cached token, fetching from storage...',
          );
          _cachedToken = await AsyncStorage.getItem('authToken');
          console.log('🔐 [apiConfig] Token from storage:', {
            exists: !!_cachedToken,
            length: _cachedToken?.length,
          });
        }

        // If Authorization header already set by caller, preserve it
        // Otherwise use cached token
        if (!config.headers.Authorization && _cachedToken) {
          config.headers.Authorization = `Bearer ${_cachedToken}`;
          console.log('✅ [apiConfig] Cached token ATTACHED:', {
            endpoint,
            url: config.url,
            tokenLength: _cachedToken?.length,
            tokenStart: _cachedToken?.substring(0, 20) + '...',
          });
        } else if (config.headers.Authorization) {
          console.log('✅ [apiConfig] Using provided Authorization header:', {
            endpoint,
            url: config.url,
            tokenStart: config.headers.Authorization.substring(0, 30) + '...',
          });
        } else {
          console.log(
            '⚠️ [apiConfig] NO TOKEN AVAILABLE - request will be unauthenticated:',
            {
              endpoint,
              url: config.url,
            },
          );
        }
      } catch (error) {
        console.error('❌ [apiConfig] Token Fetch Error:', error);
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
