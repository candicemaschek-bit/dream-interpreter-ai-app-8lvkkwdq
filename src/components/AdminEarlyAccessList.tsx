/**
 * Admin Early Access List
 * Displays all users who signed up for early access to premium features
 */

import { useEffect, useState } from 'react'
import { blink } from '@/blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminHeader } from '@/components/AdminHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Mail, User, Calendar, Sparkles, Search, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface EarlyAccessEntry {
  id: string
  name: string
  email: string
  tier: string
  userId: string | null
  createdAt: string
  invitedAt: string | null
  invitationSent: string | number
  notes: string | null
}

export function AdminEarlyAccessList() {
  const [entries, setEntries] = useState<EarlyAccessEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadEarlyAccessList()
  }, [])

  const loadEarlyAccessList = async () => {
    try {
      setLoading(true)
      const data = await blink.db.earlyAccessList.list({
        orderBy: { createdAt: 'desc' },
        limit: 1000
      })
      
      setEntries(data as EarlyAccessEntry[])
    } catch (error) {
      console.error('Error loading early access list:', error)
      toast.error('Failed to load early access list')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    try {
      const headers = ['Name', 'Email', 'Tier', 'Signed Up', 'Invitation Status']
      const rows = filteredEntries.map(entry => [
        entry.name,
        entry.email,
        entry.tier,
        new Date(entry.createdAt).toLocaleDateString(),
        Number(entry.invitationSent) > 0 ? 'Invited' : 'Pending'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `early-access-list-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Exported to CSV')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export')
    }
  }

  const filteredEntries = entries.filter(entry => {
    const query = searchQuery.toLowerCase()
    return (
      entry.name.toLowerCase().includes(query) ||
      entry.email.toLowerCase().includes(query) ||
      entry.tier.toLowerCase().includes(query)
    )
  })

  const stats = {
    total: entries.length,
    pending: entries.filter(e => Number(e.invitationSent) === 0).length,
    invited: entries.filter(e => Number(e.invitationSent) > 0).length,
    architectSignups: entries.filter(e => e.tier === 'premium').length,
    starSignups: entries.filter(e => e.tier === 'vip').length
  }

  return (
    <>
      <AdminHeader 
        title="Early Access List" 
        description="Users interested in upcoming premium features"
      >
        <Button onClick={exportToCSV} variant="outline" size="sm" disabled={entries.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </AdminHeader>

      <ScrollArea className="flex-1">
        <div className="px-6 py-6 pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading early access list...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Signups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">All entries</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground mt-1">Not yet invited</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Invited</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500">{stats.invited}</div>
                    <p className="text-xs text-muted-foreground mt-1">Invitation sent</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Architect (Premium)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-500">{stats.architectSignups}</div>
                    <p className="text-xs text-muted-foreground mt-1">Premium tier</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Star (VIP)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">{stats.starSignups}</div>
                    <p className="text-xs text-muted-foreground mt-1">VIP tier</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or tier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Early Access List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Early Access Signups ({filteredEntries.length})
                  </CardTitle>
                  <CardDescription>
                    Users who requested early access to premium features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No results found' : 'No early access signups yet'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{entry.name}</span>
                              </div>
                              <Badge variant={entry.tier === 'premium' ? 'default' : 'secondary'}>
                                {entry.tier === 'premium' ? 'Architect' : entry.tier === 'vip' ? 'Star' : entry.tier}
                              </Badge>
                              {Number(entry.invitationSent) > 0 && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                  Invited
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <a 
                                  href={`mailto:${entry.email}`}
                                  className="hover:text-primary hover:underline"
                                >
                                  {entry.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {entry.userId && (
                              <div className="text-xs text-muted-foreground">
                                User ID: {entry.userId}
                              </div>
                            )}

                            {entry.notes && (
                              <div className="text-sm text-muted-foreground italic">
                                Note: {entry.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </ScrollArea>
    </>
  )
}
