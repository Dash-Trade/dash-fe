import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, encodeFunctionData, http, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { IDRX_ADDRESS, USDC_ADDRESS, USDC_DECIMALS, isZeroAddress } from '@/config/contracts';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

export const useWalletBalance = () => {
  const { authenticated, user } = usePrivy();
  const { activeWallet, address } = useActivePrivyWallet();
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [idrxBalance, setIdrxBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!authenticated || !user) return;

    const embeddedWallets = user.linkedAccounts?.filter(
      (account: any) =>
        account.type === 'wallet' && account.imported === false && account.id !== undefined,
    ) as any[];

    const embeddedWalletAddress = embeddedWallets?.[0]?.address || user?.wallet?.address;
    const walletAddress = address ?? embeddedWalletAddress;

    if (!walletAddress) return;

    setIsLoadingBalance(true);
    try {
      const balanceOfAbi = [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function',
        },
      ] as const;

      const readBalance = async (tokenAddress: `0x${string}`) => {
        const provider = await activeWallet?.getEthereumProvider();
        if (provider) {
          const callData = encodeFunctionData({
            abi: balanceOfAbi,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`],
          });
          try {
            const result = await provider.request({
              method: 'eth_call',
              params: [{ to: tokenAddress, data: callData }, 'latest'],
            });
            if (result && result !== '0x') {
              return BigInt(result as string);
            }
            return 0n;
          } catch {
            // fallback to public RPC
          }
        }

        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'),
        });

        const maxAttempts = 3;
        let attempt = 0;
        while (attempt < maxAttempts) {
          try {
            return (await publicClient.readContract({
              address: tokenAddress,
              abi: balanceOfAbi,
              functionName: 'balanceOf',
              args: [walletAddress as `0x${string}`],
            })) as bigint;
          } catch (error: any) {
            if (error?.message?.includes('rate limit') || error?.message?.includes('429')) {
              await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
              attempt += 1;
              continue;
            }
            throw error;
          }
        }
        return 0n;
      };

      const [usdc, idrx] = await Promise.all([
        readBalance(USDC_ADDRESS),
        isZeroAddress(IDRX_ADDRESS) ? Promise.resolve(0n) : readBalance(IDRX_ADDRESS),
      ]);

      const formattedUsdc = formatUnits(usdc, USDC_DECIMALS);
      const formattedIdrx = formatUnits(idrx, USDC_DECIMALS);
      setUsdcBalance(parseFloat(formattedUsdc).toFixed(2));
      setIdrxBalance(parseFloat(formattedIdrx).toFixed(2));
    } catch (error) {
      setUsdcBalance('0.00');
      setIdrxBalance('0.00');
    } finally {
      setIsLoadingBalance(false);
    }
  }, [authenticated, user, activeWallet, address]);

  useEffect(() => {
    if (authenticated && user) {
      fetchBalances();
    }
  }, [authenticated, user, fetchBalances]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      fetchBalances();
    };
    window.addEventListener('dash:faucet-claimed', handler as EventListener);
    return () => {
      window.removeEventListener('dash:faucet-claimed', handler as EventListener);
    };
  }, [fetchBalances]);

  return { usdcBalance, idrxBalance, isLoadingBalance, refreshBalances: fetchBalances };
};
