/**
 * Platform Detection and Compatibility Utilities
 * Handles browser and device-specific feature detection and logging
 */

export interface PlatformInfo {
  browser: string
  version: string
  os: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  deviceType: 'mobile' | 'tablet' | 'desktop'
  supportsMediaRecorder: boolean
  supportsCanvas: boolean
  supportsStorage: boolean
  supportsGeolocation: boolean
  supportsWebGL: boolean
  supportsWorkers: boolean
  touchSupported: boolean
  maxFileSize: number
  mediaRecorderMimeTypes: string[]
}

/**
 * Detects current browser and operating system
 */
export function detectBrowser(): { browser: string; version: string; os: string } {
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let version = 'Unknown'
  let os = 'Unknown'

  // Detect OS
  if (ua.indexOf('Win') > -1) os = 'Windows'
  else if (ua.indexOf('Mac') > -1) os = 'macOS'
  else if (ua.indexOf('Linux') > -1) os = 'Linux'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS'

  // Detect Browser
  if (ua.indexOf('Edg') > -1) {
    browser = 'Edge'
    version = ua.split('Edg/')[1]?.split(' ')[0] || 'Unknown'
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) {
    browser = 'Chrome'
    version = ua.split('Chrome/')[1]?.split(' ')[0] || 'Unknown'
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari'
    version = ua.split('Version/')[1]?.split(' ')[0] || 'Unknown'
  } else if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox'
    version = ua.split('Firefox/')[1]?.split(' ')[0] || 'Unknown'
  } else if (ua.indexOf('Trident') > -1) {
    browser = 'Internet Explorer'
    version = ua.split('rv:')[1]?.split(')')[0] || 'Unknown'
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera'
    version = ua.split('OPR/')[1]?.split(' ')[0] || ua.split('Opera/')[1]?.split(' ')[0] || 'Unknown'
  }

  return { browser, version, os }
}

/**
 * Detects device type based on screen size and user agent
 */
export function detectDeviceType(): { isMobile: boolean; isTablet: boolean; isDesktop: boolean; deviceType: 'mobile' | 'tablet' | 'desktop' } {
  const ua = navigator.userAgent
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // Check for mobile device indicators
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (screenWidth <= 768 && screenHeight <= 1024)

  // More specific detection
  const isMobile = /Android|iPhone|iPod|IEMobile|Mobile/i.test(ua) || screenWidth < 768
  const isTablet = /iPad|Android/i.test(ua) || (screenWidth >= 768 && screenWidth < 1024)
  const isDesktop = !isMobile && !isTablet

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  }
}

/**
 * Checks for browser feature support
 */
export function checkFeatureSupport() {
  return {
    supportsMediaRecorder: typeof MediaRecorder !== 'undefined',
    supportsCanvas: typeof HTMLCanvasElement !== 'undefined',
    supportsStorage: typeof localStorage !== 'undefined',
    supportsGeolocation: 'geolocation' in navigator,
    supportsWebGL: (() => {
      try {
        const canvas = document.createElement('canvas')
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        )
      } catch {
        return false
      }
    })(),
    supportsWorkers: typeof Worker !== 'undefined',
    touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    mediaRecorderMimeTypes: getMediaRecorderMimeTypes()
  }
}

/**
 * Gets supported MIME types for MediaRecorder
 */
function getMediaRecorderMimeTypes(): string[] {
  if (typeof MediaRecorder === 'undefined') return []

  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav'
  ]

  return mimeTypes.filter(mimeType => MediaRecorder.isTypeSupported(mimeType))
}

/**
 * Gets complete platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const { browser, version, os } = detectBrowser()
  const { isMobile, isTablet, isDesktop, deviceType } = detectDeviceType()
  const features = checkFeatureSupport()

  // Estimate max file size based on device
  const maxFileSize = isMobile ? 5 * 1024 * 1024 : 25 * 1024 * 1024 // 5MB mobile, 25MB desktop

  return {
    browser,
    version,
    os,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    ...features,
    maxFileSize,
    mediaRecorderMimeTypes: features.mediaRecorderMimeTypes
  }
}

/**
 * Logs platform information to console for debugging
 */
