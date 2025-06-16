import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Utensils, 
  Pill, 
  ShoppingCart, 
  Scissors, 
  Wrench, 
  Shirt, 
  Smartphone, 
  HeartPulse,
  ArrowRight 
} from "lucide-react"

const CategoryGrid = ({ categories = [], onCategorySelect }) => {
  const getIconComponent = (iconName) => {
    const icons = {
      'utensils': Utensils,
      'pill': Pill,
      'shopping-cart': ShoppingCart,
      'scissors': Scissors,
      'wrench': Wrench,
      'shirt': Shirt,
      'smartphone': Smartphone,
      'heart-pulse': HeartPulse
    }
    
    const IconComponent = icons[iconName] || Utensils
    return <IconComponent className="w-8 h-8" />
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Explore por Categoria</h2>
        <p className="text-muted-foreground">
          Encontre exatamente o que você precisa
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className="hover-lift cursor-pointer group border-2 hover:border-primary/50 transition-all duration-200"
            onClick={() => onCategorySelect && onCategorySelect(category)}
          >
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {getIconComponent(category.icon)}
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
  )
}

export default CategoryGrid

