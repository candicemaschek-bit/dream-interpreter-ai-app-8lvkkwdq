/**
 * Image Watermarking Utility
 * Adds "Dreamworlds" watermark to dream images for launch offer users
 */

import { blink } from '../blink/client'
import { getLaunchOfferWatermarkConfig } from './launchOfferManager'

/**
 * Add "Dreamworlds" watermark to generated images
 * Used for launch offer users when they exceed the 2-dream limit
 */
export async function addWatermarkToImage(
  imageUrl: string,
  customConfig?: ReturnType<typeof getLaunchOfferWatermarkConfig>,
  userId?: string
): Promise<string> {
  try {
    const config = customConfig || getLaunchOfferWatermarkConfig()

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    
    // Create image element
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      console.warn('⚠️ Canvas context unavailable, returning original image')
      return imageUrl
    }

    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image failed to load'))
      img.src = URL.createObjectURL(blob)
    })

    // Set canvas dimensions to match image
    canvas.width = img.width
    canvas.height = img.height

    // Draw original image
    ctx.drawImage(img, 0, 0)

    // Calculate watermark position (bottom-right)
    const watermarkWidth = 200
    const watermarkHeight = 50
    const padding = config.padding
    const x = canvas.width - watermarkWidth - padding
    const y = canvas.height - watermarkHeight - padding

    // Draw watermark background
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(x, y, watermarkWidth, watermarkHeight)

    // Draw watermark border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, watermarkWidth, watermarkHeight)

    // Draw watermark text
    ctx.globalAlpha = config.opacity
    ctx.fillStyle = config.fontColor
    ctx.font = `bold ${config.fontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      config.text,
      x + watermarkWidth / 2,
      y + watermarkHeight / 2
    )

    // Reset alpha
    ctx.globalAlpha = 1.0

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        async (watermarkedBlob) => {
          if (!watermarkedBlob) {
            reject(new Error('Failed to create watermarked image blob'))
            return
          }

          try {
            // Upload watermarked image to storage
            const watermarkedFile = new File(
              [watermarkedBlob],
              `watermarked-${Date.now()}.png`,
              { type: 'image/png' }
            )

            const storagePath = userId 
              ? `dreams/${userId}/watermarked-${Date.now()}.png`
              : `watermarked-dreams/${Date.now()}.png`

            const { publicUrl } = await blink.storage.upload(
              watermarkedFile,
              storagePath
            )
            
            console.log('✅ Watermarked image created:', publicUrl)
            resolve(publicUrl)
          } catch (uploadError) {
            console.warn('⚠️ Failed to upload watermarked image:', uploadError)
            reject(uploadError)
          }
        },
        'image/png',
        0.95
      )
    })
  } catch (error) {
    console.warn('⚠️ Failed to watermark image, returning original:', error)
    // Fail gracefully - return original image
    return imageUrl
  }
}

/**
 * Batch watermark multiple images
 * Used when generating multiple dream images
 */
export async function watermarkImages(
  imageUrls: string[],
  customConfig?: ReturnType<typeof getLaunchOfferWatermarkConfig>,
  userId?: string
): Promise<string[]> {
  try {
    const watermarkedUrls = await Promise.all(
      imageUrls.map(url => addWatermarkToImage(url, customConfig, userId))
    )
    return watermarkedUrls
  } catch (error) {
    console.warn('⚠️ Error watermarking batch of images:', error)
    // Return original URLs if watermarking fails
    return imageUrls
  }
}

/**
 * Create a watermark preview canvas for testing
 */
export function createWatermarkPreview(width: number = 400, height: number = 300): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  // Draw background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#8B5CF6')
  gradient.addColorStop(1, '#A855F7')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Draw watermark
  const config = getLaunchOfferWatermarkConfig()
  const watermarkWidth = 200
  const watermarkHeight = 50
  const padding = config.padding
  const x = width - watermarkWidth - padding
  const y = height - watermarkHeight - padding

  ctx.fillStyle = config.backgroundColor
  ctx.fillRect(x, y, watermarkWidth, watermarkHeight)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, watermarkWidth, watermarkHeight)

  ctx.globalAlpha = config.opacity
  ctx.fillStyle = config.fontColor
  ctx.font = `bold ${config.fontSize}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(config.text, x + watermarkWidth / 2, y + watermarkHeight / 2)

  return canvas
}
