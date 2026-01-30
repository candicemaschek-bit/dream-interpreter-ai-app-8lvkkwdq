# Add-On Purchase System - Server-Side Enforcement & Analytics

## Overview

This document describes the server-side enforcement and analytics system for add-on purchases in the Dreamcatcher AI application. The system provides:

- **Server-side validation** of all add-on purchase requests
- **Comprehensive analytics tracking** of transactions
- **Database persistence** for subscriptions, payments, and add-on purchases
- **Type-safe integration** with the Blink SDK

## Architecture

### Database Tables

#### 1. `subscriptions` Table
Tracks user subscription information.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL
tier TEXT NOT NULL ('free', 'pro', 'premium', 'vip')
billing_cycle TEXT NOT NULL ('monthly', 'annual')
start_date TEXT NOT NULL
end_date TEXT
auto_renew INTEGER DEFAULT 1
is_active INTEGER DEFAULT 1
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

#### 2. `add_on_purchases` Table
Records each add-on purchase transaction.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL
add_on_id TEXT NOT NULL ('deep_dive_report', 'dreamworlds_pass', 'extra_dreamworld')
amount_usd REAL NOT NULL
quantity INTEGER DEFAULT 1
is_recurring INTEGER DEFAULT 0
status TEXT NOT NULL ('pending', 'processing', 'completed', 'failed', 'refunded')
transaction_id TEXT
payment_method TEXT
error_message TEXT
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

#### 3. `payment_transactions` Table
Central transaction log for all payment activities.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL
type TEXT NOT NULL ('subscription', 'add_on', 'refund')
related_id TEXT
amount_usd REAL NOT NULL
currency TEXT DEFAULT 'USD'
status TEXT NOT NULL ('pending', 'processing', 'completed', 'failed', 'refunded')
payment_method TEXT
provider TEXT
external_transaction_id TEXT
metadata TEXT (JSON)
error_message TEXT
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

#### 4. `add_on_analytics` Table
Aggregated analytics for each add-on per user.

```sql
id TEXT PRIMARY KEY
user_id TEXT NOT NULL
add_on_id TEXT NOT NULL
purchase_count INTEGER DEFAULT 1
total_revenue_usd REAL DEFAULT 0.0
last_purchase_date TEXT
repeat_customer INTEGER DEFAULT 0
customer_lifetime_value_usd REAL DEFAULT 0.0
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

## Server-Side Validation

### Edge Function: `validate-addon-purchase`

**Location:** `functions/validate-addon-purchase/index.ts`

**Purpose:** Validates and processes all add-on purchase requests server-side before payment.

**Request Format:**
```typescript
{
  addOnId: 'deep_dive_report' | 'dreamworlds_pass' | 'extra_dreamworld',
  quantity?: number (default 1, max 100)
}
```

**Validation Steps:**

1. **Authenticate User** - Verify user is logged in via Blink Auth
2. **Validate Add-On** - Confirm add-on ID exists and is valid
3. **Validate Quantity** - Ensure quantity is between 1-100
4. **Check Subscription** - Fetch user profile to verify tier
5. **Verify Eligibility** - All tiers can purchase any add-on
6. **Calculate Amount** - Compute total cost (price × quantity)

**Response Format (Success):**
```typescript
{
  valid: true,
  amount: 4.99,
  addOnDetails: {
    name: 'Dream Deep Dive Report',
    price: 4.99,
    isRecurring: false
  },
  purchaseId: 'addon_1732384397123_abc123',
  transactionId: 'txn_1732384397123_def456',
  message: 'Add-on purchase validated and recorded'
}
```

**Response Format (Error):**
```typescript
{
  valid: false,
  error: 'Invalid add-on ID: unknown_addon'
}
```

**Key Features:**
- All validation happens server-side (cannot be bypassed)
- Automatic purchase recording in database
- Analytics tracking on every validation
- Comprehensive error handling
- CORS-enabled for frontend access

## Client-Side Integration

### Utility Module: `addOnPurchaseManager.ts`

Provides type-safe client-side functions for add-on purchases.

**Key Functions:**

#### 1. `validateAndProcessAddOnPurchase(request)`
Main entry point for add-on purchases.

```typescript
const result = await validateAndProcessAddOnPurchase({
  addOnId: 'deep_dive_report',
  quantity: 1
})

if (result.valid) {
  console.log(`Purchase approved: ${result.addOnDetails?.name} - $${result.amount}`)
  // Redirect to payment processor (Stripe, etc.)
} else {
  console.error(result.error)
}
```

#### 2. `getAddOnAnalytics(addOnId, userId?)`
Fetch analytics for a specific add-on.

```typescript
const analytics = await getAddOnAnalytics('deep_dive_report')
console.log(`Total purchases: ${analytics?.purchaseCount}`)
console.log(`Total revenue: $${analytics?.totalRevenueUsd}`)
console.log(`Repeat customer: ${analytics?.repeatCustomer === 1}`)
```

#### 3. `getUserAddOnPurchases(userId?)`
Get all add-on purchases for a user.

```typescript
const purchases = await getUserAddOnPurchases()
purchases.forEach(p => {
  console.log(`${p.addOnId}: ${p.amountUsd} (${p.status})`)
})
```

#### 4. `getUserPaymentTransactions(userId?, type?)`
Get all payment transactions with optional filtering.

```typescript
const transactions = await getUserPaymentTransactions(undefined, 'add_on')
transactions.forEach(t => {
  console.log(`${t.type}: $${t.amountUsd} - ${t.status}`)
})
```

#### 5. `getUserAddOnAnalytics(userId?)`
Get aggregated analytics across all add-ons.

```typescript
const analytics = await getUserAddOnAnalytics()
console.log(`Total spent: $${analytics?.totalSpent}`)
console.log(`Repeat customer: ${analytics?.repeatCustomerStatus}`)
console.log(`Top add-on: ${analytics?.topAddOn?.addOnId}`)
```

#### 6. `trackAddOnEvent(eventType, addOnId, metadata?)`
Track custom add-on events for analytics.

```typescript
await trackAddOnEvent('view', 'deep_dive_report', {
  source: 'settings_page',
  timestamp: Date.now()
})
```

## Integration Points

### ProfileSettings Component

The add-on purchase handler has been integrated into the ProfileSettings component:

```typescript
const handlePurchaseAddOn = async (addOnId: AddOnType) => {
  try {
    const result = await validateAndProcessAddOnPurchase({
      addOnId,
      quantity: 1
    })

    if (result.valid) {
      toast.success(`${result.addOnDetails?.name} - $${result.amount?.toFixed(2)}`)
      // Next: Redirect to payment processor
    } else {
      toast.error(result.error || 'Failed to process add-on purchase')
    }
  } catch (error) {
    toast.error('Failed to process add-on purchase')
  }
}
```

### PricingPlans Component

The PricingPlans component accepts an `onPurchaseAddOn` callback:

```typescript
<PricingPlans
  currentTier={userProfile?.subscriptionTier || 'free'}
  onSelectPlan={handleSelectPlan}
  onPurchaseAddOn={handlePurchaseAddOn}
