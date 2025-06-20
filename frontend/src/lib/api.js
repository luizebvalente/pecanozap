import axios from 'axios'

// URLs da API com fallbacks
const API_URLS = [
  'http://localhost:5000/api',
  'http://127.0.0.1:5000/api',
  'https://pecanozap-production.up.railway.app/api'
]

// Estado global da conectividade
let isOnlineMode = false
let workingApiUrl = null

// Função para testar conectividade com timeout mais curto
const testConnection = async (baseUrl) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos

    const response = await fetch(`${baseUrl}/test-db`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.log(`❌ Falha na conexão com ${baseUrl}:`, error.message)
    return false
  }
}

// Encontrar URL da API que funciona
const findWorkingApi = async () => {
  console.log('🔍 Procurando API disponível...')
  
  for (const url of API_URLS) {
    console.log(`🔍 Testando ${url}...`)
    if (await testConnection(url)) {
      workingApiUrl = url
      isOnlineMode = true
      console.log(`✅ Conectado: ${url}`)
      return url
    }
  }
  
  console.log('⚠️ Nenhuma API disponível - Modo offline ativado')
  isOnlineMode = false
  return null
}

// Configurar axios com URL dinâmica
const createApiInstance = (baseUrl) => {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 5000, // Timeout reduzido
  })
}

// Instância inicial (será atualizada)
let api = null

// Dados mock mais completos para desenvolvimento offline
const getMockData = (endpoint, params = {}) => {
  console.log(`🔧 Retornando dados mock para: ${endpoint}`)
  
  const mockData = {
    '/test-db': {
      status: 'offline',
      message: 'Modo desenvolvimento offline',
      timestamp: new Date().toISOString()
    },
    '/categories': [
      { id: 1, name: 'Restaurantes', icon: '🍽️', business_count: 8, description: 'Restaurantes e lanchonetes' },
      { id: 2, name: 'Serviços', icon: '🔧', business_count: 5, description: 'Serviços diversos' },
      { id: 3, name: 'Comércio', icon: '🛍️', business_count: 6, description: 'Lojas e comércio' },
      { id: 4, name: 'Saúde', icon: '🏥', business_count: 3, description: 'Clínicas e farmácias' }
    ],
    '/cities': [
      { id: 1, name: 'Ubatuba', state: 'SP', business_count: 12 },
      { id: 2, name: 'São Paulo', state: 'SP', business_count: 8 },
      { id: 3, name: 'Rio de Janeiro', state: 'RJ', business_count: 5 }
    ],
    '/businesses': [
      {
        id: 1,
        name: 'Restaurante do Mar',
        description: 'Especializado em frutos do mar frescos',
        phone: '12999887766',
        address: 'Praia Grande, 123 - Centro',
        category: { id: 1, name: 'Restaurantes', icon: '🍽️' },
        city: { id: 1, name: 'Ubatuba', state: 'SP' },
        latitude: -23.4336,
        longitude: -45.0838,
        rating: 4.5,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'Pizzaria Bella Vista',
        description: 'As melhores pizzas da cidade',
        phone: '12988776655',
        address: 'Rua das Flores, 456 - Centro',
        category: { id: 1, name: 'Restaurantes', icon: '🍽️' },
        city: { id: 1, name: 'Ubatuba', state: 'SP' },
        latitude: -23.4340,
        longitude: -45.0845,
        rating: 4.8,
        created_at: '2024-01-20T14:30:00Z'
      },
      {
        id: 3,
        name: 'Auto Mecânica Silva',
        description: 'Serviços automotivos completos',
        phone: '12977665544',
        address: 'Av. Principal, 789 - Industrial',
        category: { id: 2, name: 'Serviços', icon: '🔧' },
        city: { id: 1, name: 'Ubatuba', state: 'SP' },
        latitude: -23.4350,
        longitude: -45.0820,
        rating: 4.2,
        created_at: '2024-02-01T09:15:00Z'
      }
    ],
    '/businesses/nearby': [
      {
        id: 1,
        name: 'Restaurante do Mar',
        description: 'Especializado em frutos do mar frescos',
        phone: '12999887766',
        address: 'Praia Grande, 123 - Centro',
        category: { id: 1, name: 'Restaurantes', icon: '🍽️' },
        city: { id: 1, name: 'Ubatuba', state: 'SP' },
        latitude: -23.4336,
        longitude: -45.0838,
        rating: 4.5,
        distance: 0.5
      },
      {
        id: 2,
        name: 'Pizzaria Bella Vista',
        description: 'As melhores pizzas da cidade',
        phone: '12988776655',
        address: 'Rua das Flores, 456 - Centro',
        category: { id: 1, name: 'Restaurantes', icon: '🍽️' },
        city: { id: 1, name: 'Ubatuba', state: 'SP' },
        latitude: -23.4340,
        longitude: -45.0845,
        rating: 4.8,
        distance: 0.8
      }
    ],
    '/admin/dashboard': {
      total_businesses: 15,
      total_users: 8,
      total_categories: 4,
      total_cities: 3,
      recent_businesses: 3,
      recent_users: 2
    },
    '/admin/users': [
      {
        id: 1,
        name: 'Restaurante do Mar',
        email: 'contato@restaurantedomar.com',
        phone: '12999887766',
        category: { name: 'Restaurantes' },
        city: { name: 'Ubatuba', state: 'SP' },
        created_at: '2024-01-15T10:00:00Z'
      }
    ],
    '/admin/businesses': [
      {
        id: 1,
        name: 'Restaurante do Mar',
        category: { name: 'Restaurantes' },
        city: { name: 'Ubatuba', state: 'SP' },
        phone: '12999887766',
        created_at: '2024-01-15T10:00:00Z'
      }
    ]
  }
  
  // Filtrar por parâmetros se necessário
  let data = mockData[endpoint] || []
  
  if (params.category_id && Array.isArray(data)) {
    data = data.filter(item => item.category?.id == params.category_id)
  }
  
  if (params.city_id && Array.isArray(data)) {
    data = data.filter(item => item.city?.id == params.city_id)
  }
  
  return { data }
}

