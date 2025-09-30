import axios from 'axios';

const API_BASE =  'https://ticket-dawg-server.onrender.com/api';
//"http://172.20.10.2:5000/api"; //||
class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
     

    });
    
    //console.log("API BASE URL:", process.env.REACT_APP_API_URL);

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        
        const message = error.response?.data?.error || error.message || 'Network request failed';
        return Promise.reject(new Error(message));
      }
    );
  }

  // Auth endpoints
  async login(username, password) {
    return this.client.post('/auth/login', { username, password });
  }

  async getProfile() {
    return this.client.get('/auth/me');
  }

  async getUsers() {
    return this.client.get('/auth/users');
  }

  async createUser(userData) {
    return this.client.post('/auth/register', userData);
  }

  async deleteUser(userId) {
    return this.client.delete(`/auth/users/${userId}`);
  }

  // Ticket endpoints
  async getTicketStats() {
    return this.client.get('/tickets/stats');
  }

  async assignTicket(email) {
    return this.client.post('/tickets/assign', { email });
  }

  async validateTicket(qrCode) {
    return this.client.post('/tickets/validate', { qrCode });
  }

  async getAllTickets(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const query = params.toString();
    return this.client.get(`/tickets${query ? '?' + query : ''}`);
  }

  async searchTickets(email) {
    return this.client.get(`/tickets/search?email=${encodeURIComponent(email)}`);
  }

  async initializeTickets() {
    return this.client.post('/tickets/initialize');
  }
}

export const api = new ApiService();
