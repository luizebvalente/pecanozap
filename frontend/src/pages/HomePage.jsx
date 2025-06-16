import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, MapPin, Star, ArrowRight, Search } from 'lucide-react'

const HomePage = () => {
  // Dados mockados para teste
  const mockCategories = [
    { id: 1, name: 'Restaurantes', description: 'Restaurantes e lanchonetes', icon: 'utensils', business_count: 15 },
    { id: 2, name: 'Farmácias', description: 'Farmácias e drogarias', icon: 'pill', business_count: 8 },
    { id: 3, name: 'Supermercados', description: 'Supermercados e mercearias', icon: 'shopping-cart', business_count: 12 },
    { id: 4, name: 'Beleza', description: 'Salões de beleza e estética', icon: 'scissors', business_count: 20 }
  ]

  const mockBusinesses = [
    {
      id: 1,
      business_name: 'Restaurante do João',
      description: 'Comida caseira e deliciosa',
      rating: 4.5,
      review_count: 23,
      whatsapp: '11999999999',
      city: { name: 'São Paulo', state: 'SP' },
      category: { name: 'Restaurantes' }
    },
    {
      id: 2,
      business_name: 'Farmácia Central',
      description: 'Medicamentos e produtos de saúde',
      rating: 4.8,
      review_count: 15,
      whatsapp: '11888888888',
      city: { name: 'São Paulo', state: 'SP' },
      category: { name: 'Farmácias' }
    }
  ]

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

  const handleWhatsAppClick = (business) => {
    const whatsappNumber = business.whatsapp.replace(/\D/g, '')
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`
    const message = encodeURIComponent(
      `Olá! Vi seu estabelecimento "${business.business_name}" no Peça no Zap e gostaria de saber mais informações.`
    )
    window.open(`https://wa.me/${formattedNumber}?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Encontre e conecte-se com estabelecimentos
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Descubra os melhores negócios da sua cidade e entre em contato direto pelo WhatsApp
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-primary hover:text-primary"
              >
                <Search className="w-5 h-5 mr-2" />
                Explorar Categorias
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary"
              >
                Ver Todos os Estabelecimentos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Explore por Categoria</h2>
            <p className="text-muted-foreground">
              Encontre exatamente o que você precisa
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockCategories.map((category) => (
              <Card 
                key={category.id}
                className="hover-lift cursor-pointer group border-2 hover:border-primary/50 transition-all duration-200"
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <div className="w-8 h-8 flex items-center justify-center">
                        📍
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-sm md:text-base">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between w-full">
                      <Badge variant="secondary" className="text-xs">
                        {category.business_count} locais
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Estabelecimentos em Destaque</h2>
            <p className="text-muted-foreground">
              Conheça alguns dos melhores negócios cadastrados
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockBusinesses.map((business) => (
              <Card key={business.id} className="hover-lift">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{business.business_name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {business.city?.name}, {business.city?.state}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {business.category?.name}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(business.rating || 0)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {business.rating ? business.rating.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({business.review_count || 0} avaliações)
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {business.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {business.description}
                    </p>
                  )}
                  
                  <Button 
                    className="w-full gradient-primary shadow-whatsapp"
                    onClick={() => handleWhatsAppClick(business)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Conversar no WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="gradient-secondary border-0">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Tem um estabelecimento?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Cadastre seu negócio gratuitamente e conecte-se com milhares de clientes através do WhatsApp
              </p>
              <Button 
                size="lg" 
                className="gradient-primary shadow-whatsapp"
                onClick={() => window.location.href = '/login'}
              >
                Cadastrar Estabelecimento
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default HomePage

