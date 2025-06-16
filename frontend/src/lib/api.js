import axios from 'axios'

// URL da API no Railway
const API_BASE_URL = 'https://pecanozap-production.up.railway.app/api'

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
})

// Interceptor para logs (opcional)
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message)
    return Promise.reject(error)
  }
)

// Serviços da API
export const apiService = {
  // Categorias
  getCategories: () => api.get('/categories'),
  
  // Cidades
  getCities: () => api.get('/cities'),
  
  // Estabelecimentos
  getBusinesses: (params = {}) => api.get('/businesses', { params }),
  getBusiness: (id) => api.get(`/businesses/${id}`),
  
  // Autenticação
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  
  // Avaliações
  createReview: (data) => api.post('/reviews', data),
  getReviews: (businessId) => api.get(`/reviews/${businessId}`),
  
  // Teste
  testDatabase: () => api.get('/test-db'),
}

// Funções auxiliares
export const formatWhatsAppUrl = (phone, businessName, message = '') => {
  // Remover caracteres especiais do telefone
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Adicionar código do Brasil se necessário
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  
  // Mensagem padrão
  const defaultMessage = message || `Olá! Vi o ${businessName} no Peça no Zap e gostaria de mais informações.`
  
  // Codificar mensagem para URL
  const encodedMessage = encodeURIComponent(defaultMessage)
  
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`
}

export const formatRating = (rating) => {
  return Math.round(rating * 10) / 10 // Arredondar para 1 casa decimal
}

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Exportar instância do axios configurada
export { api }

// Exportar URL base para uso direto
export { API_BASE_URL }

