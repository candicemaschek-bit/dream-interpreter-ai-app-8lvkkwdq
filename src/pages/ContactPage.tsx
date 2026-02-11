import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { SEOHead } from '../components/SEOHead'

export function ContactPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate form submission (in production, this would send to your backend)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <>
      <SEOHead page="contact" />
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Subtle global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none fixed z-0"></div>
        <div className="relative z-10">
        <PageHeader logoSrc="/DW-logo.png" />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-sans font-bold mb-4">Get in Touch</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Have questions, feedback, or need support? We'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Card 1 */}
          <div className="p-6 rounded-lg border border-primary/20 bg-white/50 dark:bg-card/30">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold font-sans">Email</h3>
            </div>
            <p className="text-sm text-muted-foreground break-all">
              <a href="mailto:support@dreamworlds.io" className="text-primary hover:underline">
                support@dreamworlds.io
              </a>
            </p>
            <p className="text-sm text-muted-foreground mt-2">We respond within 24 hours</p>
          </div>

          {/* Contact Info Card 2 */}
          <div className="p-6 rounded-lg border border-primary/20 bg-white/50 dark:bg-card/30">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold font-sans">Help Center</h3>
            </div>
            <p className="text-muted-foreground">
              Browse FAQs and documentation
            </p>
            <Button variant="link" className="p-0 h-auto mt-2 text-primary" onClick={() => navigate('/help-center')}>
              Visit Help Center →
            </Button>
          </div>

          {/* Contact Info Card 3 */}
          <div className="p-6 rounded-lg border border-primary/20 bg-white/50 dark:bg-card/30">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold font-sans">Location</h3>
            </div>
            <p className="text-muted-foreground">
              Serving dreamers worldwide
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl p-8 rounded-lg border border-primary/20 bg-white/50 dark:bg-card/30">
          <h2 className="text-2xl font-sans font-semibold mb-6">Send Us a Message</h2>
          
          {submitted ? (
            <div className="p-6 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-200 font-semibold">
                Thank you for your message! We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold font-sans mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold font-sans mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-semibold font-sans mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="What's this about?"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-semibold font-sans mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Tell us more..."
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-16 p-8 rounded-lg bg-primary/5 border border-primary/20">
          <h3 className="text-lg font-semibold font-sans mb-4">Response Time</h3>
          <p className="text-foreground leading-relaxed">
            We typically respond to all inquiries within 24 hours during business days. 
            For urgent issues or technical support, please email support@dreamworlds.io directly.
          </p>
        </div>
      </div>
      <PageFooter logoSrc="/DW-logo.png" />
      </div>
    </div>
    </>
  )
}