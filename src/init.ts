/**
 * App Initialization logic
 * This file must be imported at the very top of main.tsx
 */

import { installConsoleFilters, installWindowErrorHandler } from './utils/consoleErrorFilter'

// CRITICAL: Install console filters FIRST to suppress external error noise
// This filters out Firebase/Firestore errors from Blink platform, rrweb session recording,
// and postMessage origin mismatches - all external to our app code
installConsoleFilters()
installWindowErrorHandler()

console.log('[Init] App initialization complete')
