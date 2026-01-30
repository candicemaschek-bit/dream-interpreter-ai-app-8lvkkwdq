# Edge Functions

This directory contains Blink edge functions for the Dreamcatcher AI platform.

## 📁 Functions Overview

### 1. `create-admin/` - Admin Seeding Function ⚠️ ONE-TIME USE

**Purpose**: Securely promote the first user to admin role.

**Security Level**: 🔴 **CRITICAL** - Delete after use!

**Usage**:
```bash
POST /functions/v1/create-admin
{
  "email": "your-email@example.com",
  "secret": "your-ADMIN_SETUP_SECRET"
}
```

**Setup Instructions**: See [docs/ADMIN_SETUP_GUIDE.md](../docs/ADMIN_SETUP_GUIDE.md)

**⚠️ IMPORTANT**: This function must be DELETED after creating your first admin. Leaving it deployed is a security risk.

---

### 2. `generate-video/` - Dream Video Generation

**Purpose**: Generate AI videos from dream interpretations.

**Security Level**: 🟢 Normal - Production function

**Usage**: Called automatically by the app when users click "Generate Dream Video".

---

### 3. `generate-watermarked-image/` - Image Watermarking

**Purpose**: Add watermarks to AI-generated images for free-tier users.

**Security Level**: 🟢 Normal - Production function

**Usage**: Called automatically during image generation for non-premium users.

---

### 4. `generate-og-tags/` - Open Graph Tags

**Purpose**: Generate dynamic Open Graph tags for dream sharing.

**Security Level**: 🟢 Normal - Production function

**Usage**: Automatically called when generating share links for dreams.

---

## 🚀 Deployment

### Deploy All Functions
Ask Blink AI to deploy edge functions, or deploy individually through Blink Dashboard.

### Deploy Single Function
```bash
# Through Blink Dashboard:
# 1. Go to Functions
# 2. Select function
# 3. Click Deploy
```

---

## 🔒 Security Best Practices

### For Production Functions:
- ✅ Always validate input parameters
- ✅ Use environment variables for secrets
- ✅ Implement rate limiting
- ✅ Log security-relevant events
- ✅ Return generic error messages to clients
- ✅ Set appropriate CORS headers

### For Admin/Setup Functions:
- ⚠️ Use one-time secrets
- ⚠️ Log all attempts (success and failures)
- ⚠️ Delete immediately after use
- ⚠️ Never commit secrets to git
- ⚠️ Restrict access via secret validation

---

## 📚 Documentation

- [Admin Setup Guide](../docs/ADMIN_SETUP_GUIDE.md) - First-time admin creation
- [Edge Functions Guide](../docs/EDGE_FUNCTIONS_GUIDE.md) - Development guide
- [API Documentation](../docs/API_DOCUMENTATION.md) - Function endpoints

---

## 🆘 Troubleshooting

### Function Not Found
- Verify function is deployed in Blink Dashboard
- Check function name matches route
- Ensure no typos in URL

### Unauthorized Errors
- Verify required secrets are added to project
- Check secret names match exactly
- Redeploy function after adding/changing secrets

### CORS Errors
- Verify CORS headers are set in function response
- Check allowed origins match your app domain
- Ensure OPTIONS method is handled

---

## 🔄 Function Lifecycle

```
Development → Testing → Deployment → Monitoring → Maintenance
     ↓           ↓           ↓            ↓            ↓
   Local     Preview      Live       Logs        Update
  Testing     Build     Function   Analysis    As Needed
```

---

**Last Updated**: 2025-11-15
