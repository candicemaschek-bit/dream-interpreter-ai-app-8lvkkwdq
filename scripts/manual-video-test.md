# Manual Video Generation Test & Screenshot Capture

## Overview
This guide walks through generating a video and capturing screenshots to verify the complete video generation workflow.

## Prerequisites
- Test user account with PRO tier access
- Test credentials: `test-pro@dreamcatcher.test` / `TestPassword123!`

## Test Steps

### Step 1: Sign In
1. Navigate to https://3000-ivgnvrrw65fgffpz5irqj-64f851d4.preview-blink.com
2. Click "Sign In" button
3. Enter credentials:
   - Email: `test-pro@dreamcatcher.test`
   - Password: `TestPassword123!`
4. Click "Sign In"
5. **Screenshot**: `01-signed-in.png`

### Step 2: Submit Dream for Interpretation
1. Navigate to home page (Dream Input)
2. Enter dream description:
   ```
   Flying through a magical starlit sky, soaring above glowing mountains 
   and crystal waterfalls under aurora lights
   ```
3. Click "Interpret Dream" button
4. **Screenshot**: `02-dream-submitted.png`

### Step 3: Wait for AI Interpretation
1. Wait for AI interpretation to complete (20-40 seconds)
2. Verify interpretation text appears
3. **Screenshot**: `03-interpretation-complete.png`

### Step 4: Initiate Video Generation
1. Click "Generate Dream Video" button
2. Confirm video generation dialog (if present)
3. **Screenshot**: `04-video-generation-initiated.png`

### Step 5: Monitor Queue Status
1. Verify "Video added to queue" notification
2. Check queue position display
3. **Screenshot**: `05-video-queued.png`

### Step 6: Wait for Video Generation
1. Monitor progress indicator
2. Wait for video generation to complete (1-3 minutes)
3. **Screenshot**: `06-video-generating.png`

### Step 7: View Generated Video
1. Navigate to Dream Library
2. Find the dream with generated video
3. Click to view full details
4. **Screenshot**: `07-dream-library-with-video.png`

### Step 8: Capture Video Player
1. Verify video player is visible
2. Click play button (optional)
3. **Screenshot**: `08-video-player-full.png`
4. **Screenshot**: `09-video-player-closeup.png` (just the video element)

## Expected Results
- ✓ Video generation completes within 3 minutes
- ✓ Video player displays with controls
- ✓ Video is playable and shows dream visualization
- ✓ No console errors during generation
- ✓ Queue status updates correctly

## Troubleshooting
- If video generation fails, check:
  - User subscription tier (must be PRO)
  - Monthly video limit not exceeded
  - Valid authentication token
  - Edge function logs for errors

## Automated Screenshot Locations
Screenshots will be saved to:
- `test-results/` directory for Playwright tests
- Or manual screenshots as specified above
