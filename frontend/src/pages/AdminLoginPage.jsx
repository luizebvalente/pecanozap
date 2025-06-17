import { useState } from 'react'
import { Button } from '@/components/ui/button'

const AdminLoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Verificar se os campos estão preenchidos
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios')
      setLoading(false)
      return
    }

    console.log('🔐 Tentando login admin...')

    try {
      // Múltiplas tentativas com diferentes URLs
      const urls = [
        'https://pecanozap-production.up.railway.app/api/admin/login',
        'http://localhost:5000/api/admin/login'
      ]
      
      let response = null
      let lastError = null
      
      for (const url of urls) {
        try {
          console.log(`🌐 Tentando URL: ${url}`)
          
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(formData),
            mode: 'cors',
            credentials: 'omit'
          })
          
          console.log(`📡 Resposta da URL ${url}:`, response.status)
          
          if (response.ok) {
            break // Sucesso, sair do loop
          }
        } catch (err) {
          console.error(`❌ Erro na URL ${url}:`, err)
          lastError = err
          continue // Tentar próxima URL
        }
      }
      
      if (!response || !response.ok) {
        throw lastError || new Error(`Erro HTTP: ${response?.status}`)
      }

      const data = await response.json()
      console.log('✅ Login admin bem-sucedido:', data)
      
      // Salvar dados do admin
      localStorage.setItem('adminToken', data.token || 'admin_token_123')
      localStorage.setItem('adminUser', JSON.stringify(data.user || { email: formData.email, role: 'admin' }))
      
      // Navegar para dashboard
      onLogin(data.user || { email: formData.email, role: 'admin' }, data.token || 'admin_token_123')
      
    } catch (error) {
      console.error('❌ Erro no login admin:', error)
      
      // Fallback: Login offline para desenvolvimento
      if (formData.email === 'admin@pecanozap.com' && formData.password === 'admin123') {
        console.log('🔧 Usando fallback offline...')
        const fallbackUser = { email: formData.email, role: 'admin', id: 1, name: 'Admin' }
        localStorage.setItem('adminToken', 'admin_token_offline')
        localStorage.setItem('adminUser', JSON.stringify(fallbackUser))
        onLogin(fallbackUser, 'admin_token_offline')
        return
      }
      
      setError(`Erro de conexão: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🛡️ Admin - Peça no Zap</h1>
          <p className="text-gray-600 mt-2">Acesso restrito para administradores</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin@pecanozap.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Entrando...' : 'Entrar no Admin'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Credenciais padrão:</p>
          <p>Email: admin@pecanozap.com</p>
          <p>Senha: admin123</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage

