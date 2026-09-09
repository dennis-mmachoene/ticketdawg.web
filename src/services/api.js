import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://ticket-dawg-server.onrender.com/api';

// Lightweight browser-side request logger (a "morgan" for the frontend).
// Successful calls are logged only in development (quiet in production);
// failed calls are always logged with the server's reason so problems are visible.
const logApi = (isError, ...args) => {
  if (isError) { console.error('[api]', ...args); return; }
  if (process.env.NODE_ENV !== 'production') console.log('[api]', ...args);
};

class ApiService {
  constructor() {
    this.client = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        config.metadata = { start: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        const cfg = response.config || {};
        const ms = cfg.metadata ? Date.now() - cfg.metadata.start : 0;
        logApi(false, response.status, (cfg.method || '').toUpperCase(), cfg.url, `${ms}ms`);
        return response.data;
      },
      (error) => {
        const cfg = error.config || {};
        const ms = cfg.metadata ? Date.now() - cfg.metadata.start : 0;
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/') window.location.href = '/';
        }

        const reason = data?.error || error.message || 'Network request failed';
        logApi(true, status || 'ERR', (cfg.method || '').toUpperCase(), cfg.url, `${ms}ms`, '-', reason, data && Object.keys(data).length ? data : '');

        const err = new Error(reason);
        err.data = data; // keep structured fields like usedBy / usedAt / status
        err.status = status;
        return Promise.reject(err);
      }
    );
  }

  // Auth
  async login(username, password) { return this.client.post('/auth/login', { username, password }); }
  async logout() { return this.client.post('/auth/logout'); }
  async getProfile() { return this.client.get('/auth/me'); }
  async changePassword(currentPassword, newPassword) { return this.client.post('/auth/change-password', { currentPassword, newPassword }); }
  async getUsers() { return this.client.get('/auth/users'); }
  async createUser(userData) { return this.client.post('/auth/register', userData); }
  async deleteUser(userId) { return this.client.delete(`/auth/users/${userId}`); }
  async forceLogout(userId) { return this.client.post(`/auth/users/${userId}/force-logout`); }
  async updateUserPermissions(userId, permissions) { return this.client.patch(`/auth/users/${userId}/permissions`, { permissions }); }

  // Tickets
  async getTicketStats() { return this.client.get('/tickets/stats'); }
  async assignTicket(email) { return this.client.post('/tickets/assign', { email }); }
  async validateTicket(qrCode) { return this.client.post('/tickets/validate', { qrCode }); }
  async checkInByTicketId(ticketID) { return this.client.post('/tickets/checkin', { ticketID }); }
  async getAllTickets(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.append(k, v.toString()); });
    const q = params.toString();
    return this.client.get(`/tickets${q ? '?' + q : ''}`);
  }
  async searchTickets(email) { return this.client.get(`/tickets/search?email=${encodeURIComponent(email)}`); }
  async initializeTickets(count) { return this.client.post('/tickets/initialize', { count }); }
  async addTickets(count) { return this.client.post('/tickets/add', { count }); }
  async clearTickets() { return this.client.delete('/tickets/clear'); }
  async resendTicket(id) { return this.client.post(`/tickets/${id}/resend`); }
  async revokeTicket(id) { return this.client.post(`/tickets/${id}/revoke`); }

  // Activity
  async getActivityLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.append(k, v.toString()); });
    const q = params.toString();
    return this.client.get(`/activity/logs${q ? '?' + q : ''}`);
  }
  async getUserStats(userId) { return this.client.get(`/activity/user-stats/${userId}`); }
  async getSystemStats(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const q = params.toString();
    return this.client.get(`/activity/system-stats${q ? '?' + q : ''}`);
  }
}

export const api = new ApiService();
