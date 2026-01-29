import { useState, useEffect } from 'react';
import { useEmbeddedWallet } from '@/features/wallet/hooks/useEmbeddedWallet';
import { useTapToTrade } from '@/features/trading/contexts/TapToTradeContext';
import { useMarket } from '@/features/trading/contexts/MarketContext';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface TapToTradeOrder {
  id: string;
  gridSessionId: string;
  cellId: string;
  trader: string;
  symbol: string;
  isLong: boolean;
  collateral: string;
  leverage: number;
  triggerPrice: string;
  startTime: number;
  endTime: number;
  nonce: string;
  signature: string;
  collateralToken?: string;
  status: 'PENDING' | 'EXECUTING' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  createdAt: number;
  updatedAt: number;
  executedAt?: number;
  executedTxHash?: string;
  failureReason?: string;
}

type TapToTradeOrdersOptions = {
  includeAllTokens?: boolean;
};

export function useTapToTradeOrders(options?: TapToTradeOrdersOptions) {
  const { address } = useEmbeddedWallet();
  const { gridSession } = useTapToTrade();
  const { collateralToken } = useMarket();
  const [orders, setOrders] = useState<TapToTradeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());
  const includeAllTokens = options?.includeAllTokens ?? false;

  // Fetch orders
  const fetchOrders = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/tap-to-trade/orders?trader=${address}`);
      const result = await response.json();

      if (result.success) {
        const nextOrders = result.data?.map((order: TapToTradeOrder) => {
          if (!order?.collateralToken) {
            return { ...order, collateralToken };
          }
          return order;
        });
        if (includeAllTokens) {
          setOrders(nextOrders || []);
        } else {
          const filtered = nextOrders?.filter((order: TapToTradeOrder) => {
            if (!order?.collateralToken) return true;
            return order.collateralToken === collateralToken;
          });
          setOrders(filtered || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tap-to-trade orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll orders every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [address, collateralToken, includeAllTokens]);

  // Cancel single order
  const cancelOrder = async (orderId: string) => {
    if (!address) return;

    setCancellingOrders((prev) => new Set(prev).add(orderId));
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/tap-to-trade/cancel-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, trader: address }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setCancellingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Cancel all pending orders in the current grid session
  const cancelAllOrders = async () => {
    if (!address || !gridSession) return;

    const allOrderIds = orders.filter((o) => o.status === 'PENDING').map((o) => o.id);
    if (allOrderIds.length === 0) return;

    allOrderIds.forEach((id) => setCancellingOrders((prev) => new Set(prev).add(id)));

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/tap-to-trade/cancel-grid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridSessionId: gridSession.id,
          trader: address,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Failed to cancel all orders:', error);
    } finally {
      allOrderIds.forEach((id) => {
        setCancellingOrders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      });
    }
  };

  return {
    orders,
    isLoading,
    cancellingOrders,
    refetch: fetchOrders,
    cancelOrder,
    cancelAllOrders,
  };
}
