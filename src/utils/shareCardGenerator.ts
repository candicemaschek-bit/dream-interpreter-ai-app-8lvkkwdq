/**
 * Privacy-First Share Card Generator
 * Generates beautiful shareable images with dream image and description
 */

export interface ShareCardData {
  dreamTitle: string
  dreamDescription?: string
  interpretation: string
  imageUrl?: string
  dreamId: string
}

export interface ShareCardOptions {
  width?: number
  height?: number
  includeImage?: boolean
  maxInterpretationLength?: number
}

/**
 * Strips all personal information from dream data
 */
export function sanitizeForSharing(data: {
  dreamTitle: string
  dreamDescription: string
  interpretation: string
  imageUrl?: string
  userId?: string
  createdAt?: string
  [key: string]: any
}): ShareCardData {
  // Remove any potential PII
  const sanitized: ShareCardData = {
    dreamTitle: data.dreamTitle || 'Dream Interpretation',
    dreamDescription: data.dreamDescription || '',
    interpretation: data.interpretation || 'Explore your subconscious with AI-powered dream analysis.',
    imageUrl: data.imageUrl,
    dreamId: data.dreamId || ''
  }

  // Ensure no user-identifiable data is included
  return sanitized
}

/**
 * Generates excerpt from interpretation for share cards
 */
export function generateInterpretationExcerpt(
  interpretation: string,
  maxLength: number = 200
): string {
  if (interpretation.length <= maxLength) {
    return interpretation
  }

  // Find the last complete sentence within maxLength
  const truncated = interpretation.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastExclamation = truncated.lastIndexOf('!')
  
  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
  
  if (lastSentenceEnd > 0) {
    return interpretation.substring(0, lastSentenceEnd + 1)
  }
  
  // If no sentence end found, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace) + '...'
}

/**
 * Generates a shareable link (interpretation only, no personal details)
 */
export function generateShareableLink(dreamId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://dream-interpreter-ai-app-8lvkkwdq.sites.blink.new'
  
  return `${baseUrl}/dream/${dreamId}`
}

/**
 * Creates HTML for share card (to be converted to image)
 */
export function generateShareCardHTML(
  data: ShareCardData,
  options: ShareCardOptions = {}
): string {
  const {
    width = 1200,
    height = 630,
    includeImage = true,
    maxInterpretationLength = 180
  } = options

  const excerpt = generateInterpretationExcerpt(
    data.interpretation,
    maxInterpretationLength
  )

  const imageSection = includeImage && data.imageUrl
    ? `
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;">
        <img 
          src="${data.imageUrl}" 
          style="width: 100%; height: 100%; object-fit: cover; opacity: 0.2; filter: blur(20px);"
          alt=""
        />
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  </style>
</head>
<body style="margin: 0; padding: 0;">
  <div style="
    width: ${width}px;
    height: ${height}px;
    background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
    position: relative;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  ">
    ${imageSection}
    
    <!-- Content -->
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(180deg, rgba(139,92,246,0.85) 0%, rgba(168,85,247,0.95) 100%);
    ">
      <!-- Header -->
      <div>
        <div style="
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 700;
          color: white;
          margin-bottom: 30px;
          line-height: 1.2;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        ">${data.dreamTitle}</div>
        
        <div style="
          font-size: 28px;
          color: rgba(255,255,255,0.95);
          line-height: 1.6;
          margin-top: 20px;
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255,255,255,0.2);
        ">${excerpt}</div>
      </div>
      
      <!-- Footer -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="
          font-size: 20px;
          color: rgba(255,255,255,0.9);
          font-weight: 600;
          background: rgba(255,255,255,0.15);
          padding: 15px 25px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        ">✨ Interpreted by Dreamcatcher AI</div>
        
        <div style="
          font-size: 18px;
          color: white;
          background: rgba(255,255,255,0.2);
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 600;
          border: 2px solid rgba(255,255,255,0.3);
        ">Interpret your dreams free →</div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Converts share card to canvas/blob using Canvas API directly
 * Includes dream image at top and description
 */
export async function generateShareCardImage(
  data: ShareCardData,
  options: ShareCardOptions = {}
): Promise<Blob | null> {
  try {
    if (typeof window === 'undefined') {
      console.warn('generateShareCardImage can only run in browser')
      return null
    }

    const width = options.width || 1200
    const height = options.height || 1400
    const maxLength = options.maxInterpretationLength || 200

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#8B5CF6')
    gradient.addColorStop(1, '#A855F7')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    let contentStartY = 40
    
    // Draw dream image at the top if provided
    if (options.includeImage !== false && data.imageUrl) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = data.imageUrl!
        })
        
        // Draw image with rounded corners
        const imageHeight = 350
        ctx.save()
        ctx.beginPath()
        roundRect(ctx, 40, 40, width - 80, imageHeight, 24)
        ctx.clip()
        ctx.drawImage(img, 40, 40, width - 80, imageHeight)
        ctx.restore()
        
        // Add border to image
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 2
        ctx.beginPath()
        roundRect(ctx, 40, 40, width - 80, imageHeight, 24)
        ctx.stroke()
        
        contentStartY = 40 + imageHeight + 30
      } catch (err) {
        // Continue without image if it fails
        console.warn('Failed to load dream image:', err)
        contentStartY = 40
      }
    }

    // Draw title
    ctx.fillStyle = 'white'
    ctx.font = 'bold 56px "Playfair Display", serif'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 2
    
    const titleLines = wrapText(ctx, data.dreamTitle, width - 120, 56)
    let yPos = contentStartY + 50
    titleLines.forEach(line => {
      ctx.fillText(line, 60, yPos)
      yPos += 70
    })

    // NOTE: Scene and AI Interpretation sections removed per new design
    // Share card now shows only Dream Title and Image

    // Draw footer
    const footerY = height - 70

    // Left footer text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    roundRect(ctx, 60, footerY - 40, 500, 55, 14)
    ctx.fill()
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = '600 22px "Inter", sans-serif'
    ctx.fillText('✨ Interpreted by Dreamcatcher AI', 85, footerY)

    // Right footer CTA
    const ctaX = width - 400
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    roundRect(ctx, ctaX, footerY - 35, 320, 50, 25)
    ctx.fill()
    ctx.stroke()
    
    ctx.fillStyle = 'white'
    ctx.font = '600 20px "Inter", sans-serif'
    ctx.fillText('Interpret your dreams free →', ctaX + 25, footerY)

    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95)
    })

    return blob
  } catch (error) {
    console.error('Error generating share card image:', error)
    throw new Error('Failed to generate share card. Please try again.')
  }
}

// Helper function to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}

// Helper function to draw rounded rectangle
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Downloads share card as image file
 */
export async function downloadShareCard(
  data: ShareCardData,
  filename?: string
): Promise<void> {
  const blob = await generateShareCardImage(data)
  
  if (!blob) {
    throw new Error('Failed to generate share card image')
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `dreamcatcher-${data.dreamId}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copies share card image to clipboard
 */
export async function copyShareCardToClipboard(
  data: ShareCardData
): Promise<void> {
  const blob = await generateShareCardImage(data)
  
  if (!blob) {
    throw new Error('Failed to generate share card image')
  }

  // Check if clipboard API supports writing images
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not supported in this browser')
  }

  const item = new ClipboardItem({ 'image/png': blob })
  await navigator.clipboard.write([item])
}
