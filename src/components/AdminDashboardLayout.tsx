/**
 * Admin Dashboard Layout Component
 * Layout wrapper with sidebar navigation for all admin pages
 */

import { ReactNode, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminSidebar } from '@/components/AdminSidebar'
import { InlineReauthDialog } from '@/components/InlineReauthDialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Menu } from 'lucide-react'
import { useInlineReauth } from '@/hooks/useInlineReauth'
import { blink } from '@/blink/client'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface AdminDashboardLayoutProps {
  children: ReactNode
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const navigate = useNavigate()
  const { needsReauth, userEmail, clearReauth, cancelReauth } = useInlineReauth()
  const [user, setUser] = useState<any>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const handleReauthSuccess = async () => {
    // clearReauth will automatically retry all pending API calls
    await clearReauth()
    // Reload admin data after reauth
    window.location.reload()
  }

  const handleReauthCancel = () => {
    // Cancel reauth and clear retry queue
    cancelReauth()
  }

  const showInlineReauth = needsReauth && user
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Admin Sidebar - Desktop */}
      <AdminSidebar className="hidden lg:flex" />
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen flex flex-col overflow-hidden relative">
        {/* Back to App Button & Mobile Menu */}
        <div className="border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="p-3 flex items-center gap-2">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r">
                <AdminSidebar 
                  className="w-full h-full border-none" 
                  onNavigate={() => setSheetOpen(false)} 
                />
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </div>
        </div>
        
        {/* Children wrapper for scroll context */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          {children}
        </div>
      </main>

      {/* Inline Re-authentication Dialog - Applies to admin tier */}
      {showInlineReauth && (
        <InlineReauthDialog
          open={showInlineReauth}
          onSuccess={handleReauthSuccess}
          onCancel={handleReauthCancel}
          userEmail={userEmail}
          message="Your admin session has expired. Please sign in again to continue."
        />
      )}
    </div>
  )
}
