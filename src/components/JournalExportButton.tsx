/**
 * Journal Export Button Component
 * Allows users to export their reflection journal
 * 
 * Phase 3 Implementation
 */

import { useState } from 'react'
import { Download, FileText, File, Loader2 } from 'lucide-react'
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
import { exportJournal } from '../utils/journalExport'

interface JournalExportButtonProps {
  userId: string
  userName?: string
  sessionIds?: string[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function JournalExportButton({
  userId,
  userName,
  sessionIds,
  variant = 'outline',
  size = 'default'
}: JournalExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<string | null>(null)

  const handleExport = async (format: 'pdf' | 'html' | 'markdown') => {
    try {
      setExporting(true)
      setExportFormat(format)

      await exportJournal({
        userId,
        sessionIds,
        includeEmotionalTags: true,
        includeDreamLinks: true,
        format
      }, userName)

      toast.success(`Journal exported as ${format.toUpperCase()}`, {
        description: format === 'pdf' 
          ? 'Use your browser\'s print dialog to save as PDF'
          : 'Your file is downloading'
      })
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error('Export failed', {
        description: error.message || 'Could not export your journal'
      })
    } finally {
      setExporting(false)
      setExportFormat(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={exporting}
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {size !== 'icon' && (exporting ? 'Exporting...' : 'Export Journal')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-red-500" />
          <span>PDF Document</span>
          {exportFormat === 'pdf' && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('html')}
          disabled={exporting}
          className="gap-2 cursor-pointer"
        >
          <File className="w-4 h-4 text-blue-500" />
          <span>HTML File</span>
          {exportFormat === 'html' && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('markdown')}
          disabled={exporting}
          className="gap-2 cursor-pointer"
        >
          <File className="w-4 h-4 text-purple-500" />
          <span>Markdown</span>
          {exportFormat === 'markdown' && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
