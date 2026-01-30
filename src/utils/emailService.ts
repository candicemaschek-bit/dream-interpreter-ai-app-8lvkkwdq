/**
 * Email Service Integration
 * Supports both default Blink emails and custom domain emails
 */

import { blink } from '../blink/client'

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

export interface EmailConfig {
  fromEmail: string // Your custom domain email or use default
  fromName: string // Display name for emails
  replyToEmail?: string // Reply-to address
  useCustomDomain: boolean // Toggle between custom domain and default
}

// Default email configuration
const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  fromEmail: 'dreamcatcher@dreamworlds.io', // Custom domain email
  fromName: 'Dreamcatcher AI',
  replyToEmail: 'dreamcatcher@dreamworlds.io',
  useCustomDomain: false, // Default to false until verified
}

// Get email config from database or use defaults
export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const settings = await blink.db.globalSettings.list({
      where: { key: 'email_config' },
      limit: 1
    })
    
    if (settings.length > 0 && settings[0].value) {
      return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(settings[0].value) }
    }
  } catch (error) {
    console.error('Failed to fetch email config:', error)
  }
  return DEFAULT_EMAIL_CONFIG
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Helper to replace placeholders in template strings
 */
function replacePlaceholders(content: string, data: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(placeholder, value || '')
  }
  return result
}

/**
 * Try to get a template from the database, fall back to hardcoded defaults
 */
async function getTemplate(
  templateId: string,
  defaultTemplate: EmailTemplate,
  data: Record<string, string>
): Promise<EmailTemplate> {
  try {
    const templates = await blink.db.emailTemplates.list({
      where: { id: templateId, isActive: 1 },
      limit: 1
    })

    if (templates.length > 0) {
      const template = templates[0]
      return {
        subject: replacePlaceholders(template.subject, data),
        html: replacePlaceholders(template.bodyHtml, data),
        text: replacePlaceholders(template.bodyText || '', data)
      }
    }
  } catch (error) {
    console.error(`Failed to fetch template ${templateId}:`, error)
  }

  // Fallback to hardcoded template
  return {
    subject: replacePlaceholders(defaultTemplate.subject, data),
    html: replacePlaceholders(defaultTemplate.html, data),
    text: replacePlaceholders(defaultTemplate.text, data)
  }
}

