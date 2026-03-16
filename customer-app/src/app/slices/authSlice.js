import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authAPI.getMe();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            null,
    role:            localStorage.getItem('userRole')    || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading:         false,
    error:           null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user            = payload.user;
      state.role            = payload.role || 'rider';
      state.isAuthenticated = true;
      state.loading         = false;
      state.error           = null;
      localStorage.setItem('accessToken',  payload.tokens.accessToken);
      localStorage.setItem('refreshToken', payload.tokens.refreshToken);
      localStorage.setItem('userRole',     payload.role || 'rider');
    },
    logout: (state) => {
      state.user            = null;
      state.role            = null;
      state.isAuthenticated = false;
      state.loading         = false;
      state.error           = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
    },
    updateUser: (state, { payload }) => {
    if (state.user) {
    state.user = { ...state.user, ...payload };
  }
},
  },
  extraReducers: (b) => {
    b
      // ← Do NOT set loading:true on pending — that's what causes the loop
      .addCase(fetchMe.pending,   (s) => { s.error = null; })
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.loading         = false;
        s.user            = payload.user;
        s.isAuthenticated = true;

        // Restore role from payload or localStorage, then persist it.
        const roleFromUser = payload.user?.role === 'customer' ? 'rider' : payload.user?.role;
        const resolvedRole = roleFromUser
          || payload.user?.isAdmin && 'admin'
          || localStorage.getItem('userRole')
          || 'rider';

        s.role = resolvedRole;
        localStorage.setItem('userRole', resolvedRole);
      })
      .addCase(fetchMe.rejected,  (s) => {
        // If /auth/me fails, ensure the app resets auth state and redirects to landing.
        s.loading = false;
        s.isAuthenticated = false;
        s.user = null;
        s.role = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
      });
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;