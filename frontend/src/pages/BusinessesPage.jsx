import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, MapPin, Grid, List } from 'lucide-react'
import BusinessCard from '@/components/BusinessCard'
import { businessService, categoryService, cityService } from '@/lib/api'

const BusinessesPage = () => {
  const [businesses, setBusinesses] = useState([])
  const [categories, setCategories] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    city_id: '',
    category_id: '',
    page: 1
  })
  
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current_page: 1
  })

  useEffect(() => {
    loadInitialData()
    
    // Verificar parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search)
    const newFilters = { ...filters }
    
    if (urlParams.get('search')) newFilters.search = urlParams.get('search')
    if (urlParams.get('city')) newFilters.city_id = urlParams.get('city')
    if (urlParams.get('category')) newFilters.category_id = urlParams.get('category')
    
    setFilters(newFilters)
  }, [])

  useEffect(() => {
    if (categories.length > 0 && cities.length > 0) {
      loadBusinesses()
    }
  }, [filters, categories, cities])

  const loadInitialData = async () => {
    try {
      const [categoriesRes, citiesRes] = await Promise.all([
        categoryService.getAll(),
        cityService.getAll()
      ])
      
      setCategories(categoriesRes.data)
      setCities(citiesRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
    }
  }

  const loadBusinesses = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.city_id) params.city_id = filters.city_id
      if (filters.category_id) params.category_id = filters.category_id
      params.page = filters.page
      params.per_page = 12

      const response = await businessService.getAll(params)
      setBusinesses(response.data.businesses || [])
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
        current_page: response.data.current_page
      })
    } catch (error) {
      console.error('Erro ao carregar estabelecimentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset para primeira página
    }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadBusinesses()
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const getSelectedCityName = () => {
    if (!filters.city_id) return 'Todas as cidades'
    const city = cities.find(c => c.id.toString() === filters.city_id)
    return city ? `${city.name}, ${city.state}` : 'Cidade selecionada'
  }

  const getSelectedCategoryName = () => {
    if (!filters.category_id) return 'Todas as categorias'
    const category = categories.find(c => c.id.toString() === filters.category_id)
    return category ? category.name : 'Categoria selecionada'
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Estabelecimentos</h1>
          <p className="text-muted-foreground">
            Encontre os melhores negócios e entre em contato pelo WhatsApp
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar estabelecimentos..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros em linha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Cidade
                </label>
                <Select 
                  value={filters.city_id} 
                  onValueChange={(value) => handleFilterChange('city_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as cidades</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}, {city.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Categoria
                </label>
                <Select 
                  value={filters.category_id} 
                  onValueChange={(value) => handleFilterChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Filtros ativos e controles */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.city_id && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" />
                {getSelectedCityName()}
                <button 
                  onClick={() => handleFilterChange('city_id', '')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.category_id && (
              <Badge variant="secondary" className="gap-1">
                {getSelectedCategoryName()}
                <button 
                  onClick={() => handleFilterChange('category_id', '')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                "{filters.search}"
                <button 
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {pagination.total} estabelecimentos
            </span>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de estabelecimentos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Carregando estabelecimentos...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum estabelecimento encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}

        {/* Paginação */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={pagination.current_page === 1}
              onClick={() => handlePageChange(pagination.current_page - 1)}
            >
              Anterior
            </Button>
            
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={page === pagination.current_page ? 'default' : 'outline'}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              disabled={pagination.current_page === pagination.pages}
              onClick={() => handlePageChange(pagination.current_page + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessesPage

