const fs = require('fs');
const path = require('path');

// Try to load from .env.local if not in process.env
if (!process.env.REPLICATE) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^REPLICATE=(.*)$/m);
      if (match) {
        process.env.REPLICATE = match[1].trim();
        // Remove quotes if present
        if ((process.env.REPLICATE.startsWith('"') && process.env.REPLICATE.endsWith('"')) ||
            (process.env.REPLICATE.startsWith("'") && process.env.REPLICATE.endsWith("'"))) {
          process.env.REPLICATE = process.env.REPLICATE.slice(1, -1);
        }
      }
    }
  } catch (e) {
    console.error("Failed to read .env.local:", e);
  }
}

const token = process.env.REPLICATE;

if (!token) {
  console.error("Error: REPLICATE environment variable is not set.");
  process.exit(1);
}

console.log(`Token found (first 4 chars): ${token.substring(0, 4)}...`);

async function verifyReplicate() {
  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("SUCCESS: Replicate API connection verified.");
      const data = await response.json();
      console.log(`Found ${data.results?.length || 0} recent predictions.`);
      
      if (data.results && data.results.length > 0) {
        console.log("Recent prediction sample:", JSON.stringify(data.results[0], null, 2));
      } else {
        console.log("No prediction history found via API.");
      }
    } else {
      console.error(`FAILURE: Replicate API returned status ${response.status}`);
      const text = await response.text();
      console.error("Response body:", text);
    }
  } catch (error) {
    console.error("Error connecting to Replicate:", error);
  }
}

verifyReplicate();