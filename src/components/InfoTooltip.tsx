import { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

interface InfoTooltipProps {
  content: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function InfoTooltip({ content, side = 'right', className = '' }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="cursor-help inline-flex items-center justify-center">
            <HelpCircle className={`w-4 h-4 text-muted-foreground hover:text-foreground transition-colors ${className}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="text-sm">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
