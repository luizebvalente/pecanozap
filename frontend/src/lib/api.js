import axios from 'axios'

const API_BASE_URL = 'http://localhost:5001/api'

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
})

// Interceptor para adicionar token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Serviços da API
export const authService = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  getProfile: () => api.get('/profile'),
  updateProfile: (userData) => api.put('/profile', userData),
}

export const businessService = {
  getAll: (params = {}) => api.get('/businesses', { params }),
  getById: (id) => api.get(`/businesses/${id}`),
}

export const categoryService = {
  getAll: () => api.get('/categories'),
}

export const cityService = {
  getAll: () => api.get('/cities'),
}

export const reviewService = {
  create: (reviewData) => api.post('/reviews', reviewData),
  getByBusiness: (businessId) => api.get(`/reviews/${businessId}`),
}

export default api

