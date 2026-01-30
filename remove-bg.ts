
import { createClient } from '@blinkdotnew/sdk';
import fs from 'fs';
import { pipeline } from 'stream/promises';

// Initialize Blink Client
const blink = createClient({
  projectId: process.env.BLINK_PROJECT_ID!,
  secretKey: process.env.BLINK_SECRET_KEY!,
});

async function main() {
  console.log('Starting background removal process...');

  try {
    // 1. Read local file
    const filePath = 'public/logo.png';
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const fileBuffer = await fs.promises.readFile(filePath);
    // Node 20+ supports global File
    const file = new File([fileBuffer], 'logo.png', { type: 'image/png' });

    console.log('Uploading original image...');
    
    // 2. Upload to Storage
    const { publicUrl } = await blink.storage.upload(
      file,
      `temp/logo-${Date.now()}.png`
    );
    console.log(`Uploaded to: ${publicUrl}`);

    // 3. Call AI to remove background
    console.log('Requesting AI modification...');
    const { data } = await blink.ai.modifyImage({
      images: [publicUrl],
      prompt: 'Remove the black background and make it transparent. Keep the logo content exactly as is.',
      output_format: 'png',
    });

    const resultUrl = data[0].url;
    console.log(`Received processed image URL: ${resultUrl}`);

    // 4. Download result
    console.log('Downloading result...');
    const response = await fetch(resultUrl);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
    
    // 5. Save back to file
    const writeStream = fs.createWriteStream('public/logo.png');
    // @ts-ignore
    await pipeline(response.body, writeStream);
    
    console.log('Successfully saved processed image to public/logo.png');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
