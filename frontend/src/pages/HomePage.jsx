import { useState, useEffect } from 'react'
import { apiService, formatWhatsAppUrl } from '../lib/api'

function HomePage({ onNavigate }) {
  const [categories, setCategories] = useState([])
  const [featuredBusinesses, setFeaturedBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, businessesRes] = await Promise.all([
        apiService.getCategories(),
        apiService.getBusinesses({ per_page: 6 })
      ])
      
      setCategories(categoriesRes.data)
      setFeaturedBusinesses(businessesRes.data.businesses || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = (business) => {
    const url = formatWhatsAppUrl(
      business.whatsapp || business.phone,
      business.business_name,
      `Olá! Vi o ${business.business_name} no Peça no Zap e gostaria de mais informações.`
    )
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            🍃 Peça no Zap
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Conecte-se diretamente com os melhores estabelecimentos da sua cidade via WhatsApp
          </p>
          <div className="space-x-4">
            <button
              onClick={() => onNavigate('businesses')}
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Ver Estabelecimentos
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Cadastrar Negócio
            </button>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore por Categoria
            </h2>
            <p className="text-lg text-gray-600">
              Encontre exatamente o que você precisa
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onNavigate('businesses')}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center group"
              >
                <div className="text-3xl mb-3">
                  {category.icon === 'utensils' && '🍽️'}
                  {category.icon === 'pill' && '💊'}
                  {category.icon === 'shopping-cart' && '🛒'}
                  {category.icon === 'scissors' && '✂️'}
                  {category.icon === 'heart' && '❤️'}
                  {category.icon === 'book' && '📚'}
                  {category.icon === 'wrench' && '🔧'}
                  {category.icon === 'store' && '🏪'}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Estabelecimentos em Destaque */}
      {featuredBusinesses.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Estabelecimentos em Destaque
              </h2>
              <p className="text-lg text-gray-600">
                Conecte-se diretamente via WhatsApp
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBusinesses.map((business) => (
                <div key={business.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {business.business_name}
                      </h3>
                      <p className="text-gray-600">
                        {business.category?.name} • {business.city?.name}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-yellow-400">⭐</span>
                      <span className="ml-1 text-sm text-gray-600">
                        {business.rating || '5.0'}
                      </span>
                    </div>
                  </div>

                  {business.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {business.description}
                    </p>
                  )}

                  <button
                    onClick={() => handleWhatsAppClick(business)}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>💬</span>
                    <span>Conversar no WhatsApp</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <button
                onClick={() => onNavigate('businesses')}
                className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                Ver Todos os Estabelecimentos
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tem um estabelecimento?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Cadastre seu negócio e conecte-se com mais clientes via WhatsApp
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
          >
            Cadastrar Meu Negócio
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage
