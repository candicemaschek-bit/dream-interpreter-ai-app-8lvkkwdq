import { useRef, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Eraser, Palette, Download } from 'lucide-react'
import { MobileUtils } from '../utils/platformDetection'

interface DreamCanvasProps {
  onSymbolsComplete: (dataUrl: string) => void
}

export function DreamCanvas({ onSymbolsComplete }: DreamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#8B5CF6')
  const [lineWidth, setLineWidth] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size - use optimal size for device
    const rect = canvas.parentElement?.getBoundingClientRect()
    const width = rect ? rect.width : 600
    canvas.width = Math.min(width, 800)
    canvas.height = Math.min(canvas.width * 1.2, 1000)

    // Fill with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Set up pixel ratio for retina displays
    const pixelRatio = window.devicePixelRatio || 1
    if (pixelRatio > 1) {
      canvas.width = canvas.width * pixelRatio
      canvas.height = canvas.height * pixelRatio
      ctx.scale(pixelRatio, pixelRatio)
    }
  }, [])

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let x: number, y: number

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0]
      x = touch.clientX - rect.left
      y = touch.clientY - rect.top
    } else {
      // Mouse event
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoordinates(e as any)
    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)

    // Prevent default touch behavior to avoid scrolling while drawing
    if ('touches' in e) {
      e.preventDefault()
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoordinates(e as any)

    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.lineTo(x, y)
    ctx.stroke()

    // Prevent default touch behavior
    if ('touches' in e) {
      e.preventDefault()
    }
  }

  const stopDrawing = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(false)
    // Prevent default touch behavior
    if ('touches' in e) {
      e.preventDefault()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleComplete = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    onSymbolsComplete(dataUrl)
  }

  const colors = ['#8B5CF6', '#A855F7', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#000000']

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary rounded-lg">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c ? 'border-primary scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">{lineWidth}px</span>
        </div>

        <Button variant="outline" size="sm" onClick={clearCanvas}>
          <Eraser className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        className="w-full h-96 border-2 border-border rounded-lg cursor-crosshair bg-white touch-none"
        style={{ touchAction: 'none' }}
      />

      <Button onClick={handleComplete} className="w-full">
        <Download className="w-4 h-4 mr-2" />
        Use This Drawing
      </Button>
    </div>
  )
}
