import React, { useState } from 'react'
import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import { getAllTableNames } from '../utils/databaseSchema'
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
  const [currentTable, setCurrentTable] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startMigration = async () => {
    try {
      setIsMigrating(true)
      setStatus('fetching')
      setError(null)
      
      const tables = getAllTableNames().filter(t => ![
        'magic_link_tokens',
        'email_verification_tokens',
        'password_reset_tokens',
        'users'
      ].includes(t))

      let totalRecords = 0
      let migratedCount = 0
      let failedCount = 0

      // 1. Calculate total records across all tables
      setStatus('fetching')
      const tableData: Record<string, any[]> = {}
      
      for (const tableName of tables) {
        setCurrentTable(tableName)
        try {
          const tableNameCamelCase = tableName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
          const blinkTable = (blink.db as any)[tableNameCamelCase]
          
          if (blinkTable && typeof blinkTable.list === 'function') {
            const records = await blinkTable.list({ limit: 1000 }) // Adjust limit as needed
            tableData[tableName] = records
            totalRecords += records.length
          }
        } catch (e) {
          console.warn(`Could not fetch data for table ${tableName}:`, e)
        }
      }

      if (totalRecords === 0) {
        setStatus('completed')
        setIsMigrating(false)
        toast.info('No data found in Blink DB to migrate.')
        return
      }

      setStats({ total: totalRecords, migrated: 0, failed: 0 })
      setStatus('migrating')

      // 2. Migrate each table's data to Supabase
      let processedRecords = 0

      for (const tableName of tables) {
        const records = tableData[tableName]
        if (!records || records.length === 0) continue

        setCurrentTable(tableName)
        
        try {
          // Map Blink SDK camelCase to Supabase snake_case if necessary
          // Actually, our Supabase tables are snake_case, and blink.db returns camelCase.
          // We need a helper to convert camelCase keys to snake_case for Supabase
          const snakeCaseRecords = records.map(record => {
            const snakeRecord: any = {}
            Object.keys(record).forEach(key => {
              const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
              snakeRecord[snakeKey] = record[key]
            })
            return snakeRecord
          })

          const result = await supabaseService.migrateTableData(tableName, snakeCaseRecords)
          migratedCount += result.count
          failedCount += (records.length - result.count)
        } catch (e: any) {
          console.error(`Failed to migrate table ${tableName}:`, e)
          failedCount += records.length
        }

        processedRecords += records.length
        setProgress(Math.round((processedRecords / totalRecords) * 100))
        setStats({ total: totalRecords, migrated: migratedCount, failed: failedCount })
      }

      setStatus('completed')
      toast.success(`Migration completed: ${migratedCount} records migrated, ${failedCount} failed.`)
    } catch (err: any) {
      console.error('Migration error:', err)
      setError(err.message || 'An unexpected error occurred during migration.')
      setStatus('error')
    } finally {
      setIsMigrating(false)
      setCurrentTable(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Migration</h1>
          <p className="text-muted-foreground">
            Migrate data records from Blink DB to Supabase.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Migration Status</CardTitle>
            <CardDescription>
              Transfer all data to ensure consistency across platforms.
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
                  {status === 'fetching' && `Fetching data from ${currentTable || 'Blink DB'}...`}
                  {status === 'migrating' && `Migrating table: ${currentTable}...`}
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
                All data records have been processed. You can now verify the data in your Supabase dashboard.
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
              <p>• This process iterates through all tables in the Blink database.</p>
              <p>• Records are inserted into Supabase using the <code>migrateTableData</code> service method.</p>
              <p>• ID mapping is preserved (original Blink IDs are used in Supabase).</p>
              <p>• This should typically only be run once during the platform transition.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
