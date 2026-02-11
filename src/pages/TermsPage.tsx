import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { SEOHead } from '../components/SEOHead'
import { Link } from 'react-router-dom'

// Table of Contents items with anchor links
const tocItems = [
  { id: 'agreement', title: '1. Agreement to Terms' },
  { id: 'eligibility', title: '2. Eligibility & Age Requirements' },
  { id: 'license', title: '3. Use License' },
  { id: 'ai-disclaimer', title: '4. AI-Generated Content Disclaimer' },
  { id: 'content-ownership', title: '5. Content Ownership & IP Rights' },
  { id: 'data-rights', title: '6. Data Retention & Deletion Rights' },
  { id: 'sensitive-content', title: '7. Sensitive Content Acknowledgment' },
  { id: 'prohibited-conduct', title: '8. Prohibited Conduct' },
  { id: 'subscriptions', title: '9. Subscription Terms' },
  { id: 'warranties', title: '10. Disclaimer of Warranties' },
  { id: 'liability', title: '11. Limitation of Liability' },
  { id: 'indemnification', title: '12. Indemnification' },
  { id: 'termination', title: '13. Termination' },
  { id: 'governing-law', title: '14. Governing Law & Jurisdiction' },
  { id: 'changes', title: '15. Changes to Terms' },
  { id: 'contact', title: '16. Contact Information' },
]

