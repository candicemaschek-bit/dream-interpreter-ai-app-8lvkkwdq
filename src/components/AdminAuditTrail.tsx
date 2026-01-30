/**
 * Admin Audit Trail
 * Displays complete history of moderation actions for compliance
 */

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select'
import { Input } from './ui/input'
import { FileText, Download } from 'lucide-react'
import { getAuditTrail } from '../utils/moderationService'
import { format } from 'date-fns'
import { getActionLabel, MODERATION_ACTION_LABELS } from '../types/moderation'

export function AdminAuditTrail() {
  const [actions, setActions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [searchDream, setSearchDream] = useState('')

  useEffect(() => {
    loadAuditTrail()
  }, [])

  const loadAuditTrail = async () => {
    setIsLoading(true)
    try {
      const data = await getAuditTrail(100, 0)
      setActions(data)
    } catch (error) {
      console.error('Error loading audit trail:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredActions = actions
    .filter((action) => {
      if (filterAction !== 'all' && action.action_type !== filterAction) {
        return false
      }
      if (searchDream && !action.dream_title?.toLowerCase().includes(searchDream.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleExport = () => {
    const csv = [
      ['Date', 'Dream', 'Action', 'Moderator', 'Reason'].join(','),
      ...filteredActions.map(action =>
        [
          format(new Date(action.created_at), 'yyyy-MM-dd HH:mm:ss'),
          `"${action.dream_title || 'N/A'}"`,
          action.action_type,
          action.moderator_name || 'Unknown',
          `"${action.action_reason}"`
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6" />
              Moderation Audit Trail
            </CardTitle>
            <CardDescription>
              Complete history of all moderation actions for compliance and review
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search dreams..."
            value={searchDream}
            onChange={(e) => setSearchDream(e.target.value)}
            className="flex-1"
          />
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="dismiss_report">Dismiss Report</SelectItem>
              <SelectItem value="warn_author">Warn Author</SelectItem>
              <SelectItem value="hide">Hide from Feed</SelectItem>
              <SelectItem value="remove">Remove</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredActions.length} of {actions.length} actions
        </p>

        {/* Table */}
        {filteredActions.length === 0 ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <p>No audit trail entries found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Dream</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Moderator</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map((action) => (
                  <TableRow key={action.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(
                        new Date(action.created_at),
                        'MMM d, yyyy HH:mm'
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="max-w-xs truncate inline-block">
                        {action.dream_title || 'Untitled Dream'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          action.action_type === 'remove'
                            ? 'destructive'
                            : action.action_type === 'hide'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {getActionLabel(action.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {action.moderator_name || 'System'}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs">
                      <span className="truncate inline-block" title={action.action_reason}>
                        {action.action_reason}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
