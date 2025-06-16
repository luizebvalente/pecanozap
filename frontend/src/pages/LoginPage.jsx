import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LogIn, UserPlus, Building, MessageCircle } from 'lucide-react'
import { authService, categoryService, cityService } from '@/lib/api'

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    business_name: '',
    owner_name: '',
    phone: '',
    whatsapp: '',
    address: '',
    description: '',
    city_id: '',
    category_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, citiesRes] = await Promise.all([
        categoryService.getAll(),
        cityService.getAll()
      ])
      
      setCategories(categoriesRes.data)
      setCities(citiesRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await authService.login(loginForm)
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      alert('Login realizado com sucesso!')
      window.location.href = '/dashboard'      
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }
    
    if (registerForm.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }
    
    setLoading(true)
    
    try {
      const { confirmPassword, ...registerData } = registerForm
      await authService.register(registerData)
      
      alert('Cadastro realizado com sucesso! Faça login para continuar.')
      setActiveTab('login')
      setLoginForm({ email: registerForm.email, password: '' })
      
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao fazer cadastro')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginInputChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }))
  }

  const handleRegisterInputChange = (field, value) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Peça no Zap</h1>
          <p className="text-muted-foreground">
            Conecte seu estabelecimento aos clientes
          </p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => handleLoginInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Sua senha"
                      value={loginForm.password}
                      onChange={(e) => handleLoginInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Dados de acesso */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Dados de Acesso
                    </h3>
                    
                    <div>
                      <Label htmlFor="register-email">Email *</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerForm.email}
                        onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="register-password">Senha *</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={registerForm.password}
                          onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirmar Senha *</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirme a senha"
                          value={registerForm.confirmPassword}
                          onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do estabelecimento */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Dados do Estabelecimento
                    </h3>
                    
                    <div>
                      <Label htmlFor="business-name">Nome do Estabelecimento *</Label>
                      <Input
                        id="business-name"
                        placeholder="Ex: Restaurante do João"
                        value={registerForm.business_name}
                        onChange={(e) => handleRegisterInputChange('business_name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="owner-name">Nome do Proprietário *</Label>
                      <Input
                        id="owner-name"
                        placeholder="Seu nome completo"
                        value={registerForm.owner_name}
                        onChange={(e) => handleRegisterInputChange('owner_name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          placeholder="(11) 99999-9999"
                          value={registerForm.phone}
                          onChange={(e) => handleRegisterInputChange('phone', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp *</Label>
                        <Input
                          id="whatsapp"
                          placeholder="(11) 99999-9999"
                          value={registerForm.whatsapp}
                          onChange={(e) => handleRegisterInputChange('whatsapp', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        placeholder="Rua, número, bairro"
                        value={registerForm.address}
                        onChange={(e) => handleRegisterInputChange('address', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="city">Cidade *</Label>
                        <Select 
                          value={registerForm.city_id} 
                          onValueChange={(value) => handleRegisterInputChange('city_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id.toString()}>
                                {city.name}, {city.state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category">Categoria *</Label>
                        <Select 
                          value={registerForm.category_id} 
                          onValueChange={(value) => handleRegisterInputChange('category_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva seu estabelecimento..."
                        value={registerForm.description}
                        onChange={(e) => handleRegisterInputChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Cadastrar Estabelecimento'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

