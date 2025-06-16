import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Star, 
  Clock,
  Share2,
  Heart
} from 'lucide-react'
import ReviewList from '@/components/ReviewList'
import ReviewForm from '@/components/ReviewForm'
import { businessService, reviewService } from '@/lib/api'

const BusinessDetailPage = () => {
  const { id } = useParams()
  const [business, setBusiness] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    if (id) {
      loadBusinessData()
    }
  }, [id])

  const loadBusinessData = async () => {
    try {
      const [businessRes, reviewsRes] = await Promise.all([
        businessService.getById(id),
        reviewService.getByBusiness(id)
      ])
      
      setBusiness(businessRes.data)
      setReviews(reviewsRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados do estabelecimento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = () => {
    if (!business?.whatsapp) return
    
    const whatsappNumber = business.whatsapp.replace(/\D/g, '')
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`
    const message = encodeURIComponent(
      `Olá! Vi seu estabelecimento "${business.business_name}" no Peça no Zap e gostaria de saber mais informações.`
    )
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`
    
    window.open(whatsappUrl, '_blank')
  }

  const handleReviewSubmit = async (reviewData) => {
    try {
      await reviewService.create(reviewData)
      alert('Avaliação enviada com sucesso! Ela será analisada antes de ser publicada.')
      setShowReviewForm(false)
      // Recarregar avaliações
      const reviewsRes = await reviewService.getByBusiness(id)
      setReviews(reviewsRes.data)
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao enviar avaliação')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.business_name,
        text: `Confira ${business.business_name} no Peça no Zap!`,
        url: window.location.href
      })
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando estabelecimento...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Estabelecimento não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O estabelecimento que você procura não existe ou foi removido.
          </p>
          <Button onClick={() => window.location.href = '/businesses'}>
            Ver Todos os Estabelecimentos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header do estabelecimento */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl md:text-3xl">
                      {business.business_name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {business.category?.name}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{business.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{business.city?.name}, {business.city?.state}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(business.rating || 0)}
                    </div>
                    <span className="font-semibold">
                      {business.rating ? business.rating.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-muted-foreground">
                      ({business.review_count || 0} avaliações)
                    </span>
                  </div>
                  
                  {business.description && (
                    <p className="text-muted-foreground leading-relaxed">
                      {business.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Button 
                    size="lg"
                    className="gradient-primary shadow-whatsapp"
                    onClick={handleWhatsAppClick}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Conversar no WhatsApp
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Informações de contato */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-muted-foreground">{business.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-muted-foreground">{business.whatsapp}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de avaliações */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ReviewList reviews={reviews} />
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Deixe sua Avaliação</CardTitle>
                </CardHeader>
                <CardContent>
                  {!showReviewForm ? (
                    <div className="text-center">
                      <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Compartilhe sua experiência com outros clientes
                      </p>
                      <Button 
                        onClick={() => setShowReviewForm(true)}
                        className="w-full"
                      >
                        Avaliar Estabelecimento
                      </Button>
                    </div>
                  ) : (
                    <ReviewForm
                      businessId={business.id}
                      onSubmit={handleReviewSubmit}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessDetailPage

