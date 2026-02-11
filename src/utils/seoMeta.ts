/**
 * SEO Meta Tags and Structured Data Utilities
 * Centralizes SEO configuration for better maintainability
 */

export interface PageSEO {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogType?: string
  ogImage?: string
  structuredData?: any
}

export const SITE_CONFIG = {
  siteName: 'Dreamcatcher AI',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://dream-interpreter-ai-app-8lvkkwdq.live.blink.new',
  defaultImage: (typeof window !== 'undefined' ? window.location.origin : 'https://dream-interpreter-ai-app-8lvkkwdq.live.blink.new') + '/og-image.png',
  twitterHandle: '@dreamworldsio',
  logo: (typeof window !== 'undefined' ? window.location.origin : 'https://dream-interpreter-ai-app-8lvkkwdq.live.blink.new') + '/logo_new.png'
}

/**
 * Primary Keywords for Dream Interpretation Industry
 */
export const PRIMARY_KEYWORDS = [
  'dream interpretation',
  'AI dream analysis',
  'dream meaning',
  'dream symbols',
  'subconscious insights',
  'dream journal app',
  'dream decoder',
  'lucid dreaming tools'
]

/**
 * Page-Specific SEO Configuration
 */
export const PAGE_SEO: { [key: string]: PageSEO } = {
  home: {
    title: 'Dreamcatcher AI - AI-Powered Dream Interpretation & Analysis',
    description: 'Unlock the hidden meanings in your dreams with AI-powered interpretation. Decode dream symbols, track patterns, and explore your subconscious mind with personalized insights.',
    keywords: [
      'dream interpretation ai',
      'dream analyzer',
      'dream meaning decoder',
      'ai dream journal',
      'subconscious mind analysis',
      'dream symbol interpreter',
      'recurring dream analysis',
      'dream pattern tracking'
    ],
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Dreamcatcher AI',
      url: SITE_CONFIG.siteUrl,
      description: 'AI-powered dream interpretation and analysis platform',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_CONFIG.siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  },
  
  pricing: {
    title: 'Pricing Plans - Dreamcatcher AI Dream Interpretation Services',
    description: 'Flexible pricing plans for AI dream interpretation. Start free with 2 lifetime analyses. Premium plans include unlimited dreams, video generation, and advanced insights.',
    keywords: [
      'dream interpretation pricing',
      'dream analysis cost',
      'subscription plans',
      'free dream interpreter',
      'premium dream analysis'
    ],
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Dreamcatcher AI Subscription',
      description: 'AI-powered dream interpretation subscription plans',
      brand: {
        '@type': 'Brand',
        name: 'Dreamcatcher AI'
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Dreamer Plan',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Visionary Plan',
          price: '9.99',
          priceCurrency: 'USD',
          billingIncrement: 'P1M',
          availability: 'https://schema.org/InStock'
        },
        {
          '@type': 'Offer',
          name: 'Architect Plan',
          price: '19.99',
          priceCurrency: 'USD',
          billingIncrement: 'P1M',
          availability: 'https://schema.org/InStock'
        }
      ]
    }
  },
  
  signup: {
    title: 'Sign Up - Start Your Dream Journey with Dreamcatcher AI',
    description: 'Create your free account and get 2 lifetime dream analyses. No credit card required. Start understanding your dreams with AI-powered interpretations today.',
    keywords: [
      'dream app sign up',
      'create dream journal account',
      'free dream interpretation trial',
      'dream analysis registration'
    ],
    ogType: 'website'
  },
  
  privacy: {
    title: 'Privacy & Security Policy - Dreamcatcher AI Data Protection',
    description: 'Comprehensive privacy policy for Dreamcatcher AI. Learn how we protect your dream data with encryption, on-device classification, and transparent AI practices. Your dreams stay private.',
    keywords: [
      'dream data privacy',
      'secure dream journal',
      'data protection policy',
      'dream app security',
      'AI privacy policy',
      'GDPR compliant dream app',
      'sensitive content protection',
      'on-device classification'
    ],
    ogType: 'article',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy & Security Policy',
      description: 'Comprehensive privacy and security policy for Dreamcatcher AI',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Dreamcatcher AI',
        url: SITE_CONFIG.siteUrl
      },
      dateModified: '2025-12-07'
    }
  },
  
  terms: {
    title: 'Terms of Service - Dreamcatcher AI User Agreement & AI Disclaimer',
    description: 'Terms of Service for Dreamcatcher AI. Includes AI content disclaimer, age requirements (13+), data rights, sensitive content policies, and governing law. Version 2.0.',
    keywords: [
      'terms of service',
      'user agreement',
      'dream app terms',
      'service conditions',
      'AI disclaimer',
      'dream interpretation legal',
      'age requirements',
      'data deletion rights'
    ],
    ogType: 'article',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms of Service',
      description: 'Terms of Service and User Agreement for Dreamcatcher AI',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Dreamcatcher AI',
        url: SITE_CONFIG.siteUrl
      },
      dateModified: '2025-12-07'
    }
  },
  
  help: {
    title: 'Help Center - Dreamcatcher AI FAQs & Support',
    description: 'Find answers to common questions about dream interpretation, subscription plans, video generation, and account management. Get help with Dreamcatcher AI.',
    keywords: [
      'dream interpretation help',
      'dream analysis faq',
      'dream app support',
      'how to interpret dreams'
    ],
    ogType: 'website'
  },
  
  contact: {
    title: 'Contact Us - Get Support for Dreamcatcher AI',
    description: 'Have questions about dream interpretation? Contact our support team for help with your account, interpretations, or technical issues. We respond within 24 hours.',
    keywords: [
      'dream interpretation support',
      'contact dream app',
      'dream analysis help desk',
      'customer service'
    ],
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Dreamcatcher AI',
      description: 'Contact our support team for help',
      url: `${SITE_CONFIG.siteUrl}/contact`
    }
  }
}

