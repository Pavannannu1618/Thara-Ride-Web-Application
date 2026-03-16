import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'dark',
    isLoading: false,
    modal: { isOpen: false, type: null, data: null },
    notifications: [],
  },
  reducers: {
    setLoading: (state, action) => { state.isLoading = action.payload; },
    openModal: (state, action) => {
      state.modal = { isOpen: true, type: action.payload.type, data: action.payload.data || null };
    },
    closeModal: (state) => {
      state.modal = { isOpen: false, type: null, data: null };
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (state.notifications.length > 20) state.notifications.pop();
    },
    markNotificationsRead: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
    },
  },
});

export const { setLoading, openModal, closeModal, addNotification, markNotificationsRead } = uiSlice.actions;
export default uiSlice.reducer;