// Função para fazer requisições com fallback robusto
const makeRequest = async (method, endpoint, data = null, params = null) => {
  // Se não tem API funcionando, tentar encontrar uma
  if (!workingApiUrl) {
    await findWorkingApi()
    if (workingApiUrl) {
      api = createApiInstance(workingApiUrl)
    }
  }

  // Se ainda não tem API, usar dados mock
  if (!workingApiUrl || !isOnlineMode) {
    return getMockData(endpoint, params)
  }

  try {
    let response
    switch (method.toLowerCase()) {
      case 'get':
        response = await api.get(endpoint, { params })
        break
      case 'post':
        response = await api.post(endpoint, data)
        break
      case 'put':
        response = await api.put(endpoint, data)
        break
      case 'delete':
        response = await api.delete(endpoint)
        break
      default:
        throw new Error(`Método ${method} não suportado`)
    }
    return response
  } catch (error) {
    console.error(`❌ Erro na requisição ${method} ${endpoint}:`, error)
    
    // Marcar como offline e usar dados mock
    isOnlineMode = false
    workingApiUrl = null
    console.log('🔧 Mudando para modo offline devido ao erro')
    return getMockData(endpoint, params)
  }
}

// Serviços da API com fallback automático
export const apiService = {
  // Status
  isOnline: () => isOnlineMode,
  getCurrentUrl: () => workingApiUrl,
  
  // Categorias
  getCategories: () => makeRequest('get', '/categories'),
  
  // Cidades
  getCities: () => makeRequest('get', '/cities'),
  
  // Estabelecimentos
  getBusinesses: (params = {}) => makeRequest('get', '/businesses', null, params),
  getBusiness: (id) => makeRequest('get', `/businesses/${id}`),
  
  // Estabelecimentos próximos
  getNearbyBusinesses: (lat, lng, radius = 5) => 
    makeRequest('get', `/businesses/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  
  // Autenticação
  register: (data) => makeRequest('post', '/register', data),
  login: (data) => makeRequest('post', '/login', data),
  
  // Admin
  adminLogin: (data) => makeRequest('post', '/admin/login', data),
  getDashboardStats: () => makeRequest('get', '/admin/dashboard'),
  getUsers: () => makeRequest('get', '/admin/users'),
  getBusinessesAdmin: () => makeRequest('get', '/admin/businesses'),
  
  // Avaliações
  createReview: (data) => makeRequest('post', '/reviews', data),
  getReviews: (businessId) => makeRequest('get', `/reviews/${businessId}`),
  
  // Teste
  testDatabase: () => makeRequest('get', '/test-db'),
  
  // Função para inicializar conexão
  initialize: findWorkingApi,
  
  // Forçar modo offline (para testes)
  forceOffline: () => {
    isOnlineMode = false
    workingApiUrl = null
    console.log('🔧 Modo offline forçado')
  }
}

// Funções auxiliares
export const formatWhatsAppUrl = (phone, businessName, message = '') => {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  const defaultMessage = message || `Olá! Vi o ${businessName} no Peça no Zap e gostaria de mais informações.`
  const encodedMessage = encodeURIComponent(defaultMessage)
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`
}

export const formatRating = (rating) => {
  return Math.round(rating * 10) / 10
}

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Exportar instância do axios e URL atual
export { api, workingApiUrl as API_BASE_URL }
