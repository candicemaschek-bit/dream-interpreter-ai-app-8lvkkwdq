# Email Integration Guide - Dreamcatcher AI

## 📧 Overview

Dreamcatcher AI now has a fully integrated email service that supports both **default Blink email** and **custom domain emails**. This guide explains how to configure and use email functionality in your application.

## ✅ What's Included

### Email Features
- ✉️ **Email Verification** - Verify user email addresses on signup
- 🔐 **Password Reset** - Secure password reset via email
- 🔮 **Magic Links** - Passwordless authentication
- 🌙 **Welcome Emails** - Onboarding emails after verification
- 📧 **Custom Notifications** - Send custom emails to users

### Email Templates
All emails include:
- **Responsive HTML** - Beautiful design on all devices
- **Plain Text Fallback** - For email clients that don't support HTML
- **Brand Styling** - Matches Dreamcatcher AI branding
- **Professional Layout** - Header, content, footer structure

## 🚀 Quick Start

### Option 1: Default Blink Email (Easiest)

No configuration required! Emails work out of the box using Blink's managed email service.

```typescript
// Emails are sent automatically through:
await blink.auth.signUp({ email, password }) // Sends verification email
await initiatePasswordReset(email) // Sends reset email
await sendMagicLink(email) // Sends magic link
```

**Pros:**
- ✅ Zero configuration
- ✅ Automatic deliverability optimization
- ✅ Works immediately

**Cons:**
- ❌ Emails come from Blink domain (not your brand)

---

### Option 2: Custom Domain Email (Recommended for Production)

Use your own domain email (e.g., `noreply@yourdomain.com`) for a professional appearance.

#### Step 1: Configure Email Settings

1. Navigate to **Admin Panel → Email Settings**
2. Toggle **"Use Custom Domain Email"** ON
3. Enter your email configuration:
   - **From Email:** `noreply@yourdomain.com`
   - **From Name:** `Dreamcatcher AI`
   - **Reply-To Email:** `support@yourdomain.com`
4. Click **Save Configuration**

#### Step 2: DNS Configuration (Required for Custom Domain)

To use your domain email, configure these DNS records with your domain provider:

**SPF Record** (TXT record for your domain):
```
v=spf1 include:_spf.blink.new ~all
```

**DKIM Record** (TXT record):
```
Contact Blink support for your DKIM key
```

**DMARC Record** (TXT record):
```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

#### Step 3: Test Your Configuration

1. Go to **Admin Panel → Email Settings → Test Email**
2. Enter your email address
3. Click **Send Test Email**
4. Check your inbox for the test email

**✅ Success indicators:**
- Email arrives in inbox (not spam)
- Shows your custom "From" address
- Includes all styling and branding

---

## 🔧 Technical Implementation

### Email Service Architecture

```
src/utils/emailService.ts
├── Email Configuration
│   ├── getEmailConfig() - Load config from database
│   └── updateEmailConfig() - Update email settings
├── Email Templates
│   ├── getEmailVerificationTemplate()
│   ├── getPasswordResetTemplate()
│   ├── getMagicLinkTemplate()
│   └── getWelcomeTemplate()
└── Sending Functions
    ├── sendVerificationEmail()
    ├── sendPasswordResetEmail()
    ├── sendMagicLinkEmail()
    ├── sendWelcomeEmail()
    └── sendNotificationEmail()
```

### How It Works

1. **User triggers email action** (signup, password reset, etc.)
2. **Token generation** - Secure token created in `tokenVerification.ts`
3. **Email template** - HTML/text content generated with personalization
4. **Blink SDK** - `blink.notifications.email()` sends the email
5. **Custom domain** (if enabled) - Email sent from your domain
6. **Delivery** - Email arrives in user's inbox

### Code Example: Send Custom Email

```typescript
import { sendNotificationEmail } from '../utils/emailService'

// Send a custom notification
const result = await sendNotificationEmail(
  'user@example.com',
  'Your Dream Analysis is Ready!',
  '<h1>Hello!</h1><p>Your dream analysis is complete.</p>',
  'Hello!\n\nYour dream analysis is complete.'
)

