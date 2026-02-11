/**
 * Admin Sidebar Component
 * Persistent navigation sidebar with task list
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Shield, Users, TrendingUp, DollarSign, Calculator, LogOut, Lightbulb, Mail, Video, Bug, Activity, AlertTriangle, FileText, Sparkles, Gift, Database } from 'lucide-react'
import { blink } from '@/blink/client'
import { cn } from '@/lib/utils'

interface AdminNavItem {
  path: string
  label: string
  icon: React.ReactNode
}

interface AdminSidebarProps {
  className?: string
  onNavigate?: () => void
}

const navItems: AdminNavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: <Shield className="w-4 h-4" /> },
  { path: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { path: '/admin/launch-offers', label: 'Launch Offers', icon: <Gift className="w-4 h-4" /> },
  { path: '/admin/early-access', label: 'Early Access', icon: <Sparkles className="w-4 h-4" /> },
  { path: '/admin/video-queue', label: 'Video Queue', icon: <Video className="w-4 h-4" /> },
  { path: '/admin/moderation', label: 'Moderation', icon: <AlertTriangle className="w-4 h-4" /> },
  { path: '/admin/audit-trail', label: 'Audit Trail', icon: <FileText className="w-4 h-4" /> },
  { path: '/admin/migration', label: 'Data Migration', icon: <Database className="w-4 h-4" /> },
  { path: '/admin/features', label: 'Features', icon: <Lightbulb className="w-4 h-4" /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  { path: '/admin/revenue', label: 'Revenue', icon: <DollarSign className="w-4 h-4" /> },
  { path: '/admin/costs', label: 'Costs & Scale', icon: <Calculator className="w-4 h-4" /> },
  { path: '/admin/email', label: 'Email Settings', icon: <Mail className="w-4 h-4" /> },
  { path: '/admin/telemetry', label: 'Token Telemetry', icon: <Activity className="w-4 h-4" /> },
  { path: '/admin/debug-users', label: 'Debug Users', icon: <Bug className="w-4 h-4" /> }
]

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (path: string) => {
    navigate(path)
    onNavigate?.()
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 [AdminSidebar] Admin logout initiated')
      
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
        console.log('🗑️ [AdminSidebar] Cleared localStorage auth data:', keysToRemove.length, 'keys')
      } catch (storageError) {
        console.warn('⚠️ [AdminSidebar] Could not clear localStorage:', storageError)
      }
      
      console.log('✅ [AdminSidebar] Logout completed')
      navigate('/')
    } catch (error) {
      console.error('❌ [AdminSidebar] Logout error:', error)
      // Force navigation even on error
      navigate('/')
    }
  }

  return (
    <aside className={cn("w-64 h-screen flex flex-col bg-card border-r flex-shrink-0", className)}>
      {/* Logo/Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <img src="/logo_new.png" alt="Logo" className="w-6 h-6 pointer-events-none" />
          <div>
            <h2 className="font-bold text-sm">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">DreamCatcher AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start text-xs"
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start text-xs"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}