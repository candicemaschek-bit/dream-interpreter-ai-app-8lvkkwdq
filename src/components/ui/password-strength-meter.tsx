import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

interface PasswordRequirement {
  label: string
  met: boolean
}

export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
  requirements: PasswordRequirement[]
} {
  const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ]
  
  const metCount = requirements.filter(r => r.met).length
  
  // Calculate score (0-4)
  let score = 0
  if (password.length > 0) {
    score = Math.min(4, Math.floor(metCount * 0.8))
    // Bonus for long passwords
    if (password.length >= 12) score = Math.min(4, score + 1)
  }
  
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = [
    'bg-red-500',
    'bg-orange-500', 
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500'
  ]
  
  return {
    score,
    label: labels[score],
    color: colors[score],
    requirements
  }
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password])
  
  if (!password) return null
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              index <= strength.score ? strength.color : 'bg-muted'
            )}
          />
        ))}
      </div>
      
      {/* Strength Label */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Password strength:</span>
        <span className={cn(
          'text-xs font-medium',
          strength.score <= 1 ? 'text-red-500' :
          strength.score === 2 ? 'text-yellow-600' :
          strength.score === 3 ? 'text-lime-600' :
          'text-green-600'
        )}>
          {strength.label}
        </span>
      </div>
      
      {/* Requirements List */}
      <div className="space-y-1 pt-1">
        {strength.requirements.map((req, index) => (
          <div 
            key={index} 
            className={cn(
              'flex items-center gap-2 text-xs transition-colors',
              req.met ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
