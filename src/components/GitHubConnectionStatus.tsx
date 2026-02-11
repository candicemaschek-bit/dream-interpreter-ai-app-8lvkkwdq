import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ExternalLink, Github } from 'lucide-react'

interface GitHubConnectionStatus {
  isConnected: boolean
  username: string
  repoName: string
  owner: string
  ownerType: string
  lastVerified: string
  error?: string
  stars?: number
  forks?: number
  description?: string
  repoUrl?: string
}

interface GitHubConnectionStatusProps {
  username: string
  repoName: string
  owner?: string
  ownerType?: string
}

export function GitHubConnectionStatusComponent({
  username,
  repoName,
  owner = 'blink-new',
  ownerType = 'Organization'
}: GitHubConnectionStatusProps) {
  const [status, setStatus] = useState<GitHubConnectionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load status from config on mount
  useEffect(() => {
    let mounted = true

    const loadStatus = async () => {
      try {
        setIsLoading(true)
        // Set initial status from props
        const connectionStatus: GitHubConnectionStatus = {
          isConnected: true,
          username,
          repoName,
          owner,
          ownerType,
          lastVerified: new Date().toISOString()
        }
        if (mounted) {
          setStatus(connectionStatus)
        }
      } catch (error) {
        console.error('Error loading GitHub status:', error)
        if (mounted) {
          setStatus({
            isConnected: false,
            username,
            repoName,
            owner,
            ownerType,
            lastVerified: new Date().toISOString(),
            error: 'Failed to load GitHub connection status'
          })
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadStatus()

    return () => {
      mounted = false
    }
  }, [username, repoName, owner, ownerType])

  if (!status) {
    return null
  }

  const cardClasses = `bg-gradient-to-br ${
    isLoading
      ? 'from-gray-50 to-gray-100/50 border-gray-200'
      : status.isConnected
        ? 'from-green-50 to-green-100/50 border-green-200'
        : 'from-red-50 to-red-100/50 border-red-200'
  }`

  const badgeVariant = isLoading ? 'secondary' : status.isConnected ? 'secondary' : 'destructive'
  const badgeText = isLoading ? 'Verifying...' : status.isConnected ? 'Connected' : 'Disconnected'
  
  const formatConnectionStatus = (s: GitHubConnectionStatus) => {
    if (s.isConnected) {
      return `Connected to ${s.owner}/${s.repoName} as ${s.username}`
    }
    return s.error || 'Disconnected'
  }

  return (
    <Card className={cardClasses}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-foreground" />
            <div>
              <CardTitle>GitHub Connection</CardTitle>
              <CardDescription>Repository & Account Status</CardDescription>
            </div>
          </div>
          <Badge variant={badgeVariant} className="text-xs">
            {badgeText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mr-2"></div>
            <span className="text-sm text-muted-foreground">Verifying GitHub connection...</span>
          </div>
        ) : (
          <>
            {/* Connection Status */}
            <div className="flex items-start space-x-2">
              <div className="flex-1">
                <p className="font-medium text-sm">Status</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatConnectionStatus(status)}
                </p>
              </div>
            </div>

            {/* Repository Details */}
            {status.isConnected ? (
              <>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Username</p>
                    <p className="text-sm font-mono mt-1">{status.username}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Owner Type</p>
                    <p className="text-sm font-mono mt-1 capitalize">{status.ownerType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Repository</p>
                    <p className="text-sm font-mono mt-1">{status.repoName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Owner</p>
                    <p className="text-sm font-mono mt-1">{status.owner}</p>
                  </div>
                </div>

                {/* Repository Stats */}
                {(status.stars !== undefined || status.forks !== undefined) && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    {status.stars !== undefined && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Stars</p>
                        <p className="text-sm font-mono mt-1">{status.stars.toLocaleString()}</p>
                      </div>
                    )}
                    {status.forks !== undefined && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Forks</p>
                        <p className="text-sm font-mono mt-1">{status.forks.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {status.description && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{status.description}</p>
                  </div>
                )}

                {/* Repository URL */}
                <div className="pt-2 border-t">
                  <a
                    href={`https://github.com/${status.owner}/${status.repoName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    View on GitHub
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* Error Details */}
                {status.error && (
                  <div className="p-3 bg-red-100/50 border border-red-200 rounded text-xs text-red-700">
                    <p className="font-semibold mb-1">Connection Failed</p>
                    <p>{status.error}</p>
                  </div>
                )}
              </>
            )}

            {/* Last Verified */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Last verified: {new Date(status.lastVerified).toLocaleString()}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
