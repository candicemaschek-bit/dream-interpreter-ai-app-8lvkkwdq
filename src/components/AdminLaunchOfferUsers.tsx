import { useState, useEffect } from 'react'
import { blink } from '@/blink/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Loader2, AlertCircle, Gift, TrendingDown, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface LaunchOfferUser {
  id: string
  userId: string
  signupNumber: number
  offerActivated: number
  transcriptionsUsed: number
  imagesGenerated: number
  createdAt: string
  updatedAt: string
  userEmail?: string
}

export function AdminLaunchOfferUsers() {
  const [users, setUsers] = useState<LaunchOfferUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    utilized: 0,
    transcriptionUsagePercentage: 0,
  })
  const [limit, setLimit] = useState(500)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null)
  const [manualEmail, setManualEmail] = useState('')
  const [foundUser, setFoundUser] = useState<{ id: string, email: string } | null>(null)
  const [searchingUser, setSearchingUser] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch global setting for limit
      const globalSettings = await blink.db.globalSettings.list({
        where: { key: 'launch_offer_limit' },
        limit: 1
      })
      const currentLimit = globalSettings[0]?.value ? Number(globalSettings[0].value) : 500
      setLimit(currentLimit)

      // Fetch all launch offer users
      const launchOffers = await blink.db.launchOfferUsers.list({
        orderBy: { signupNumber: 'asc' },
        limit: 1000
      })

      // Fetch users to get emails (client-side join)
      const usersData = await blink.db.users.list({ limit: 2000 })
      const usersMap = new Map(usersData.map((u: any) => [u.id, u.email]))

      const launchOfferUsers: LaunchOfferUser[] = launchOffers.map((offer: any) => ({
        id: offer.id,
        userId: offer.userId,
        signupNumber: Number(offer.signupNumber),
        offerActivated: Number(offer.offerActivated),
        transcriptionsUsed: Number(offer.transcriptionsUsed),
        imagesGenerated: Number(offer.imagesGenerated),
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        userEmail: usersMap.get(offer.userId) || '',
      }))

      setUsers(launchOfferUsers)

      // Calculate stats
      const totalActive = launchOfferUsers.filter((u) => u.offerActivated === 1).length
      const totalUtilized = launchOfferUsers.filter((u) => u.transcriptionsUsed > 0).length
      const totalTranscriptions = launchOfferUsers.reduce((sum, u) => sum + u.transcriptionsUsed, 0)
      const maxTranscriptions = launchOfferUsers.length * 4 // 4 per user limit
      const usagePercentage = maxTranscriptions > 0 ? Math.round((totalTranscriptions / maxTranscriptions) * 100) : 0

      setStats({
        total: launchOfferUsers.length,
        active: totalActive,
        utilized: totalUtilized,
        transcriptionUsagePercentage: usagePercentage,
      })
    } catch (error) {
      console.error('Error loading launch offer users:', error)
      toast.error('Failed to load launch offer users')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeOffer = async (id: string) => {
    if (!confirm('Are you sure? This will deactivate the launch offer for this user.')) return

    setRevokingId(id)
    try {
      await blink.db.launchOfferUsers.update(id, {
        offerActivated: 0,
        updatedAt: new Date().toISOString()
      })
      toast.success('Launch offer revoked')
      await loadData()
    } catch (error) {
      console.error('Error revoking offer:', error)
      toast.error('Failed to revoke offer')
    } finally {
      setRevokingId(null)
    }
  }

  const handleResetTranscriptions = async (id: string) => {
    if (!confirm('Reset transcription usage for this user to 0?')) return

    setResettingId(id)
    try {
      await blink.db.launchOfferUsers.update(id, {
        transcriptionsUsed: 0,
        updatedAt: new Date().toISOString()
      })
      toast.success('Transcription usage reset')
      await loadData()
    } catch (error) {
      console.error('Error resetting usage:', error)
      toast.error('Failed to reset usage')
    } finally {
      setResettingId(null)
    }
  }

  const handleSearchUserByEmail = async () => {
    if (!manualEmail.includes('@')) return
    
    setSearchingUser(true)
    try {
      const result = await blink.db.users.list({
        where: { email: manualEmail.toLowerCase() },
        limit: 1
      })
      
      if (result.length > 0) {
        setFoundUser({ id: result[0].id, email: result[0].email })
        toast.success('User found!')
      } else {
        setFoundUser(null)
        toast.error('No user found with that email')
      }
    } catch (error) {
      console.error('Error searching user:', error)
      toast.error('Failed to search user')
    } finally {
      setSearchingUser(false)
    }
  }

  const handleManualGrant = async () => {
    if (!foundUser) return
    
    setGrantingUserId(foundUser.id)
    try {
      const token = await blink.auth.getValidToken()
      if (!token) throw new Error('No auth token')
      
      const functionUrl = 'https://8lvkkwdq--grant-launch-offer.functions.blink.new'
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId: foundUser.id })
      })
      
      const result = await response.json()
      if (result.granted) {
        toast.success(result.message || 'Launch offer granted successfully')
        setManualEmail('')
        setFoundUser(null)
        await loadData()
      } else {
        toast.error(result.message || 'Failed to grant offer')
      }
    } catch (error) {
      console.error('Error granting offer:', error)
      toast.error('Failed to grant launch offer')
    } finally {
      setGrantingUserId(null)
    }
  }

  const filteredUsers = users.filter((u) => u.userEmail?.toLowerCase().includes(searchEmail.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Manual Grant Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Manual Grant
          </CardTitle>
          <CardDescription>
            Grant a launch offer manually to a specific user by email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Enter user email..."
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUserByEmail()}
              />
              <Button 
                variant="outline" 
                onClick={handleSearchUserByEmail}
                disabled={searchingUser || !manualEmail.includes('@')}
              >
                {searchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            {foundUser && (
              <Button 
                onClick={handleManualGrant} 
                disabled={!!grantingUserId}
                className="bg-primary hover:bg-primary/90"
              >
                {grantingUserId === foundUser.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Grant to ${foundUser.email}`
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Signups</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">of {limit}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Offers</p>
                <p className="text-3xl font-bold mt-2">{stats.active}</p>
                <p className="text-xs text-muted-foreground mt-1">currently active</p>
              </div>
              <Gift className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilized</p>
                <p className="text-3xl font-bold mt-2">{stats.utilized}</p>
                <p className="text-xs text-muted-foreground mt-1">used transcriptions</p>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quota Usage</p>
                <p className="text-3xl font-bold mt-2">{stats.transcriptionUsagePercentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">of total budget</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Launch Offer Users</CardTitle>
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {searchEmail ? 'No users found matching your search' : 'No launch offer users'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signup #</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transcriptions</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.signupNumber}</TableCell>
                      <TableCell className="text-sm">{user.userEmail || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={user.offerActivated === 1 ? 'default' : 'secondary'}>
                          {user.offerActivated === 1 ? 'Active' : 'Revoked'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{user.transcriptionsUsed}/4</span>
                          {user.transcriptionsUsed >= 4 && (
                            <Badge variant="destructive" className="text-xs">
                              Full
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.imagesGenerated}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.transcriptionsUsed > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetTranscriptions(user.id)}
                              disabled={resettingId === user.id}
                            >
                              {resettingId === user.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Reset'
                              )}
                            </Button>
                          )}
                          {user.offerActivated === 1 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevokeOffer(user.id)}
                              disabled={revokingId === user.id}
                            >
                              {revokingId === user.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Revoke'
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} launch offer users
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
