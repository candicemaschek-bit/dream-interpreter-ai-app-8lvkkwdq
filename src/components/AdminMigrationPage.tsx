import React, { useState } from 'react'
import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Loader2, Database, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function AdminMigrationPage() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'fetching' | 'migrating' | 'completed' | 'error'>('idle')
  const [stats, setStats] = useState({ total: 0, migrated: 0, failed: 0 })
  const [error, setError] = useState<string | null>(null)

  const startMigration = async () => {
    try {
      setIsMigrating(true)
      setStatus('fetching')
      setError(null)
      
      // 1. Fetch all dreams from Blink DB
      const blinkDreams = await blink.db.dreams.list()
      const total = blinkDreams.length
      
      if (total === 0) {
        setStatus('completed')
        setIsMigrating(false)
        toast.info('No dreams found in Blink DB to migrate.')
        return
      }

      setStats({ total, migrated: 0, failed: 0 })
      setStatus('migrating')

      // 2. Migrate each dream to Supabase
      let migratedCount = 0
      let failedCount = 0

      for (let i = 0; i < blinkDreams.length; i++) {
        const dream = blinkDreams[i]
        try {
          // Check if dream already exists in Supabase (optional, but good for idempotency)
          // For now, we'll just attempt to create it. supabaseService.createDream will handle insertion.
          
          await supabaseService.createDream({
            id: dream.id,
            user_id: dream.userId,
            title: dream.title,
            description: dream.description,
            input_type: dream.inputType,
            image_url: dream.imageUrl || null,
            symbols_data: dream.symbolsData || null,
            interpretation: dream.interpretation || null,
            video_url: dream.videoUrl || null,
            tags: Array.isArray(dream.tags) ? dream.tags.join(',') : (dream.tags || null),
            created_at: dream.createdAt,
            updated_at: dream.updatedAt
          })
          
          migratedCount++
        } catch (e: any) {
          console.error(`Failed to migrate dream ${dream.id}:`, e)
          failedCount++
        }

        const currentProgress = Math.round(((i + 1) / total) * 100)
        setProgress(currentProgress)
        setStats(prev => ({ ...prev, migrated: migratedCount, failed: failedCount }))
      }

      setStatus('completed')
      toast.success(`Migration completed: ${migratedCount} migrated, ${failedCount} failed.`)
    } catch (err: any) {
      console.error('Migration error:', err)
      setError(err.message || 'An unexpected error occurred during migration.')
      setStatus('error')
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Migration</h1>
          <p className="text-muted-foreground">
            Migrate dream records from Blink DB to Supabase.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Migration Status</CardTitle>
            <CardDescription>
              Transfer all dream data to ensure consistency across platforms.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Blink DB
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#3ecf8e] rounded-sm" />
                Supabase
              </span>
            </div>

            {status !== 'idle' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {status === 'fetching' && 'Fetching dreams from Blink DB...'}
                  {status === 'migrating' && `Migrating dream ${stats.migrated + stats.failed + 1} of ${stats.total}...`}
                  {status === 'completed' && 'Migration finished successfully!'}
                  {status === 'error' && 'Migration halted due to an error.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-[10px] uppercase text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.migrated}</div>
                <div className="text-[10px] uppercase text-muted-foreground">Migrated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-[10px] uppercase text-muted-foreground">Failed</div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={startMigration} 
              disabled={isMigrating || status === 'completed'}
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : status === 'completed' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </>
              ) : (
                'Start Migration'
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {status === 'completed' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Migration Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                All dream records have been processed. You can now verify the data in your Supabase dashboard.
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Migration Error</AlertTitle>
              <AlertDescription>
                {error || 'An error occurred while migrating data. Please check the console for details.'}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <p>• This process iterates through all dreams in the Blink database.</p>
              <p>• Records are inserted into Supabase using the <code>createDream</code> service method.</p>
              <p>• ID mapping is preserved (original Blink IDs are used in Supabase).</p>
              <p>• This should typically only be run once during the platform transition.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
