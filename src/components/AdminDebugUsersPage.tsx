/**
 * Admin Debug Users Page
 * Lists test users and provides quick-login functionality
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { blink } from '@/blink/client'
import { AdminDashboardLayout } from '@/components/AdminDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  LogIn, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface TestUser {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  role: string
  subscriptionTier: string
  createdAt: string
}

export function AdminDebugUsersPage() {
  const navigate = useNavigate()
  const [testUsers, setTestUsers] = useState<TestUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loginInProgress, setLoginInProgress] = useState<string | null>(null)

  useEffect(() => {
    loadTestUsers()
  }, [])

  const loadTestUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch users with .dreamcatcher.local email domain (test users)
      const users = await blink.db.users.list()
      
      // Filter test users and fetch their profiles
      const testUserEmails = users.filter(u => 
        u.email.endsWith('.dreamcatcher.local')
      )
      
      const usersWithProfiles = await Promise.all(
        testUserEmails.map(async (user) => {
          const profiles = await blink.db.userProfiles.list({
            where: { userId: user.id },
            limit: 1
          })
          
          return {
            id: user.id,
            email: user.email,
            displayName: user.displayName || 'Unknown',
            emailVerified: Number(user.emailVerified) > 0,
            role: user.role || 'user',
            subscriptionTier: profiles.length > 0 
              ? String(profiles[0].subscriptionTier || 'free')
              : 'free',
            createdAt: user.createdAt
          }
        })
      )
      
      // Sort by subscription tier (VIP > Premium > Pro > Free)
      const tierOrder: Record<string, number> = { vip: 4, premium: 3, pro: 2, free: 1 }
      usersWithProfiles.sort((a, b) => 
        (tierOrder[b.subscriptionTier] || 0) - (tierOrder[a.subscriptionTier] || 0)
      )
      
      setTestUsers(usersWithProfiles)
    } catch (error) {
      console.error('Error loading test users:', error)
      toast.error('Failed to load test users')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (user: TestUser) => {
    try {
      setLoginInProgress(user.id)
      
      // Default test password for all test users
      const testPassword = user.email.includes('admin') 
        ? 'AdminPassword123!' 
        : 'TestPassword123!'
      
      // Sign out current user first
      console.log('🚪 [AdminDebug] Logging out current user for quick-switch')
      
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
        console.log('🗑️ [AdminDebug] Cleared localStorage auth data:', keysToRemove.length, 'keys')
      } catch (storageError) {
        console.warn('⚠️ [AdminDebug] Could not clear localStorage:', storageError)
      }
      
      // Wait to ensure logout completes
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Sign in as test user
      console.log('🔐 [AdminDebug] Signing in as test user:', user.email)
      await blink.auth.signInWithEmail(user.email, testPassword)
      
      toast.success(`Logged in as ${user.displayName}`)
      
      // Navigate to main app
      navigate('/')
      
    } catch (error: any) {
      console.error('Quick login error:', error)
      toast.error(`Login failed: ${error.message || 'Unknown error'}`)
    } finally {
      setLoginInProgress(null)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'vip':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <AdminDashboardLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              Debug: Test Users
            </h1>
            <p className="text-muted-foreground mt-2">
              Quick-login to test user accounts for debugging and testing
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Note:</strong> All test users use the standard password <code className="bg-muted px-1 rounded">TestPassword123!</code>
              {' '}(Admin uses <code className="bg-muted px-1 rounded">AdminPassword123!</code>)
            </AlertDescription>
          </Alert>

          {/* Test Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Test Users</CardTitle>
              <CardDescription>
                {testUsers.length} test user{testUsers.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : testUsers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No test users found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Run the seed script to create test users
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {testUsers.map((user) => (
                      <Card key={user.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            {/* User Info */}
                            <div className="flex-1 space-y-3">
                              {/* Name and Role */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  {user.displayName}
                                </h3>
                                {user.role === 'admin' && (
                                  <Badge variant="destructive" className="gap-1">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                  </Badge>
                                )}
                              </div>

                              {/* Email */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <code className="bg-muted px-2 py-0.5 rounded">
                                  {user.email}
                                </code>
                              </div>

                              {/* Status Badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Subscription Tier */}
                                <Badge className={getTierColor(user.subscriptionTier)}>
                                  {user.subscriptionTier.toUpperCase()}
                                </Badge>

                                {/* Email Verification */}
                                {user.emailVerified ? (
                                  <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                                    <XCircle className="w-3 h-3" />
                                    Unverified
                                  </Badge>
                                )}
                              </div>

                              {/* User ID */}
                              <div className="text-xs text-muted-foreground">
                                ID: <code className="bg-muted px-1 rounded">{user.id}</code>
                              </div>
                            </div>

                            {/* Quick Login Button */}
                            <Button
                              onClick={() => handleQuickLogin(user)}
                              disabled={loginInProgress !== null}
                              className="shrink-0"
                            >
                              {loginInProgress === user.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Logging in...
                                </>
                              ) : (
                                <>
                                  <LogIn className="w-4 h-4 mr-2" />
                                  Quick Login
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Click "Quick Login"</p>
                  <p className="text-muted-foreground">This will log you out of your current account and log in as the test user</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Test Features</p>
                  <p className="text-muted-foreground">Navigate through the app to test subscription tiers, permissions, and features</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Return to Admin</p>
                  <p className="text-muted-foreground">Navigate to /admin to return to this debug page and switch users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}
