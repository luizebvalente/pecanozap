import { MessageCircle, Heart, MapPin } from "lucide-react"

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo e descrição */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold">Peça no Zap</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Conectando você aos melhores estabelecimentos da sua cidade através do WhatsApp.
            </p>
          </div>

          {/* Links úteis */}
          <div className="space-y-4">
            <h4 className="font-semibold">Links Úteis</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="/businesses" className="hover:text-primary transition-colors">
                  Estabelecimentos
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-primary transition-colors">
                  Cadastrar Estabelecimento
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contato</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: (11) 99999-9999</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Brasil</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Feito com <Heart className="w-4 h-4 text-red-500" /> para conectar pessoas e negócios
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2024 Peça no Zap. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

