import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { parseUnits } from 'viem';
import { STABILITY_FUND_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from '@/config/contracts';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Hook for USDC approval via StabilityFund (single approval target)
 */
export function useTapToTradeApproval() {
  const { authenticated } = usePrivy();
  const { activeWallet } = useActivePrivyWallet();
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch current USDC allowance for StabilityFund
   */
  const fetchAllowance = useCallback(async () => {
    if (!authenticated || !activeWallet) return;

    try {
      const walletClient = await activeWallet.getEthereumProvider();
      if (!walletClient) return;

      const userAddress = activeWallet.address;

      // Encode allowance call
      const allowanceData = `0xdd62ed3e${userAddress
        .slice(2)
        .padStart(64, '0')}${STABILITY_FUND_ADDRESS.slice(2).padStart(64, '0')}`;

      const result = await walletClient.request({
        method: 'eth_call',
        params: [
          {
            to: USDC_ADDRESS,
            data: allowanceData,
          },
          'latest',
        ],
      });

      const allowanceValue = result === '0x' || !result ? BigInt(0) : BigInt(result as string);
      setAllowance(allowanceValue);
    } catch (error) {
      setAllowance(BigInt(0));
    }
  }, [authenticated, activeWallet]);

  /**
   * Approve USDC for StabilityFund
   */
  const approve = useCallback(
    async (amount: string) => {
      if (!authenticated || !activeWallet) {
        throw new Error('Wallet not ready');
      }

      setIsPending(true);

      try {
        const walletClient = await activeWallet.getEthereumProvider();
        if (!walletClient) {
          throw new Error('Wallet client not available');
        }

        // Encode approve function call
        const approveData = `0x095ea7b3${STABILITY_FUND_ADDRESS.slice(2).padStart(
          64,
          '0',
        )}${BigInt(amount).toString(16).padStart(64, '0')}`;

        const txHash = await walletClient.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: activeWallet.address,
              to: USDC_ADDRESS,
              data: approveData,
            },
          ],
        });

        // Wait for confirmation
        let confirmed = false;
        let attempts = 0;
        while (!confirmed && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const receipt = await walletClient.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });

          if (receipt && (receipt as any).status === '0x1') {
            confirmed = true;
          }
          attempts++;
        }

        if (!confirmed) {
          throw new Error('Transaction confirmation timeout');
        }

        // Refresh allowance
        await fetchAllowance();

        return txHash;
      } catch (error: any) {
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [authenticated, activeWallet, fetchAllowance],
  );

  /**
   * Check if user has sufficient allowance (> threshold)
   */
  const hasAllowance = useCallback(
    (threshold: bigint = parseUnits('10000', USDC_DECIMALS)) => {
      return allowance !== null && allowance > threshold;
    },
    [allowance],
  );

  // Fetch allowance on mount and when dependencies change
  useEffect(() => {
    if (authenticated && activeWallet) {
      fetchAllowance();
    }
  }, [authenticated, activeWallet, fetchAllowance]);

  return {
    allowance,
    approve,
    hasAllowance,
    isPending,
    isLoading,
    refetch: fetchAllowance,
  };
}