if (result.success) {
  console.log('Email sent! Message ID:', result.messageId)
} else {
  console.error('Failed to send:', result.error)
}
```

---

## 📝 Email Templates Reference

### 1. Email Verification

**Sent when:** User signs up  
**Purpose:** Verify email address ownership  
**Expires:** 24 hours  
**Template:** `getEmailVerificationTemplate()`

**Key elements:**
- Welcome message
- Verification button/link
- Expiration notice
- Security disclaimer

---

### 2. Password Reset

**Sent when:** User requests password reset  
**Purpose:** Securely reset forgotten password  
**Expires:** 1 hour  
**Template:** `getPasswordResetTemplate()`

**Key elements:**
- Reset password button/link
- Security warning
- Short expiration (1 hour)
- Ignore instructions if not requested

---

### 3. Magic Link

**Sent when:** User requests passwordless login  
**Purpose:** Sign in without password  
**Expires:** 15 minutes  
**Template:** `getMagicLinkTemplate()`

**Key elements:**
- Instant sign-in button/link
- One-time use notice
- Short expiration (15 minutes)

---

### 4. Welcome Email

**Sent when:** Email verification succeeds  
**Purpose:** Onboard new users  
**Expires:** Never  
**Template:** `getWelcomeTemplate()`

**Key elements:**
- Welcome message
- Feature highlights
- Call-to-action to start using app
- Support contact info

---

## 🎨 Customizing Email Templates

### Editing Templates

Templates are defined in `src/utils/emailService.ts`. Each template function returns:

```typescript
interface EmailTemplate {
  subject: string  // Email subject line
  html: string     // HTML version with styling
  text: string     // Plain text fallback
}
```

### Customization Tips

1. **Maintain brand consistency** - Use your brand colors and fonts
2. **Keep it responsive** - Test on mobile devices
3. **Include plain text** - Always provide a text version
4. **Short and clear** - Users scan emails quickly
5. **Clear CTA** - One primary action per email

### Example: Customize Welcome Email

```typescript
function getWelcomeTemplate(displayName: string): EmailTemplate {
  return {
    subject: '🎉 Welcome to Your Custom App!', // Your subject
    html: `
      <div style="background: #your-brand-color;">
        <h1>Welcome ${displayName}!</h1>
        <p>Your custom welcome message here...</p>
        <a href="https://yourapp.com">Get Started</a>
      </div>
    `,
    text: `Welcome ${displayName}!\n\nYour custom welcome message...`
  }
}
```

---

## 🔐 Security Best Practices

### Token Security
- ✅ All tokens are hashed before storage
- ✅ Tokens have short expiration times
- ✅ One-time use for password resets and magic links
- ✅ Lookup hashes prevent timing attacks

### Email Security
- ✅ SPF/DKIM/DMARC authentication (custom domain)
- ✅ HTTPS links only
- ✅ No sensitive data in email bodies
- ✅ Clear security warnings for password resets

---

## 🧪 Testing Email Integration

### Local Testing

**Using Default Blink Email:**
1. Sign up with a real email address
2. Check your inbox for verification email
3. Click the verification link
4. Should receive welcome email

**Using Custom Domain:**
1. Configure custom domain in Admin Panel
2. Send test email to your address
3. Verify email arrives with correct "From" address
4. Check spam folder if not in inbox

### Debugging Tips

**Email not arriving?**
- ✅ Check spam/junk folder
- ✅ Verify email address is correct
- ✅ Check admin panel for error messages
- ✅ Test with different email provider (Gmail, Outlook, etc.)

**Custom domain not working?**
- ✅ Verify DNS records are configured
- ✅ Wait 24-48 hours for DNS propagation
- ✅ Use DNS checker tool to verify records
- ✅ Contact Blink support for assistance

**Email goes to spam?**
- ✅ Configure SPF/DKIM/DMARC records
- ✅ Use professional email content (no spam triggers)
- ✅ Avoid excessive links or promotional language
- ✅ Warm up your domain (send gradually increasing emails)

---

## 📊 Admin Panel Features

### Email Settings Page

Navigate to: **Admin Panel → Email Settings**

**Tabs:**

1. **Configuration**
   - Toggle custom domain on/off
   - Configure from/reply-to addresses
   - View setup instructions

2. **Test Email**
   - Send test emails to verify configuration
   - See delivery status and message IDs
   - Test before going live

3. **Templates**
   - View all available email templates
   - See template status (Active/Inactive)
   - Preview template descriptions

---

## 🚨 Troubleshooting

### Common Issues

**Issue: "Failed to send email"**
- **Cause:** Network error or invalid configuration
- **Solution:** Check email configuration in Admin Panel, verify domain settings

**Issue: Emails go to spam**
- **Cause:** Missing DNS authentication records
- **Solution:** Configure SPF/DKIM/DMARC records for your domain

**Issue: Verification link expired**
- **Cause:** User clicked link after expiration time
- **Solution:** Resend verification email (button in app)

**Issue: Custom domain emails not working**
- **Cause:** DNS records not configured or propagated
- **Solution:** Verify DNS settings, wait for propagation (24-48 hours)

---

## 📚 API Reference

### Core Email Functions

#### `sendVerificationEmail(email, displayName, verificationUrl)`
Send email verification to new users.

**Parameters:**
- `email` (string) - Recipient email address
- `displayName` (string) - User's display name
- `verificationUrl` (string) - Verification link URL

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

---

#### `sendPasswordResetEmail(email, displayName, resetUrl)`
Send password reset email.

**Parameters:**
- `email` (string) - Recipient email address
- `displayName` (string) - User's display name
- `resetUrl` (string) - Password reset link URL

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

---

#### `sendMagicLinkEmail(email, magicLinkUrl)`
Send magic link for passwordless authentication.

**Parameters:**
- `email` (string) - Recipient email address
- `magicLinkUrl` (string) - Magic link URL

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

---

#### `sendWelcomeEmail(email, displayName)`
Send welcome email after successful verification.

**Parameters:**
- `email` (string) - Recipient email address
- `displayName` (string) - User's display name

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

---

#### `sendNotificationEmail(email, subject, htmlContent, textContent)`
Send custom notification email.

**Parameters:**
- `email` (string) - Recipient email address
- `subject` (string) - Email subject line
- `htmlContent` (string) - HTML email body
- `textContent` (string) - Plain text email body

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

---

#### `sendTestEmail(toEmail)`
Send test email to verify configuration.

**Parameters:**
- `toEmail` (string) - Test recipient email address

**Returns:** `{ success: boolean, messageId?: string, error?: string }`

---

## 🎯 Next Steps

### For Development
1. Use default Blink email (no setup required)
2. Test all email flows (signup, reset, magic link)
3. Verify templates look good on mobile

### For Production
1. Purchase a custom domain (e.g., `yourdomain.com`)
2. Configure DNS records (SPF, DKIM, DMARC)
3. Enable custom domain in Admin Panel
4. Send test emails to verify delivery
5. Monitor spam rates and deliverability

### Advanced Features
- **Email analytics** - Track open rates and clicks
- **A/B testing** - Test different subject lines
- **Segmentation** - Send targeted emails to user groups
- **Scheduling** - Schedule emails for optimal times
- **Templates editor** - Visual template customization

---

## 💡 Pro Tips

1. **Use your domain** - Custom domain email significantly improves trust
2. **Test thoroughly** - Send test emails to multiple email providers
3. **Monitor spam** - Use tools like Mail Tester to check spam score
4. **Keep it simple** - Simple, text-focused emails have better deliverability
5. **Personalize** - Use user's name and relevant information
6. **Mobile first** - Most emails are opened on mobile devices
7. **Clear CTA** - Make it obvious what action to take
8. **Unsubscribe link** - Always include (even for transactional emails)

---

## 🤝 Support

### Need Help?

- **Email integration issues:** Check this guide first
- **DNS configuration:** Contact your domain provider
- **Blink SDK questions:** Refer to Blink documentation
- **Custom requirements:** Contact Dreamcatcher AI support

### Resources

- [Blink SDK Email Documentation](https://blink.new/docs/notifications)
- [Email Deliverability Guide](https://blink.new/docs/email-deliverability)
- [DNS Configuration Help](https://blink.new/docs/custom-domain)

---

**Happy Emailing! 📧✨**
