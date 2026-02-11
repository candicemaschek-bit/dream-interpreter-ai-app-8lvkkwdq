import { blink } from '../blink/client';

export interface EdgeUploadResult {
  publicUrl: string;
  path: string;
}

const PROJECT_ID = import.meta.env.VITE_BLINK_PROJECT_ID || 'dream-interpreter-ai-app-8lvkkwdq';

function getFunctionUrl(functionName: string): string {
  // Extract the unique ID part (suffix) from the project ID
  // e.g., "dream-interpreter-ai-app-8lvkkwdq" -> "8lvkkwdq"
  const parts = PROJECT_ID.split('-');
  const shortId = parts[parts.length - 1];
  return `https://${shortId}--${functionName}.functions.blink.new`;
}

/**
 * Uploads a file using the files-upload-server edge function.
 * This is an alternative to blink.storage.upload when you need server-side handling.
 * 
 * @param file The file to upload
 * @param path Optional custom path (default: uploads/{userId}/{timestamp}_{filename})
 * @returns Promise resolving to the upload result with publicUrl
 */
export async function uploadFileToEdge(file: File, path?: string): Promise<EdgeUploadResult> {
  const url = getFunctionUrl('files-upload-server');
  
  // Get auth token
  const session = await blink.auth.me().catch(() => null);
  if (!session) {
    throw new Error('User must be authenticated to upload files');
  }

  // Get the token directly
  // Note: SDK v2+ might have different token access. 
  // We use a safe approach by getting it from the internal state or valid token method if available
  // In Blink SDK, requests are usually authenticated automatically, but for fetch we need the token.
  // We can try to get it from the session or using getValidToken
  let token: string | null = null;
  
  try {
    // @ts-ignore - getValidToken exists in newer SDKs
    token = await blink.auth.getValidToken();
  } catch (e) {
    console.warn('Could not get token via getValidToken, trying fallback', e);
  }

  if (!token) {
    // Fallback: in some versions token might be in local storage or session
    // For now we throw if we can't get it
    throw new Error('Could not retrieve authentication token');
  }

  // Use FormData for efficient upload
  const formData = new FormData();
  formData.append('file', file);
  if (path) {
    formData.append('path', path);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    let errorText = await response.text();
    try {
        const json = JSON.parse(errorText);
        if (json.error) errorText = json.error;
    } catch {}
    throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}
