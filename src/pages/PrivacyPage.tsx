import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { SEOHead } from '../components/SEOHead'

// Table of Contents items with anchor links
const tocItems = [
  { id: 'overview', title: '1. Privacy Overview' },
  { id: 'information-collected', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Data' },
  { id: 'ai-processing', title: '4. AI Processing & Your Dreams' },
  { id: 'sensitive-content', title: '5. Sensitive Content Handling' },
  { id: 'data-security', title: '6. Data Security' },
  { id: 'your-rights', title: '7. Your Privacy Rights' },
  { id: 'data-retention', title: '8. Data Retention & Deletion' },
  { id: 'sharing', title: '9. Data Sharing & Third Parties' },
  { id: 'children', title: '10. Children\'s Privacy' },
  { id: 'international', title: '11. International Data Transfers' },
  { id: 'cookies', title: '12. Cookies & Tracking' },
  { id: 'updates', title: '13. Policy Updates' },
  { id: 'contact', title: '14. Contact Us' },
]

export function PrivacyPage() {
  return (
    <>
      <SEOHead page="privacy" />
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Subtle global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none fixed z-0"></div>
        <div className="relative z-10">
        <PageHeader logoSrc="/DW-logo.png" />

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-16 flex-1">
          <h1 className="text-4xl font-sans font-bold mb-4">Privacy & Security Policy</h1>
          
          <div className="mb-8 p-4 bg-secondary/30 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong>Version:</strong> 2.0 &nbsp;|&nbsp; <strong>Effective Date:</strong> December 7, 2025
            </p>
          </div>

          {/* Privacy Commitment Banner */}
          <div className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">🛡️ Our Privacy Commitment</h2>
            <p className="text-sm leading-relaxed">
              You control your privacy: Keep dreams private by default, choose anonymous sharing, and redact sensitive content before cloud analysis. We don't automatically process your personal details—you decide what to share.
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="mb-12 p-6 bg-card rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors py-1"
                >
                  {item.title}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-10 text-foreground">
            {/* Section 1: Privacy Overview */}
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">1. Privacy Overview</h2>
              <p className="mb-4 leading-relaxed">
                At DREAMWORLDS, we believe your dreams and personal reflections deserve the highest level of privacy and security. This policy explains how we collect, use, protect, and give you control over your data.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-card rounded-lg border text-center">
                  <p className="text-2xl mb-2">🔒</p>
                  <p className="font-medium">End-to-End Encryption</p>
                  <p className="text-xs text-muted-foreground mt-1">Your data is encrypted in transit and at rest</p>
                </div>
                <div className="p-4 bg-card rounded-lg border text-center">
                  <p className="text-2xl mb-2">🚫</p>
                  <p className="font-medium">No Data Selling</p>
                  <p className="text-xs text-muted-foreground mt-1">We never sell your personal information</p>
                </div>
                <div className="p-4 bg-card rounded-lg border text-center">
                  <p className="text-2xl mb-2">🎛️</p>
                  <p className="font-medium">Full Control</p>
                  <p className="text-xs text-muted-foreground mt-1">Export, delete, or manage your data anytime</p>
                </div>
              </div>
            </section>

            {/* Section 2: Information We Collect */}
            <section id="information-collected" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Information You Provide</h3>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• <strong>Account Information:</strong> Email address, password (hashed), display name, profile preferences</li>
                <li>• <strong>Dream Content:</strong> Dream descriptions, voice recordings, drawings, uploaded images</li>
                <li>• <strong>Emotional Data:</strong> Feelings, moods, and emotions you associate with dreams</li>
                <li>• <strong>Feedback:</strong> Support requests, survey responses, feature requests</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-2">Information Collected Automatically</h3>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• <strong>Usage Data:</strong> Features used, session duration, interaction patterns (anonymized)</li>
                <li>• <strong>Device Information:</strong> Device type, operating system, browser type (for compatibility)</li>
                <li>• <strong>Log Data:</strong> IP address (anonymized after 30 days), timestamps, error logs</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-2">Information We Do NOT Collect</h3>
              <ul className="space-y-2 ml-4 leading-relaxed text-green-700 dark:text-green-400">
                <li>• ✓ We do NOT collect your precise location</li>
                <li>• ✓ We do NOT collect contacts or address book</li>
                <li>• ✓ We do NOT collect financial information (payment processed by Stripe)</li>
                <li>• ✓ We do NOT create advertising profiles</li>
              </ul>
            </section>

            {/* Section 3: How We Use Your Data */}
            <section id="how-we-use" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">3. How We Use Your Data</h2>
              <ul className="space-y-3 ml-4 leading-relaxed">
                <li>
                  <strong>Service Delivery:</strong> To provide dream interpretation, video generation, and core features
                </li>
                <li>
                  <strong>Personalization:</strong> To customize your experience based on your preferences and history
                </li>
                <li>
                  <strong>Pattern Analysis:</strong> To identify recurring themes in your dreams (only with your consent)
                </li>
                <li>
                  <strong>Communication:</strong> To send service updates, security alerts, and optional newsletters
                </li>
                <li>
                  <strong>Improvement:</strong> To enhance our services using anonymized, aggregate data
                </li>
                <li>
                  <strong>Safety:</strong> To detect and prevent fraud, abuse, and security threats
                </li>
              </ul>
            </section>

            {/* Section 4: AI Processing & Your Dreams */}
            <section id="ai-processing" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">4. AI Processing & Your Dreams</h2>
              
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg mb-4">
                <p className="text-sm font-medium">
                  🧠 Transparency: Here's exactly how AI processes your dreams
                </p>
              </div>

              <h3 className="text-lg font-semibold mt-4 mb-2">How AI Interprets Your Dreams</h3>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>1. You submit a dream description (text, voice, or image)</li>
                <li>2. Your content is securely transmitted to our AI service</li>
                <li>3. AI generates an interpretation based on dream symbolism patterns</li>
                <li>4. The interpretation is returned to you and stored in your account</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-2">AI Training Disclosure</h3>
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="leading-relaxed">
                  <strong>You Control Your Privacy:</strong> Keep dreams private by default. Choose when to share, with whom, and what content to redact before cloud analysis. We don't automatically process your personal details—you decide what to share.
                </p>
                <p className="leading-relaxed mt-2 text-sm text-muted-foreground">
                  Your individual dreams are never used to train our AI models. We only use fully anonymized, aggregated patterns (like "dreams about flying are common") for research purposes, and only with your explicit consent.
                </p>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-2">AI Output Moderation</h3>
              <p className="leading-relaxed">
                Our AI includes safety filters to:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed mt-2">
                <li>• Prevent harmful or inappropriate interpretations</li>
                <li>• Add psychological safety disclaimers to sensitive topics</li>
                <li>• Redirect crisis situations to appropriate resources</li>
                <li>• Filter hallucinated or factually incorrect content</li>
              </ul>
            </section>

            {/* Section 5: Sensitive Content Handling */}
            <section id="sensitive-content" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">5. Sensitive Content Handling</h2>
              
              <p className="leading-relaxed mb-4">
                Dreams naturally contain sensitive themes including trauma, sexuality, violence, and fears. We've built comprehensive protections:
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">On-Device Classification</h3>
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                <p className="text-sm leading-relaxed">
                  <strong>Privacy-First Processing:</strong> Sensitive content is detected and classified locally on your device BEFORE anything is sent to our servers. This means we can protect your privacy without ever seeing your sensitive content.
                </p>
              </div>

              <h3 className="text-lg font-semibold mt-4 mb-2">Your Content Controls</h3>
              <ul className="space-y-3 ml-4 leading-relaxed">
                <li>
                  <strong>Automatic Redaction:</strong> Choose to automatically redact trauma, sexuality, violence, or fear-related content before cloud analysis
                </li>
                <li>
                  <strong>Analysis Consent:</strong> Explicitly approve whether sensitive dreams should be analyzed by AI
                </li>
                <li>
                  <strong>Local-Only Mode:</strong> Store dreams entirely on your device without any cloud processing
                </li>
                <li>
                  <strong>Granular Tags:</strong> View and manage sensitivity tags assigned to each dream
                </li>
              </ul>

              <p className="mt-4 leading-relaxed">
                Configure your preferences in{' '}
                <Link to="/settings" className="text-primary hover:underline">Privacy Settings</Link>.
              </p>
            </section>

            {/* Section 6: Data Security */}
            <section id="data-security" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">6. Data Security</h2>
              <p className="leading-relaxed mb-4">
                We implement industry-leading security measures to protect your data:
              </p>
              <ul className="space-y-3 ml-4 leading-relaxed">
                <li>
                  <strong>Encryption in Transit:</strong> All data is encrypted using TLS 1.3 (HTTPS)
                </li>
                <li>
                  <strong>Encryption at Rest:</strong> Sensitive data is encrypted using AES-256 on our servers
                </li>
                <li>
                  <strong>Secure Infrastructure:</strong> Hosted on enterprise-grade cloud platforms with SOC 2 compliance
                </li>
                <li>
                  <strong>Access Controls:</strong> Strict internal access policies; employees access data only when necessary
                </li>
                <li>
                  <strong>Security Monitoring:</strong> 24/7 monitoring for unauthorized access and anomalies
                </li>
                <li>
                  <strong>Regular Audits:</strong> Periodic security assessments and penetration testing
                </li>
              </ul>

              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm leading-relaxed">
                  <strong>Security Incident Notification:</strong> In the unlikely event of a data breach, we will notify affected users within 72 hours as required by law, and provide guidance on protective measures.
                </p>
              </div>
            </section>

            {/* Section 7: Your Privacy Rights */}
            <section id="your-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">7. Your Privacy Rights</h2>
              <p className="leading-relaxed mb-4">
                You have comprehensive rights over your personal data:
              </p>

              <div className="grid gap-4">
                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2">📥 Right to Access</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Request a complete copy of all personal data we hold about you
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2">📤 Right to Export</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download your dream library in portable formats (JSON, PDF)
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2">🗑️ Right to Delete</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Delete individual dreams or your entire account and all associated data
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2">✏️ Right to Rectify</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Correct inaccurate personal information in your account
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2">🚫 Right to Object</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Opt out of certain data processing, including pattern tracking
                  </p>
                </div>
                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium flex items-center gap-2">📦 Right to Portability</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive your data in a structured, machine-readable format
                  </p>
                </div>
              </div>

              <p className="mt-4 leading-relaxed">
                Exercise your rights via{' '}
                <Link to="/settings" className="text-primary hover:underline">Account Settings</Link>{' '}
                or email{' '}
                <a href="mailto:privacy@dreamworlds.io" className="text-primary hover:underline">
                  privacy@dreamworlds.io
                </a>
              </p>
            </section>

            {/* Section 8: Data Retention & Deletion */}
            <section id="data-retention" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">8. Data Retention & Deletion</h2>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">Retention Periods</h3>
              <table className="w-full text-sm border-collapse mt-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Data Type</th>
                    <th className="text-left py-2">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Dream content</td>
                    <td className="py-2">While account is active, or until you delete</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Account information</td>
                    <td className="py-2">While account is active + 30 days after deletion</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Usage analytics</td>
                    <td className="py-2">Anonymized after 90 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Server logs</td>
                    <td className="py-2">30 days (then anonymized or deleted)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Backup copies</td>
                    <td className="py-2">90 days after account deletion</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-lg font-semibold mt-6 mb-2">Account Deletion Process</h3>
              <ol className="space-y-2 ml-4 leading-relaxed list-decimal list-inside">
                <li>Request deletion via Settings or email privacy@dreamworlds.io</li>
                <li>Receive confirmation email within 24 hours</li>
                <li>7-day grace period to cancel (optional)</li>
                <li>All personal data permanently deleted within 30 days</li>
                <li>Receive deletion confirmation email</li>
              </ol>
            </section>

            {/* Section 9: Data Sharing & Third Parties */}
            <section id="sharing" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">9. Data Sharing & Third Parties</h2>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">We NEVER</h3>
              <ul className="space-y-2 ml-4 leading-relaxed text-green-700 dark:text-green-400">
                <li>• ✓ Sell your personal data to third parties</li>
                <li>• ✓ Share your dreams without explicit permission</li>
                <li>• ✓ Use your data for third-party advertising</li>
                <li>• ✓ Allow data brokers access to your information</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-2">Service Providers We Use</h3>
              <p className="leading-relaxed mb-4">
                We work with trusted third-party services that process data on our behalf:
              </p>
              <ul className="space-y-3 ml-4 leading-relaxed">
                <li>
                  <strong>Cloud Infrastructure:</strong> Secure hosting and data storage (SOC 2, ISO 27001 compliant)
                </li>
                <li>
                  <strong>AI Services:</strong> Dream interpretation and video generation (no data retained for training)
                </li>
                <li>
                  <strong>Payment Processing:</strong> Stripe for subscriptions (PCI DSS compliant, we never see your card)
                </li>
                <li>
                  <strong>Email Services:</strong> Account notifications and optional newsletters
                </li>
                <li>
                  <strong>Analytics:</strong> Anonymized usage metrics (no personal identifiers)
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-2">Legal Requirements</h3>
              <p className="leading-relaxed">
                We may disclose data if required by law, court order, or to protect rights, safety, or property. We will notify you of such requests unless legally prohibited.
              </p>
            </section>

            {/* Section 10: Children's Privacy */}
            <section id="children" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">10. Children's Privacy</h2>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ Dreamworlds is not intended for children under 13 years of age.
                </p>
              </div>
              <p className="leading-relaxed mb-4">
                We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe we have collected information from your child, please contact us immediately at{' '}
                <a href="mailto:privacy@dreamworlds.io" className="text-primary hover:underline">
                  privacy@dreamworlds.io
                </a>
                , and we will promptly delete such information.
              </p>
              <p className="leading-relaxed">
                Users aged 13-17 may use Dreamworlds with parental consent. Parents/guardians are responsible for monitoring their minor's use of the service.
              </p>
            </section>

            {/* Section 11: International Data Transfers */}
            <section id="international" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">11. International Data Transfers</h2>
              <p className="leading-relaxed mb-4">
                Dreamworlds operates globally. Your data may be transferred to and processed in countries outside your residence, including the United States.
              </p>
              <p className="leading-relaxed mb-4">
                We ensure appropriate safeguards for international transfers:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>• Data Processing Agreements with all service providers</li>
                <li>• Compliance with GDPR for EU/EEA users</li>
                <li>• Compliance with CCPA for California residents</li>
              </ul>
            </section>

            {/* Section 12: Cookies & Tracking */}
            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">12. Cookies & Tracking</h2>
              <p className="leading-relaxed mb-4">
                We use minimal cookies and tracking technologies:
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">Essential Cookies</h3>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Authentication tokens (required to keep you logged in)</li>
                <li>• Session identifiers (required for security)</li>
                <li>• Preference storage (dark mode, language settings)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Analytics (Optional)</h3>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Privacy-focused analytics (no personal identifiers)</li>
                <li>• Feature usage metrics (anonymized)</li>
                <li>• Error tracking (anonymized crash reports)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">What We Don't Use</h3>
              <ul className="space-y-2 ml-4 leading-relaxed text-green-700 dark:text-green-400">
                <li>• ✓ No advertising cookies or trackers</li>
                <li>• ✓ No cross-site tracking</li>
                <li>• ✓ No social media tracking pixels</li>
                <li>• ✓ No third-party data collection</li>
              </ul>
            </section>

            {/* Section 13: Policy Updates */}
            <section id="updates" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">13. Policy Updates</h2>
              <p className="leading-relaxed mb-4">
                We may update this Privacy Policy periodically. When we make material changes:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• We will notify you via email and/or prominent notice in the App</li>
                <li>• We will update the "Effective Date" at the top of this policy</li>
                <li>• Material changes take effect 30 days after notification</li>
                <li>• Continued use after the effective date constitutes acceptance</li>
              </ul>
              <p className="mt-4 leading-relaxed text-sm text-muted-foreground">
                We encourage you to review this policy periodically to stay informed about our privacy practices.
              </p>
            </section>

            {/* Section 14: Contact Us */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">14. Contact Us</h2>
              <p className="leading-relaxed mb-4">
                For privacy questions, concerns, or to exercise your rights:
              </p>
              <div className="p-4 bg-card rounded-lg border">
                <ul className="space-y-3 leading-relaxed">
                  <li>
                    <strong>Privacy Team:</strong>{' '}
                    <a href="mailto:privacy@dreamworlds.io" className="text-primary hover:underline">
                      privacy@dreamworlds.io
                    </a>
                  </li>
                  <li>
                    <strong>Data Protection Officer:</strong>{' '}
                    <a href="mailto:dpo@dreamworlds.io" className="text-primary hover:underline">
                      dpo@dreamworlds.io
                    </a>
                  </li>
                  <li>
                    <strong>General Support:</strong>{' '}
                    <a href="mailto:dreamcatcher@dreamworlds.io" className="text-primary hover:underline">
                      dreamcatcher@dreamworlds.io
                    </a>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-secondary rounded-lg">
                <h4 className="font-medium mb-2">Response Time Commitment</h4>
                <p className="text-sm text-muted-foreground">
                  We aim to respond to all privacy-related requests within 30 days. For EU/EEA residents, we comply with GDPR's one-month response requirement. For California residents, we comply with CCPA's 45-day response requirement.
                </p>
              </div>
            </section>

            <div className="mt-16 pt-8 border-t">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Version:</strong> 2.0 &nbsp;|&nbsp; <strong>Last updated:</strong> December 7, 2025
                </p>
                <div className="flex gap-4">
                  <Link to="/terms" className="text-sm text-primary hover:underline">
                    Terms of Service
                  </Link>
                  <Link to="/contact" className="text-sm text-primary hover:underline">
                    Contact Us
                  </Link>
                </div>
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
