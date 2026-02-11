/**
 * Helper utilities for Open Graph tag generation
 * Coordinates between client-side and server-side OG handling
 */

export const OG_FUNCTION_URL = 'https://8lvkkwdq--generate-og-tags.functions.blink.new'

/**
 * Get the server-side OG generation URL for a dream
 * This URL should be used by crawlers to fetch properly rendered OG tags
 */
export function getServerOGUrl(dreamId: string): string {
  return `${OG_FUNCTION_URL}?dreamId=${dreamId}`
}

/**
 * Check if the current request is from a social media crawler
 * Used to determine if we should redirect to server-side OG generation
 */
export function isCrawler(): boolean {
  if (typeof navigator === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const crawlerPatterns = [
    'bot',
    'crawler',
    'spider',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'slackbot',
    'whatsapp',
    'telegrambot',
    'discordbot',
    'pinterest',
    'redditbot',
  ]
  
  return crawlerPatterns.some(pattern => userAgent.includes(pattern))
}

/**
 * Prerender hint for crawlers
 * Adds a special meta tag that some crawlers use to find prerendered content
 */
export function addPrerenderHint(dreamId: string): void {
  if (typeof document === 'undefined') return
  
  // Add prerender-specific meta tag
  const prerenderTag = document.createElement('meta')
  prerenderTag.setAttribute('name', 'prerender-status-code')
  prerenderTag.setAttribute('content', '200')
  document.head.appendChild(prerenderTag)
  
  // Add canonical with fragment hint for AJAX crawling
  const canonicalTag = document.createElement('link')
  canonicalTag.setAttribute('rel', 'canonical')
  canonicalTag.setAttribute('href', `${window.location.origin}/dream/${dreamId}`)
  document.head.appendChild(canonicalTag)
}