/**
 * FAQ Structured Data for Help Center
 */
export const FAQ_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How accurate are AI dream interpretations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI uses psychological frameworks and symbol analysis to provide personalized interpretations. Dreams are deeply personal, so use these insights as a guide for self-reflection rather than definitive truth.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is there a free version of Dreamcatcher AI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Our free Dreamer plan includes 2 lifetime dream analyses, letting you test the service completely risk-free before upgrading to paid plans.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I input my dreams?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can record your dreams using text input, voice recording, or by uploading drawings and images of dream symbols. Choose whichever method feels most natural for you.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is my dream data private and secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Your dreams are encrypted and stored securely. We never sell your data. See our Privacy Policy for complete details on how we protect your information.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I generate videos of my dreams?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Video generation depends on your plan. Architect tier includes 6-second videos per dream. VIP includes 45-second cinematic DreamWorlds. All tiers can purchase additional videos as add-ons.'
      }
    }
  ]
}

/**
 * Organization Structured Data
 */
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Dreamcatcher AI',
  alternateName: 'DreamWorlds.io',
  url: SITE_CONFIG.siteUrl,
  logo: SITE_CONFIG.logo,
  description: 'AI-powered dream interpretation and analysis platform helping users understand their subconscious mind through dream symbols, patterns, and insights.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'dreamcatcher@dreamworlds.io',
    contactType: 'Customer Support',
    availableLanguage: ['English']
  },
  sameAs: [
    'https://twitter.com/dreamworldsio',
    'https://facebook.com/dreamworldsio'
  ]
}

/**
 * SoftwareApplication Schema for App Listing
 */
export const SOFTWARE_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Dreamcatcher AI',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web Browser, iOS, Android',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127'
  },
  description: 'AI-powered dream interpretation app that helps you decode dream symbols, track patterns, and explore your subconscious mind with personalized insights.'
}
