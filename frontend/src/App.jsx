import { useState } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import BusinessesPage from './pages/BusinessesPage'
import DashboardPage from './pages/DashboardPage'
import BusinessDetailPage from './pages/BusinessDetailPage'
import MapPage from './pages/MapPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setCurrentPage('home')
  }

  const handleNavigate = (page, businessId = null) => {
    setCurrentPage(page)
    if (businessId) {
      setSelectedBusinessId(businessId)
    }
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'map':
        return <MapPage onNavigate={handleNavigate} />
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />
      case 'businesses':
        return <BusinessesPage onNavigate={handleNavigate} />
      case 'business-detail':
        return <BusinessDetailPage businessId={selectedBusinessId} onNavigate={handleNavigate} />
      case 'dashboard':
        return user ? 
          <DashboardPage user={user} onNavigate={handleNavigate} /> : 
          <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />
      default:
        return <HomePage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => handleNavigate('home')}
                className="text-2xl font-bold text-green-600 hover:text-green-700"
              >
                🍃 Peça no Zap
              </button>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => handleNavigate('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'home' 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Início
              </button>
              <button
                onClick={() => handleNavigate('businesses')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'businesses' 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-700 hover:text-green-600'
                }`}
              >
                Estabelecimentos
              </button>
              {user ? (
                <>
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === 'dashboard' 
                        ? 'bg-green-100 text-green-700' 
                        : 'text-gray-700 hover:text-green-600'
                    }`}
                  >
                    Painel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm font-medium"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleNavigate('login')}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm font-medium"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Conteúdo da página */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl">💬</span>
            <span className="text-xl font-semibold">Peça no Zap</span>
          </div>
          <p className="text-gray-300">
            Conectando você aos melhores estabelecimentos via WhatsApp
          </p>
          <div className="mt-4 flex justify-center space-x-6">
            <button
              onClick={() => handleNavigate('home')}
              className="text-gray-300 hover:text-white"
            >
              Início
            </button>
            <button onClick={() => handleNavigate('map')}>
            🗺️ Encontrar no Mapa
            </button>
            <button
              onClick={() => handleNavigate('businesses')}
              className="text-gray-300 hover:text-white"
            >
              Estabelecimentos
            </button>
            <button
              onClick={() => handleNavigate('login')}
              className="text-gray-300 hover:text-white"
            >
              Login
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            &copy; 2024 Peça no Zap. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

