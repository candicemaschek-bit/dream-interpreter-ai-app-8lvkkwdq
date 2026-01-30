import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, Shield, Trash2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Admin Setup Helper Component
 * 
 * This component provides a user-friendly interface for creating the first admin user.
 * It should be REMOVED after the first admin is created for security.
 * 
 * Usage:
 * 1. Import this component in App.tsx (temporarily)
 * 2. Render it for authenticated users: {user && !isAdmin && <AdminSetupHelper user={user} />}
 * 3. Follow the on-screen instructions
 * 4. DELETE this component and its import after successful admin creation
 */

interface AdminSetupHelperProps {
  user?: {
    email: string;
    id: string;
  };
}

export default function AdminSetupHelper({ user }: AdminSetupHelperProps) {
  const [secret, setSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string[];
  } | null>(null);

  // Generate a random secret
  const generateSecret = (): void => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let secret = '';
    for (let i = 0; i < 40; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecret(secret);
    toast.success('Secret generated! Copy it now.');
  };

  // Copy secret to clipboard
  const copySecret = (): void => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  // Get the function URL (you'll need to replace this with your actual project URL)
  const getFunctionUrl = (): string => {
    // Try to detect from current URL
    const hostname = window.location.hostname;
    if (hostname.includes('blink.new')) {
      const projectId = hostname.split('.')[0];
      return `https://${projectId}.functions.blink.new/create-admin`;
    }
    return 'https://YOUR-PROJECT-ID.functions.blink.new/create-admin';
  };

  // Call the admin seeding function
  const promoteToAdmin = async (): Promise<void> => {
    if (!secret || secret.length < 32) {
      setResult({
        type: 'error',
        message: 'Secret must be at least 32 characters long'
      });
      return;
    }

    if (!user?.email) {
      setResult({
        type: 'error',
        message: 'You must be signed in to promote yourself to admin'
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const functionUrl = getFunctionUrl();
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          secret: secret
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          type: 'error',
          message: data.message || 'Failed to promote user to admin',
          details: data.details ? [data.details] : undefined
        });
        toast.error(data.message || 'Admin promotion failed');
        return;
      }

      if (data.success) {
        setResult({
          type: 'success',
          message: data.message,
          details: data.nextSteps || [
            'Sign out and sign back in to refresh your session',
            'Navigate to /admin to access the admin dashboard',
            'DELETE this component for security'
          ]
        });
        toast.success('Admin promotion successful!');
      }

    } catch (error) {
      console.error('Admin promotion error:', error);
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Network error occurred',
        details: ['Check your internet connection', 'Verify the edge function is deployed']
      });
      toast.error('Failed to connect to admin function');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-8 border-2 border-warning">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-warning" />
          <CardTitle>Admin Setup Helper</CardTitle>
        </div>
        <CardDescription>
          Create your first admin user securely. This component should be removed after use.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Banner */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> This is a one-time setup helper. Delete this component and the create-admin function after successful admin creation.
          </AlertDescription>
        </Alert>

        {/* Step 1: Generate Secret */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </div>
            <h3 className="font-semibold">Generate Admin Setup Secret</h3>
          </div>
          
          <div className="space-y-2 pl-8">
            <Label htmlFor="secret">Secret Key (32+ characters)</Label>
            <div className="flex gap-2">
              <Input
                id="secret"
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Click 'Generate' to create a secure secret"
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={generateSecret}
                title="Generate random secret"
              >
                Generate
              </Button>
              <Button
                variant="ghost"
                onClick={copySecret}
                disabled={!secret}
                title="Copy secret to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Copy this secret and add it to your project secrets as <code className="bg-muted px-1 py-0.5 rounded">ADMIN_SETUP_SECRET</code>
            </p>
          </div>
        </div>

        {/* Step 2: Add to Secrets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </div>
            <h3 className="font-semibold">Add Secret to Project</h3>
          </div>
          
          <div className="space-y-2 pl-8">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <strong>Blink Dashboard → Secrets</strong></li>
                  <li>Click <strong>+ Add Secret</strong></li>
                  <li>Key: <code className="bg-muted px-1 py-0.5 rounded">ADMIN_SETUP_SECRET</code></li>
                  <li>Value: Paste the secret you generated above</li>
                  <li>Click <strong>Save</strong></li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Step 3: Deploy Function */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </div>
            <h3 className="font-semibold">Deploy Edge Function</h3>
          </div>
          
          <div className="space-y-2 pl-8">
            <p className="text-sm text-muted-foreground">
              The <code className="bg-muted px-1 py-0.5 rounded">create-admin</code> function is in your project.
              Deploy it through Blink's dashboard or ask Blink AI to deploy edge functions.
            </p>
            <div className="bg-muted p-3 rounded text-xs font-mono break-all">
              Function URL: {getFunctionUrl()}
            </div>
          </div>
        </div>

        {/* Step 4: Promote to Admin */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              4
            </div>
            <h3 className="font-semibold">Promote Your Account to Admin</h3>
          </div>
          
          <div className="space-y-2 pl-8">
            <p className="text-sm text-muted-foreground">
              Signed in as: <strong>{user?.email || 'Not signed in'}</strong>
            </p>
            <Button
              onClick={promoteToAdmin}
              disabled={isLoading || !secret || !user}
              className="w-full"
            >
              {isLoading ? 'Promoting...' : 'Promote to Admin'}
            </Button>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <Alert variant={result.type === 'success' ? 'default' : 'destructive'}>
            {result.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>
              <p className="font-semibold mb-2">{result.message}</p>
              {result.details && (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Security Reminder */}
        <Alert>
          <Trash2 className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <strong>After successful admin creation:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Delete this component (<code className="bg-muted px-1 py-0.5 rounded">AdminSetupHelper.tsx</code>)</li>
              <li>Delete the edge function (<code className="bg-muted px-1 py-0.5 rounded">create-admin</code>)</li>
              <li>Remove <code className="bg-muted px-1 py-0.5 rounded">ADMIN_SETUP_SECRET</code> from project secrets</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
