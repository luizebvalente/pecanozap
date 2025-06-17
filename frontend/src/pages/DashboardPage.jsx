import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  User, 
  Phone, 
  MapPin, 
  Star, 
  MessageCircle, 
  Edit, 
  Save,
  Eye,
  BarChart3
} from 'lucide-react'
import { apiService } from '../lib/api'

const DashboardPage = ({ user: propUser, onNavigate }) => {
  const [user, setUser] = useState(propUser || null)
  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
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
    // Verificar se está logado e carregar dados do localStorage
    const savedUser = localStorage.getItem('user')
    if (!savedUser) {
      window.location.href = '/login'
      return
    }
    
    // Carregar dados do usuário do localStorage
    const userData = JSON.parse(savedUser)
    setUser(userData)
    
    // Preencher formulário com dados do usuário
    setFormData({
      business_name: userData.business_name || '',
      owner_name: userData.owner_name || '',
      phone: userData.phone || '',
      whatsapp: userData.whatsapp || '',
      address: userData.address || '',
      description: userData.description || '',
      city_id: userData.city_id?.toString() || '',
      category_id: userData.category_id?.toString() || ''
    })
    
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, citiesRes] = await Promise.all([
        apiService.getCategories(),
        apiService.getCities()
      ])
      
      setCategories(categoriesRes.data)
      setCities(citiesRes.data)
      
      // Carregar avaliações se o usuário tiver ID
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        if (userData.id) {
          try {
            const reviewsRes = await apiService.getReviews(userData.id)
            setReviews(reviewsRes.data)
          } catch (error) {
            console.log('Nenhuma avaliação encontrada ou erro ao carregar:', error)
            setReviews([])
          }
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Por enquanto, apenas atualizar dados locais
      // TODO: Implementar endpoint de atualização no backend
      const updatedUser = { ...user, ...formData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      setEditing(false)
      alert('Dados atualizados com sucesso!')
      
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao atualizar dados')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ))
  }

  const getWhatsAppLink = () => {
    if (!user?.whatsapp) return '#'
    const whatsappNumber = user.whatsapp.replace(/\D/g, '')
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`
    const message = encodeURIComponent(
      `Olá! Vi seu estabelecimento "${user.business_name}" no Peça no Zap e gostaria de saber mais informações.`
    )
    return `https://wa.me/${formattedNumber}?text=${message}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel do Estabelecimento</h1>
          <p className="text-muted-foreground">
            Gerencie as informações do seu negócio
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avaliação Média</p>
                  <p className="text-2xl font-bold">
                    {user?.rating ? user.rating.toFixed(1) : '0.0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                  <p className="text-2xl font-bold">{user?.review_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={user?.is_active ? 'default' : 'secondary'}>
                    {user?.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-2" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          {/* Aba Perfil */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informações do Estabelecimento</CardTitle>
                  <Button
                    variant={editing ? "outline" : "default"}
                    onClick={() => editing ? setEditing(false) : setEditing(true)}
                  >
                    {editing ? (
                      <>Cancelar</>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_name">Nome do Estabelecimento</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner_name">Nome do Proprietário</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => handleInputChange('owner_name', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!editing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Select 
                      value={formData.city_id} 
                      onValueChange={(value) => handleInputChange('city_id', value)}
                      disabled={!editing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma cidade" />
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
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => handleInputChange('category_id', value)}
                      disabled={!editing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
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
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!editing}
                    rows={3}
                  />
                </div>

                {editing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>Salvando...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Avaliações */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações Recebidas</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Nenhuma avaliação ainda</h3>
                    <p className="text-muted-foreground">
                      Compartilhe seu estabelecimento para receber as primeiras avaliações!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{review.customer_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Visualizar */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Como seu estabelecimento aparece</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md mx-auto">
                  <Card className="hover-lift">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{user?.business_name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {cities.find(c => c.id.toString() === formData.city_id)?.name}, {cities.find(c => c.id.toString() === formData.city_id)?.state}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {categories.find(c => c.id.toString() === formData.category_id)?.name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(user?.rating || 0)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {user?.rating ? user.rating.toFixed(1) : "0.0"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({user?.review_count || 0} avaliações)
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {user?.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {user.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Phone className="w-4 h-4" />
                        <span>{user?.phone}</span>
                      </div>

                      <Button 
                        className="w-full gradient-primary shadow-whatsapp"
                        onClick={() => window.open(getWhatsAppLink(), '_blank')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Conversar no WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default DashboardPage

