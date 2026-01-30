/**
 * Audio Muxing Utility for Video Generation
 * Handles background music/audio for short-form videos (5-6 seconds)
 * No TTS for short videos - music only
 */

/**
 * Free background music sources (royalty-free)
 * These can be replaced with paid services for better quality
 */
export const BACKGROUND_MUSIC_LIBRARY = {
  dreamy: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_d1718ab41b.mp3', // Dreamy ambient
  mystical: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', // Mystical atmosphere
  peaceful: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3', // Peaceful meditation
  ethereal: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d9e33da79e.mp3', // Ethereal ambient
  cinematic: 'https://cdn.pixabay.com/download/audio/2022/03/22/audio_b112cfc9e7.mp3', // Cinematic
};

export type MusicMood = keyof typeof BACKGROUND_MUSIC_LIBRARY;

/**
 * Audio muxing configuration
 */
export interface AudioMuxConfig {
  videoBlob: Blob;
  musicUrl?: string;
  musicMood?: MusicMood;
  volume?: number; // 0.0 to 1.0
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  duration: number; // video duration in seconds
}

/**
 * Select appropriate background music based on dream content
 */
export function selectBackgroundMusic(prompt: string): MusicMood {
  const promptLower = prompt.toLowerCase();
  
  // Nightmare or dark themes
  if (promptLower.includes('nightmare') || promptLower.includes('fear') || 
      promptLower.includes('dark') || promptLower.includes('scary')) {
    return 'mystical';
  }
  
  // Peaceful or calming themes
  if (promptLower.includes('peaceful') || promptLower.includes('calm') || 
      promptLower.includes('serene') || promptLower.includes('meditation')) {
    return 'peaceful';
  }
  
  // Action or dramatic themes
  if (promptLower.includes('flying') || promptLower.includes('adventure') || 
      promptLower.includes('epic') || promptLower.includes('dramatic')) {
    return 'cinematic';
  }
  
  // Surreal or otherworldly themes
  if (promptLower.includes('surreal') || promptLower.includes('strange') || 
      promptLower.includes('magical') || promptLower.includes('mystical')) {
    return 'ethereal';
  }
  
  // Default to dreamy for most dreams
  return 'dreamy';
}

/**
 * Get music URL for mood
 */
export function getMusicUrlForMood(mood: MusicMood): string {
  return BACKGROUND_MUSIC_LIBRARY[mood];
}

/**
 * Check if video duration requires TTS
 * Short videos (5-6 seconds): Music only, no TTS
 * Long videos (120 seconds): TTS + Music
 */
export function requiresTTS(durationSeconds: number): boolean {
  return durationSeconds > 10; // Only for videos longer than 10 seconds
}

/**
 * Calculate audio costs
 * - Short videos: Background music only (no TTS cost)
 * - Long videos: TTS + background music
 * 
 * AUDIO MUXING IMPLEMENTATION:
 * - Current: Client-side audio overlay (metadata only)
 * - Alternative: Server-side muxing (FFmpeg, Cloudinary, Mux)
 * 
 * Cost Comparison:
 * - Client-side: $0.001/second (minimal metadata storage)
 * - Server-side: $0.001/second + $0.05/minute processing = ~$0.005/second for 45s video
 * 
 * For Dreamworlds (45 seconds):
 * - Client-side: 45 × $0.001 = $0.045
 * - Server-side: 45 × $0.005 = $0.225
 * 
 * Current implementation uses client-side for cost efficiency.
 * For better quality/download support, consider server-side muxing.
 */
export function calculateAudioCost(params: {
  durationSeconds: number;
  ttsCharacterCount?: number;
  useBackgroundMusic: boolean;
  useServerSideMuxing?: boolean;
}): {
  ttsCost: number;
  musicCost: number;
  totalCost: number;
} {
  const ttsCostPerChar = 0.000015; // $15 per 1M characters
  const musicCostPerSecondClient = 0.001; // Client-side overlay (metadata)
  const musicCostPerSecondServer = 0.005; // Server-side muxing (FFmpeg/cloud)
  
  let ttsCost = 0;
  let musicCost = 0;
  
  // TTS cost (only for long videos)
  if (params.ttsCharacterCount && requiresTTS(params.durationSeconds)) {
    ttsCost = params.ttsCharacterCount * ttsCostPerChar;
  }
  
  // Background music cost (applies to all videos)
  if (params.useBackgroundMusic) {
    const costPerSecond = params.useServerSideMuxing 
      ? musicCostPerSecondServer 
      : musicCostPerSecondClient;
    musicCost = params.durationSeconds * costPerSecond;
  }
  
  return {
    ttsCost,
    musicCost,
    totalCost: ttsCost + musicCost,
  };
}