function getEmailVerificationTemplate(
  displayName: string,
  verificationUrl: string
): EmailTemplate {
  return {
    subject: '✨ Verify Your Dreamcatcher AI Email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .content p { color: #333333; line-height: 1.6; margin: 16px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .footer { background-color: #f3f0ff; padding: 20px; text-align: center; color: #666666; font-size: 14px; }
            .footer a { color: #8B5CF6; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Dreamcatcher AI</h1>
            </div>
            <div class="content">
              <h2>Hello {{displayName}}!</h2>
              <p>Welcome to Dreamcatcher AI! We're excited to help you explore and interpret your dreams.</p>
              <p>Please verify your email address by clicking the button below:</p>
              <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
              <p style="color: #666666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #8B5CF6; font-size: 12px; word-break: break-all;">{{verificationUrl}}</p>
              <p style="color: #999999; font-size: 13px; margin-top: 32px;">This link expires in 24 hours. If you didn't create an account with Dreamcatcher AI, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Dreamcatcher AI. All rights reserved.</p>
              <p><a href="https://dreamcatcher.ai">Visit our website</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello {{displayName}}!\n\nWelcome to Dreamcatcher AI! We're excited to help you explore and interpret your dreams.\n\nPlease verify your email address by clicking this link:\n{{verificationUrl}}\n\nThis link expires in 24 hours. If you didn't create an account with Dreamcatcher AI, you can safely ignore this email.\n\n© 2025 Dreamcatcher AI. All rights reserved.\nVisit us at https://dreamcatcher.ai`,
  }
}

function getPasswordResetTemplate(
  displayName: string,
  resetUrl: string
): EmailTemplate {
  return {
    subject: '🔐 Reset Your Dreamcatcher AI Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .content p { color: #333333; line-height: 1.6; margin: 16px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; }
            .footer { background-color: #f3f0ff; padding: 20px; text-align: center; color: #666666; font-size: 14px; }
            .footer a { color: #8B5CF6; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello {{displayName}}!</h2>
              <p>We received a request to reset your password for your Dreamcatcher AI account.</p>
              <p>Click the button below to create a new password:</p>
              <a href="{{resetUrl}}" class="button">Reset Password</a>
              <p style="color: #666666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #8B5CF6; font-size: 12px; word-break: break-all;">{{resetUrl}}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2025 Dreamcatcher AI. All rights reserved.</p>
              <p><a href="https://dreamcatcher.ai">Visit our website</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello {{displayName}}!\n\nWe received a request to reset your password for your Dreamcatcher AI account.\n\nClick this link to create a new password:\n{{resetUrl}}\n\nThis link expires in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.\n\n© 2025 Dreamcatcher AI. All rights reserved.\nVisit us at https://dreamcatcher.ai`,
  }
}

function getMagicLinkTemplate(email: string, magicLinkUrl: string): EmailTemplate {
  return {
    subject: '🔮 Your Dreamcatcher AI Magic Link',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .content p { color: #333333; line-height: 1.6; margin: 16px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .footer { background-color: #f3f0ff; padding: 20px; text-align: center; color: #666666; font-size: 14px; }
            .footer a { color: #8B5CF6; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔮 Sign In to Dreamcatcher AI</h1>
            </div>
            <div class="content">
              <h2>Your Magic Link is Ready!</h2>
              <p>Click the button below to sign in to your Dreamcatcher AI account:</p>
              <a href="{{magicLinkUrl}}" class="button">Sign In Instantly</a>
              <p style="color: #666666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #8B5CF6; font-size: 12px; word-break: break-all;">{{magicLinkUrl}}</p>
              <p style="color: #999999; font-size: 13px; margin-top: 32px;">This link expires in 15 minutes and can only be used once. If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Dreamcatcher AI. All rights reserved.</p>
              <p><a href="https://dreamcatcher.ai">Visit our website</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your Magic Link is Ready!\n\nClick this link to sign in to your Dreamcatcher AI account:\n{{magicLinkUrl}}\n\nThis link expires in 15 minutes and can only be used once. If you didn't request this, please ignore this email.\n\n© 2025 Dreamcatcher AI. All rights reserved.\nVisit us at https://dreamcatcher.ai`,
  }
}

function getWelcomeTemplate(displayName: string): EmailTemplate {
  return {
    subject: '🌙 Welcome to Dreamcatcher AI!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .content p { color: #333333; line-height: 1.6; margin: 16px 0; }
            .content h3 { color: #8B5CF6; margin-top: 32px; }
            .content ul { color: #666666; line-height: 1.8; }
            .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .footer { background-color: #f3f0ff; padding: 20px; text-align: center; color: #666666; font-size: 14px; }
            .footer a { color: #8B5CF6; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌙 Welcome to Dreamcatcher AI!</h1>
            </div>
            <div class="content">
              <h2>Hello {{displayName}}!</h2>
              <p>Thank you for joining Dreamcatcher AI! We're thrilled to help you unlock the hidden meanings in your dreams.</p>
              <h3>✨ What You Can Do:</h3>
              <ul>
                <li>Describe your dreams using text, symbols, or images</li>
                <li>Get AI-powered interpretations of your dreams</li>
                <li>Generate stunning videos representing your dream worlds</li>
                <li>Track dream patterns and themes over time</li>
                <li>Build your personal dream library</li>
              </ul>
              <a href="https://dreamcatcher.ai/app" class="button">Start Interpreting Dreams</a>
              <p style="color: #666666; font-size: 14px; margin-top: 32px;">Need help? Reply to this email or visit our <a href="https://dreamcatcher.ai/support" style="color: #8B5CF6;">support center</a>.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Dreamcatcher AI. All rights reserved.</p>
              <p><a href="https://dreamcatcher.ai">Visit our website</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello {{displayName}}!\n\nThank you for joining Dreamcatcher AI! We're thrilled to help you unlock the hidden meanings in your dreams.\n\nWhat You Can Do:\n• Describe your dreams using text, symbols, or images\n• Get AI-powered interpretations of your dreams\n• Generate stunning videos representing your dream worlds\n• Track dream patterns and themes over time\n• Build your personal dream library\n\nStart interpreting dreams: https://dreamcatcher.ai/app\n\nNeed help? Visit our support center at https://dreamcatcher.ai/support\n\n© 2025 Dreamcatcher AI. All rights reserved.`,
  }
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  displayName: string,
  verificationUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getEmailConfig()
    const defaultTemplate = getEmailVerificationTemplate(displayName, verificationUrl)
    const template = await getTemplate('verify_email', defaultTemplate, { displayName, verificationUrl })

    const result = await blink.notifications.email({
      to: email,
      from: config.useCustomDomain ? `${config.fromName} <${config.fromEmail}>` : undefined, // Use display name if custom
      replyTo: config.replyToEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return {
      success: result.success,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Failed to send verification email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  displayName: string,
  resetUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getEmailConfig()
    const defaultTemplate = getPasswordResetTemplate(displayName, resetUrl)
    const template = await getTemplate('password_reset', defaultTemplate, { displayName, resetUrl })

    const result = await blink.notifications.email({
      to: email,
      from: config.useCustomDomain ? `${config.fromName} <${config.fromEmail}>` : undefined,
      replyTo: config.replyToEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return {
      success: result.success,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Failed to send password reset email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getEmailConfig()
    const defaultTemplate = getMagicLinkTemplate(email, magicLinkUrl)
    const template = await getTemplate('magic_link', defaultTemplate, { email, magicLinkUrl })

    const result = await blink.notifications.email({
      to: email,
      from: config.useCustomDomain ? `${config.fromName} <${config.fromEmail}>` : undefined,
      replyTo: config.replyToEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return {
      success: result.success,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Failed to send magic link email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  displayName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getEmailConfig()
    const defaultTemplate = getWelcomeTemplate(displayName)
    const template = await getTemplate('welcome_email', defaultTemplate, { displayName })

    const result = await blink.notifications.email({
      to: email,
      from: config.useCustomDomain ? `${config.fromName} <${config.fromEmail}>` : undefined,
      replyTo: config.replyToEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return {
      success: result.success,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Failed to send welcome email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

/**
 * Send custom notification email
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getEmailConfig()

    const result = await blink.notifications.email({
      to: email,
      from: config.useCustomDomain ? `${config.fromName} <${config.fromEmail}>` : undefined,
      replyTo: config.replyToEmail,
      subject,
      html: htmlContent,
      text: textContent,
    })

    return {
      success: result.success,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Failed to send notification email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

// ============================================================================
// EMAIL CONFIGURATION MANAGEMENT (For Admin Panel)
// ============================================================================

/**
 * Update email configuration
 */
export async function updateEmailConfig(
  config: Partial<EmailConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await blink.auth.me()
    if (!user) throw new Error('User not authenticated')

    const currentConfig = await getEmailConfig()
    const newConfig = { ...currentConfig, ...config }
    
    const settings = await blink.db.globalSettings.list({
      where: { key: 'email_config' },
      limit: 1
    })
    
    if (settings.length > 0) {
      await blink.db.globalSettings.update(settings[0].id, {
        value: JSON.stringify(newConfig),
        updatedAt: new Date().toISOString()
      })
    } else {
      await blink.db.globalSettings.create({
        key: 'email_config',
        value: JSON.stringify(newConfig),
        updatedAt: new Date().toISOString(),
        userId: user.id
      })
    }
    
    console.log('Email config updated:', newConfig)
    return { success: true }
  } catch (error: any) {
    console.error('Failed to update email config:', error)
    return {
      success: false,
      error: error.message || 'Failed to update configuration',
    }
  }
}

/**
 * Test email configuration by sending a test email
 */
export async function sendTestEmail(
  toEmail: string,
  configOverride?: EmailConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = configOverride || await getEmailConfig()

    const result = await blink.notifications.email({
      to: toEmail,
      from: config.useCustomDomain ? `${config.fromName} <${config.fromEmail}>` : undefined,
      replyTo: config.replyToEmail,
      subject: '✅ Test Email from Dreamcatcher AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f3f0ff; border-radius: 8px;">
          <h2 style="color: #8B5CF6;">✅ Email Configuration Test</h2>
          <p>Congratulations! Your email configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>From Name: ${config.fromName}</li>
            <li>From Email: ${config.fromEmail}</li>
            <li>Reply-To: ${config.replyToEmail || 'Not set'}</li>
            <li>Using Custom Domain: ${config.useCustomDomain ? 'Yes' : 'No'}</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 32px;">This is an automated test email from Dreamcatcher AI.</p>
        </div>
      `,
      text: `✅ Email Configuration Test\n\nCongratulations! Your email configuration is working correctly.\n\nConfiguration Details:\n- From Name: ${config.fromName}\n- From Email: ${config.fromEmail}\n- Reply-To: ${config.replyToEmail || 'Not set'}\n- Using Custom Domain: ${config.useCustomDomain ? 'Yes' : 'No'}\n\nThis is an automated test email from Dreamcatcher AI.`,
    })

    return {
      success: result.success,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Failed to send test email:', error)
    return {
      success: false,
      error: error.message || 'Failed to send test email',
    }
  }
}