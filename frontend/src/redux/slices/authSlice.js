import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Auto login from stored token
export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('lms_token');
    if (!token) return rejectWithValue('No token');
    const { data } = await api.get('/auth/me');
    return { user: data.data, token };
  } catch (error) {
    localStorage.removeItem('lms_token');
    return rejectWithValue(error.message);
  }
});

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('lms_token', data.token);
    return { user: data.data, token: data.token };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const changePassword = createAsyncThunk('auth/changePassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/change-password', payload);
    localStorage.setItem('lms_token', data.token);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to change password');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true, // Start true for auto-login check
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('lms_token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user
      .addCase(loadUser.pending, (state) => { state.loading = true; })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Change password
      .addCase(changePassword.fulfilled, (state) => { state.loading = false; })
      .addCase(changePassword.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
