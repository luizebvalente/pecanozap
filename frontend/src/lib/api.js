import axios from 'axios'

// URL da API no Railway
const API_BASE_URL = 'https://pecanozap-production.up.railway.app/api'

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

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

// Exportar instância do axios
export { api }
export { API_BASE_URL }


apiService.initialize = async () => {
  try {
    await api.get("/status")
    return true
  } catch (error) {
    console.error("API initialization failed:", error)
    return false
  }
}

apiService.isOnline = () => {
  // This is a placeholder. A more robust check would involve
  // periodically pinging the backend or checking network status.
  return navigator.onLine
}


