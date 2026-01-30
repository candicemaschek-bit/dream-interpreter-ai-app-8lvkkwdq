# Privacy-First Social Sharing System

## Overview

Dreamcatcher AI now features a comprehensive privacy-first social sharing system that allows users to share their dream interpretations without exposing any personal information.

## Features

### 1. **Share as Image** 📸
- Generates a beautiful shareable image card
- Includes dream title and interpretation excerpt
- Features Dreamcatcher AI branding and watermark
- **Privacy**: No personal information included (no user name, email, dates)
- Downloads as PNG file

### 2. **Copy Image** 📋
- Same as "Share as Image" but copies to clipboard
- Can be pasted directly into social media posts
- Works on modern browsers with Clipboard API support

### 3. **Copy Link** 🔗
- Generates a shareable link to the dream interpretation page
- Link points to `/dream/{dreamId}` for public viewing
- **Privacy**: Only includes interpretation content, no personal data
- Perfect for sharing via messaging apps

### 4. **Social Media Sharing** 🌐
- Quick share to Twitter/X, Facebook, LinkedIn, Email
- Pre-filled text with interpretation snippet
- Opens in popup window for better UX
- Uses existing localization system

## Share Card Design

The generated share card features:

```
┌─────────────────────────────────────────────┐
│  [Purple gradient background with dream     │
│   image overlay (blurred, 20% opacity)]     │
│                                              │
│  Dream Title (Large, Serif)                 │
│                                              │
│  ┌──────────────────────────────────┐       │
│  │ Interpretation Excerpt           │       │
│  │ (200 chars max, clean card)      │       │
│  └──────────────────────────────────┘       │
│                                              │
│  ✨ Interpreted by Dreamcatcher AI          │
│                     Interpret your dreams → │
└─────────────────────────────────────────────┘
```

### Design Specifications
- **Size**: 1200x630px (optimal for social media)
- **Colors**: Primary gradient (#8B5CF6 to #A855F7)
- **Typography**: 
  - Playfair Display (serif) for title
  - Inter for body text
- **Elements**:
  - Watermark: "Interpreted by Dreamcatcher AI"
  - CTA: "Interpret your dreams free →"
  - Blurred dream image background

## Privacy Protection

### What's Included
✅ Dream title  
✅ Interpretation text (excerpt)  
✅ Dream image (optional, blurred background)  
✅ Branding watermark  

### What's NOT Included
❌ User name  
❌ User email  
❌ Creation date/time  
❌ User ID  
❌ Subscription tier  
❌ Any PII (Personally Identifiable Information)  

### Data Sanitization

The system uses `sanitizeForSharing()` function to strip all personal data:

```typescript
function sanitizeForSharing(data) {
  return {
    dreamTitle: data.dreamTitle,
    interpretation: data.interpretation,
    imageUrl: data.imageUrl,
    dreamId: data.dreamId
  }
  // All other fields (userId, createdAt, etc.) are excluded
}
```

## Implementation Details

### Key Components

1. **`DreamShareButton.tsx`**
   - Main sharing UI component
   - Dropdown menu with all sharing options
   - Loading states and error handling
   - Privacy notice at bottom of menu

2. **`shareCardGenerator.ts`**
   - Share card HTML generation
   - Image rendering via html2canvas
   - Blob/download utilities
   - Privacy sanitization functions

### Dependencies

- `html2canvas`: Converts HTML to image
- `lucide-react`: Icons
- `react-hot-toast`: User feedback

### Usage in Components

```tsx
<DreamShareButton
  dreamTitle="My Dream"
  dreamDescription="Full description..."
  interpretation="AI interpretation..."
  dreamId="dream-123"
  imageUrl="https://example.com/image.jpg"
  variant="outline"
  size="sm"
/>
```

## User Experience

### Share Menu Flow

1. User clicks Share button (Share2 icon)
2. Dropdown opens with categorized options:
   - **Privacy-First Sharing** section (top)
     - Share as Image
     - Copy Image
     - Copy Link
   - **Share to Social Media** section
     - Twitter/X, Facebook, LinkedIn, Email
3. Privacy notice displayed at bottom
4. User selects option
5. Loading state shown (if generating image)
6. Success toast notification
7. Menu auto-closes after action

### Loading States

- **Generating Image**: Shows spinner with "Generating Image..." text
- **Copy Actions**: Instant with "Copied!" confirmation
- **Social Share**: Opens new window immediately

### Error Handling

- Image generation failures show error toast
- Clipboard API not supported: fallback message
- Network errors: retry suggestion

## Browser Support

### Share as Image / Copy Image
- ✅ Chrome/Edge 76+
- ✅ Firefox 90+
- ✅ Safari 13.1+
- ❌ IE 11 (not supported)

### Copy Link
- ✅ All modern browsers (uses Clipboard API)

### Social Media Sharing
- ✅ All browsers (uses standard window.open)

## SEO & Open Graph

The shareable links (`/dream/{dreamId}`) automatically include:
- Server-side Open Graph tags (via edge function)
- Twitter Card metadata
- Rich preview when shared on social media

## Future Enhancements

### Planned Features
1. **Custom Templates**: Multiple share card designs
2. **Sticker Mode**: Square format for Instagram Stories
3. **Video Snippets**: 5-second dream video clips
4. **QR Code**: Generate QR code for offline sharing
5. **Analytics**: Track share counts per dream

### Customization Options
- Brand colors (for white-label)
- Custom watermark text
- Font selection
- Layout variations (vertical, horizontal, square)

## Testing

### Manual Testing Checklist

- [ ] Click "Share as Image" generates PNG file
- [ ] Click "Copy Image" copies to clipboard
- [ ] Click "Copy Link" copies URL to clipboard
- [ ] Social media buttons open correct platforms
- [ ] Privacy notice is visible
- [ ] No personal data in generated images
- [ ] Loading states display correctly
- [ ] Error handling works properly
- [ ] Works on mobile and desktop
- [ ] Share card has correct design/branding

### Automated Tests (Future)

```typescript
describe('Privacy-First Sharing', () => {
  test('sanitizes personal data', () => {
    const result = sanitizeForSharing(dreamData)
    expect(result.userId).toBeUndefined()
    expect(result.createdAt).toBeUndefined()
  })
  
  test('generates share card HTML', () => {
    const html = generateShareCardHTML(data)
    expect(html).toContain('Dreamcatcher AI')
    expect(html).not.toContain(userData.email)
  })
})
```

## Troubleshooting

### Common Issues

**Issue**: Image generation fails
- **Solution**: Check browser console for errors, ensure html2canvas loaded

**Issue**: Clipboard API not working
- **Solution**: Requires HTTPS or localhost, check browser permissions

**Issue**: Share card missing dream image
- **Solution**: Verify `imageUrl` is passed to DreamShareButton

**Issue**: Social share opens blank window
- **Solution**: Check popup blocker settings

## Analytics & Metrics

Track the following metrics:
1. Share button clicks
2. Share method selection (image vs link vs social)
3. Successful share completions
4. Failed share attempts
5. Social platform distribution

## Compliance

### GDPR Compliance
- ✅ No personal data shared without consent
- ✅ Users control what's shared
- ✅ Clear privacy notice displayed

### Data Protection
- ✅ Server-side processing for share URLs
- ✅ No tracking pixels in share cards
- ✅ No third-party data collection

## Support

For issues or questions:
- GitHub: Create issue with "sharing" label
- Discord: #feature-support channel
- Email: support@dreamcatcher.ai

---

**Last Updated**: December 1, 2025  
**Version**: 1.0.0  
**Maintained by**: Dreamcatcher AI Team
