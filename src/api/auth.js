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
 * Update user profile by ID (including WhatsApp number OTP trigger if changed)
 * PATCH /update-profile/:id
 * @param {string} id - User _id
 * @param {object} profileData - Profile fields to update
 * Returns: { success, user, whatsappPending, whatsappNumber, message }
 */
export const updateUserProfile = async (id, profileData) => {
  try {
    const response = await authApi.patch(`/update-profile/${id}`, profileData);

    if (response.data.success) {
      const data = response.data.data;
      return {
        success: true,
        user: data?.whatsappPending ? null : data,
        whatsappPending: Boolean(data?.whatsappPending),
        whatsappNumber: data?.whatsappNumber || null,
        message: response.data.message || 'Profile updated successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Update profile by ID error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Verify WhatsApp OTP and confirm pending number
 * PATCH /verify-whatsapp/:id
 * @param {string} id - User _id
 * @param {string} otp - OTP code
 * Returns: { success, whatsappNumber, isWatsappVerify, message }
 */
export const verifyWhatsappNumber = async (id, otp) => {
  try {
    const response = await authApi.patch(`/verify-whatsapp/${id}`, { otp });

    if (response.data.success) {
      return {
        success: true,
        whatsappNumber: response.data.data?.whatsappNumber || null,
        isWatsappVerify: Boolean(response.data.data?.isWatsappVerify),
        message:
          response.data.message || 'WhatsApp number updated successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Verify WhatsApp OTP error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Send WhatsApp OTP to verify a WhatsApp number
 * POST /send-whatsapp-otp/:id
 * @param {string} id - User _id
 * @param {string} whatsappNumber - WhatsApp number
 * Returns: { success, whatsappNumber, message }
 */
export const sendWhatsappOtpForVerify = async (id, whatsappNumber) => {
  try {
    const response = await authApi.post(`/send-whatsapp-otp/${id}`, {
      whatsappNumber: whatsappNumber?.trim(),
    });

    if (response.data.success) {
      return {
        success: true,
        whatsappNumber: response.data.data?.whatsappNumber || whatsappNumber,
        message: response.data.message || 'OTP sent to WhatsApp successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Check WhatsApp verification status for a user
 * GET /whatsapp-status/:id
 * @param {string} id - User _id
 * Returns: { success, isWatsappVerify, whatsappNumber, message }
 */
export const checkWhatsappStatus = async id => {
  try {
    const response = await authApi.get(`/whatsapp-status/${id}`);

    if (response.data.success) {
      return {
        success: true,
        isWatsappVerify: Boolean(response.data.data?.isWatsappVerify),
        whatsappNumber: response.data.data?.whatsappNumber || null,
        message: response.data.message,
      };
    }
    return {
      success: false,
      isWatsappVerify: false,
      whatsappNumber: null,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Check WhatsApp status error:', error);
    return {
      success: false,
      isWatsappVerify: false,
      whatsappNumber: null,
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
      baseURL: 'https://api.wazifaesadat.org/api',
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
 * Register / send OTP via email (or phone if provided)
 * POST /register-with-otp
 * @param {string} email - Email address
 * @param {string} [phone] - Optional phone number
 * Returns: { success, message, email, phone, channel }
 */
export const registerWithOtp = async (email, phone) => {
  try {
    const payload = email
      ? { email: email.trim().toLowerCase() }
      : { phone: phone?.trim() };
    const response = await authApi.post('/register-with-otp', payload);

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'OTP sent successfully',
        email: response.data.data?.email || payload.email,
        phone: response.data.data?.phone || payload.phone,
        channel:
          response.data.data?.channel || (payload.email ? 'email' : 'whatsapp'),
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Register with OTP error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Verify email OTP
 * POST /verify-email-otp
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 * Returns: { success, token, user, message }
 */
export const verifyEmailOtp = async (email, otp) => {
  try {
    const response = await authApi.post('/verify-email-otp', {
      email: email.trim().toLowerCase(),
      otp,
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
        message: response.data.message || 'Email OTP verified successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Verify email OTP error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
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
 * POST /google-login
 * @param {string} idToken - Google ID token from GoogleSignIn
 * Returns: { success, token, user, message }
 */
export const loginWithGoogle = async idToken => {
  try {
    const response = await authApi.post('/google-login', {
      idToken,
    });

    if (response.data.success && response.data.data) {
      const userData = response.data.data;
      const token = userData.authToken;

      if (!token) {
        return {
          success: false,
          message: 'Authentication token not received',
        };
      }

      await AsyncStorage.setItem('authToken', token);
      setCachedToken(token);

      return {
        success: true,
        token,
        user: userData,
        message: response.data.message || 'Google login successful',
      };
    }

    return {
      success: false,
      message: response.data.message || 'Google login failed',
    };
  } catch (error) {
    console.error(
      'Google login API error:',
      error.response?.data || error.message,
    );

    return {
      success: false,
      message:
        error.response?.data?.message || error.message || 'Google login failed',
    };
  }
};

/**
 * Create user profile with country, state, city
 * @param {object} profileData - { fullName, country, phone, state, city, phoneCode }
 * Returns: { success, message, requiresOtp }
 */
export const createUserProfile = async profileData => {
  try {
    const response = await authApi.post('/profile/create', profileData);

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Profile created successfully',
        requiresOtp: response.data.data?.requiresOtp || true,
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Create profile error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Verify WhatsApp OTP for profile
 * @param {string} userId - User ID (from route params or Redux)
 * @param {string} otp - 6-digit OTP
 * Returns: { success, token, user, message }
 */
export const verifyWhatsAppOtp = async (userId, otp) => {
  try {
    // Use the correct backend endpoint: PATCH /verify-whatsapp/:id
    const response = await authApi.patch(`/verify-whatsapp/${userId}`, {
      otp,
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
        message: response.data.message || 'WhatsApp OTP verified successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('WhatsApp OTP verification error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * Resend WhatsApp OTP for profile verification
 * @param {string} userId - User ID (from route params or Redux)
 * @param {string} whatsappNumber - WhatsApp number to send OTP to
 * Returns: { success, message }
 */
export const resendWhatsAppOtp = async (userId, whatsappNumber) => {
  try {
    const response = await authApi.post(`/send-whatsapp-otp/${userId}`, {
      whatsappNumber: whatsappNumber?.trim(),
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'WhatsApp OTP resent successfully',
      };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Resend WhatsApp OTP error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};
