/**
 * Symbolica Export Button Component
 * Export Symbol Orchard data to PDF/HTML/Markdown
 */

import { useState } from 'react'
import { Download, FileText, FileCode, FileImage, Loader2, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu'
import { toast } from 'sonner'
import { exportSymbolOrchard } from '../utils/symbolicaExport'
import type { GardenStats } from '../types/symbolica'

interface SymbolicaExportButtonProps {
  userId: string
  stats?: GardenStats
  userName?: string
  symbolCount?: number
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SymbolicaExportButton({
  userId,
  stats,
  userName,
  symbolCount = 0,
  variant = 'outline',
  size = 'sm'
}: SymbolicaExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html' | 'markdown' | null>(null)

  const handleExport = async (format: 'pdf' | 'html' | 'markdown') => {
    if (symbolCount === 0) {
      toast.error('No symbols to export', {
        description: 'Start logging dreams to grow your Symbol Orchard!'
      })
      return
    }

    setExporting(true)
    setExportFormat(format)

    try {
      await exportSymbolOrchard(
        {
          userId,
          format,
          includeStats: true
        },
        stats,
        userName
      )

      toast.success(`Symbol Orchard exported as ${format.toUpperCase()}!`, {
        description: `${symbolCount} symbols exported successfully.`
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed', {
        description: 'Please try again later.'
      })
    } finally {
      setExporting(false)
      setExportFormat(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={exporting} className="gap-1.5">
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {size !== 'icon' && <span>Export</span>}
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="cursor-pointer"
        >
          <FileImage className="w-4 h-4 mr-2 text-red-500" />
          <div className="flex flex-col">
            <span>PDF Document</span>
            <span className="text-xs text-muted-foreground">Print-ready format</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => handleExport('html')}
          disabled={exporting}
          className="cursor-pointer"
        >
          <FileCode className="w-4 h-4 mr-2 text-orange-500" />
          <div className="flex flex-col">
            <span>HTML File</span>
            <span className="text-xs text-muted-foreground">Web viewable</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => handleExport('markdown')}
          disabled={exporting}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2 text-blue-500" />
          <div className="flex flex-col">
            <span>Markdown</span>
            <span className="text-xs text-muted-foreground">Plain text format</span>
          </div>
        </DropdownMenuItem>

        {symbolCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {symbolCount} symbol{symbolCount !== 1 ? 's' : ''} will be exported
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
