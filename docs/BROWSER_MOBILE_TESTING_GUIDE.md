# Browser & Mobile Testing Guide

## Overview
This document provides a comprehensive testing checklist for cross-platform browser and mobile device compatibility for the Dreamcatcher app.

---

## Platform Detection & Logging

The app automatically detects and logs platform information on startup using `platformDetection.ts`. Check the browser console for:

```
🖥️ Platform Information
Browser: Chrome 120
OS: macOS
Device Type: desktop
Touch Support: No
Screen: 1920x1080
Feature Support: (list of capabilities)
Supported MIME Types: audio/webm;codecs=opus
```

---

## Browser Compatibility Matrix

| Browser | Version | Desktop | Mobile | Status | Notes |
|---------|---------|---------|--------|--------|-------|
| Chrome | Latest | ✅ | ✅ | Full Support | Best performance, all features work |
| Firefox | Latest | ✅ | ✅ | Full Support | Excellent compatibility |
| Safari | 14+ | ✅ | ✅ | Full Support | iOS limitations noted |
| Edge | Latest | ✅ | ⚠️ | Full Support | Mobile version limited |
| Opera | Latest | ✅ | ⚠️ | Full Support | Rare issues |
| IE 11 | 11 | ❌ | N/A | Not Supported | Use modern browser |

### Browser-Specific Issues & Workarounds

#### Safari/iOS
- **Issue**: Limited file upload from camera
- **Workaround**: Use gallery instead of camera
- **Issue**: MediaRecorder MIME type negotiation
- **Workaround**: App handles automatically

#### Firefox Android
- **Issue**: Audio constraints may need adjustment
- **Workaround**: App sets `autoGainControl: true` automatically

#### Edge Mobile
- **Issue**: Some canvas operations slower
- **Workaround**: Uses optimized pixel ratio handling

---

## Testing Checklist

### 1. Voice Recording Feature

#### Desktop Browsers
- [ ] **Chrome (Desktop)**
  - [ ] Click record button
  - [ ] Speak for 5-10 seconds
  - [ ] Stop recording
  - [ ] Verify audio playback works
  - [ ] Verify transcription completes
  - [ ] Console shows: "🎤 Starting recording on: Chrome macOS"

- [ ] **Firefox (Desktop)**
  - [ ] Repeat above test
  - [ ] Verify no console warnings

- [ ] **Safari (Desktop)**
  - [ ] Repeat above test
  - [ ] Check for Safari-specific warnings

- [ ] **Edge (Desktop)**
  - [ ] Repeat above test

#### Mobile Browsers
- [ ] **Chrome (Android)**
  - [ ] Tap record button (appears as red microphone icon)
  - [ ] Allow microphone permission when prompted
  - [ ] Speak for 5-10 seconds
  - [ ] Tap to stop recording
  - [ ] Verify audio preview works
  - [ ] Verify save & transcribe works
  - [ ] Check console for platform info

- [ ] **Firefox (Android)**
  - [ ] Repeat above test
  - [ ] Verify console shows `autoGainControl: true` set

- [ ] **Safari (iOS)**
  - [ ] Open in Safari
  - [ ] Tap record button
  - [ ] Allow microphone permission
  - [ ] Test recording/transcription
  - [ ] Note: iOS may show different permission prompts

- [ ] **Chrome (iOS)**
  - [ ] Test as above
  - [ ] Note: Uses WebKit internally on iOS

#### Recording Edge Cases
- [ ] Test with no microphone permission (should show specific error)
- [ ] Test canceling/discarding recording
- [ ] Test audio playback progress bar
- [ ] Test recovery of interrupted recordings
- [ ] Test on 4G/LTE network (slow transcription)

### 2. Canvas Drawing (Symbol Input)

#### Desktop Browsers
- [ ] **Chrome (Desktop)**
  - [ ] Switch to "Symbols" tab
  - [ ] Verify canvas loads and is visible
  - [ ] Draw with mouse - verify smooth strokes
  - [ ] Test color picker
  - [ ] Test line width slider
  - [ ] Test clear button
  - [ ] Verify final drawing saves correctly

- [ ] **Firefox (Desktop)**
  - [ ] Repeat above

- [ ] **Safari (Desktop)**
  - [ ] Repeat above

