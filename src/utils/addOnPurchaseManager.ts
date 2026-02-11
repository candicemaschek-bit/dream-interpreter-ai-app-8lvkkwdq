import { blink } from '../blink/client';
import type { AddOnType } from '../types/subscription';

interface AddOnPurchaseRequest {
  addOnId: AddOnType;
  quantity?: number;
}

interface AddOnPurchaseResponse {
  valid: boolean;
  error?: string;
  amount?: number;
  purchaseId?: string;
  transactionId?: string;
  addOnDetails?: {
    name: string;
    price: number;
    isRecurring: boolean;
  };
}

/**
 * Validates and processes an add-on purchase via server-side validation
 * @param request - The add-on purchase request
 * @returns Validation and purchase response
 */
export async function validateAndProcessAddOnPurchase(
  request: AddOnPurchaseRequest
): Promise<AddOnPurchaseResponse> {
  try {
    const user = await blink.auth.me();
    if (!user?.id) {
      return {
        valid: false,
        error: 'User must be logged in to purchase add-ons'
      };
    }

    const token = await blink.auth.getValidToken();

    // Call server-side validation edge function
    const response = await fetch('https://8lvkkwdq--validate-addon-purchase.functions.blink.new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        addOnId: request.addOnId,
        quantity: request.quantity || 1,
        userId: user.id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: (errorData as any).error || 'Validation failed'
      };
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error in add-on purchase validation:', error);
    return {
      valid: false,
      error: 'Failed to process add-on purchase request'
    };
  }
}

/**
 * Gets analytics for a specific add-on
 * @param addOnId - The add-on ID to get analytics for
 * @param userId - The user ID (optional, defaults to current user)
 * @returns Analytics data
 */
export async function getAddOnAnalytics(addOnId: AddOnType, userId?: string) {
  try {
    let currentUserId = userId;

    if (!currentUserId) {
      const user = await blink.auth.me();
      if (!user?.id) {
        return null;
      }
      currentUserId = user.id;
    }

    const analytics = await (blink.db as any).addOnAnalytics.list({
      where: {
        AND: [
          { userId: currentUserId },
          { addOnId }
        ]
      },
      limit: 1
    });

    return Array.isArray(analytics) ? analytics[0] : analytics;

  } catch (error) {
    console.error('Error fetching add-on analytics:', error);
    return null;
  }
}

/**
 * Gets all add-on purchases for a user
 * @param userId - The user ID (optional, defaults to current user)
 * @returns List of add-on purchases
 */
export async function getUserAddOnPurchases(userId?: string) {
  try {
    let currentUserId = userId;

    if (!currentUserId) {
      const user = await blink.auth.me();
      if (!user?.id) {
        return [];
      }
      currentUserId = user.id;
    }

    const purchases = await (blink.db as any).addOnPurchases.list({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' }
    });

    return Array.isArray(purchases) ? purchases : [purchases];

  } catch (error) {
    console.error('Error fetching user add-on purchases:', error);
    return [];
  }
}

/**
 * Gets all payment transactions for a user
 * @param userId - The user ID (optional, defaults to current user)
 * @param type - Filter by transaction type (optional)
 * @returns List of payment transactions
 */
export async function getUserPaymentTransactions(userId?: string, type?: string) {
  try {
    let currentUserId = userId;

    if (!currentUserId) {
      const user = await blink.auth.me();
      if (!user?.id) {
        return [];
      }
      currentUserId = user.id;
    }

    const where: any = { userId: currentUserId };
    if (type) {
      where.type = type;
    }

    const transactions = await (blink.db as any).paymentTransactions.list({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return Array.isArray(transactions) ? transactions : [transactions];

  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return [];
  }
}

/**
 * Gets analytics across all add-ons for a user
 * @param userId - The user ID (optional, defaults to current user)
 * @returns Aggregated analytics
 */
export async function getUserAddOnAnalytics(userId?: string) {
  try {
    let currentUserId = userId;

    if (!currentUserId) {
      const user = await blink.auth.me();
      if (!user?.id) {
        return null;
      }
      currentUserId = user.id;
    }

    const analytics = await (blink.db as any).addOnAnalytics.list({
      where: { userId: currentUserId }
    });

    const analyticsArray = Array.isArray(analytics) ? analytics : [analytics];

    if (analyticsArray.length === 0) {
      return null;
    }

    // Aggregate analytics
    const aggregated = {
      totalAddOnPurchases: 0,
      totalSpent: 0,
      repeatCustomerStatus: false,
      topAddOn: null as any,
      addOnsBreakdown: [] as any[]
    };

    analyticsArray.forEach((a: any) => {
      aggregated.totalAddOnPurchases += Number(a.purchaseCount || 0);
      aggregated.totalSpent += Number(a.totalRevenueUsd || 0);
      aggregated.repeatCustomerStatus = Number(a.repeatCustomer) > 0;

      aggregated.addOnsBreakdown.push({
        addOnId: a.addOnId,
        purchaseCount: Number(a.purchaseCount),
        totalRevenue: Number(a.totalRevenueUsd),
        lastPurchaseDate: a.lastPurchaseDate
      });
    });

    // Find top add-on
    aggregated.topAddOn = aggregated.addOnsBreakdown.reduce((max, current) =>
      current.totalRevenue > (max?.totalRevenue || 0) ? current : max
    );

    return aggregated;

  } catch (error) {
    console.error('Error fetching aggregated add-on analytics:', error);
    return null;
  }
}

/**
 * Formats currency for display
 * @param amount - The amount in USD
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Tracks a custom add-on event for analytics
 * @param eventType - Type of event (e.g., 'view', 'click', 'purchase_attempt')
 * @param addOnId - The add-on ID
 * @param metadata - Additional event metadata
 */
export async function trackAddOnEvent(
  eventType: string,
  addOnId: AddOnType,
  metadata?: Record<string, any>
) {
  try {
    const user = await blink.auth.me();
    if (!user?.id) {
      return;
    }

    // Track using Blink analytics
    if (blink.analytics) {
      blink.analytics.log(`addon_${eventType}`, {
        addOnId,
        ...metadata
      });
    }

  } catch (error) {
    console.error('Error tracking add-on event:', error);
  }
}
