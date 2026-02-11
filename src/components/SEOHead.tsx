/**
 * SEO Head Component
 * Dynamically updates meta tags, structured data, and Open Graph tags
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PAGE_SEO, SITE_CONFIG, ORGANIZATION_SCHEMA, PageSEO } from '../utils/seoMeta'

interface SEOHeadProps {
  page?: keyof typeof PAGE_SEO
  customSEO?: Partial<PageSEO>
}

export function SEOHead({ page, customSEO }: SEOHeadProps) {
  const location = useLocation()
  
  useEffect(() => {
    // Determine which page configuration to use
    let seoConfig: PageSEO
    
    if (customSEO) {
      // Custom SEO provided - merge with defaults
      seoConfig = {
        title: customSEO.title || `${SITE_CONFIG.siteName} - AI Dream Interpretation`,
        description: customSEO.description || 'Discover the hidden meanings in your dreams',
        ...customSEO
      }
    } else if (page && PAGE_SEO[page]) {
      // Use predefined page SEO
      seoConfig = PAGE_SEO[page]
    } else {
      // Default fallback
      seoConfig = PAGE_SEO.home
    }
    
    // Update document title
    document.title = seoConfig.title
    
    // Update meta description
    updateMetaTag('name', 'description', seoConfig.description)
    
    // Update keywords if provided
    if (seoConfig.keywords && seoConfig.keywords.length > 0) {
      updateMetaTag('name', 'keywords', seoConfig.keywords.join(', '))
    }
    
    // Update canonical URL
    const canonicalUrl = seoConfig.canonical || `${SITE_CONFIG.siteUrl}${location.pathname}`
    updateLinkTag('canonical', canonicalUrl)
    
    // Update Open Graph tags
    updateMetaTag('property', 'og:title', seoConfig.title)
    updateMetaTag('property', 'og:description', seoConfig.description)
    updateMetaTag('property', 'og:url', canonicalUrl)
    updateMetaTag('property', 'og:type', seoConfig.ogType || 'website')
    updateMetaTag('property', 'og:image', seoConfig.ogImage || SITE_CONFIG.defaultImage)
    updateMetaTag('property', 'og:site_name', SITE_CONFIG.siteName)
    
    // Update Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image')
    updateMetaTag('name', 'twitter:title', seoConfig.title)
    updateMetaTag('name', 'twitter:description', seoConfig.description)
    updateMetaTag('name', 'twitter:image', seoConfig.ogImage || SITE_CONFIG.defaultImage)
    
    // Update or add structured data
    updateStructuredData([
      ORGANIZATION_SCHEMA,
      ...(seoConfig.structuredData ? [seoConfig.structuredData] : [])
    ])
    
  }, [page, customSEO, location.pathname])
  
  return null // This component only manages head elements
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(attribute: string, key: string, value: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement
  
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  
  element.setAttribute('content', value)
}

/**
 * Helper function to update or create link tags
 */
function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement
  
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  
  element.setAttribute('href', href)
}

/**
 * Helper function to update structured data (JSON-LD)
 */
function updateStructuredData(schemas: any[]) {
  // Remove existing structured data scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
  existingScripts.forEach(script => script.remove())
  
  // Add new structured data
  schemas.forEach(schema => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    document.head.appendChild(script)
  })
}
