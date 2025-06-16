import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, User, Calendar } from "lucide-react"

const ReviewList = ({ reviews = [] }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma avaliação ainda</h3>
          <p className="text-muted-foreground">
            Seja o primeiro a avaliar este estabelecimento!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        Avaliações ({reviews.length})
      </h3>
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{review.customer_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {review.rating}/5
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(review.created_at)}
                </div>
              </div>
            </CardHeader>
            
            {review.comment && (
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed">
                  {review.comment}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ReviewList

