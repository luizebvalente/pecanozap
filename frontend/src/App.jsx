import { HashRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import BusinessesPage from './pages/BusinessesPage'
import DashboardPage from './pages/DashboardPage'
import BusinessDetailPage from './pages/BusinessDetailPage'
import Header from './components/Header'
import Footer from './components/Footer'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <HashRouter>
      <div className="App min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/login" 
              element={<LoginPage onLogin={handleLogin} />} 
            />
            <Route path="/businesses" element={<BusinessesPage />} />
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  <DashboardPage user={user} />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              } 
            />
            <Route path="/business/:id" element={<BusinessDetailPage />} />
            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </HashRouter>
  )
}

export default App

