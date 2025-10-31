# 💳 Stripe Payment Integration Setup

This document explains how to set up Stripe payments for the Lingala Learning Platform.

## 🚀 Quick Start

### 1. Get Your Stripe API Keys

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and sign up
2. **Access Dashboard**: Visit [dashboard.stripe.com](https://dashboard.stripe.com)
3. **Get API Keys**: Navigate to **Developers > API Keys**
   - Copy your **Publishable key** (starts with `pk_test_` for test mode)
   - Copy your **Secret key** (starts with `sk_test_` for test mode)

### 2. Configure Environment Variables

Add these keys to your `.env` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Webhooks

1. **Go to Webhooks**: Visit [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. **Add Endpoint**: Click "Add endpoint"
3. **Endpoint URL**: `http://localhost:3000/api/stripe/webhook` (for local development)
4. **Select Events**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Copy Webhook Secret**: After creating, copy the webhook signing secret

## 🏗️ Architecture Overview

### Payment Flow
1. **User clicks "Enroll Now"** → `PaymentButton` component
2. **Create Checkout Session** → `/api/stripe/checkout`
3. **Redirect to Stripe** → Stripe Checkout page
4. **Payment Processing** → Stripe handles payment
5. **Webhook Notification** → `/api/stripe/webhook`
6. **Success Page** → `/courses/[id]/success`

### Database Schema
The integration uses these tables:
- `user_enrollments` - Track course enrollments
- `payments` - Store payment records
- `subscriptions` - Future subscription management

## 📁 File Structure

```
src/
├── app/api/stripe/
│   ├── checkout/route.ts      # Create checkout sessions
│   ├── webhook/route.ts       # Handle Stripe webhooks
│   └── verify-payment/route.ts # Verify payment completion
├── components/
│   ├── PaymentButton.tsx      # Payment/enrollment button
│   └── StripeSetupGuide.tsx   # Setup instructions
└── lib/
    ├── stripe.ts              # Server-side Stripe config
    └── stripe-client.ts       # Client-side Stripe config
```

## 🧪 Testing

### Test Cards
Use these test card numbers:

| Card Number | Brand | Outcome |
|-------------|-------|---------|
| `4242 4242 4242 4242` | Visa | Success |
| `4000 0000 0000 0002` | Visa | Declined |
| `5555 5555 5555 4444` | Mastercard | Success |
| `4000 0000 0000 0069` | Visa | Expired Card |

### Test Details
- **Expiry**: Any future date (e.g., `12/30`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any ZIP code (e.g., `12345`)

### Test Flow
1. Navigate to a course page
2. Click "Enroll Now - $XX.XX"
3. Complete checkout with test card
4. Verify enrollment on success page
5. Check admin payments dashboard

## 🔒 Security Features

- **Webhook Signature Verification**: All webhooks are verified using Stripe's signature
- **CSRF Protection**: Checkout sessions include user verification
- **Idempotency**: Duplicate enrollments are prevented
- **Environment Separation**: Test and live keys are clearly separated

## 📊 Admin Features

### Payments Dashboard
Access at `/admin/payments` to view:
- Total revenue
- Payment statistics
- Recent transactions
- Payment status tracking

### User Management
- View user enrollments
- Manually enroll users (if needed)
- Track payment history per user

## 🚀 Going Live

### 1. Activate Live Mode
1. **Complete Stripe Setup**: Verify your business details
2. **Get Live Keys**: Switch to live mode in Stripe dashboard
3. **Update Environment**: Replace test keys with live keys

### 2. Update Webhook URLs
```bash
# Production webhook URL
https://yourdomain.com/api/stripe/webhook
```

### 3. Environment Variables for Production
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🔧 Troubleshooting

### Common Issues

**Webhook Failures**
- Check webhook URL is accessible
- Verify webhook secret is correct
- Check server logs for errors

**Payment Button Not Working**
- Verify publishable key is set
- Check browser console for errors
- Ensure user is authenticated

**Enrollment Not Created**
- Check webhook is receiving events
- Verify database connection
- Review webhook handler logs

### Debug Mode
Enable debug logging by adding:
```bash
DEBUG=stripe:*
```

## 🔄 Future Enhancements

### Subscription Support
The current setup supports one-time payments. For subscriptions:
1. Create Stripe Products and Prices
2. Implement subscription checkout
3. Add subscription management UI
4. Handle subscription lifecycle events

### Multiple Payment Methods
- Apple Pay / Google Pay integration
- Bank transfers (ACH)
- International payment methods

### Advanced Features
- Promo codes and discounts
- Split payments
- Marketplace functionality
- Revenue sharing

## 📞 Support

For issues with:
- **Stripe Integration**: Check [Stripe Documentation](https://stripe.com/docs)
- **Payment Issues**: Contact [Stripe Support](https://support.stripe.com)
- **Platform Issues**: Check application logs and database

---

**💡 Pro Tip**: Start with test mode and thoroughly test the payment flow before going live!