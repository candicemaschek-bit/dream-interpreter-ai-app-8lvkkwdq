import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Search, ChevronDown, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { SEOHead } from '../components/SEOHead'
import { FAQ_STRUCTURED_DATA } from '../utils/seoMeta'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Simply click on the "Start Free" button on the landing page, enter your email or sign in with Google/Apple, and follow the onboarding steps. No credit card required!'
  },
  {
    category: 'Getting Started',
    question: 'Is there a free version of DREAMWORLDS?',
    answer: 'Yes! Our free Dreamer plan includes 2 lifetime dream analyses, letting you test the service completely risk-free before upgrading.'
  },
  {
    category: 'Getting Started',
    question: 'Can I change my subscription plan later?',
    answer: 'Absolutely! You can upgrade or downgrade your plan anytime from your Settings dashboard. Changes take effect immediately with prorated billing.'
  },
  {
    category: 'Dream Input & Analysis',
    question: 'What are the different ways to input my dream?',
    answer: 'You can record your dream using text input, voice recording, or by uploading drawings/images of dream symbols. Choose whichever method feels most natural for you.'
  },
  {
    category: 'Dream Input & Analysis',
    question: 'How accurate are the dream interpretations?',
    answer: 'Our AI uses psychological frameworks and symbol analysis to provide personalized interpretations. Remember, dreams are personal—use these insights as a guide for self-reflection rather than definitive truth.'
  },
  {
    category: 'Dream Input & Analysis',
    question: 'Can I edit or delete a dream after uploading?',
    answer: 'Yes! You can edit dream details or delete entries from your Dream Library at any time. Your privacy is important to us.'
  },
  {
    category: 'Subscription & Billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express). More payment options are coming soon!'
  },
  {
    category: 'Subscription & Billing',
    question: 'Is there a refund policy?',
    answer: 'We offer a 7-day money-back guarantee for annual subscriptions. Monthly subscriptions include our satisfaction guarantee—if you\'re not happy, contact us within 7 days for a refund.'
  },
  {
    category: 'Subscription & Billing',
    question: 'Do unused analyses carry over each month?',
    answer: 'No, your monthly allowance resets on the same day each month. Unused analyses don\'t carry over, so make the most of your plan each month!'
  },
  {
    category: 'DreamWorlds & Videos',
    question: 'What is DreamWorlds and when will it launch?',
    answer: 'DreamWorlds is an immersive cinematic experience that transforms your dreams into visual journeys. It\'s coming soon for VIP members with exclusive features.'
  },
  {
    category: 'DreamWorlds & Videos',
    question: 'Can I generate videos for free?',
    answer: 'Video generation depends on your plan. Architect tier includes 6-second videos per dream. VIP includes 45-second cinematic DreamWorlds. All tiers can purchase additional videos as add-ons.'
  },
  {
    category: 'Account & Privacy',
    question: 'Is my dream data private and secure?',
    answer: 'Yes! Your dreams are encrypted and stored securely. We never sell your data. See our Privacy Policy for complete details on how we protect your information.'
  },
  {
    category: 'Account & Privacy',
    question: 'Can I export my dream history?',
    answer: 'This feature is coming soon! You\'ll be able to download your complete dream journal and analysis history in a portable format.'
  },
  {
    category: 'Account & Privacy',
    question: 'How do I delete my account?',
    answer: 'You can request account deletion from your Settings. All your data will be permanently removed within 30 days. Contact support if you need assistance.'
  }
]

const categories = Array.from(new Set(faqs.map(faq => faq.category)))

export function HelpCenterPage() {
  const navigate = useNavigate()
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <>
      <SEOHead 
        page="help" 
        customSEO={{ structuredData: FAQ_STRUCTURED_DATA }}
      />
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Subtle global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none fixed z-0"></div>
        <div className="relative z-10">
        <PageHeader logoSrc="/DW-logo.png" />

        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-sans font-bold mb-4">Help Center</h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about DREAMWORLDS and your dream journey.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
        <h3 className="text-sm font-semibold mb-3">Filter by category:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4 mb-12">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-primary/20 rounded-lg overflow-hidden bg-white/50 dark:bg-card/30 hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-start justify-between gap-4 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex-1">
                    <span className="inline-block text-xs font-semibold text-primary mb-2">
                      {faq.category}
                    </span>
                    <h3 className="font-semibold text-foreground">{faq.question}</h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${
                      expandedFAQ === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedFAQ === idx && (
                  <div className="px-6 py-4 border-t border-primary/10 bg-primary/5">
                    <p className="text-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No results found for "{searchQuery}"</p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="p-8 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is here to help. Reach out to us anytime and we'll get back to you within 24 hours.
              </p>
              <Button onClick={() => navigate('/contact')} className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all">
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        </div>

        <PageFooter logoSrc="/DW-logo.png" />
        </div>
      </div>
    </>
  )
}
