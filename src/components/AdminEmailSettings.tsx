/**
 * Admin Email Settings Component
 * Configure email service with custom domain support
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Mail, Send, Settings, CheckCircle, XCircle, AlertCircle, Plus, Edit2, Trash2, Save, RefreshCw } from 'lucide-react'
import { sendTestEmail, updateEmailConfig, getEmailConfig } from '../utils/emailService'
import { blink } from '../blink/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Textarea } from './ui/textarea'
import toast from 'react-hot-toast'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  bodyHtml: string
  bodyText?: string
  category?: string
  isActive: number
  createdAt: string
  updatedAt: string
}

export function AdminEmailSettings() {
  const [config, setConfig] = useState({
    fromEmail: 'dreamcatcher@dreamworlds.io',
    fromName: 'Dreamcatcher AI',
    replyToEmail: 'dreamcatcher@dreamworlds.io',
    useCustomDomain: false,
  })

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null)

  const [testEmail, setTestEmail] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    messageId?: string
    error?: string
  } | null>(null)

  useEffect(() => {
    loadTemplates()
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const savedConfig = await getEmailConfig()
      setConfig(savedConfig)
    } catch (error) {
      console.error('Failed to load email config:', error)
    }
  }

  const loadTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const data = await blink.db.emailTemplates.list({
        orderBy: { createdAt: 'desc' }
      })
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      const result = await updateEmailConfig(config)
      if (result.success) {
        toast.success('Email configuration saved successfully!')
      } else {
        toast.error('Failed to save configuration: ' + result.error)
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    }
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.bodyHtml) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const user = await blink.auth.me()
      if (!user) throw new Error('User not authenticated')

      if (editingTemplate.id) {
        await blink.db.emailTemplates.update(editingTemplate.id, {
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          bodyHtml: editingTemplate.bodyHtml,
          bodyText: editingTemplate.bodyText || editingTemplate.bodyHtml.replace(/<[^>]*>/g, ''),
          category: editingTemplate.category || 'general',
          updatedAt: new Date().toISOString()
        })
        toast.success('Template updated successfully!')
      } else {
        const id = editingTemplate.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
        await blink.db.emailTemplates.create({
          id,
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          bodyHtml: editingTemplate.bodyHtml,
          bodyText: editingTemplate.bodyText || editingTemplate.bodyHtml.replace(/<[^>]*>/g, ''),
          category: editingTemplate.category || 'general',
          isActive: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user.id
        })
        toast.success('Template created successfully!')
      }
      setIsTemplateDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      await blink.db.emailTemplates.delete(id)
      toast.success('Template deleted successfully')
      loadTemplates()
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address')
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      // Pass the current config state to test specific settings before saving
      const result = await sendTestEmail(testEmail, config)
      setTestResult(result)

      if (result.success) {
        toast.success('Test email sent successfully!')
      } else {
        toast.error(`Failed to send test email: ${result.error}`)
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Unknown error',
      })
      toast.error('Failed to send test email')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email System</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your communication infrastructure and custom templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Service Active
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="configuration" className="gap-2 py-3">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 py-3">
            <Mail className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2 py-3">
            <Send className="w-4 h-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2 border-primary/10">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-xl">Sender Identity</CardTitle>
                <CardDescription>
                  Configure how your brand appears in users' inboxes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {/* Custom Domain Toggle */}
                <div className="flex items-center justify-between p-6 bg-muted/30 rounded-xl border-2 border-dashed">
                  <div className="space-y-1">
                    <Label className="text-base font-bold">White-label Domain Sending</Label>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Remove "via blink-email.com" branding and send directly from your domain
                    </p>
                  </div>
                  <Switch
                    checked={config.useCustomDomain}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, useCustomDomain: checked })
                    }
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail" className="text-sm font-semibold">Sender Address</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      className="h-11"
                      placeholder="noreply@yourdomain.com"
                      value={config.fromEmail}
                      onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                      disabled={!config.useCustomDomain}
                    />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {config.useCustomDomain ? 'Authenticated Domain' : 'Managed Sandbox Email'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName" className="text-sm font-semibold">Sender Display Name</Label>
                    <Input
                      id="fromName"
                      type="text"
                      className="h-11"
                      placeholder="e.g. Dreamcatcher Support"
                      value={config.fromName}
                      onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="replyToEmail" className="text-sm font-semibold">Reply-To Route (Optional)</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    className="h-11"
                    placeholder="support@dreamworlds.io"
                    value={config.replyToEmail}
                    onChange={(e) => setConfig({ ...config, replyToEmail: e.target.value })}
                  />
                </div>

                {config.useCustomDomain && (
                  <Alert className="bg-amber-50 border-amber-200 text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs leading-relaxed">
                      <strong>Pending Verification:</strong> Your domain requires SPF and DKIM records to be updated in your DNS provider settings.
                      Without these, emails may be flagged as spam.
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleSaveConfig} className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20">
                  <Save className="w-4 h-4 mr-2" />
                  Save Infrastructure Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Service Capability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your current tier supports up to <strong>10,000 monthly emails</strong> with priority delivery and full SDK integration.
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supported Logic:</h4>
                  <ul className="grid grid-cols-1 gap-2">
                    {['HTML Layouts', 'Attachment API', 'Multiple Recipients', 'Open Tracking'].map(item => (
                      <li key={item} className="text-xs flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Email Content Templates</h3>
            <Button onClick={() => {
              setEditingTemplate({ name: '', subject: '', bodyHtml: '', category: 'general' })
              setIsTemplateDialogOpen(true)
            }} className="gap-2">
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {isLoadingTemplates ? (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl">
                <Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground">No custom templates found.</p>
              </div>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="group hover:border-primary/50 transition-all duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter">
                        {template.category}
                      </Badge>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingTemplate(template)
                            setIsTemplateDialogOpen(true)
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-base font-bold mt-2">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                      <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {template.isActive ? 'Active' : 'Disabled'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Template Dialog */}
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate?.id ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                <DialogDescription>
                  Design your email content using standard HTML and variables
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tpl-name">Internal Name</Label>
                  <Input 
                    id="tpl-name" 
                    value={editingTemplate?.name || ''} 
                    onChange={e => setEditingTemplate(prev => ({ ...prev!, name: e.target.value }))}
                    placeholder="e.g. Welcome Message"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tpl-subject">Email Subject</Label>
                  <Input 
                    id="tpl-subject" 
                    value={editingTemplate?.subject || ''} 
                    onChange={e => setEditingTemplate(prev => ({ ...prev!, subject: e.target.value }))}
                    placeholder="Subject line seen by user"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tpl-category">Category</Label>
                  <Input 
                    id="tpl-category" 
                    value={editingTemplate?.category || ''} 
                    onChange={e => setEditingTemplate(prev => ({ ...prev!, category: e.target.value }))}
                    placeholder="e.g. auth, marketing, notifications"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tpl-html">HTML Content</Label>
                  <Textarea 
                    id="tpl-html" 
                    className="min-h-[200px] font-mono text-xs"
                    value={editingTemplate?.bodyHtml || ''} 
                    onChange={e => setEditingTemplate(prev => ({ ...prev!, bodyHtml: e.target.value }))}
                    placeholder="<h1>Hello {{name}}!</h1>..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tpl-text">Plain Text Version (Optional)</Label>
                  <Textarea 
                    id="tpl-text" 
                    className="min-h-[100px] text-xs"
                    value={editingTemplate?.bodyText || ''} 
                    onChange={e => setEditingTemplate(prev => ({ ...prev!, bodyText: e.target.value }))}
                    placeholder="Fallback text for non-HTML clients"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTemplate}>Save Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="test" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="max-w-2xl mx-auto border-dashed border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Quality Assurance</CardTitle>
              <CardDescription>
                Send a sample email to verify deliverability and layout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="testEmail" className="font-bold">Target Inbox</Label>
                <Input
                  id="testEmail"
                  type="email"
                  className="h-12 text-center text-lg"
                  placeholder="name@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              <Button
                onClick={handleTestEmail}
                disabled={isTesting || !testEmail}
                className="w-full h-12 text-base font-bold bg-primary"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Dispatching Test Email...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send System Test
                  </>
                )}
              </Button>

              {testResult && (
                <div className={`p-4 rounded-xl border-2 ${testResult.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-3">
                    {testResult.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <h4 className={`font-bold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {testResult.success ? 'Delivery Confirmed' : 'Dispatch Failed'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {testResult.success 
                          ? `Message ID: ${testResult.messageId}` 
                          : testResult.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}