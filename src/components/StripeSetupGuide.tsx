'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function StripeSetupGuide() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`;

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> To enable payments, you need to set up your Stripe account and add your API keys to the environment variables.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>1. Get Stripe API Keys</span>
              <Badge variant="outline">Required</Badge>
            </CardTitle>
            <CardDescription>
              Get your API keys from the Stripe Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to <Button variant="link" className="p-0 h-auto" asChild>
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                  Stripe Dashboard - API Keys <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button></li>
              <li>Copy your <strong>Publishable key</strong> (starts with pk_)</li>
              <li>Copy your <strong>Secret key</strong> (starts with sk_)</li>
              <li>Add them to your <code>.env</code> file</li>
            </ol>

            <div className="bg-muted p-3 rounded-lg font-mono text-sm">
              <div className="flex items-center justify-between mb-1">
                <span>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...', 'Publishable key line')}
                >
                  {copiedText === 'Publishable key line' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>STRIPE_SECRET_KEY=sk_test_...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('STRIPE_SECRET_KEY=sk_test_...', 'Secret key line')}
                >
                  {copiedText === 'Secret key line' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>2. Set up Webhooks</span>
              <Badge variant="outline">Required</Badge>
            </CardTitle>
            <CardDescription>
              Configure webhooks to handle payment events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to <Button variant="link" className="p-0 h-auto" asChild>
                <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
                  Stripe Dashboard - Webhooks <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button></li>
              <li>Click "Add endpoint"</li>
              <li>Use this URL as your endpoint:</li>
            </ol>

            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <code className="text-sm">{webhookUrl}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                >
                  {copiedText === 'Webhook URL' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Select these events:</p>
              <ul className="text-xs space-y-1">
                <li>• checkout.session.completed</li>
                <li>• payment_intent.succeeded</li>
                <li>• customer.subscription.created</li>
                <li>• customer.subscription.updated</li>
                <li>• customer.subscription.deleted</li>
              </ul>
            </div>

            <div className="bg-muted p-3 rounded-lg font-mono text-sm">
              <div className="flex items-center justify-between">
                <span>STRIPE_WEBHOOK_SECRET=whsec_...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('STRIPE_WEBHOOK_SECRET=whsec_...', 'Webhook secret line')}
                >
                  {copiedText === 'Webhook secret line' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>3. Test Your Setup</CardTitle>
          <CardDescription>
            Use Stripe's test cards to verify everything works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Test Card Numbers:</h4>
              <ul className="text-sm space-y-1">
                <li><code>4242 4242 4242 4242</code> - Visa (Success)</li>
                <li><code>4000 0000 0000 0002</code> - Visa (Declined)</li>
                <li><code>5555 5555 5555 4444</code> - Mastercard (Success)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Test Details:</h4>
              <ul className="text-sm space-y-1">
                <li>Use any future expiry date</li>
                <li>Use any 3-digit CVC</li>
                <li>Use any ZIP code</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Ready to go live?</strong> Replace your test keys with live keys from your Stripe dashboard when you're ready to accept real payments.
        </AlertDescription>
      </Alert>
    </div>
  );
}