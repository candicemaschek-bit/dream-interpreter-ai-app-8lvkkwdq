/**
 * Utility for dynamically updating Open Graph meta tags
 * Used when sharing specific dream interpretations
 */

interface OpenGraphData {
  title: string
  description: string
  url: string
  image?: string
  type?: string
}

/**
 * Updates Open Graph meta tags dynamically for social sharing
 * This ensures shared dream links display proper preview cards
 */
export function updateOpenGraphTags(data: OpenGraphData): void {
  if (typeof document === 'undefined') return

  const defaultImage = `${window.location.origin}/og-image.png`
  const image = data.image || defaultImage

  // Update or create Open Graph meta tags
  updateMetaTag('og:title', data.title)
  updateMetaTag('og:description', data.description)
  updateMetaTag('og:url', data.url)
  updateMetaTag('og:image', image)
  updateMetaTag('og:type', data.type || 'article')

  // Update Twitter Card meta tags
  updateMetaTag('twitter:title', data.title, 'name')
  updateMetaTag('twitter:description', data.description, 'name')
  updateMetaTag('twitter:image', image, 'name')

  // Update page title and description
  document.title = data.title
  updateMetaTag('description', data.description, 'name')
}

/**
 * Helper function to update or create a meta tag
 */
function updateMetaTag(property: string, content: string, attr: 'property' | 'name' = 'property'): void {
  if (!content) return

  let metaTag = document.querySelector(`meta[${attr}="${property}"]`)
  
  if (metaTag) {
    metaTag.setAttribute('content', content)
  } else {
    metaTag = document.createElement('meta')
    metaTag.setAttribute(attr, property)
    metaTag.setAttribute('content', content)
    document.head.appendChild(metaTag)
  }
}

/**
 * Resets Open Graph tags to default values
 */
export function resetOpenGraphTags(): void {
  const defaultData: OpenGraphData = {
    title: 'Dreamcatcher AI',
    description: 'Discover the hidden meanings in your dreams with AI-powered interpretations. Input text, symbols, or images and unlock the secrets of your subconscious.',
    url: window.location.origin,
    type: 'website'
  }
  
  updateOpenGraphTags(defaultData)
}

/**
 * Generates Open Graph data for a dream interpretation
 */
export function generateDreamOpenGraphData(
  dreamTitle: string,
  dreamDescription: string,
  interpretation: string,
  dreamId: string,
  imageUrl?: string
): OpenGraphData {
  const truncatedDescription = dreamDescription.length > 200 
    ? `${dreamDescription.substring(0, 197)}...` 
    : dreamDescription

  const truncatedInterpretation = interpretation.length > 150
    ? `${interpretation.substring(0, 147)}...`
    : interpretation

  return {
    title: `Dream: ${dreamTitle} | Dreamcatcher AI`,
    description: `${truncatedDescription}\n\nInterpretation: ${truncatedInterpretation}`,
    url: `${window.location.origin}/dream/${dreamId}`,
    image: imageUrl,
    type: 'article'
  }
}
