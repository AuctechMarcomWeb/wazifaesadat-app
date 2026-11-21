import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  permissions: [],
  role: null,
  profile: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Login success
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.profile = action.payload.user; // Store profile
      state.role = action.payload.user?.role;
      state.permissions = action.payload.user?.permissions || [];
      state.isAuthenticated = true;
      state.error = null;
      state.loading = false;
    },

    // Login error
    loginError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.isAuthenticated = false;
    },

    // Set user data
    setUser: (state, action) => {
      state.user = action.payload;
      state.profile = action.payload; // Store full profile
      state.role = action.payload?.role;
      state.permissions = action.payload?.permissions || [];
    },

    // Set token
    setToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },

    // Set permissions
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },

    // Update profile
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

    // Clear error
    clearError: state => {
      state.error = null;
    },

    // Logout
    logout: state => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      state.permissions = [];
      state.role = null;
    },
  },
});

export const {
  setLoading,
  loginSuccess,
  loginError,
  setUser,
  setToken,
  setPermissions,
  updateProfile,
  clearError,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
