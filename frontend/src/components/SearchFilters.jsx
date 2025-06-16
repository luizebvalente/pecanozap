import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Filter } from "lucide-react"

const SearchFilters = ({ 
  cities = [], 
  categories = [], 
  onSearch, 
  onCityChange, 
  onCategoryChange,
  selectedCity,
  selectedCategory 
}) => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchTerm)
    }
  }

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Filtros de Busca</h3>
      </div>
      
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Busca por texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar estabelecimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros em linha para desktop, empilhados para mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro de cidade */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              <MapPin className="w-4 h-4 inline mr-1" />
              Cidade
            </label>
            <Select value={selectedCity} onValueChange={onCityChange}>
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

          {/* Filtro de categoria */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Categoria
            </label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
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
        </div>

        {/* Botão de busca */}
        <Button type="submit" className="w-full md:w-auto">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </form>
    </div>
  )
}

export default SearchFilters

