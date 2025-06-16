import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, MessageCircle, Home, Building, User, LogIn } from "lucide-react"

const Header = ({ user, onLoginClick, onLogoutClick }) => {
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Estabelecimentos', href: '/businesses', icon: Building },
  ]

  const NavItems = ({ mobile = false }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
              mobile ? 'py-2' : ''
            }`}
            onClick={() => mobile && setIsOpen(false)}
          >
            <Icon className="w-4 h-4" />
            {item.name}
          </a>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Peça no Zap</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Encontre e conecte-se
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavItems />
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm">Olá, {user.business_name}</span>
                <Button variant="outline" size="sm" onClick={onLogoutClick}>
                  Sair
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLoginClick}
                className="hidden md:flex"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-8">
                  <NavItems mobile />
                  
                  <div className="border-t pt-4">
                    {user ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {user.business_name}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            onLogoutClick()
                            setIsOpen(false)
                          }}
                          className="w-full"
                        >
                          Sair
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          onLoginClick()
                          setIsOpen(false)
                        }}
                        className="w-full"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

