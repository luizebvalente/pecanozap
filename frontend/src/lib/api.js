const API_BASE_URL = 'https://pecanozap-production.up.railway.app/api';

const apiClient = {
  async request(method, endpoint, data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Mantém credentials
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Erro na requisição ${method} ${endpoint}:`, error);
      throw error;
    }
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, data) { return this.request('POST', endpoint, data); },
  put(endpoint, data) { return this.request('PUT', endpoint, data); },
  delete(endpoint) { return this.request('DELETE', endpoint); }
};

export const apiService = {
  async login(email, password) {
    const response = await apiClient.post('/login', { email, password });
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('userId', response.user_id);
      localStorage.setItem('businessName', response.business_name);
    }
    return response;
  },

  async register(userData) {
    return await apiClient.post('/register', userData);
  },

  async getCategories() {
    return await apiClient.get('/categories');
  },

  async getCities() {
    return await apiClient.get('/cities');
  },

  async getBusinesses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);
    if (filters.search) params.append('search', filters.search);
    
    const endpoint = params.toString() ? `/businesses?${params}` : '/businesses';
    return await apiClient.get(endpoint);
  },

  async getDashboard() {
    return await apiClient.get('/dashboard');
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('businessName');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

export const formatWhatsAppUrl = (phone, businessName) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const message = `Olá! Vi o ${businessName} no Peça no Zap e gostaria de mais informações.`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

export default apiService;

