import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './fixtures/auth';

/**
 * Specialized test to generate a video and capture screenshots
 * This test demonstrates the complete video generation workflow
 */
test.describe('Video Generation Screenshot Capture', () => {
  test('should generate video and capture screenshot', async ({ page }) => {
    // Step 1: Sign in with PRO user (has video generation access)
    console.log('Step 1: Signing in as PRO user...');
    await signIn(page, TEST_USERS.PRO.email, TEST_USERS.PRO.password);
    await page.waitForLoadState('networkidle');
    
    // Capture initial screenshot
    await page.screenshot({ path: 'test-results/01-signed-in.png', fullPage: true });
    console.log('✓ Signed in successfully');
    
    // Step 2: Navigate to home and submit a dream
    console.log('Step 2: Submitting dream for interpretation...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const dreamInput = page.getByPlaceholder(/dream|describe/i).or(page.getByRole('textbox').first());
    await dreamInput.fill('Flying through a magical starlit sky, soaring above glowing mountains and crystal waterfalls under aurora lights');
    
    await page.screenshot({ path: 'test-results/02-dream-input.png', fullPage: true });
    
    const submitButton = page.getByRole('button', { name: /interpret|analyze|submit/i }).first();
    await submitButton.click();
    console.log('✓ Dream submitted for interpretation');
    
    // Step 3: Wait for interpretation to complete
    console.log('Step 3: Waiting for AI interpretation...');
    await page.waitForTimeout(8000); // Wait for interpretation
    
    await page.screenshot({ path: 'test-results/03-interpretation-loading.png', fullPage: true });
    
    // Wait for interpretation results
    const interpretationText = page.locator('text=/interpretation|meaning|symbolizes|represents/i').first();
    await expect(interpretationText).toBeVisible({ timeout: 40000 });
    console.log('✓ Interpretation completed');
    
    await page.screenshot({ path: 'test-results/04-interpretation-complete.png', fullPage: true });
    
    // Step 4: Click video generation button
    console.log('Step 4: Initiating video generation...');
    const videoButton = page.getByRole('button', { name: /video|generate.*video|create.*video/i }).first();
    
    await expect(videoButton).toBeVisible({ timeout: 30000 });
    await page.screenshot({ path: 'test-results/05-video-button-visible.png', fullPage: true });
    
    await videoButton.click();
    console.log('✓ Video generation button clicked');
    
    // Step 5: Handle confirmation dialog if present
    console.log('Step 5: Handling confirmation...');
    await page.waitForTimeout(2000);
    
    // Look for confirm button in dialog
    const confirmButton = page.getByRole('button', { name: /confirm|generate|yes|create/i }).first();
    if (await confirmButton.isVisible({ timeout: 5000 })) {
      await page.screenshot({ path: 'test-results/06-confirmation-dialog.png', fullPage: true });
      await confirmButton.click();
      console.log('✓ Confirmation accepted');
    }
    
    // Step 6: Wait for video generation queue notification
    console.log('Step 6: Checking queue status...');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/07-video-queued.png', fullPage: true });
    
    // Look for queue status or progress indicator
    const queueStatus = page.getByText(/queue|position|processing|generating/i).first();
    if (await queueStatus.isVisible({ timeout: 10000 })) {
      console.log('✓ Video added to generation queue');
    }
    
    // Step 7: Monitor progress (check every few seconds)
    console.log('Step 7: Monitoring video generation progress...');
    let videoGenerated = false;
    let attempts = 0;
    const maxAttempts = 20; // Wait up to ~2 minutes
    
    while (!videoGenerated && attempts < maxAttempts) {
      attempts++;
      console.log(`Checking progress (attempt ${attempts}/${maxAttempts})...`);
      
      await page.waitForTimeout(6000);
      
      // Check for video player or video element
      const videoPlayer = page.locator('video').first();
      const videoUrl = page.getByText(/video.*ready|completed|generated/i).first();
      
      if (await videoPlayer.isVisible({ timeout: 2000 }).catch(() => false)) {
        videoGenerated = true;
        console.log('✓ Video player detected!');
      } else if (await videoUrl.isVisible({ timeout: 2000 }).catch(() => false)) {
        videoGenerated = true;
        console.log('✓ Video generation completed!');
      }
      
      // Capture progress screenshot
      await page.screenshot({ 
        path: `test-results/08-progress-check-${attempts}.png`, 
        fullPage: true 
      });
    }
    
    // Step 8: Navigate to dream library to find the video
    console.log('Step 8: Navigating to Dream Library...');
    const libraryLink = page.getByRole('link', { name: /library|history|my dreams/i }).first();
    
    if (await libraryLink.isVisible({ timeout: 5000 })) {
      await libraryLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✓ Navigated to Dream Library');
      
      await page.screenshot({ path: 'test-results/09-dream-library.png', fullPage: true });
      
      // Step 9: Find and click the most recent dream with video
      console.log('Step 9: Looking for generated video...');
      await page.waitForTimeout(2000);
      
      // Look for video indicators or play buttons
      const videoIndicator = page.locator('video, [data-video], .video-player').first();
      const playButton = page.getByRole('button', { name: /play|watch/i }).first();
      
      if (await videoIndicator.isVisible({ timeout: 5000 })) {
        console.log('✓ Video found in library!');
        
        // Click the dream card to view full details
        const dreamCard = page.locator('[data-dream-card], .dream-card, article').first();
        if (await dreamCard.isVisible()) {
          await dreamCard.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'test-results/10-video-detail-view.png', fullPage: true });
        }
        
        // Step 10: Capture screenshot of video player
        console.log('Step 10: Capturing video player screenshot...');
        const videoElement = page.locator('video').first();
        
        if (await videoElement.isVisible({ timeout: 5000 })) {
          // Wait for video to load
          await page.waitForTimeout(3000);
          
          // Capture full page with video player
          await page.screenshot({ 
            path: 'test-results/11-final-video-player.png', 
            fullPage: true 
          });
          
          // Capture just the video player area
          await videoElement.screenshot({ 
            path: 'test-results/12-video-player-closeup.png' 
          });
          
          console.log('✓ Video player screenshots captured!');
          console.log('\n=== SUCCESS ===');
          console.log('Screenshots saved to test-results/');
          console.log('- 11-final-video-player.png: Full page with video');
          console.log('- 12-video-player-closeup.png: Video player only');
        }
      } else if (await playButton.isVisible({ timeout: 5000 })) {
        console.log('✓ Play button found, clicking to view video...');
        await playButton.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: 'test-results/11-final-video-player.png', 
          fullPage: true 
        });
        
        console.log('✓ Video screenshots captured!');
      } else {
        console.log('⚠ Video may still be processing...');
        await page.screenshot({ 
          path: 'test-results/11-library-waiting.png', 
          fullPage: true 
        });
      }
    }
    
    console.log('\n=== Test Complete ===');
    console.log('All screenshots saved to test-results/ directory');
  });
});
