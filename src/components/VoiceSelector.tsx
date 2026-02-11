import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface VoiceSelectorProps {
  currentVoice: string
  onVoiceChange: (voice: string) => void
}

const VOICES = [
  { value: 'nova', label: 'Nova', description: 'Default, neutral' },
  { value: 'alloy', label: 'Alloy', description: 'Neutral, balanced' },
  { value: 'echo', label: 'Echo', description: 'Clear, articulate' },
  { value: 'fable', label: 'Fable', description: 'Expressive, warm' },
  { value: 'onyx', label: 'Onyx', description: 'Deep, authoritative' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft, gentle' }
]

export function VoiceSelector({ currentVoice, onVoiceChange }: VoiceSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="tts-voice">Preferred Narration Voice</Label>
      <Select value={currentVoice} onValueChange={onVoiceChange}>
        <SelectTrigger id="tts-voice">
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {VOICES.map((voice) => (
            <SelectItem key={voice.value} value={voice.value}>
              <div className="flex flex-col py-1">
                <span className="font-medium">{voice.label}</span>
                <span className="text-xs text-muted-foreground">{voice.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Your dreams will be narrated in this voice. Change anytime in settings.
      </p>
    </div>
  )
}
