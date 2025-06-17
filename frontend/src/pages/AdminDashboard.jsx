import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const AdminDashboard = ({ adminToken, onLogout }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Estados para cada seção
  const [users, setUsers] = useState([])
  const [cities, setCities] = useState([])
  const [categories, setCategories] = useState([])
  const [reviews, setReviews] = useState([])
  
  // Estados para modais e formulários
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadDashboardStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'cities') loadCities()
    if (activeTab === 'categories') loadCategories()
    if (activeTab === 'reviews') loadReviews()
  }, [activeTab])

  const apiCall = async (url, options = {}) => {
    try {
      // Múltiplas URLs para tentar
      const urls = [
        `https://pecanozap-production.up.railway.app${url}`,
        `http://localhost:5000${url}`
      ]
      
      let response = null
      let lastError = null
      
      for (const baseUrl of urls) {
        try {
          console.log(`🌐 Tentando API: ${baseUrl}`)
          
          response = await fetch(baseUrl, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
              ...options.headers
            },
            mode: 'cors',
            credentials: 'omit',
            ...options
          })
          
          if (response.ok) {
            console.log(`✅ Sucesso na API: ${baseUrl}`)
            break
          }
        } catch (err) {
          console.error(`❌ Erro na API ${baseUrl}:`, err)
          lastError = err
          continue
        }
      }
      
      if (!response || !response.ok) {
        throw lastError || new Error(`Erro HTTP: ${response?.status}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('❌ Erro na API:', error)
      throw error
    }
  }

  const loadDashboardStats = async () => {
    try {
      setError('')
      console.log('🔄 Carregando estatísticas do dashboard...')
      
      const data = await apiCall('/api/admin/dashboard')
      console.log('📊 Dados recebidos:', data)
      
      setStats(data.stats)
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
      setError(`Erro ao carregar dados: ${error.message}`)
      
      // Fallback com dados mock para desenvolvimento
      setStats({
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        total_reviews: 0,
        pending_reviews: 0,
        approved_reviews: 0,
        total_cities: 0,
        total_categories: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      console.log('🔄 Carregando usuários...')
      const data = await apiCall('/api/admin/users')
      setUsers(data.users || [])
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error)
      setUsers([])
    }
  }

  const loadCities = async () => {
    try {
      console.log('🔄 Carregando cidades...')
      const data = await apiCall('/api/admin/cities')
      setCities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ Erro ao carregar cidades:', error)
      setCities([])
    }
  }

  const loadCategories = async () => {
    try {
      console.log('🔄 Carregando categorias...')
      const data = await apiCall('/api/admin/categories')
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error)
      setCategories([])
    }
  }

  const loadReviews = async () => {
    try {
      console.log('🔄 Carregando avaliações...')
      const data = await apiCall('/api/admin/reviews')
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('❌ Erro ao carregar avaliações:', error)
      setReviews([])
    }
  }

  const handleCreate = (type) => {
    setModalType(type)
    setEditingItem(null)
    setFormData({})
    setShowModal(true)
  }

  const handleEdit = (type, item) => {
    setModalType(type)
    setEditingItem(item)
    setFormData(item)
    setShowModal(true)
  }

  const handleDelete = async (type, id) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return

    try {
      let endpoint = ''
      switch(type) {
        case 'user': endpoint = `/api/admin/users/${id}`; break
        case 'city': endpoint = `/api/admin/cities/${id}`; break
        case 'category': endpoint = `/api/admin/categories/${id}`; break
        case 'review': endpoint = `/api/admin/reviews/${id}`; break
      }

      await apiCall(endpoint, { method: 'DELETE' })
      
      // Recarregar dados
      if (type === 'user') loadUsers()
      if (type === 'city') loadCities()
      if (type === 'category') loadCategories()
      if (type === 'review') loadReviews()
      
      alert('Item deletado com sucesso!')
    } catch (error) {
      alert('Erro ao deletar: ' + error.message)
    }
  }

  const handleSave = async () => {
    try {
      let endpoint = ''
      let method = editingItem ? 'PUT' : 'POST'
      
      switch(modalType) {
        case 'user':
          endpoint = editingItem ? `/api/admin/users/${editingItem.id}` : '/api/admin/users'
          break
        case 'city':
          endpoint = editingItem ? `/api/admin/cities/${editingItem.id}` : '/api/admin/cities'
          break
        case 'category':
          endpoint = editingItem ? `/api/admin/categories/${editingItem.id}` : '/api/admin/categories'
          break
        case 'review':
          endpoint = editingItem ? `/api/admin/reviews/${editingItem.id}` : '/api/admin/reviews'
          break
      }

      await apiCall(endpoint, {
        method,
        body: JSON.stringify(formData)
      })

      setShowModal(false)
      
      // Recarregar dados
      if (modalType === 'user') loadUsers()
      if (modalType === 'city') loadCities()
      if (modalType === 'category') loadCategories()
      if (modalType === 'review') loadReviews()
      
      alert('Salvo com sucesso!')
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    onLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
          {error && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2">Tentando carregar dados offline...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🛡️ Admin - Peça no Zap
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, Administrador
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Aviso de Conectividade</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-1">Exibindo dados em modo offline.</p>
              </div>
            </div>
          </div>
        )}
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'users', label: '👥 Usuários' },
              { id: 'cities', label: '🏙️ Cidades' },
              { id: 'categories', label: '📂 Categorias' },
              { id: 'reviews', label: '⭐ Avaliações' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Visão Geral do Sistema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.active_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Avaliações</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_reviews}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">🏙️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cidades</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_cities}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Avaliações</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aprovadas:</span>
                    <span className="font-semibold text-green-600">{stats.approved_reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pendentes:</span>
                    <span className="font-semibold text-yellow-600">{stats.pending_reviews}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Usuários</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ativos:</span>
                    <span className="font-semibold text-green-600">{stats.active_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inativos:</span>
                    <span className="font-semibold text-red-600">{stats.inactive_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categorias:</span>
                    <span className="font-semibold text-blue-600">{stats.total_categories}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">👥 Gerenciamento de Usuários</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estabelecimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proprietário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.business_name}</div>
                        <div className="text-sm text-gray-500">{user.category?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.owner_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit('user', user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete('user', user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cities Management */}
        {activeTab === 'cities' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🏙️ Gerenciamento de Cidades</h2>
              <Button
                onClick={() => handleCreate('city')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                + Nova Cidade
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estabelecimentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cities.map((city) => (
                    <tr key={city.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {city.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {city.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {city.business_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit('city', city)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete('city', city.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Management */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📂 Gerenciamento de Categorias</h2>
              <Button
                onClick={() => handleCreate('category')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                + Nova Categoria
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ícone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estabelecimentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.icon}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.business_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit('category', category)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete('category', category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews Management */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">⭐ Gerenciamento de Avaliações</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estabelecimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avaliação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{review.customer_name}</div>
                        <div className="text-sm text-gray-500">{review.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ID: {review.business_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {'⭐'.repeat(review.rating)} ({review.rating}/5)
                        </div>
                        <div className="text-sm text-gray-500">{review.comment}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          review.is_approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {review.is_approved ? 'Aprovada' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!review.is_approved && (
                          <button
                            onClick={() => handleEdit('review', {...review, is_approved: true})}
                            className="text-green-600 hover:text-green-900"
                          >
                            Aprovar
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete('review', review.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal para edição/criação */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Editar' : 'Criar'} {
                  modalType === 'city' ? 'Cidade' :
                  modalType === 'category' ? 'Categoria' :
                  modalType === 'user' ? 'Usuário' : 'Avaliação'
                }
              </h3>
              
              <div className="space-y-4">
                {modalType === 'city' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="SP"
                      />
                    </div>
                  </>
                )}

                {modalType === 'category' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descrição</label>
                      <input
                        type="text"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ícone</label>
                      <input
                        type="text"
                        value={formData.icon || ''}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="🏪"
                      />
                    </div>
                  </>
                )}

                {modalType === 'user' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.is_active ? 'true' : 'false'}
                        onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome do Estabelecimento</label>
                      <input
                        type="text"
                        value={formData.business_name || ''}
                        onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome do Proprietário</label>
                      <input
                        type="text"
                        value={formData.owner_name || ''}
                        onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

