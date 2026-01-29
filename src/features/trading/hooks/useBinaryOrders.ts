import { useState, useEffect } from 'react';
import { useEmbeddedWallet } from '@/features/wallet/hooks/useEmbeddedWallet';
import { useMarket } from '@/features/trading/contexts/MarketContext';
import { COLLATERAL_TOKENS, CollateralToken } from '@/config/contracts';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface BinaryOrder {
  betId: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  betAmount: string | number;
  targetPrice: string;
  entryPrice: string;
  entryTime: number;
  targetTime: number;
  multiplier: number;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'CANCELLED';
  settledAt?: number;
  settlePrice?: string;
  createdAt: number;
  collateralToken?: CollateralToken;
}

type BinaryOrdersOptions = {
  collateralToken?: CollateralToken | 'ALL';
};

export function useBinaryOrders(options?: BinaryOrdersOptions) {
  const [orders, setOrders] = useState<BinaryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useEmbeddedWallet();
  const { collateralToken } = useMarket();
  const requestedToken = options?.collateralToken ?? collateralToken;
  const tokenList: CollateralToken[] =
    requestedToken === 'ALL' ? COLLATERAL_TOKENS : [requestedToken];
  const tokenKey = requestedToken === 'ALL' ? 'ALL' : requestedToken;

  const fetchOrders = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const responses = await Promise.all(
        tokenList.map(async (token) => {
          const url = `${BACKEND_URL}/api/one-tap/bets?trader=${address}&collateralToken=${token}`;
          const response = await fetch(url);
          if (!response.ok) {
            return [] as BinaryOrder[];
          }
          const data = await response.json();
          if (!data?.success || !data?.data) {
            return [] as BinaryOrder[];
          }
          const transformedOrders = data.data.map((bet: any) => {
            const entryPrice = parseFloat(bet.entryPrice) / 100000000; // 8 decimals
            const targetPrice = parseFloat(bet.targetPrice) / 100000000; // 8 decimals
            const direction = targetPrice > entryPrice ? 'UP' : 'DOWN';

            return {
              ...bet,
              direction,
              collateralToken: bet.collateralToken || token,
            } as BinaryOrder;
          });
          return transformedOrders;
        }),
      );

      const combined = responses.flat();
      const deduped = new Map<string, BinaryOrder>();
      combined.forEach((order) => {
        const key = `${order.betId}-${order.collateralToken ?? 'USDC'}`;
        if (!deduped.has(key)) {
          deduped.set(key, order);
        }
      });
      setOrders(Array.from(deduped.values()));
    } catch (error) {
      console.error('❌ Error fetching binary orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Poll every 3 seconds to get updates
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [address, tokenKey]);

  return {
    orders,
    isLoading,
    refetch: fetchOrders,
  };
}
