import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Mic, MicOff, Loader2, Check, AlertCircle, Play, Pause, Volume2, X, HelpCircle } from 'lucide-react'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'
import { recordingAutoSave } from '../utils/recordingAutoSave'
import type { RecordingSession } from '../utils/recordingAutoSave'
import { getPlatformInfo, logPlatformInfo } from '../utils/platformDetection'
import { VoiceRecorderOnboarding } from './VoiceRecorderOnboarding'
import { enforceDreamInputCap } from '../utils/inputBudget'
import { useApiWithReauth } from '../hooks/useInlineReauth'

const MAX_DURATION_SECONDS = 180 // 3 minutes max recording duration

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcription: string) => void
  disabled?: boolean
}

export function VoiceRecorder({ onTranscriptionComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [hasRecoveredRecording, setHasRecoveredRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [showSaveButton, setShowSaveButton] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const [serviceUnavailableError, setServiceUnavailableError] = useState(false)
  const [lastFailedAudioBlob, setLastFailedAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<string>('')
  const startTimeRef = useRef<number>(0)

  const { apiCallWithReauth } = useApiWithReauth()

  // Initialize onboarding state from localStorage (don't show dialog on mount)
  useEffect(() => {
    try {
      const hasSeenVoiceOnboarding = localStorage.getItem('voiceRecorderOnboarded')
      if (hasSeenVoiceOnboarding === 'true') {
        setHasSeenOnboarding(true)
      }
      // Don't show onboarding on mount - only show when user clicks mic button for first time
    } catch (error) {
      console.warn('Error checking onboarding state:', error)
      // If localStorage fails, we'll show onboarding on first mic click
    }
  }, [])

  // Initialize and check for recovered recordings
  useEffect(() => {
    const recoverRecordingCallback = async (session: RecordingSession) => {
      setIsProcessing(true)
      
      try {
        const audioBlob = new Blob(session.chunks, { type: 'audio/webm' })
        
        toast.success('Recovering your incomplete recording...')
        
        await transcribeAudio(audioBlob)
        
        // Clean up recovered session
        await recordingAutoSave.deleteRecordingSession(session.id)
        setHasRecoveredRecording(false)
      } catch (error) {
        console.error('Error recovering recording:', error)
        toast.error('Failed to recover recording')
        setIsProcessing(false)
        setHasRecoveredRecording(false)
      }
    }
    
    const initAutoSave = async () => {
      try {
        await recordingAutoSave.init()
        
        // Check for any incomplete recordings from previous session
        const sessions = await recordingAutoSave.getAllRecordingSessions()
        
        if (sessions.length > 0) {
          const latestSession = sessions.sort((a, b) => b.lastSaved - a.lastSaved)[0]
          const ageMinutes = Math.floor((Date.now() - latestSession.lastSaved) / 60000)
          
          // Only recover if less than 30 minutes old
          if (ageMinutes < 30 && latestSession.chunks.length > 0) {
            setHasRecoveredRecording(true)
            toast.success(`Found incomplete recording from ${ageMinutes} min ago`, {
              duration: 5000,
            })
            
            // Auto-recover and transcribe
            setTimeout(() => {
              recoverRecordingCallback(latestSession)
            }, 1000)
          } else {
            // Clean up old sessions
            await recordingAutoSave.clearOldSessions()
          }
        }
      } catch (error) {
        console.error('Error initializing auto-save:', error)
      }
    }
    
    initAutoSave()
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
      // Stop any playing audio and clean up audio element properly
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
        audioPlayerRef.current.currentTime = 0
        audioPlayerRef.current = null
      }
      // Clean up audio URL on unmount to prevent memory leak
      if (audioUrl) {
        try {
          URL.revokeObjectURL(audioUrl)
        } catch (error) {
          console.warn('Error revoking audio URL:', error)
        }
      }
      // Stop media recorder if still recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.stop()
        } catch (error) {
          console.warn('Error stopping media recorder on unmount:', error)
        }
      }
      // Clear audio chunks array
      audioChunksRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOnboardingDismiss = () => {
    setShowOnboarding(false)
    // Mark as seen even if dismissed
    try {
      localStorage.setItem('voiceRecorderOnboarded', 'true')
      setHasSeenOnboarding(true)
    } catch (error) {
      console.warn('Error saving onboarding state:', error)
    }
  }

  const handleOnboardingReady = () => {
    setShowOnboarding(false)
    try {
      localStorage.setItem('voiceRecorderOnboarded', 'true')
      setHasSeenOnboarding(true)
    } catch (error) {
      console.warn('Error saving onboarding state:', error)
    }
  }

  const startRecording = async () => {
    try {
      // Show Recording Tips dialog on first microphone click (not on component mount)
      if (!hasSeenOnboarding) {
        setShowOnboarding(true)
        // Don't mark as seen yet - let the onboarding handlers do that when user dismisses/completes
        return // Stop here - user needs to see tips first, then click again to record
      }

      // Log platform info for debugging
      logPlatformInfo()

      const platformInfo = getPlatformInfo()
      console.log('🎤 Starting recording on:', platformInfo.browser, platformInfo.os)

      // Check if device supports MediaRecorder
      if (!platformInfo.supportsMediaRecorder) {
        toast.error('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.')
        return
      }

      // Request audio with platform-specific constraints
      const audioConstraints: any = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: platformInfo.os === 'iOS' ? true : false,
        sampleRate: 44100
      }

      // iOS-specific adjustments
      if (platformInfo.os === 'iOS') {
        audioConstraints.autoGainControl = true // iOS handles gain better
      }

      // Firefox on mobile needs different settings
      if (platformInfo.browser === 'Firefox' && platformInfo.isMobile) {
        audioConstraints.autoGainControl = true
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      })
      
      // Verify we have audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('No audio track available from microphone')
      }
      
      // Ensure audio track is not muted
      audioTracks.forEach(track => {
        track.enabled = true
        console.log('Audio track enabled:', track.enabled, 'Label:', track.label)
      })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      // Generate unique session ID
      sessionIdRef.current = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      startTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          console.log('Audio data chunk received, size:', event.data.size, 'Total chunks:', audioChunksRef.current.length)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('onstop event fired, processing audio chunks')
        console.log('Total chunks to process:', audioChunksRef.current.length)
        
        // Stop stream tracks
        stream.getTracks().forEach(track => {
          track.stop()
          console.log('Track stopped:', track.kind, track.label)
        })
        
        // Stop auto-save timer
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current)
          autoSaveTimerRef.current = null
        }
        
        if (audioChunksRef.current.length === 0) {
          console.log('No audio chunks available')
          toast.error('No audio recorded')
          // Clean up session
          await recordingAutoSave.deleteRecordingSession(sessionIdRef.current)
          return
        }

        const recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('Audio blob created, size:', recordedBlob.size, 'bytes')
        
        // Store the audio blob and show save button
        setAudioBlob(recordedBlob)
        setShowSaveButton(true)
        
        // Create audio URL for playback
        const url = URL.createObjectURL(recordedBlob)
        setAudioUrl(url)
        
        // Delete auto-saved session
        await recordingAutoSave.deleteRecordingSession(sessionIdRef.current)
        
        toast.success('Recording stopped! Listen to your recording or save to continue.')
      }

      // Error handling for mediaRecorder
      mediaRecorder.onerror = (event: any) => {
        const error = event.error;
        const errorMessage = error instanceof Error ? error.message : (error?.message || String(error));
        console.error('MediaRecorder error:', error)
        toast.error(`Recording error: ${errorMessage}`)
        setIsRecording(false)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current)
          autoSaveTimerRef.current = null
        }
      }

      // Request data every 1 second for auto-save
      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingDuration(0)
      setHasRecoveredRecording(false)
      
      console.log('MediaRecorder started, state:', mediaRecorder.state)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1
          
          // Enforce max duration limit
          if (newDuration >= MAX_DURATION_SECONDS) {
            // Stop recording automatically
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop()
              toast.warning(`Recording stopped automatically after ${Math.floor(MAX_DURATION_SECONDS / 60)} minutes to ensure reliability.`)
            }
          }
          
          return newDuration
        })
      }, 1000)
      
      // Start auto-save timer (save every 2 seconds)
      autoSaveTimerRef.current = setInterval(() => {
        saveRecordingSession()
      }, 2000)
      
      toast.success('Recording started (auto-save enabled)')
    } catch (error) {
      console.error('Error accessing microphone:', error)
      
      // Handle specific permission errors
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone permission denied. Please enable it in your browser settings to record dreams.', {
            duration: 4000,
          })
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone device found. Please connect a microphone.', {
            duration: 4000,
          })
        } else if (error.name === 'NotReadableError') {
          toast.error('Microphone is already in use. Please close other apps using it.', {
            duration: 4000,
          })
        } else {
          toast.error('Failed to access microphone. Please grant permission.', {
            duration: 4000,
          })
        }
      } else {
        toast.error('Failed to access microphone. Please grant permission.', {
          duration: 4000,
        })
      }
    }
  }

  const stopRecording = () => {
    console.log('stopRecording called, mediaRecorder state:', mediaRecorderRef.current?.state)
    
    // Clear timers first (but don't change isRecording state yet - let onstop handler do it)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
      console.log('Timer cleared')
    }
    
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
      console.log('Auto-save timer cleared')
    }
    
    // Stop the media recorder if it exists and is in recording state
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        console.log('Calling MediaRecorder.stop()')
        mediaRecorderRef.current.stop()
        console.log('MediaRecorder.stop() called successfully, waiting for onstop event...')
        
        // The onstop event handler will process the audio and update state
        // Set isRecording to false to update UI, but the audio processing happens in onstop
        setTimeout(() => {
          setIsRecording(false)
          console.log('isRecording set to false')
        }, 50)
      } catch (error) {
        console.error('Error calling MediaRecorder.stop():', error)
        toast.error('Error stopping recording')
        setIsRecording(false)
      }
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      console.log('MediaRecorder is paused, resuming then stopping...')
      try {
        mediaRecorderRef.current.resume()
        mediaRecorderRef.current.stop()
        console.log('MediaRecorder resumed and stopped')
        setTimeout(() => {
          setIsRecording(false)
        }, 50)
      } catch (error) {
        console.error('Error resuming/stopping paused recorder:', error)
        toast.error('Error stopping recording')
        setIsRecording(false)
      }
    } else {
      console.log('MediaRecorder not in recording or paused state, state:', mediaRecorderRef.current?.state)
      // Fallback: manually process chunks if they exist
      if (audioChunksRef.current.length > 0) {
        console.log('Fallback: processing existing audio chunks')
        const recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(recordedBlob)
        setShowSaveButton(true)
        const url = URL.createObjectURL(recordedBlob)
        setAudioUrl(url)
        toast.success('Recording stopped! Listen to your recording or save to continue.')
      } else {
        console.log('Fallback: no audio chunks available')
        toast.error('No audio recorded')
      }
      setIsRecording(false)
    }
  }

  const handleSaveAndTranscribe = async () => {
    if (!audioBlob) {
      toast.error('No recording to save')
      return
    }

    setShowSaveButton(false)
    await transcribeAudio(audioBlob)
  }

  const handleCancelRecording = () => {
    // Clean up audio URL to prevent memory leaks
    if (audioUrl) {
      try {
        URL.revokeObjectURL(audioUrl)
      } catch (error) {
        console.warn('Error revoking audio URL:', error)
      }
    }
    
    // Stop audio playback if playing
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      audioPlayerRef.current.currentTime = 0
      audioPlayerRef.current = null
    }
    
    setAudioUrl(null)
    setAudioBlob(null)
    setShowSaveButton(false)
    setRecordingDuration(0)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    audioChunksRef.current = []
    setServiceUnavailableError(false)
    setLastFailedAudioBlob(null)
    toast.success('Recording cancelled')
  }

  const handleRetryTranscription = async () => {
    if (!lastFailedAudioBlob) {
      toast.error('No recording to retry')
      return
    }

    setServiceUnavailableError(false)
    await transcribeAudio(lastFailedAudioBlob)
  }

  const togglePlayPause = () => {
    if (!audioPlayerRef.current || !audioUrl) {
      console.log('Audio player not ready')
      return
    }

    if (isPlaying) {
      audioPlayerRef.current.pause()
      setIsPlaying(false)
    } else {
      audioPlayerRef.current.play().catch(error => {
        console.error('Error playing audio:', error)
        toast.error('Failed to play audio')
      })
      setIsPlaying(true)
    }
  }

  // Setup audio player when audioUrl changes
  useEffect(() => {
    if (audioUrl) {
      console.log('Creating new Audio element for URL:', audioUrl)
      
      // Create audio element
      const audio = new Audio()
      audio.src = audioUrl
      audioPlayerRef.current = audio

      const handleLoadedMetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration)
        setDuration(audio.duration)
      }

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime)
      }

      const handleEnded = () => {
        console.log('Audio playback ended')
        setIsPlaying(false)
        setCurrentTime(0)
      }

      const handleError = (error: Event) => {
        console.error('Audio error:', error)
        toast.error('Error loading audio')
      }

      // Add event listeners
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)

      return () => {
        console.log('Cleaning up audio element')
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        audio.pause()
      }
    }
  }, [audioUrl])

  const saveRecordingSession = async () => {
    if (!isRecording || audioChunksRef.current.length === 0) return

    try {
      const session: RecordingSession = {
        id: sessionIdRef.current,
        chunks: [...audioChunksRef.current], // Copy array
        startTime: startTimeRef.current,
        lastSaved: Date.now(),
        duration: recordingDuration,
      }

      await recordingAutoSave.saveRecordingSession(session)
    } catch (error) {
      console.error('Error auto-saving recording:', error)
      // Silent fail - don't interrupt recording
    }
  }

  const recoverRecording = async (session: RecordingSession) => {
    setIsProcessing(true)
    
    try {
      const audioBlob = new Blob(session.chunks, { type: 'audio/webm' })
      
      toast.success('Recovering your incomplete recording...')
      
      await transcribeAudio(audioBlob)
      
      // Clean up recovered session
      await recordingAutoSave.deleteRecordingSession(session.id)
      setHasRecoveredRecording(false)
    } catch (error) {
      console.error('Error recovering recording:', error)
      toast.error('Failed to recover recording')
      setIsProcessing(false)
      setHasRecoveredRecording(false)
    }
  }

  const dismissRecoveredRecording = async () => {
    try {
      await recordingAutoSave.clearOldSessions()
      setHasRecoveredRecording(false)
      toast.success('Recovered recording dismissed')
    } catch (error) {
      console.error('Error dismissing recovered recording:', error)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setServiceUnavailableError(false)
    setLastFailedAudioBlob(null)
    
    try {
      // Upload audio to storage first
      const timestamp = Date.now()
      const audioFile = new File([audioBlob], `recording-${timestamp}.webm`, { type: 'audio/webm' })
      
      console.log('🎤 Uploading audio file...')
      const { publicUrl } = await apiCallWithReauth(() =>
        blink.storage.upload(audioFile, `voice-recordings/${timestamp}.webm`)
      )
      console.log('✅ Audio uploaded:', publicUrl)

      // Use custom edge function for transcription
      const TRANSCRIBE_URL = 'https://8lvkkwdq--transcribe-audio.functions.blink.new'

      // Simple approach: Get token and make request
      const result = await apiCallWithReauth(async () => {
        console.log('🎤 Starting transcription...')
        
        // Get fresh token
        const token = await blink.auth.getValidToken()
        if (!token) {
          throw new Error('Not authenticated')
        }
        
        // Make transcription request
        const response = await fetch(TRANSCRIBE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            audioUrl: publicUrl,
            language: 'en'
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Transcription error:', response.status, errorData)
          
          // Handle specific error codes
          if (errorData.code === 'AUTH_FAILED' || response.status === 401) {
            throw new Error('Authentication failed')
          }
          
          throw new Error(errorData.error || `Transcription failed: ${response.status}`)
        }

        return response.json()
      })

      const rawText = String(result.text || '')
      const { text, wasTruncated } = enforceDreamInputCap(rawText)

      if (wasTruncated) {
        toast('Transcription was trimmed to fit the 3,000 character limit.', {
          icon: '✂️',
          duration: 4500
        })
      }

      console.log('✅ Transcription successful, length:', text.length)

      setTranscription(text)
      onTranscriptionComplete(text)
      toast.success('Dream recorded successfully!')
    } catch (error) {
      console.error('Error transcribing audio:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Simple error handling
      if (errorMessage.includes('Not authenticated') || errorMessage.includes('Authentication')) {
        toast.error('Please sign in to transcribe your recording.', { duration: 5000 })
      } else if (errorMessage.includes('503') || errorMessage.includes('502') || errorMessage.includes('504')) {
        setServiceUnavailableError(true)
        setLastFailedAudioBlob(audioBlob)
        toast.error('Transcription service is temporarily busy. Click "Retry" below to try again.', { duration: 6000 })
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        setServiceUnavailableError(true)
        setLastFailedAudioBlob(audioBlob)
        toast.error('Network issue. Please check your connection and try again.', { duration: 6000 })
      } else {
        toast.error(`Transcription failed: ${errorMessage}. Please try typing your dream instead.`, { duration: 5000 })
      }
    } finally {
      setIsProcessing(false)
      audioChunksRef.current = []
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* Voice Recorder Onboarding Overlay */}
      {showOnboarding && (
        <VoiceRecorderOnboarding
          onDismiss={handleOnboardingDismiss}
          onReady={handleOnboardingReady}
        />
      )}

      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
          {/* Recovery Alert */}
          {hasRecoveredRecording && !isProcessing && (
            <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Incomplete Recording Found
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    We found a recording that wasn't finished. Recovering it now...
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissRecoveredRecording}
                  className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
          
          {/* Auto-save Indicator */}
          {isRecording && (
            <div className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Auto-saving every 2 seconds</span>
            </div>
          )}
          
          {/* Recording Button */}
          <div className="relative">
            <Button
              size="lg"
              variant={isRecording ? 'destructive' : 'default'}
              className={`w-24 h-24 rounded-full transition-all ${
                isRecording ? 'animate-pulse' : ''
              } relative z-10`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isProcessing || showSaveButton}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </Button>
            
            {/* Recording indicator ring */}
            {isRecording && (
              <div className="absolute inset-0 w-24 h-24 mx-auto pointer-events-none">
                <div className="w-full h-full border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Help Icon */}
          {!isRecording && !showSaveButton && !isProcessing && (
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-red-500 hover:text-red-600 transition-colors animate-pulse"
              aria-label="Recording tips"
              title="Need help recording?"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}

          {/* Audio Player & Action Buttons */}
          {showSaveButton && audioBlob && audioUrl && !isProcessing && (
            <div className="w-full space-y-4">
              {/* Audio Player */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full w-14 h-14 p-0 border-primary/30 hover:bg-primary/10"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-primary" />
                      ) : (
                        <Play className="w-6 h-6 text-primary ml-0.5" />
                      )}
                    </Button>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDuration(Math.floor(currentTime))}</span>
                        <Volume2 className="w-4 h-4 text-primary" />
                        <span>{formatDuration(Math.floor(duration))}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-100"
                          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-center text-sm text-muted-foreground">
                    Preview your recording before saving
                  </p>
                </CardContent>
              </Card>
              
              <div className="flex gap-2 w-full">
                <Button
                  size="lg"
                  variant="default"
                  className="flex-1"
                  onClick={handleSaveAndTranscribe}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save & Transcribe
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleCancelRecording}
                  disabled={isProcessing}
                  className="px-4"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Service Unavailable Retry UI */}
              {serviceUnavailableError && lastFailedAudioBlob && !isProcessing && (
                <div className="w-full p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Transcription Service Temporarily Busy</span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                    Our transcription server is experiencing high demand. Your recording is safely saved - you can retry transcription without recording again.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-9 font-bold bg-red-600 hover:bg-red-700"
                      onClick={handleRetryTranscription}
                    >
                      <Loader2 className={`w-3 h-3 mr-2 animate-spin ${isProcessing ? '' : 'hidden'}`} />
                      Retry Transcription
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => {
                        setServiceUnavailableError(false)
                        setLastFailedAudioBlob(null)
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Text */}
          <div className="text-center space-y-2">
            {isProcessing ? (
              <p className="text-lg font-medium text-muted-foreground">
                Transcribing your dream...
              </p>
            ) : showSaveButton ? (
              <>
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(recordingDuration)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Play your recording above to review, then save or cancel
                </p>
              </>
            ) : isRecording ? (
              <>
                <p className="text-2xl font-bold text-red-600">
                  {formatDuration(recordingDuration)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Recording... Tap to stop
                </p>
              </>
            ) : transcription ? (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <p className="text-sm font-medium">Dream recorded successfully</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-medium">Capture Your Dream</p>
                <p className="text-sm text-muted-foreground">
                  Tap the microphone to start recording
                </p>
              </>
            )}
          </div>

          {/* Transcription Preview */}
          {transcription && !isProcessing && (
            <div className="w-full p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1 font-medium">Transcription:</p>
              <p className="text-sm">{transcription}</p>
            </div>
          )}

          {/* Help Text */}
          {!isRecording && !transcription && !isProcessing && !serviceUnavailableError && (
            <div className="text-center text-xs text-muted-foreground max-w-sm">
              <p>Perfect for recording dreams right when you wake up.</p>
              <p className="mt-1">Speak naturally and describe what you remember.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  )
}
