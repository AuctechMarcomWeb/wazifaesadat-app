import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAxiosInstance, setCachedToken } from './apiConfig';

const authApi = createAxiosInstance('auth');

/**
 * Login with userId and password
 * Returns: { success, token, user, message }
 */
export const loginWithPassword = async (userId, password) => {
  try {
    const response = await authApi.post('/loginWithPassword', {
      userId,
      password,
    });

    if (response.data.success && response.data.data) {
      const token = response.data.data.authToken;

      // Cache token for subsequent requests
      setCachedToken(token);

      return {
        success: true,
        token: token,
        user: response.data.data,
        message: response.data.message,
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Get user profile with permissions
 * Returns: { success, user, permissions, role, message }
 */
export const getProfile = async () => {
  try {
    // authApi will automatically use cached token from interceptor
    const response = await authApi.get('/profile');

    if (response.data.success && response.data.data?.user) {
      const userData = response.data.data.user;
      const permissions = userData.permissions || [];

      console.log('✅ Profile API Response:');
      console.log('   - User:', userData.name);
      console.log('   - Role:', userData.role);
      console.log('   - Total Permissions:', permissions.length);
      console.log('   - Permissions:', permissions);

      return {
        success: true,
        user: userData,
        permissions: permissions,
        role: userData.role,
        message: response.data.message,
      };
    }

    console.warn('Profile API error:', response.data.message);
    return {
      success: false,
      message: response.data.message || 'Failed to fetch profile',
    };
  } catch (error) {
    console.error('Profile error:', error.message);
    console.error('Profile error response:', error.response?.data);
    return {
      success: false,
      message:
        error.response?.data?.message || error.message || 'Network error',
    };
  }
};

/**
 * Logout
 * Returns: { success, message }
 */
export const logout = async () => {
  try {
    const response = await authApi.post('/logout');
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Update profile
 * Returns: { success, user, message }
 */
export const updateProfile = async userData => {
  try {
    const response = await authApi.put('/profile', userData);

    if (response.data.success) {
      return {
        success: true,
        user: response.data.data,
        message: response.data.message,
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Update user by ID (Full Profile Update)
 * @param {string} userId - User ID
 * @param {object} userData - Updated user data
 * Returns: { success, user, message }
 */
export const updateUserById = async (userId, userData) => {
  try {
    const response = await authApi.patch(`/update/${userId}`, userData);

    if (response.data.success) {
      return {
        success: true,
        user: response.data.data || response.data.result,
        message: response.data.message,
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Update user error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Update Password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * Returns: { success, message }
 */
export const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    const response = await authApi.post('/updatePassword', {
      userId,
      currentPassword,
      newPassword,
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Password updated successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Create Password (for users without password)
 * @param {string} userId - User ID
 * @param {string} password - New password
 * Returns: { success, message }
 */
export const createPassword = async (userId, password) => {
  try {
    const response = await authApi.post('/createPassword', {
      userId,
      password,
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Password created successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Create password error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Upload Image to Cloudinary
 * @param {object} file - File object with uri, type, name
 * Returns: { success, imageUrl, message }
 */
export const uploadImage = async file => {
  try {
    // For React Native, we need to be careful with FormData
    const formData = new FormData();

    // Append file with proper structure for React Native
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `image-${Date.now()}.jpg`,
    });

    console.log('📤 Starting upload:', {
      name: file.name,
      type: file.type,
      uri: file.uri.substring(0, 50) + '...',
    });

    // Create a special instance for upload
    const uploadInstance = axios.create({
      baseURL: 'http://192.168.1.12:9004/api',
      timeout: 30000,
    });

    // Add auth token to upload request
    uploadInstance.interceptors.request.use(
      async config => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.log('Token fetch error:', err);
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Don't manually set Content-Type for FormData - let axios handle it
    const response = await uploadInstance.post('/upload/uploadImage', formData);

    console.log('📤 Upload response:', response.data);

    if (response.data.success && response.data.data?.imageUrl) {
      return {
        success: true,
        imageUrl: response.data.data.imageUrl,
        message: response.data.message || 'Image uploaded successfully',
      };
    }
    return {
      success: false,
      message: response.data.message || 'Upload failed',
    };
  } catch (error) {
    console.error('❌ Upload error - Message:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
      console.error('   Response status:', error.response.status);
    } else if (error.request) {
      console.error('   No response received - Network error');
      console.error('   Request URL:', error.config?.url);
      console.error('   Request method:', error.config?.method);
    }

    return {
      success: false,
      message:
        error.response?.data?.message || error.message || 'Upload failed',
    };
  }
};

/**
 * Sign up with email/phone and get OTP
 * @param {string} fullName - Full name
 * @param {string} contact - Email or phone number
 * @param {string} password - Password
 * Returns: { success, message, contact, channel }
 */
export const signupWithOtp = async (fullName, contact, password) => {
  try {
    const isEmail = contact.includes('@');
    const channel = isEmail ? 'email' : 'sms';

    const response = await authApi.post('/signup/sendOtp', {
      fullName,
      contact,
      password,
      channel,
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'OTP sent successfully',
        contact,
        channel,
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Verify OTP and complete signup
 * @param {string} contact - Email or phone number
 * @param {string} otp - OTP code (6 digits)
 * @param {string} fullName - Full name
 * @param {string} password - Password
 * Returns: { success, token, user, message }
 */
export const verifySignupOtp = async (contact, otp, fullName, password) => {
  try {
    const response = await authApi.post('/signup/verifyOtp', {
      contact,
      otp,
      fullName,
      password,
    });

    if (response.data.success && response.data.data) {
      const token = response.data.data.authToken || response.data.data.token;

      if (token) {
        await AsyncStorage.setItem('authToken', token);
        setCachedToken(token);
      }

      return {
        success: true,
        token,
        user: response.data.data.user || response.data.data,
        message: response.data.message || 'Account created successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Resend OTP
 * @param {string} contact - Email or phone number
 * @param {string} channel - 'email' or 'sms'
 * Returns: { success, message }
 */
export const resendOtp = async (contact, channel = 'email') => {
  try {
    const response = await authApi.post('/signup/resendOtp', {
      contact,
      channel,
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'OTP resent successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Login with Google ID Token
 * @param {string} idToken - Google ID token from GoogleSignIn
 * Returns: { success, token, user, message }
 */
export const loginWithGoogle = async (idToken) => {
  try {
    const response = await authApi.post('/loginWithGoogle', {
      idToken,
    });

    if (response.data.success && response.data.data) {
      const token = response.data.data.authToken || response.data.data.token;

      if (token) {
        await AsyncStorage.setItem('authToken', token);
        setCachedToken(token);
      }

      return {
        success: true,
        token,
        user: response.data.data.user || response.data.data,
        message: response.data.message || 'Google login successful',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Google login error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};