/**
 * Estimate total video generation cost per tier
 * This helps determine pricing and cost-effectiveness
 */
export function estimateVideoGenerationCost(params: {
  tier: 'premium' | 'vip';
  durationSeconds: number;
  framesCount: number;
  useAudio: boolean;
  ttsCharacterCount?: number;
}): {
  frameCost: number;
  videoCost: number;
  audioCost: number;
  storageCost: number;
  totalCost: number;
  costPerSecond: number;
} {
  const frameGenerationCost = 0.004; // Per frame
  const videoProcessingBaseCost = 0.20; // Base processing
  const videoProcessingPerSecond = 0.05; // Per second
  const storageCostPerSecond = 0.001; // Storage cost
  
  const frameCost = params.framesCount * frameGenerationCost;
  const videoCost = videoProcessingBaseCost + (params.durationSeconds * videoProcessingPerSecond);
  
  const audio = calculateAudioCost({
    durationSeconds: params.durationSeconds,
    ttsCharacterCount: params.ttsCharacterCount,
    useBackgroundMusic: params.useAudio,
  });
  
  const storageCost = params.durationSeconds * storageCostPerSecond;
  
  const totalCost = frameCost + videoCost + audio.totalCost + storageCost;
  const costPerSecond = totalCost / params.durationSeconds;
  
  return {
    frameCost,
    videoCost,
    audioCost: audio.totalCost,
    storageCost,
    totalCost,
    costPerSecond,
  };
}

/**
 * Get cost breakdown by subscription tier
 * Helps admins understand cost structure
 */
export function getCostBreakdownByTier(): {
  premium: {
    duration: number;
    frames: number;
    monthlyLimit: number;
    costPerVideo: number;
    costPerMonth: number;
  };
  vip: {
    duration: number;
    frames: number;
    monthlyLimit: number;
    costPerVideo: number;
    costPerMonth: number;
  };
} {
  // Premium: 6 seconds, 3 frames, 20 videos/month
  const premiumCost = estimateVideoGenerationCost({
    tier: 'premium',
    durationSeconds: 6,
    framesCount: 3,
    useAudio: true,
    ttsCharacterCount: 0, // No TTS for short videos
  });
  
  // VIP: 45 seconds, 15 frames, 1 video/month (Dreamworlds)
  const vipCost = estimateVideoGenerationCost({
    tier: 'vip',
    durationSeconds: 45,
    framesCount: 15,
    useAudio: true,
    ttsCharacterCount: 0, // TTS not implemented for Dreamworlds yet
  });
  
  return {
    premium: {
      duration: 6,
      frames: 3,
      monthlyLimit: 20,
      costPerVideo: Number(premiumCost.totalCost.toFixed(4)),
      costPerMonth: Number((premiumCost.totalCost * 20).toFixed(2)),
    },
    vip: {
      duration: 45,
      frames: 15, // 15 frames for smooth 45-second cinematic video
      monthlyLimit: 1, // VIP gets 1 Dreamworlds/month included (not 25)
      costPerVideo: Number(vipCost.totalCost.toFixed(4)),
      costPerMonth: Number((vipCost.totalCost * 1).toFixed(2)), // 1 video/month
    },
  };
}

/**
 * Simple audio muxing for Deno environment
 * Since we can't use FFmpeg directly in Deno edge functions,
 * we'll use a simpler approach:
 * 1. For short videos: Just add metadata about music URL
 * 2. Client-side player will overlay music during playback
 * 3. For long videos: Consider using external service like Cloudinary
 */
export async function prepareVideoWithAudio(config: AudioMuxConfig): Promise<{
  videoBlob: Blob;
  musicUrl: string | null;
  musicVolume: number;
  fadeIn: number;
  fadeOut: number;
}> {
  // Determine music mood if not provided
  let musicUrl = config.musicUrl;
  if (!musicUrl && config.musicMood) {
    musicUrl = getMusicUrlForMood(config.musicMood);
  }
  
  // For now, return video blob with audio metadata
  // Client-side video player will handle audio overlay
  return {
    videoBlob: config.videoBlob,
    musicUrl: musicUrl || null,
    musicVolume: config.volume || 0.3, // Default 30% volume
    fadeIn: config.fadeIn || 0.5, // 0.5 second fade in
    fadeOut: config.fadeOut || 0.5, // 0.5 second fade out
  };
}

/**
 * Check if external video processing service should be used
 * For production, consider using:
 * - Cloudinary Video API (has audio mixing)
 * - Mux (specialized video platform)
 * - AWS Elemental MediaConvert
 */
export function shouldUseExternalService(durationSeconds: number): boolean {
  // Use external service for videos longer than 30 seconds
  // for better quality and proper audio muxing
  return durationSeconds > 30;
}