export function TermsPage() {
  return (
    <>
      <SEOHead page="terms" />
      <div className="min-h-screen bg-background flex flex-col relative">
        {/* Subtle global gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none fixed z-0"></div>
        <div className="relative z-10">
        <PageHeader logoSrc="/DW-logo.png" />

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-16 flex-1">
          <h1 className="text-4xl font-sans font-bold mb-4">Terms of Service</h1>
          
          <div className="mb-8 p-4 bg-secondary/30 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong>Version:</strong> 2.0 &nbsp;|&nbsp; <strong>Effective Date:</strong> December 7, 2025
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
            {/* Section 1: Agreement to Terms */}
            <section id="agreement" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="leading-relaxed mb-4">
                By accessing and using Dreamworlds ("the Service," "our App," "we," "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the platform.
              </p>
              <p className="leading-relaxed">
                These Terms constitute a legally binding agreement between you and Dreamworlds. Please read them carefully before using our services.
              </p>
            </section>

            {/* Section 2: Eligibility & Age Requirements */}
            <section id="eligibility" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">2. Eligibility & Age Requirements</h2>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ Age Restriction: You must be at least 13 years old to use Dreamworlds.
                </p>
              </div>
              <p className="leading-relaxed mb-4">
                By using Dreamworlds, you represent and warrant that:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• You are at least 13 years of age (or 16 in the European Union)</li>
                <li>• If you are under 18, you have obtained parental or guardian consent to use the Service</li>
                <li>• You have the legal capacity to enter into this agreement</li>
                <li>• You are not prohibited from using the Service under applicable laws</li>
              </ul>
              <p className="leading-relaxed mt-4 text-sm text-muted-foreground">
                Parents and guardians: If you allow a minor to use Dreamworlds, you are responsible for monitoring their activity and agree to these Terms on their behalf.
              </p>
            </section>

            {/* Section 3: Use License */}
            <section id="license" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">3. Use License</h2>
              <p className="mb-4 leading-relaxed">
                We grant you a limited, non-exclusive, non-transferable, revocable license to access and use Dreamworlds for personal, non-commercial purposes. You agree not to:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Attempt to gain unauthorized access to the platform or its systems</li>
                <li>• Reverse engineer, decompile, or disassemble any code or algorithms</li>
                <li>• Use the service to harm others or violate any laws</li>
                <li>• Share your account credentials with others</li>
                <li>• Attempt to bypass security, access controls, or usage limits</li>
                <li>• Use automated systems (bots, scrapers) to access the Service</li>
                <li>• Sublicense, sell, or redistribute access to the Service</li>
              </ul>
            </section>

            {/* Section 4: AI-Generated Content Disclaimer */}
            <section id="ai-disclaimer" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">4. AI-Generated Content Disclaimer</h2>
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg mb-4">
                <p className="text-sm font-medium">
                  🧠 Important: AI interpretations are for personal reflection and entertainment only.
                </p>
              </div>
              <p className="mb-4 leading-relaxed">
                Dreamworlds uses artificial intelligence to generate dream interpretations, visualizations, and videos. You acknowledge and agree that:
              </p>
              <ul className="space-y-3 ml-4 leading-relaxed">
                <li>
                  <strong>Not Medical Advice:</strong> AI-generated interpretations are NOT a substitute for professional mental health advice, diagnosis, or treatment. They should never be used as the basis for medical, psychological, or therapeutic decisions.
                </li>
                <li>
                  <strong>Not Psychologically Validated:</strong> Our AI interpretations are based on general dream symbolism and pattern recognition, not clinically validated psychological methodologies.
                </li>
                <li>
                  <strong>May Contain Errors:</strong> AI systems can produce inaccurate, incomplete, or contextually inappropriate interpretations. We do not guarantee the accuracy or reliability of AI-generated content.
                </li>
                <li>
                  <strong>Entertainment Purpose:</strong> The Service is designed for personal reflection, self-discovery, and entertainment—not clinical analysis.
                </li>
                <li>
                  <strong>Seek Professional Help:</strong> If you experience distress, recurring nightmares, or psychological concerns, please consult a qualified mental health professional.
                </li>
              </ul>
              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Crisis Resources:</strong> If you're in crisis, please contact emergency services or a crisis helpline in your country. In the US, call or text 988 for the Suicide & Crisis Lifeline.
                </p>
              </div>
            </section>

            {/* Section 5: Content Ownership & IP Rights */}
            <section id="content-ownership" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">5. Content Ownership & IP Rights</h2>
              <h3 className="text-lg font-semibold mt-4 mb-2">Your Content</h3>
              <p className="mb-4 leading-relaxed">
                You retain full ownership of all original content you create on Dreamworlds, including dream entries, voice recordings, drawings, and uploaded images.
              </p>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">License Grant to Dreamworlds</h3>
              <p className="mb-4 leading-relaxed">
                By using our service, you grant us a limited, non-exclusive license to:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Store and process your content to provide our services</li>
                <li>• Generate AI interpretations based on your dream descriptions</li>
                <li>• Create video visualizations of your dreams</li>
                <li>• Use anonymized, aggregated data for service improvement (never identifiable)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">AI-Generated Content Ownership</h3>
              <p className="mb-4 leading-relaxed">
                Regarding AI-generated interpretations and videos created from your dreams:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• You receive a personal, non-exclusive license to use, share, and download AI-generated content for non-commercial purposes</li>
                <li>• AI-generated videos may contain watermarks indicating they were created with Dreamworlds</li>
                <li>• We retain rights to the underlying AI models and interpretation algorithms</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">AI Training Disclosure</h3>
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm leading-relaxed">
                  <strong>You Control Your Privacy:</strong> Keep dreams private by default, choose anonymous sharing, and redact sensitive content before cloud analysis. We don't automatically process your personal details—you decide what to share.
                </p>
              </div>
            </section>

            {/* Section 6: Data Retention & Deletion Rights */}
            <section id="data-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">6. Data Retention & Deletion Rights</h2>
              <p className="mb-4 leading-relaxed">
                You have comprehensive rights over your data:
              </p>
              <ul className="space-y-3 ml-4 leading-relaxed">
                <li>
                  <strong>Right to Access:</strong> Request a copy of all data we hold about you at any time
                </li>
                <li>
                  <strong>Right to Export:</strong> Download your dream library in standard formats (JSON, PDF)
                </li>
                <li>
                  <strong>Right to Delete:</strong> Delete individual dreams or your entire account and all associated data
                </li>
                <li>
                  <strong>Right to Portability:</strong> Transfer your data to another service
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-2">Data Retention Periods</h3>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• <strong>Active accounts:</strong> Data retained while your account is active</li>
                <li>• <strong>Account deletion:</strong> All personal data deleted within 30 days of account deletion request</li>
                <li>• <strong>Inactive accounts:</strong> Accounts inactive for 24+ months may be deleted after notice</li>
                <li>• <strong>Legal obligations:</strong> Some data may be retained longer if required by law</li>
              </ul>

              <p className="mt-4 leading-relaxed">
                To exercise your data rights, visit your{' '}
                <Link to="/settings" className="text-primary hover:underline">Account Settings</Link>{' '}
                or contact us at{' '}
                <a href="mailto:privacy@dreamworlds.io" className="text-primary hover:underline">
                  privacy@dreamworlds.io
                </a>
              </p>
            </section>

            {/* Section 7: Sensitive Content Acknowledgment */}
            <section id="sensitive-content" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">7. Sensitive Content Acknowledgment</h2>
              <p className="mb-4 leading-relaxed">
                Dreams naturally contain a wide range of themes, including potentially sensitive content. By using Dreamworlds, you acknowledge that:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed mb-4">
                <li>• Dreams may include themes of trauma, violence, sexuality, fears, and other sensitive subjects</li>
                <li>• You are solely responsible for the content you choose to record and analyze</li>
                <li>• AI interpretations of sensitive content may be triggering or uncomfortable</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Your Privacy Controls</h3>
              <p className="leading-relaxed mb-4">
                We provide robust tools to protect your sensitive content:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• <strong>On-device classification:</strong> Sensitive content is detected locally before any cloud upload</li>
                <li>• <strong>Redaction options:</strong> Choose to automatically redact trauma, sexuality, violence, or fear-related content</li>
                <li>• <strong>Local-only mode:</strong> Store dreams locally without cloud AI analysis</li>
                <li>• <strong>Granular controls:</strong> Customize exactly what content is analyzed or shared</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                Configure your preferences in{' '}
                <Link to="/settings" className="text-primary hover:underline">Privacy Settings</Link>. Also see our{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for full details.
              </p>
            </section>

            {/* Section 8: Prohibited Conduct */}
            <section id="prohibited-conduct" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">8. Prohibited Conduct</h2>
              <p className="mb-4 leading-relaxed">
                You agree not to use Dreamworlds to:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Share illegal, defamatory, or abusive content</li>
                <li>• Harass, threaten, or harm other users</li>
                <li>• Spam or engage in phishing activities</li>
                <li>• Infringe on intellectual property rights</li>
                <li>• Upload malware or malicious code</li>
                <li>• Impersonate others or misrepresent your identity</li>
                <li>• Manipulate AI systems to produce harmful content</li>
                <li>• Violate any applicable laws or regulations</li>
              </ul>
            </section>

            {/* Section 9: Subscription Terms */}
            <section id="subscriptions" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">9. Subscription Terms</h2>
              <ul className="space-y-3 ml-4 leading-relaxed">
                <li>• <strong>Auto-Renewal:</strong> Subscriptions renew automatically unless canceled at least 24 hours before the renewal date</li>
                <li>• <strong>Cancellation:</strong> You can cancel at any time; access continues until the end of your billing period</li>
                <li>• <strong>Refunds:</strong> Refunds are not available for partial billing periods, except as required by law</li>
                <li>• <strong>Price Changes:</strong> We reserve the right to change pricing with 30 days' notice; existing subscriptions honored at current rate until renewal</li>
                <li>• <strong>Free Trial:</strong> Free trial terms are specified at signup; you will be charged when the trial ends unless you cancel</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                View subscription details and pricing on our{' '}
                <Link to="/pricing" className="text-primary hover:underline">Pricing Page</Link>.
              </p>
            </section>

            {/* Section 10: Disclaimer of Warranties */}
            <section id="warranties" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">10. Disclaimer of Warranties</h2>
              <div className="p-4 bg-secondary rounded-lg mb-4">
                <p className="text-sm uppercase tracking-wide font-medium">Legal Notice</p>
              </div>
              <p className="leading-relaxed mb-4">
                DREAMWORLDS IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="leading-relaxed mb-4">
                We specifically disclaim any warranty that:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• AI interpretations are medically, psychologically, or scientifically accurate</li>
                <li>• The Service will be uninterrupted, secure, or error-free</li>
                <li>• Results obtained from the Service will be accurate or reliable</li>
                <li>• Any errors will be corrected</li>
              </ul>
            </section>

            {/* Section 11: Limitation of Liability */}
            <section id="liability" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">11. Limitation of Liability</h2>
              <p className="leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, DREAMWORLDS AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Loss of profits, data, or goodwill</li>
                <li>• Service interruption or computer damage</li>
                <li>• Emotional distress caused by AI interpretations</li>
                <li>• Decisions made based on AI-generated content</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            {/* Section 12: Indemnification */}
            <section id="indemnification" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">12. Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify and hold harmless Dreamworlds, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of another party.
              </p>
            </section>

            {/* Section 13: Termination */}
            <section id="termination" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">13. Termination</h2>
              <p className="leading-relaxed mb-4">
                We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including but not limited to:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• Violation of these Terms</li>
                <li>• Engaging in prohibited conduct</li>
                <li>• Fraudulent or illegal activity</li>
                <li>• Non-payment of subscription fees</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Upon termination, your right to use the Service ceases immediately. You may request your data before termination takes effect.
              </p>
            </section>

            {/* Section 14: Governing Law & Jurisdiction */}
            <section id="governing-law" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">14. Governing Law & Jurisdiction</h2>
              <p className="leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
              </p>
              <p className="leading-relaxed mb-4">
                Any disputes arising from these Terms or your use of the Service shall be resolved through:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• <strong>Informal Resolution:</strong> Contact us first to resolve disputes amicably</li>
                <li>• <strong>Arbitration:</strong> If informal resolution fails, disputes shall be resolved by binding arbitration under the rules of the American Arbitration Association</li>
                <li>• <strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive any right to participate in class action lawsuits</li>
              </ul>
              <p className="leading-relaxed mt-4 text-sm text-muted-foreground">
                For EU users: Nothing in these Terms affects your statutory rights under applicable consumer protection laws.
              </p>
            </section>

            {/* Section 15: Changes to Terms */}
            <section id="changes" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">15. Changes to Terms</h2>
              <p className="leading-relaxed mb-4">
                We may update these Terms at any time. When we make material changes:
              </p>
              <ul className="space-y-2 ml-4 leading-relaxed">
                <li>• We will notify you via email or prominent notice in the App</li>
                <li>• Changes take effect 30 days after notification for existing users</li>
                <li>• Continued use after the effective date constitutes acceptance</li>
                <li>• If you disagree with changes, you may close your account before they take effect</li>
              </ul>
            </section>

            {/* Section 16: Contact Information */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-sans font-semibold mb-4">16. Contact Information</h2>
              <p className="leading-relaxed mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="p-4 bg-card rounded-lg border">
                <ul className="space-y-2 leading-relaxed">
                  <li>
                    <strong>General Inquiries:</strong>{' '}
                    <a href="mailto:dreamcatcher@dreamworlds.io" className="text-primary hover:underline">
                      dreamcatcher@dreamworlds.io
                    </a>
                  </li>
                  <li>
                    <strong>Privacy Concerns:</strong>{' '}
                    <a href="mailto:privacy@dreamworlds.io" className="text-primary hover:underline">
                      privacy@dreamworlds.io
                    </a>
                  </li>
                  <li>
                    <strong>Legal Matters:</strong>{' '}
                    <a href="mailto:legal@dreamworlds.io" className="text-primary hover:underline">
                      legal@dreamworlds.io
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            <div className="mt-16 pt-8 border-t">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Version:</strong> 2.0 &nbsp;|&nbsp; <strong>Last updated:</strong> December 7, 2025
                </p>
                <div className="flex gap-4">
                  <Link to="/privacy" className="text-sm text-primary hover:underline">
                    Privacy Policy
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
