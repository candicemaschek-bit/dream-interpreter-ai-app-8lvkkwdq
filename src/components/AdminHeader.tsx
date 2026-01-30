/**
 * Admin Header Component
 * Shared header for all admin pages with mobile navigation
 */

import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Shield, Users, TrendingUp, DollarSign, LogOut, Lightbulb, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { blink } from '@/blink/client'

interface AdminHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

interface AdminNavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: AdminNavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: <Shield className="w-4 h-4" /> },
  { path: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { path: '/admin/tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
  { path: '/admin/features', label: 'Features', icon: <Lightbulb className="w-4 h-4" /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  { path: '/admin/revenue', label: 'Revenue', icon: <DollarSign className="w-4 h-4" /> }
]

export function AdminHeader({ title, description, children }: AdminHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      console.log('🚪 [AdminHeader] Admin logout initiated')
      
      // Import stopSessionManager if needed
      const { stopSessionManager } = await import('../utils/sessionManager')
      stopSessionManager()
      
      // Logout from Blink SDK
      await blink.auth.signOut()
      
      // Clear any remaining auth-related data from localStorage
      try {
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('blink') || 
          key.includes('auth') || 
          key.includes('token') ||
          key.includes('dreamcatcher')
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log('🗑️ [AdminHeader] Cleared localStorage auth data:', keysToRemove.length, 'keys')
      } catch (storageError) {
        console.warn('⚠️ [AdminHeader] Could not clear localStorage:', storageError)
      }
      
      console.log('✅ [AdminHeader] Logout completed')
      navigate('/')
    } catch (error) {
      console.error('❌ [AdminHeader] Logout error:', error)
      // Force navigation even on error
      navigate('/')
    }
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  return (
    <>
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 flex-shrink-0">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between">
          {/* Left: Menu Button + Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              className="hover:bg-accent"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <img src="/logo_new.png" alt="Logo" className="w-6 h-6 hidden sm:block pointer-events-none" />
            <div>
              <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
              {description && <p className="text-xs text-muted-foreground hidden sm:block">{description}</p>}
            </div>
          </div>
          
          {/* Right: Actions */}
          {children}
        </div>
      </header>

      {/* Mobile Navigation Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <div className="font-bold text-sm">Admin Panel</div>
                <div className="text-xs text-muted-foreground font-normal">DreamCatcher AI</div>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  className="w-full justify-start text-sm"
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              )
            })}
          </nav>

          <Separator />

          {/* Logout */}
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
