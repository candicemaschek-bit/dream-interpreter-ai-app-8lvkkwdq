import { createClient } from '@blinkdotnew/sdk'
import '../types/blink'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'dream-interpreter-ai-app-8lvkkwdq',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY,
  auth: { 
    mode: 'headless'
  }
})

// Persistent authentication is already handled by Blink SDK's managed mode
// The SDK automatically:
// - Stores auth tokens in localStorage
// - Restores sessions on page reload
// - Refreshes tokens automatically
// No additional configuration needed for persistent login
