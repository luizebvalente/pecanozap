import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Phone, MessageCircle } from "lucide-react"

const BusinessCard = ({ business, onWhatsAppClick }) => {
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

  const formatWhatsApp = (phone) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')
    // Adiciona código do país se não tiver
    return cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  }

  const handleWhatsAppClick = () => {
    const whatsappNumber = formatWhatsApp(business.whatsapp)
    const message = encodeURIComponent(
      `Olá! Vi seu estabelecimento "${business.business_name}" no Peça no Zap e gostaria de saber mais informações.`
    )
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`
    
    if (onWhatsAppClick) {
      onWhatsAppClick(business, whatsappUrl)
    } else {
      window.open(whatsappUrl, '_blank')
    }
  }

  return (
    <Card className="hover-lift cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
              {business.business_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {business.city?.name}, {business.city?.state}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            {business.category?.name}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
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

      <CardContent className="pt-0">
        {business.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {business.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Phone className="w-4 h-4" />
          <span>{business.phone}</span>
        </div>

        <Button 
          onClick={handleWhatsAppClick}
          className="w-full gradient-primary hover:opacity-90 shadow-whatsapp"
          size="sm"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Conversar no WhatsApp
        </Button>
      </CardContent>
    </Card>
  )
}

export default BusinessCard

