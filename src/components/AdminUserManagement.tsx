/**
 * Admin User Management Page
 * Comprehensive user management interface with search, filters, and actions
 */

import { useEffect, useState } from 'react'
import { blink } from '@/blink/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Search, Users, Ban, CheckCircle, XCircle, UserCog, Gift, Download, MoreHorizontal, ShieldAlert, ArrowUpCircle } from 'lucide-react'
import { AdminHeader } from '@/components/AdminHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserRow, UserProfileRow } from '@/types/blink'
import { toast } from 'react-hot-toast'
import '@/types/blink'

interface UserData {
  id: string
  email: string
  displayName?: string
  createdAt: string
  lastSignIn: string
  role?: string
  profile?: {
    subscriptionTier: string
    accountStatus: string
    dreamsAnalyzedThisMonth: number
    dreamsAnalyzedLifetime: number
  }
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isGrantingOffer, setIsGrantingOffer] = useState(false)
  const [hasLaunchOffer, setHasLaunchOffer] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, tierFilter, users])

  useEffect(() => {
    if (selectedUser) {
      checkLaunchOfferStatus(selectedUser.id)
    }
  }, [selectedUser])

  const checkLaunchOfferStatus = async (userId: string) => {
    try {
      const result = await blink.db.launchOfferUsers.list({
        where: { userId },
        limit: 1
      })
      setHasLaunchOffer(result.length > 0 && Number(result[0].offerActivated) === 1)
    } catch (error) {
      console.error('Error checking launch offer:', error)
      setHasLaunchOffer(false)
    }
  }

  const handleGrantLaunchOffer = async (userId: string) => {
    try {
      setIsGrantingOffer(true)
      const token = await blink.auth.getValidToken()
      if (!token) throw new Error('No auth token')

      const functionUrl = 'https://8lvkkwdq--grant-launch-offer.functions.blink.new'
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId: userId })
      })

      const result = await response.json()
      if (result.granted) {
        toast.success(result.message || 'Launch offer granted')
        setHasLaunchOffer(true)
      } else {
        toast.error(result.message || 'Failed to grant offer')
      }
    } catch (error) {
      console.error('Error granting offer:', error)
      toast.error('Failed to grant launch offer')
    } finally {
      setIsGrantingOffer(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUserIds)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUserIds(newSelection)
  }

  const toggleAllSelection = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    const userIds = Array.from(selectedUserIds)
    if (userIds.length === 0) return

    toast.loading(`Updating ${userIds.length} users...`, { id: 'bulk-update' })
    
    try {
      let successCount = 0
      for (const userId of userIds) {
        const profiles = await blink.db.userProfiles.list({ where: { userId } })
        if (profiles.length > 0) {
          await blink.db.userProfiles.update(profiles[0].id, {
            accountStatus: status,
            updatedAt: new Date().toISOString()
          })
          successCount++
        }
      }
      toast.success(`Successfully updated ${successCount} users`, { id: 'bulk-update' })
      loadUsers()
      setSelectedUserIds(new Set())
    } catch (error) {
      console.error('Bulk update error:', error)
      toast.error('Failed to update some users', { id: 'bulk-update' })
    }
  }

  const handleBulkTierUpdate = async (tier: string) => {
    const userIds = Array.from(selectedUserIds)
    if (userIds.length === 0) return

    toast.loading(`Upgrading ${userIds.length} users...`, { id: 'bulk-tier' })
    
    try {
      let successCount = 0
      for (const userId of userIds) {
        const profiles = await blink.db.userProfiles.list({ where: { userId } })
        if (profiles.length > 0) {
          await blink.db.userProfiles.update(profiles[0].id, {
            subscriptionTier: tier,
            updatedAt: new Date().toISOString()
          })
          successCount++
        }
      }
      toast.success(`Successfully upgraded ${successCount} users to ${tier}`, { id: 'bulk-tier' })
      loadUsers()
      setSelectedUserIds(new Set())
    } catch (error) {
      console.error('Bulk tier update error:', error)
      toast.error('Failed to update some users', { id: 'bulk-tier' })
    }
  }

  const handleExportCSV = () => {
    const userIds = Array.from(selectedUserIds)
    const exportData = userIds.length > 0 
      ? users.filter(u => userIds.includes(u.id))
      : filteredUsers

    const headers = ['ID', 'Email', 'Display Name', 'Status', 'Tier', 'Dreams (Total)', 'Dreams (Month)', 'Joined']
    const csvContent = [
      headers.join(','),
      ...exportData.map(u => [
        u.id,
        u.email,
        `"${u.displayName || ''}"`,
        u.profile?.accountStatus || 'unknown',
        u.profile?.subscriptionTier || 'free',
        u.profile?.dreamsAnalyzedLifetime || 0,
        u.profile?.dreamsAnalyzedThisMonth || 0,
        u.createdAt
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `dreamcatcher-users-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${exportData.length} users to CSV`)
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await blink.db.users.list({ limit: 1000 })
      const profilesData = await blink.db.userProfiles.list({ limit: 1000 })

      // Combine users with their profiles
      const enrichedUsers: UserData[] = usersData.map((user: any) => {
        const profile = profilesData.find((p: any) => p.userId === user.id)
        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt,
          lastSignIn: user.lastSignIn,
          role: user.role,
          profile: profile ? {
            subscriptionTier: profile.subscriptionTier || 'free',
            accountStatus: profile.accountStatus || 'active',
            dreamsAnalyzedThisMonth: Number(profile.dreamsAnalyzedThisMonth) || 0,
            dreamsAnalyzedLifetime: Number(profile.dreamsAnalyzedLifetime) || 0,
          } : undefined
        }
      })

      setUsers(enrichedUsers)
      setFilteredUsers(enrichedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        (user.displayName?.toLowerCase() || '').includes(query) ||
        user.id.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.profile?.accountStatus === statusFilter)
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => user.profile?.subscriptionTier === tierFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const profiles = await blink.db.userProfiles.list({
        where: { userId }
      })

      if (profiles.length > 0) {
        await blink.db.userProfiles.update(profiles[0].id, {
          accountStatus: newStatus,
          updatedAt: new Date().toISOString()
        })
        toast.success(`User status updated to ${newStatus}`)
        loadUsers()
        setDialogOpen(false)
      } else {
        toast.error('User profile not found')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  const handleUpdateUserTier = async (userId: string, newTier: string) => {
    try {
      const profiles = await blink.db.userProfiles.list({
        where: { userId }
      })

      if (profiles.length > 0) {
        await blink.db.userProfiles.update(profiles[0].id, {
          subscriptionTier: newTier,
          updatedAt: new Date().toISOString()
        })
        toast.success(`User tier updated to ${newTier}`)
        loadUsers()
        setDialogOpen(false)
      } else {
        toast.error('User profile not found')
      }
    } catch (error) {
      console.error('Error updating user tier:', error)
      toast.error('Failed to update user tier')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'suspended':
        return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>
      case 'banned':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Banned</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="secondary">Free</Badge>
      case 'pro':
        return <Badge variant="default" className="bg-purple-500">Pro</Badge>
      case 'premium':
        return <Badge variant="default" className="bg-amber-500">Premium</Badge>
      case 'vip':
        return <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-pink-500">VIP</Badge>
      default:
        return <Badge variant="outline">N/A</Badge>
    }
  }

  return (
    <>
      <AdminHeader title="User Management" description="Manage user accounts and permissions" />

      <ScrollArea className="flex-1">
        <div className="px-6 py-6 pb-12">
        {/* Filters and Bulk Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Account Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subscription Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:w-72">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{selectedUserIds.size} selected</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds(new Set())} className="h-6 text-[10px]">Clear</Button>
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1" size="sm" disabled={selectedUserIds.size === 0}>
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('active')}>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Set Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('suspended')}>
                      <Ban className="w-4 h-4 mr-2 text-yellow-500" />
                      Suspend Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate('banned')}>
                      <XCircle className="w-4 h-4 mr-2 text-red-500" />
                      Ban Users
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1" size="sm" disabled={selectedUserIds.size === 0}>
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Tier
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkTierUpdate('free')}>Free</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkTierUpdate('pro')}>Pro</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkTierUpdate('premium')}>Premium</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkTierUpdate('vip')}>VIP</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button variant="outline" className="w-full" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription>View and manage all user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={toggleAllSelection}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Dreams</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className={selectedUserIds.has(user.id) ? 'bg-accent/30' : ''}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{user.email}</TableCell>
                        <TableCell>{user.displayName || '-'}</TableCell>
                        <TableCell>{getStatusBadge(user.profile?.accountStatus)}</TableCell>
                        <TableCell>{getTierBadge(user.profile?.subscriptionTier)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{user.profile?.dreamsAnalyzedLifetime || 0} total</div>
                            <div className="text-muted-foreground text-xs">
                              {user.profile?.dreamsAnalyzedThisMonth || 0} this month
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setDialogOpen(true)
                            }}
                          >
                            <UserCog className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>
              Update user settings and permissions
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">Email</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">User ID</p>
                  <p className="text-muted-foreground font-mono text-xs">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Display Name</p>
                  <p className="text-muted-foreground">{selectedUser.displayName || 'Not set'}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Role</p>
                  <p className="text-muted-foreground">{selectedUser.role || 'user'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Special Offers</h4>
                <div className="flex gap-2">
                  <Button
                    variant={hasLaunchOffer ? 'default' : 'outline'}
                    size="sm"
                    className={hasLaunchOffer ? 'bg-green-500 hover:bg-green-600' : ''}
                    disabled={hasLaunchOffer || isGrantingOffer}
                    onClick={() => handleGrantLaunchOffer(selectedUser.id)}
                  >
                    <Gift className="w-4 h-4 mr-1" />
                    {hasLaunchOffer ? 'Launch Offer Active' : isGrantingOffer ? 'Granting...' : 'Grant Launch Offer'}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Account Status</h4>
                <div className="flex gap-2">
                  <Button
                    variant={selectedUser.profile?.accountStatus === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateUserStatus(selectedUser.id, 'active')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </Button>
                  <Button
                    variant={selectedUser.profile?.accountStatus === 'suspended' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateUserStatus(selectedUser.id, 'suspended')}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Suspended
                  </Button>
                  <Button
                    variant={selectedUser.profile?.accountStatus === 'banned' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateUserStatus(selectedUser.id, 'banned')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Banned
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Subscription Tier</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedUser.profile?.subscriptionTier === 'free' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateUserTier(selectedUser.id, 'free')}
                  >
                    Free
                  </Button>
                  <Button
                    variant={selectedUser.profile?.subscriptionTier === 'pro' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateUserTier(selectedUser.id, 'pro')}
                  >
                    Pro
                  </Button>
                  <Button
                    variant={selectedUser.profile?.subscriptionTier === 'premium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateUserTier(selectedUser.id, 'premium')}
                  >
                    Premium
                  </Button>
                  <Button
                    variant={selectedUser.profile?.subscriptionTier === 'vip' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateUserTier(selectedUser.id, 'vip')}
                  >
                    VIP
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </ScrollArea>
    </>
  )
}
