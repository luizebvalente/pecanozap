import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Star, Send } from "lucide-react"

const ReviewForm = ({ businessId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    rating: 0,
    comment: ""
  })
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.rating === 0) {
      alert("Por favor, selecione uma avaliação")
      return
    }
    if (!formData.customer_name.trim()) {
      alert("Por favor, informe seu nome")
      return
    }
    
    onSubmit({
      ...formData,
      business_id: businessId
    })
  }

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const isActive = starValue <= (hoveredRating || formData.rating)
      
      return (
        <Star
          key={i}
          className={`w-8 h-8 cursor-pointer transition-colors ${
            isActive 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300 hover:text-yellow-200"
          }`}
          onClick={() => handleRatingClick(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
        />
      )
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Deixe sua Avaliação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating com estrelas */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Sua avaliação *
            </label>
            <div className="flex gap-1">
              {renderStars()}
            </div>
            {formData.rating > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {formData.rating} de 5 estrelas
              </p>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Seu nome *
            </label>
            <Input
              type="text"
              placeholder="Digite seu nome"
              value={formData.customer_name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                customer_name: e.target.value 
              }))}
              required
            />
          </div>

          {/* Telefone (opcional) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Telefone (opcional)
            </label>
            <Input
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.customer_phone}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                customer_phone: e.target.value 
              }))}
            />
          </div>

          {/* Comentário */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte como foi sua experiência..."
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                comment: e.target.value 
              }))}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Enviar Avaliação
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ReviewForm