/>
```

## Add-On Types

### Available Add-Ons

| ID | Name | Price | Recurring | Eligible Tiers |
|----|------|-------|-----------|-----------------|
| `deep_dive_report` | Dream Deep Dive Report | $4.99 | No | All |
| `dreamworlds_pass` | Additional DreamWorld | $6.99 | No | All |
| `extra_dreamworld` | DreamWorlds Bundle | $14.99 | No | All |

## Analytics Flow

### Data Collection

1. **User initiates purchase** → Client calls `validateAndProcessAddOnPurchase()`
2. **Server validates** → Edge function validates request
3. **Record purchase** → `add_on_purchases` table entry created
4. **Log transaction** → `payment_transactions` table entry created
5. **Update analytics** → `add_on_analytics` table updated or created

### Analytics Tracking

For each add-on purchase:

- **Purchase count** incremented
- **Total revenue** updated
- **Last purchase date** recorded
- **Repeat customer flag** set if count > 1
- **Customer lifetime value** calculated

### Querying Analytics

```typescript
// Per add-on analytics
const analytics = await getAddOnAnalytics('deep_dive_report')

// All add-ons aggregated
const allAnalytics = await getUserAddOnAnalytics()

// All transactions
const transactions = await getUserPaymentTransactions()
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid add-on ID` | Unknown add-on | Use valid add-on ID |
| `Quantity must be between 1-100` | Invalid quantity | Use 1-100 |
| `User authentication failed` | Not logged in | Log in first |
| `User profile not found` | Profile missing | Complete onboarding |
| `Internal server error` | Server issue | Retry or contact support |

### Error Recovery

```typescript
try {
  const result = await validateAndProcessAddOnPurchase({ addOnId, quantity })
  if (!result.valid) {
    // Handle validation error
    console.error(result.error)
  }
} catch (error) {
  // Handle network or unexpected error
  console.error('Network error:', error)
}
```

## Future Enhancements

### Payment Processing Integration
When ready, integrate with payment processor:

1. Use `validate-addon-purchase` for pre-validation
2. Redirect to Stripe/PayPal checkout
3. Webhook updates `payment_transactions` status
4. Update `add_on_purchases` with transaction ID

### Refunds
Implement refund handling:

```sql
-- Create refund record
INSERT INTO payment_transactions
(id, user_id, type, related_id, amount_usd, status, ...)
VALUES ('...', userId, 'refund', purchaseId, -4.99, 'completed', ...)

-- Update original purchase
UPDATE add_on_purchases SET status = 'refunded' WHERE id = purchaseId
```

### Recurring Add-Ons
For monthly subscriptions:

```typescript
// Mark as recurring
await blink.db.addOnPurchases.create({
  isRecurring: '1',  // Enable recurring
  // ... other fields
})

// Handle monthly renewal via cron job
```

## Type Safety

All database types are defined in `src/types/database.ts`:

```typescript
export interface AddOnPurchaseRow {
  id: string
  userId: string
  addOnId: string
  amountUsd: string | number
  quantity: string | number
  isRecurring: '0' | '1'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  // ... other fields
}
```

## Testing

### Manual Testing

1. **Test Validation:**
   ```typescript
   const result = await validateAndProcessAddOnPurchase({
     addOnId: 'deep_dive_report'
   })
   console.log(result) // Should return valid: true
   ```

2. **Test Analytics:**
   ```typescript
   const analytics = await getAddOnAnalytics('deep_dive_report')
   console.log(analytics) // Should show purchase count incremented
   ```

3. **Test Multiple Purchases:**
   ```typescript
   // Purchase same add-on twice
   await validateAndProcessAddOnPurchase({ addOnId: 'deep_dive_report' })
   await validateAndProcessAddOnPurchase({ addOnId: 'deep_dive_report' })
   
   // Check analytics
   const analytics = await getAddOnAnalytics('deep_dive_report')
   console.log(analytics.repeatCustomer) // Should be 1
   ```

## Summary

The add-on purchase system provides:

✅ **Server-side enforcement** - All validations happen on the server  
✅ **Comprehensive analytics** - Track all transactions and customer behavior  
✅ **Type-safe integration** - Full TypeScript support  
✅ **Error handling** - Graceful failure modes  
✅ **Audit trail** - Complete transaction history  
✅ **Scalability** - Efficient database design  

**Status:** Ready for payment processor integration (Stripe, PayPal, etc.)
