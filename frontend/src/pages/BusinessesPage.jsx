import { useState, useEffect } from 'react'
import { apiService, formatWhatsAppUrl } from '../lib/api'

function BusinessesPage({ onNavigate }) {
  const [businesses, setBusinesses] = useState([])
  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category_id: '',
    city_id: '',
    search: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadBusinesses()
  }, [filters])

  const loadData = async () => {
    try {
      const [categoriesRes, citiesRes] = await Promise.all([
        apiService.getCategories(),
        apiService.getCities()
      ])
      setCategories(categoriesRes.data)
      setCities(citiesRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const loadBusinesses = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.city_id) params.city_id = filters.city_id
      if (filters.search) params.search = filters.search

      const response = await apiService.getBusinesses(params)
      setBusinesses(response.data.businesses || [])
    } catch (error) {
      console.error('Erro ao carregar estabelecimentos:', error)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const clearFilters = () => {
    setFilters({
      category_id: '',
      city_id: '',
      search: ''
    })
  }

  const handleWhatsAppClick = (business) => {
    const url = formatWhatsAppUrl(
      business.whatsapp || business.phone,
      business.business_name,
      `Olá! Vi o ${business.business_name} no Peça no Zap e gostaria de mais informações.`
    )
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Estabelecimentos
            </h1>
            <p className="text-lg text-gray-600">
              Encontre e conecte-se com os melhores negócios da sua região
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Nome do estabelecimento..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                name="category_id"
                value={filters.category_id}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <select
                name="city_id"
                value={filters.city_id}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todas as cidades</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name} - {city.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Limpar */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando estabelecimentos...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum estabelecimento encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Tente ajustar os filtros ou cadastre o primeiro estabelecimento
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Cadastrar Estabelecimento
            </button>
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            <div className="mb-6">
              <p className="text-gray-600">
                {businesses.length} estabelecimento{businesses.length !== 1 ? 's' : ''} encontrado{businesses.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Grid de estabelecimentos */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <div key={business.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Header do card */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 
                          className="text-xl font-semibold text-gray-900 mb-1 cursor-pointer hover:text-green-600 transition-colors"
                          onClick={() => onNavigate && onNavigate('business-detail', business.id)}
                        >
                          {business.business_name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-2">
                          <span>{business.category?.name}</span>
                          <span>•</span>
                          <span>{business.city?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="ml-1 text-sm font-medium text-gray-700">
                          {business.rating || '5.0'}
                        </span>
                      </div>
                    </div>

                    {/* Descrição */}
                    {business.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {business.description}
                      </p>
                    )}

                    {/* Endereço */}
                    {business.address && (
                      <div className="flex items-start text-sm text-gray-500 mb-4">
                        <span className="mr-2">📍</span>
                        <span className="line-clamp-2">{business.address}</span>
                      </div>
                    )}

                    {/* Informações de contato */}
                    <div className="space-y-2 mb-4">
                      {business.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">📞</span>
                          <span>{business.phone}</span>
                        </div>
                      )}
                      {business.whatsapp && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">💬</span>
                          <span>{business.whatsapp}</span>
                        </div>
                      )}
                    </div>

                    {/* Botão WhatsApp */}
                    <button
                      onClick={() => handleWhatsAppClick(business)}
                      className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 font-medium"
                    >
                      <span>💬</span>
                      <span>Conversar no WhatsApp</span>
                    </button>
                  </div>

                  {/* Footer com informações extras */}
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Proprietário: {business.owner_name}</span>
                      {business.created_at && (
                        <span>
                          Desde {new Date(business.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to action */}
            <div className="text-center mt-12 py-8 bg-green-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Não encontrou o que procura?
              </h3>
              <p className="text-gray-600 mb-4">
                Cadastre seu estabelecimento e conecte-se com mais clientes
              </p>
              <button
                onClick={() => onNavigate('login')}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                Cadastrar Meu Negócio
              </button>
            </div>
          </>
        )}
      </div>

      {/* Botão voltar */}
      {onNavigate && (
        <div className="fixed bottom-6 left-6">
          <button
            onClick={() => onNavigate('home')}
            className="bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-shadow"
          >
            <span className="text-xl">←</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default BusinessesPage

