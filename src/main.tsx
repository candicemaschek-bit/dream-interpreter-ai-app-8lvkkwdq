import './init'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from './components/ui/sonner'
import App from './App'
import './index.css'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'

// Lazy-load admin components to avoid circular dependencies
const AdminDashboardLayout = React.lazy(() => import('./components/AdminDashboardLayout').then(m => ({ default: m.AdminDashboardLayout })))
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminUserManagement = React.lazy(() => import('./components/AdminUserManagement').then(m => ({ default: m.AdminUserManagement })))
const AdminTasksPage = React.lazy(() => import('./components/AdminTasksPage').then(m => ({ default: m.AdminTasksPage })))
const AdminEarlyAccessList = React.lazy(() => import('./components/AdminEarlyAccessList').then(m => ({ default: m.AdminEarlyAccessList })))
const AdminLaunchOfferUsers = React.lazy(() => import('./components/AdminLaunchOfferUsers').then(m => ({ default: m.AdminLaunchOfferUsers })))
const AdminAnalytics = React.lazy(() => import('./components/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })))
const AdminRevenuePage = React.lazy(() => import('./components/AdminRevenuePage').then(m => ({ default: m.AdminRevenuePage })))
const AdminCostScalability = React.lazy(() => import('./components/AdminCostScalability').then(m => ({ default: m.AdminCostScalability })))
const AdminFeatureManagement = React.lazy(() => import('./components/AdminFeatureManagement').then(m => ({ default: m.AdminFeatureManagement })))
const AdminEmailSettings = React.lazy(() => import('./components/AdminEmailSettings').then(m => ({ default: m.AdminEmailSettings })))
const AdminVideoQueueMonitor = React.lazy(() => import('./components/AdminVideoQueueMonitor').then(m => ({ default: m.AdminVideoQueueMonitor })))
const AdminDebugUsersPage = React.lazy(() => import('./components/AdminDebugUsersPage').then(m => ({ default: m.AdminDebugUsersPage })))
const AdminAuthTelemetryMonitor = React.lazy(() => import('./components/AdminAuthTelemetryMonitor').then(m => ({ default: m.AdminAuthTelemetryMonitor })))
const AdminModerationQueue = React.lazy(() => import('./components/AdminModerationQueue').then(m => ({ default: m.AdminModerationQueue })))
const AdminAuditTrail = React.lazy(() => import('./components/AdminAuditTrail').then(m => ({ default: m.AdminAuditTrail })))
const AdminMigrationPage = React.lazy(() => import('./components/AdminMigrationPage').then(m => ({ default: m.AdminMigrationPage })))
import { DreamDetailPage } from './pages/DreamDetailPage'
import { EmailVerificationPage } from './pages/EmailVerificationPage'
import { PasswordResetPage } from './pages/PasswordResetPage'
import { MagicLinkAuthPage } from './pages/MagicLinkAuthPage'
import { PricingPage } from './pages/PricingPage'
import { LandingPage } from './pages/LandingPage'
import { SignUpPage } from './pages/SignUpPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { ContactPage } from './pages/ContactPage'
import { HelpCenterPage } from './pages/HelpCenterPage'
import { EarlyAccessPage } from './pages/EarlyAccessPage'
import { ReflectAIPage } from './pages/ReflectAIPage'
import { SymbolOrchardPage } from './pages/SymbolOrchardPage'
import { CommunityPage } from './pages/CommunityPage'
import { DreamMapPage } from './pages/DreamMapPage'
import { PrivacyDefaultsPage } from './pages/PrivacyDefaultsPage'
import { RequestPasswordResetPage } from './pages/RequestPasswordResetPage'
import { ReauthRetryProvider } from './contexts/ReauthRetryContext'
import { registerServiceWorker, captureInstallPrompt } from './utils/pwaInstaller'
// DISABLED: MigrationGuard is commented out to avoid confusion with Supabase migration
// import { MigrationGuard } from './components/MigrationGuard'
import { ErrorBoundary } from './components/ErrorBoundary'

// CRITICAL: Capture install prompt IMMEDIATELY (before load event)
// This must happen as early as possible since beforeinstallprompt fires early in the page lifecycle
if ('serviceWorker' in navigator) {
  captureInstallPrompt()
  
  const registerPwa = () => {
    registerServiceWorker().then(registration => {
      if (registration) {
        console.log('[PWA] App is ready for offline use')
      }
    })
  }

  if (document.readyState === 'complete') {
    registerPwa()
  } else {
    window.addEventListener('load', registerPwa)
  }
}

// ScrollToTop component - scrolls to top on route change
function ScrollToTop() {
  const location = useLocation()
  
  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  
  return null
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find the root element. Ensure index.html has <div id="root"></div>')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ReauthRetryProvider>
        <Toaster position="top-right" />
        <SonnerToaster />
        <BrowserRouter>
          <ScrollToTop />
          <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/auth/signup" element={<SignUpPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                {/* MigrationGuard disabled - Supabase migration in progress */}
                  <App />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/early-access" element={<EarlyAccessPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help-center" element={<HelpCenterPage />} />
            <Route path="/privacy-defaults" element={<PrivacyDefaultsPage />} />
            <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
            <Route path="/dream/:dreamId" element={<DreamDetailPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />
            <Route path="/auth/magic-link" element={<MagicLinkAuthPage />} />
            <Route path="/reflect-ai" element={
              <ProtectedRoute>
                {/* MigrationGuard disabled */}
                  <ReflectAIPage />
              </ProtectedRoute>
            } />
            <Route path="/reflect/:sessionId" element={
              <ProtectedRoute>
                {/* MigrationGuard disabled */}
                  <ReflectAIPage />
              </ProtectedRoute>
            } />
            <Route path="/symbol-orchard" element={
              <ProtectedRoute>
                {/* MigrationGuard disabled */}
                  <SymbolOrchardPage />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                {/* MigrationGuard disabled */}
                  <CommunityPage />
              </ProtectedRoute>
            } />
            <Route path="/dream-map" element={
              <ProtectedRoute>
                {/* MigrationGuard disabled */}
                  <DreamMapPage />
              </ProtectedRoute>
            } />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminDashboard />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminUserManagement />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminTasksPage />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/early-access"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminEarlyAccessList />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/launch-offers"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminLaunchOfferUsers />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminAnalytics />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/revenue"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminRevenuePage />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/costs"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminCostScalability />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/features"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminFeatureManagement />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/email"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminEmailSettings />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/video-queue"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminVideoQueueMonitor />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/debug-users"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDebugUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/telemetry"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminAuthTelemetryMonitor />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminModerationQueue />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-trail"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminAuditTrail />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/admin/migration"
              element={
                <AdminRoute>
                  {/* MigrationGuard disabled */}
                    <AdminDashboardLayout>
                      <AdminMigrationPage />
                    </AdminDashboardLayout>
                </AdminRoute>
              }
            />
          </Routes>
          </React.Suspense>
        </BrowserRouter>
      </ReauthRetryProvider>
      </ErrorBoundary>
      </React.StrictMode>,
      )
      