#### Mobile Browsers (Touch Events)
- [ ] **Chrome (Android)**
  - [ ] Switch to "Symbols" tab
  - [ ] Verify canvas is touch-optimized size
  - [ ] Draw with single finger
  - [ ] Test pressure sensitivity (if available)
  - [ ] Verify no page scrolling while drawing
  - [ ] Test clear button
  - [ ] Submit drawing

- [ ] **Firefox (Android)**
  - [ ] Repeat above

- [ ] **Safari (iOS)**
  - [ ] Test drawing with Apple Pencil (if iPad)
  - [ ] Test drawing with finger
  - [ ] Verify smooth responsive performance

- [ ] **Chrome (iOS)**
  - [ ] Repeat touch drawing tests

#### Canvas Edge Cases
- [ ] Draw on landscape vs portrait orientation
- [ ] Test rapid drawing (stress test)
- [ ] Test with retina/high-DPI displays
- [ ] Verify canvas doesn't cause page lag

### 3. File Upload

#### Desktop Browsers
- [ ] **Chrome (Desktop)**
  - [ ] Switch to "Image" tab
  - [ ] Click "Choose Image"
  - [ ] Upload image from computer
  - [ ] Verify image preview shows
  - [ ] Submit dream

- [ ] **Firefox (Desktop)**
  - [ ] Repeat above

- [ ] **Safari (Desktop)**
  - [ ] Repeat above

#### Mobile Browsers (Camera/Gallery)
- [ ] **Chrome (Android)**
  - [ ] Tap "Choose Image"
  - [ ] Select "Camera" - take photo
  - [ ] Verify preview shows
  - [ ] Or select "Gallery" - choose existing image
  - [ ] Submit dream

- [ ] **Firefox (Android)**
  - [ ] Repeat above

- [ ] **Safari (iOS)**
  - [ ] Tap "Choose Image"
  - [ ] Test camera option
  - [ ] Test photo library option
  - [ ] Note: iOS may handle permissions differently

#### File Upload Edge Cases
- [ ] Test large files (verify rejection or warning)
- [ ] Test various image formats (JPEG, PNG, WebP)
- [ ] Test landscape vs portrait images
- [ ] Test slow network upload

### 4. Responsive Layout

#### Desktop Testing
- [ ] **Full Desktop (1920x1080)**
  - [ ] All navigation visible
  - [ ] Content properly centered
  - [ ] No horizontal scrolling

- [ ] **Laptop (1366x768)**
  - [ ] Layout adjusts properly
  - [ ] No overflow issues

- [ ] **Small Desktop (1024x768)**
  - [ ] Verify responsive adjustments

#### Mobile Testing
- [ ] **Mobile (360x800) - Small Phone**
  - [ ] Navigation stacks properly
  - [ ] Buttons readable and tappable
  - [ ] No horizontal scrolling
  - [ ] Vertical scrolling works smoothly

- [ ] **Mobile (412x915) - Medium Phone**
  - [ ] Layout optimized for size

- [ ] **Mobile (540x960) - Large Phone**
  - [ ] Layout scales appropriately

- [ ] **Tablet (768x1024) - iPad**
  - [ ] Layout uses tablet-optimized view
  - [ ] Spacing appropriate for larger screen

#### Orientation Testing
- [ ] **Portrait Mode**
  - [ ] All features accessible
  - [ ] No content cut off

- [ ] **Landscape Mode**
  - [ ] Canvas drawing works properly
  - [ ] Content reflows correctly
  - [ ] Navigation accessible

### 5. Performance Testing

#### Desktop
- [ ] **Chrome DevTools - Lighthouse**
  - [ ] Performance score > 80
  - [ ] Accessibility score > 90
  - [ ] Best Practices score > 90

- [ ] **Network Throttling**
  - [ ] Test on "Slow 3G"
  - [ ] Verify UI remains responsive
  - [ ] Image generation doesn't timeout

#### Mobile
- [ ] **Real Device (Android)**
  - [ ] Open DevTools on connected device
  - [ ] Check console for platform info
  - [ ] Verify recording doesn't cause lag
  - [ ] Monitor memory usage

- [ ] **Real Device (iOS)**
  - [ ] Test on actual iPhone/iPad
  - [ ] Verify responsive performance
  - [ ] Check Safari console warnings

### 6. Permission Handling

