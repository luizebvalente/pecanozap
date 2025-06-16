const API_BASE_URL = 'https://pecanozap-production.up.railway.app/api';

// ✅ CONFIGURAÇÃO FETCH CORRIGIDA (SEM CREDENTIALS)
const apiClient = {
  async request(method, endpoint, data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // ✅ REMOVIDO credentials: 'include' para evitar conflito CORS
    };

    // ✅ ADICIONAR TOKEN SE EXISTIR
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // ✅ ADICIONAR BODY SE NECESSÁRIO
    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      // ✅ VERIFICAR SE RESPOSTA É JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
        
        return result;
      } else {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { success: true };
      }
    } catch (error) {
      console.error(`Erro na requisição ${method} ${endpoint}:`, error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request('GET', endpoint);
  },

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  },

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  },

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
};

// ✅ SERVIÇOS DA API COM FALLBACK
export const apiService = {
  // ✅ LOGIN
  async login(email, password) {
    try {
      console.log('Tentando login para:', email);
      
      const response = await apiClient.post('/login', { email, password });
      
      console.log('Resposta do login:', response);
      
      // ✅ SALVAR DADOS NO LOCALSTORAGE
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('userId', response.user_id);
        localStorage.setItem('businessName', response.business_name);
        localStorage.setItem('userEmail', response.email);
      }
      
      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  },

  // ✅ REGISTRO
  async register(userData) {
    try {
      const response = await apiClient.post('/register', userData);
      return response;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw new Error(error.message || 'Erro ao registrar usuário');
    }
  },

  // ✅ DASHBOARD
  async getDashboard() {
    try {
      const response = await apiClient.get('/dashboard');
      return response;
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      throw new Error(error.message || 'Erro ao carregar dashboard');
    }
  },

  // ✅ CATEGORIAS COM FALLBACK
  async getCategories() {
    try {
      const response = await apiClient.get('/categories');
      return response;
    } catch (error) {
      console.error('Erro ao buscar categorias, usando fallback:', error);
      // ✅ FALLBACK - dados locais se API falhar
      return [
        { id: 1, name: 'Restaurantes', icon: '🍽️' },
        { id: 2, name: 'Farmácias', icon: '💊' },
        { id: 3, name: 'Supermercados', icon: '🛒' },
        { id: 4, name: 'Autopeças', icon: '🚗' },
        { id: 5, name: 'Beleza', icon: '💄' },
        { id: 6, name: 'Roupas', icon: '👕' },
        { id: 7, name: 'Eletrônicos', icon: '📱' },
        { id: 8, name: 'Serviços', icon: '🔧' }
      ];
    }
  },

  // ✅ CIDADES COM FALLBACK
  async getCities() {
    try {
      const response = await apiClient.get('/cities');
      return response;
    } catch (error) {
      console.error('Erro ao buscar cidades, usando fallback:', error);
      // ✅ FALLBACK - dados locais se API falhar
      return [
        { id: 1, name: 'São Paulo', state: 'SP' },
        { id: 2, name: 'Rio de Janeiro', state: 'RJ' },
        { id: 3, name: 'Belo Horizonte', state: 'MG' },
        { id: 4, name: 'Salvador', state: 'BA' },
        { id: 5, name: 'Brasília', state: 'DF' },
        { id: 6, name: 'Fortaleza', state: 'CE' },
        { id: 7, name: 'Recife', state: 'PE' },
        { id: 8, name: 'Porto Alegre', state: 'RS' },
        { id: 9, name: 'Curitiba', state: 'PR' },
        { id: 10, name: 'Ubatuba', state: 'SP' }
      ];
    }
  },

  // ✅ ESTABELECIMENTOS COM FALLBACK
  async getBusinesses(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);
      if (filters.search) params.append('search', filters.search);
      
      const endpoint = params.toString() ? `/businesses?${params}` : '/businesses';
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos, usando fallback:', error);
      // ✅ FALLBACK - dados locais se API falhar
      const allBusinesses = [
        {
          id: 1,
          name: 'Quintal da Villa Restaurante',
          category: 'Restaurantes',
          city: 'Ubatuba-SP',
          phone: '12999887766',
          address: 'Rua Guarani, 663 - Itaguá',
          rating: 4.8,
          description: 'Restaurante com vista para o mar'
        },
        {
          id: 2,
          name: 'Auto Comercial Taubaté',
          category: 'Autopeças',
          city: 'Ubatuba-SP',
          phone: '12988776655',
          address: 'Av Rio Grande do Sul, 274',
          rating: 4.5,
          description: 'Autopeças e acessórios automotivos'
        },
        {
          id: 3,
          name: 'Smidi Farma',
          category: 'Farmácias',
          city: 'Ubatuba-SP',
          phone: '12977665544',
          address: 'Praça 13 de Maio, 6 - Centro',
          rating: 4.7,
          description: 'Farmácia com delivery'
        },
        {
          id: 4,
          name: 'Bendito Burguer',
          category: 'Restaurantes',
          city: 'Ubatuba-SP',
          phone: '12966554433',
          address: 'Rua Hans Staden, 350 - Centro',
          rating: 4.6,
          description: 'Hamburgueria artesanal'
        },
        {
          id: 5,
          name: 'Uba Supermercadinho',
          category: 'Supermercados',
          city: 'Ubatuba-SP',
          phone: '12955443322',
          address: 'Rua Conceição, 200 - Itaguá',
          rating: 4.3,
          description: 'Supermercado de bairro'
        }
      ];

      // ✅ APLICAR FILTROS NOS DADOS LOCAIS
      let filteredBusinesses = allBusinesses;
      
      if (filters.category) {
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.category.toLowerCase().includes(filters.category.toLowerCase())
        );
      }
      
      if (filters.city) {
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.city.toLowerCase().includes(filters.city.toLowerCase())
        );
      }
      
      if (filters.search) {
        filteredBusinesses = filteredBusinesses.filter(b => 
          b.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          b.description.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      return filteredBusinesses;
    }
  },

  // ✅ LOGOUT
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('businessName');
    localStorage.removeItem('userEmail');
  },

  // ✅ VERIFICAR SE ESTÁ LOGADO
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // ✅ OBTER DADOS DO USUÁRIO
  getCurrentUser() {
    return {
      id: localStorage.getItem('userId'),
      businessName: localStorage.getItem('businessName'),
      email: localStorage.getItem('userEmail')
    };
  }
};

// ✅ FUNÇÃO PARA FORMATAR WHATSAPP
export const formatWhatsAppUrl = (phone, businessName, userLocation = '') => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  let message = `Olá! Vi o ${businessName} no Peça no Zap e gostaria de mais informações.`;
  if (userLocation) {
    message += ` Estou em ${userLocation}.`;
  }
  
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

export default apiService;