export function logPlatformInfo(): void {
  const info = getPlatformInfo()
  console.group('🖥️ Platform Information')
  console.log('Browser:', `${info.browser} ${info.version}`)
  console.log('OS:', info.os)
  console.log('Device Type:', `${info.deviceType} (Mobile: ${info.isMobile}, Tablet: ${info.isTablet}, Desktop: ${info.isDesktop})`)
  console.log('Touch Support:', info.touchSupported ? 'Yes' : 'No')
  console.log('Screen:', `${window.innerWidth}x${window.innerHeight}`)
  console.group('Feature Support')
  console.log('MediaRecorder:', info.supportsMediaRecorder)
  console.log('Canvas:', info.supportsCanvas)
  console.log('WebGL:', info.supportsWebGL)
  console.log('Web Workers:', info.supportsWorkers)
  console.log('Local Storage:', info.supportsStorage)
  console.log('Geolocation:', info.supportsGeolocation)
  console.log('Supported MIME Types:', info.mediaRecorderMimeTypes)
  console.groupEnd()
  console.groupEnd()
}

/**
 * Checks if a feature is available, logs warning if not
 */
export function checkFeatureAvailability(feature: keyof PlatformInfo, featureName: string): boolean {
  const info = getPlatformInfo()
  const isAvailable = info[feature] as unknown as boolean

  if (!isAvailable) {
    console.warn(`⚠️ ${featureName} is not available on this browser/device`)
  }

  return isAvailable
}

/**
 * Gets appropriate MIME type for audio recording based on browser support
 */
export function getAudioMimeType(): string {
  const mimeTypes = getPlatformInfo().mediaRecorderMimeTypes

  if (mimeTypes.length > 0) {
    return mimeTypes[0] // Return the first supported type
  }

  // Fallback (shouldn't happen if MediaRecorder is supported)
  return 'audio/webm'
}

/**
 * Checks if device is capable of handling feature with performance considerations
 */
export function canPerformanceHandle(operation: 'imageGeneration' | 'videoGeneration' | 'recordAudio'): boolean {
  const info = getPlatformInfo()

  switch (operation) {
    case 'imageGeneration':
      // Images require WebGL or good processing power
      return info.supportsWebGL || info.isDesktop
    case 'videoGeneration':
      // Video generation is demanding, prefer desktop with good resources
      return info.isDesktop && info.supportsWorkers
    case 'recordAudio':
      // Audio recording needs MediaRecorder support
      return info.supportsMediaRecorder
    default:
      return false
  }
}

/**
 * Gets browser-specific warnings or issues
 */
export function getBrowserIssues(): string[] {
  const info = getPlatformInfo()
  const issues: string[] = []

  // Safari-specific issues
  if (info.browser === 'Safari') {
    if (info.os === 'iOS') {
      issues.push('iOS Safari: Limited file upload support from camera')
      issues.push('iOS Safari: Canvas drawing may have performance issues')
    }
    issues.push('Safari: MediaRecorder support varies by version')
  }

  // Mobile-specific issues
  if (info.isMobile) {
    issues.push('Mobile: Limited file upload size (5MB recommended)')
    issues.push('Mobile: Video generation may be slow')
  }

  // IE issues (unsupported)
  if (info.browser === 'Internet Explorer') {
    issues.push('Internet Explorer: Not officially supported, please use a modern browser')
  }

  // Firefox-specific
  if (info.browser === 'Firefox' && info.os === 'iOS') {
    issues.push('Firefox iOS: MediaRecorder may have issues with audio MIME types')
  }

  return issues
}

/**
 * Logs any browser compatibility issues
 */
export function logBrowserIssues(): void {
  const issues = getBrowserIssues()
  if (issues.length > 0) {
    console.warn('⚠️ Browser Compatibility Issues:')
    issues.forEach(issue => console.warn(`  • ${issue}`))
  }
}

/**
 * Mobile-specific utilities
 */
export const MobileUtils = {
  /**
   * Requests microphone permission on mobile with specific error handling
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Immediately stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          console.warn('User denied microphone permission')
          return false
        } else if (error.name === 'NotFoundError') {
          console.error('No microphone device found')
          return false
        }
      }
      console.error('Error requesting microphone permission:', error)
      return false
    }
  },

  /**
   * Checks if device has microphone
   */
  hasMicrophone(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  },

  /**
   * Gets optimal canvas size for mobile device
   */
  getOptimalCanvasSize(): { width: number; height: number } {
    const info = getPlatformInfo()
    const maxDimension = Math.min(window.innerWidth, window.innerHeight) * 0.9

    return {
      width: Math.min(maxDimension, 800),
      height: Math.min(maxDimension * 1.2, 1000)
    }
  },

  /**
   * Checks if file size is acceptable for device
   */
  isFileSizeAcceptable(fileSize: number): boolean {
    const info = getPlatformInfo()
    return fileSize <= info.maxFileSize
  },

  /**
   * Gets device orientation
   */
  getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }
}
