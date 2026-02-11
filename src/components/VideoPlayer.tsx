import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import type { VideoPlayerState } from '../types/video'
import { formatVideoTime } from '../types/video'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  onStateChange?: (state: VideoPlayerState) => void
}

export function VideoPlayer({ src, poster, className, onStateChange }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: false,
    isLoading: true,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isFullscreen: false,
    hasError: false
  })
  const [showControls, setShowControls] = useState(true)

  // Notify parent component of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(playerState)
    }
  }, [playerState, onStateChange])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({
        ...prev,
        duration: video.duration,
        isLoading: false
      }))
    }

    const handleTimeUpdate = () => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: video.currentTime
      }))
    }

    const handleEnded = () => {
      setPlayerState(prev => ({
        ...prev,
        isPlaying: false
      }))
    }

    const handleLoadStart = () => {
      setPlayerState(prev => ({
        ...prev,
        isLoading: true
      }))
    }

    const handleCanPlay = () => {
      setPlayerState(prev => ({
        ...prev,
        isLoading: false
      }))
    }

    const handleError = () => {
      setPlayerState(prev => ({
        ...prev,
        hasError: true,
        isLoading: false,
        errorMessage: 'Failed to load video'
      }))
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return

    if (playerState.isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const newMuted = !playerState.isMuted
    videoRef.current.muted = newMuted
    setPlayerState(prev => ({ ...prev, isMuted: newMuted }))
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const time = parseFloat(e.target.value)
    videoRef.current.currentTime = time
    setPlayerState(prev => ({ ...prev, currentTime: time }))
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
      setPlayerState(prev => ({ ...prev, isFullscreen: false }))
    } else {
      videoRef.current.requestFullscreen()
      setPlayerState(prev => ({ ...prev, isFullscreen: true }))
    }
  }

  return (
    <div
      className={cn('relative group rounded-lg overflow-hidden bg-black', className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {playerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Play button overlay */}
      {!playerState.isPlaying && !playerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
            <Play className="w-10 h-10 text-black ml-2" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
          showControls || !playerState.isPlaying ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max={playerState.duration || 0}
          value={playerState.currentTime}
          onChange={handleSeek}
          className="w-full mb-3 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              {playerState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              {playerState.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            <span className="text-white text-sm font-medium">
              {formatVideoTime(playerState.currentTime)} / {formatVideoTime(playerState.duration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
