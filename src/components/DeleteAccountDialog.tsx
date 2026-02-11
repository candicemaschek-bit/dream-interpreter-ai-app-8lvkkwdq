/**
 * Delete Account Dialog Component
 * Allows users to permanently delete their account and all associated data
 */

import { useState, useEffect } from 'react'
import { Trash2, AlertTriangle, Loader2, Shield, TreeDeciduous, BookOpen, XCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
} from './ui/alert-dialog'
import { Card, CardContent } from './ui/card'
import { toast } from 'sonner'
import { blink } from '../blink/client'
import { deleteAllUserData, getUserDataSummary, clearLocalUserData } from '../utils/accountDeletion'

interface DeleteAccountDialogProps {
  userId: string
  userEmail: string
  onAccountDeleted: () => void
}

export function DeleteAccountDialog({
  userId,
  userEmail,
  onAccountDeleted
}: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'warning' | 'confirm' | 'deleting' | 'complete'>('warning')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [understandChecked, setUnderstandChecked] = useState(false)
  const [dataSummary, setDataSummary] = useState<{
    dreams: number
    reflectionSessions: number
    symbols: number
    totalRecords: number
  } | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState('')

  // Load data summary when dialog opens
  useEffect(() => {
    if (open && !dataSummary) {
      loadDataSummary()
    }
  }, [open])

  const loadDataSummary = async () => {
    setLoadingSummary(true)
    try {
      const summary = await getUserDataSummary(userId)
      setDataSummary(summary)
    } catch (error) {
      console.error('Error loading data summary:', error)
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setStep('warning')
    setConfirmEmail('')
    setConfirmText('')
    setUnderstandChecked(false)
  }

  const handleProceedToConfirm = () => {
    setStep('confirm')
  }

  const handleDeleteAccount = async () => {
    // Validate confirmation inputs
    if (confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
      toast.error('Email does not match')
      return
    }

    if (confirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type DELETE MY ACCOUNT exactly')
      return
    }

    if (!understandChecked) {
      toast.error('Please confirm you understand this action is irreversible')
      return
    }

    setStep('deleting')

    try {
      setDeleteProgress('Deleting dream data...')
      
      // Delete all user data from database
      const result = await deleteAllUserData(userId)
      
      setDeleteProgress('Clearing local data...')
      
      // Clear local storage and IndexedDB
      clearLocalUserData()
      
      setDeleteProgress('Signing out...')
      
      // Sign out the user
      try {
        await blink.auth.signOut()
      } catch (e) {
        // Continue even if logout fails
        console.warn('Logout error:', e)
      }

      setStep('complete')

      if (result.success) {
        toast.success('Account deleted successfully', {
          description: `Removed data from ${result.deletedTables.length} tables.`
        })
      } else {
        toast.warning('Account partially deleted', {
          description: 'Some data could not be removed. Please contact support if needed.'
        })
      }

      // Notify parent component
      setTimeout(() => {
        onAccountDeleted()
      }, 2000)

    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account', {
        description: 'Please try again or contact support.'
      })
      setStep('confirm')
    }
  }

  const canProceed = step === 'warning'
  const canDelete = 
    confirmEmail.toLowerCase() === userEmail.toLowerCase() &&
    confirmText === 'DELETE MY ACCOUNT' &&
    understandChecked

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="max-w-lg">
        {step === 'warning' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete Your Account
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action is permanent and cannot be undone. All your data will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {/* Data Summary */}
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-3 text-destructive">Data that will be deleted:</h4>
                  
                  {loadingSummary ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading your data summary...
                    </div>
                  ) : dataSummary ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <img src="/logo_new.png" alt="Dreams" className="w-4 h-4 opacity-50 grayscale" />
                          <span>Dreams recorded</span>
                        </div>
                        <span className="font-medium">{dataSummary.dreams}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span>Reflection sessions</span>
                        </div>
                        <span className="font-medium">{dataSummary.reflectionSessions}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TreeDeciduous className="w-4 h-4 text-green-500" />
                          <span>Dream symbols</span>
                        </div>
                        <span className="font-medium">{dataSummary.symbols}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-destructive/20">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>Total records</span>
                          <span className="text-destructive">{dataSummary.totalRecords}+</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Could not load data summary</p>
                  )}
                </CardContent>
              </Card>

              {/* Additional info */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Your profile and preferences</p>
                <p>• All dream interpretations and videos</p>
                <p>• Reflection journal entries</p>
                <p>• Symbol Orchard data</p>
                <p>• Subscription and payment history</p>
                <p>• All analytics and usage data</p>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
              <Button 
                variant="destructive" 
                onClick={handleProceedToConfirm}
              >
                I Want to Delete My Account
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Shield className="w-5 h-5" />
                Final Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription>
                Please confirm your identity to proceed with account deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {/* Email confirmation */}
              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Enter your email address</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  placeholder={userEmail}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className={confirmEmail && confirmEmail.toLowerCase() !== userEmail.toLowerCase() 
                    ? 'border-destructive' 
                    : confirmEmail.toLowerCase() === userEmail.toLowerCase() 
                      ? 'border-green-500' 
                      : ''}
                />
              </div>

              {/* Type confirmation */}
              <div className="space-y-2">
                <Label htmlFor="confirmText">
                  Type <span className="font-mono font-bold text-destructive">DELETE MY ACCOUNT</span> to confirm
                </Label>
                <Input
                  id="confirmText"
                  placeholder="DELETE MY ACCOUNT"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={confirmText && confirmText !== 'DELETE MY ACCOUNT' 
                    ? 'border-destructive' 
                    : confirmText === 'DELETE MY ACCOUNT' 
                      ? 'border-green-500' 
                      : ''}
                />
              </div>

              {/* Final checkbox */}
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <Checkbox
                  id="understand"
                  checked={understandChecked}
                  onCheckedChange={(checked) => setUnderstandChecked(checked === true)}
                />
                <Label htmlFor="understand" className="text-sm cursor-pointer">
                  I understand that this action is <strong>permanent and irreversible</strong>. 
                  All my data will be deleted and cannot be recovered.
                </Label>
              </div>
            </div>

            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setStep('warning')}>
                Go Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={!canDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Permanently Delete Account
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === 'deleting' && (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Deleting Your Account</h3>
            <p className="text-muted-foreground">{deleteProgress}</p>
            <p className="text-xs text-muted-foreground mt-4">
              Please don't close this window...
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-12 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Account Deleted</h3>
            <p className="text-muted-foreground mb-4">
              Your account and all associated data have been permanently deleted.
            </p>
            <p className="text-sm text-muted-foreground">
              You will be redirected shortly...
            </p>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