#### Microphone Permission
- [ ] **First-time Access**
  - [ ] Browser shows permission prompt
  - [ ] User can grant or deny
  - [ ] App handles denial gracefully

- [ ] **Revoked Permission**
  - [ ] If user revokes permission
  - [ ] App shows helpful error message

#### Camera Permission (Image Upload)
- [ ] **First-time Camera Access**
  - [ ] Permission prompt appears
  - [ ] User can grant or deny

#### Storage Permission (Mobile)
- [ ] **Android Storage**
  - [ ] App requests necessary permissions
  - [ ] File upload works

---

## Console Testing

### Platform Detection Log Example
```
🖥️ Platform Information
Browser: Chrome 120.0.1234
OS: Windows
Device Type: desktop (Mobile: false, Tablet: false, Desktop: true)
Touch Support: No
Screen: 1920x1080
Feature Support:
  MediaRecorder: true
  Canvas: true
  WebGL: true
  Web Workers: true
  Local Storage: true
  Geolocation: true
  Supported MIME Types: audio/webm;codecs=opus
```

### Recording Session Log Example
```
🎤 Starting recording on: Chrome Windows
Audio track enabled: true Label: default
MediaRecorder started, state: recording
onstop event fired, processing audio chunks
Audio blob created, size: 45000 bytes
Recording stopped! Listen to your recording or save to continue.
```

### Error Logging Examples
```
⚠️ Browser Compatibility Issues:
  • Mobile: Limited file upload size (5MB recommended)

❌ Error accessing microphone: NotAllowedError
  Microphone permission denied. Please enable it in your browser settings.
```

---

## Automated Testing

Run the platform compatibility test suite:

```bash
npm run test -- platformCompatibility.test.ts
```

This tests:
- Browser detection accuracy
- Device type detection
- Feature support checking
- Platform info completeness
- Mobile utilities functionality
- Canvas optimization for devices
- Voice recording compatibility
- Touch event support
- Cross-browser consistency

---

## Bug Report Template

When reporting cross-platform issues, include:

```
**Browser:** [Chrome/Firefox/Safari/Edge]
**OS:** [Windows/macOS/Linux/Android/iOS]
**Device Type:** [Desktop/Mobile/Tablet]
**Screen Size:** [e.g., 1920x1080]
**Issue:** [Description]
**Console Log Output:** [Paste platform info from console]
**Steps to Reproduce:** [List steps]
**Expected Behavior:** [What should happen]
**Actual Behavior:** [What happens instead]
**Screenshots:** [If applicable]
```

---

## Known Limitations

### Safari/iOS
- Limited file size for uploads (recommended max 5MB)
- Some audio constraints may not apply
- Camera roll may not be available in private mode

### Firefox Android
- May require specific audio gain control settings
- Performance on older devices may be slower

### Edge Mobile
- Some canvas operations perform slower
- File upload from camera may be limited

### General Mobile Limitations
- Recommended maximum file size: 5MB (vs 25MB on desktop)
- Video generation may be slower
- Background operations may pause when app goes idle

---

## Performance Targets

| Metric | Desktop | Mobile |
|--------|---------|--------|
| Voice Recording Startup | < 500ms | < 800ms |
| Recording Transcription | < 10s | < 15s |
| Canvas Drawing Smoothness | 60fps | 30fps min |
| File Upload | < 5s (5MB) | < 10s (5MB) |
| Dream Interpretation | < 5s | < 8s |
| Page Load Time | < 2s | < 3s |

---

## Testing Schedule

- **Daily:** Manual testing of core features on primary browser (Chrome Desktop)
- **Weekly:** Cross-browser testing (Chrome, Firefox, Safari, Edge)
- **Bi-weekly:** Mobile device testing (Android, iOS)
- **Monthly:** Performance testing and optimization
- **Before Release:** Full compatibility matrix testing

---

## Resources

- [MDN: Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Caniuse.com](https://caniuse.com/) - Feature support database
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Firefox Developer Tools](https://developer.mozilla.org/en-US/docs/Tools)
- [Safari Developer Tools](https://developer.apple.com/safari/tools/)

---

## Contact & Support

For platform-specific issues or questions:
1. Check browser console for platform detection logs
2. Review known limitations section
3. Search existing issues
4. Report new issues with bug report template above
