import axios from 'axios';

const API_BASE = 'https://ticket-dawg-server.onrender.com/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/') window.location.href = '/';
        }
        const message = error.response?.data?.error || error.message || 'Network request failed';
        return Promise.reject(new Error(message));
      }
    );
  }

  // Auth
  async login(username, password) { return this.client.post('/auth/login', { username, password }); }
  async logout() { return this.client.post('/auth/logout'); }
  async getProfile() { return this.client.get('/auth/me'); }
  async getUsers() { return this.client.get('/auth/users'); }
  async createUser(userData) { return this.client.post('/auth/register', userData); }
  async deleteUser(userId) { return this.client.delete(`/auth/users/${userId}`); }
  async forceLogout(userId) { return this.client.post(`/auth/users/${userId}/force-logout`); }
  async updateUserPermissions(userId, permissions) { return this.client.patch(`/auth/users/${userId}/permissions`, { permissions }); }

  // Tickets
  async getTicketStats() { return this.client.get('/tickets/stats'); }
  async assignTicket(email) { return this.client.post('/tickets/assign', { email }); }
  async validateTicket(qrCode) { return this.client.post('/tickets/validate', { qrCode }); }
  async getAllTickets(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v.toString()); });
    const query = params.toString();
    return this.client.get(`/tickets${query ? '?' + query : ''}`);
  }
  async searchTickets(email) { return this.client.get(`/tickets/search?email=${encodeURIComponent(email)}`); }
  async initializeTickets(count) { return this.client.post('/tickets/initialize', { count }); }
  async clearTickets() { return this.client.delete('/tickets/clear'); }

  // Activity
  async getActivityLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v.toString()); });
    const query = params.toString();
    return this.client.get(`/activity/logs${query ? '?' + query : ''}`);
  }
  async getUserStats(userId) { return this.client.get(`/activity/user-stats/${userId}`); }
  async getSystemStats(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return this.client.get(`/activity/system-stats${query ? '?' + query : ''}`);
  }
}

export const api = new ApiService();
