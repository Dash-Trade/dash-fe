import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, encodeFunctionData, http, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { USDC_ADDRESS, USDC_DECIMALS } from '@/config/contracts';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

/**
 * Custom hook to fetch USDC balance from the embedded wallet
 * Uses the same logic as WalletConnectButton to ensure consistency
 */
export const useUSDCBalance = () => {
  const { authenticated, user } = usePrivy();
  const { activeWallet, address } = useActivePrivyWallet();
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!authenticated || !user) {
        setUsdcBalance('0.00');
        return;
      }

      // Get embedded wallet address (same logic as WalletConnectButton)
      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === 'wallet' && account.imported === false && account.id !== undefined,
      ) as any[];

      const embeddedWalletAddress = embeddedWallets?.[0]?.address || user?.wallet?.address;
      const walletAddress = address ?? embeddedWalletAddress;

      if (!walletAddress) {
        setUsdcBalance('0.00');
        return;
      }

      setIsLoadingBalance(true);
      try {
        let balance: bigint | null = null;
        const provider = await activeWallet?.getEthereumProvider();
        const balanceAbi = [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
        ] as const;

        if (provider) {
          const callData = encodeFunctionData({
            abi: balanceAbi,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`],
          });
          try {
            const result = await provider.request({
              method: 'eth_call',
              params: [{ to: USDC_ADDRESS, data: callData }, 'latest'],
            });
            if (result && result !== '0x') {
              balance = BigInt(result as string);
            } else {
              balance = 0n;
            }
          } catch {
            balance = null;
          }
        }

        if (balance === null) {
          const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'),
          });

          const maxAttempts = 3;
          let attempt = 0;
          while (attempt < maxAttempts) {
            try {
              balance = (await publicClient.readContract({
                address: USDC_ADDRESS,
                abi: balanceAbi,
                functionName: 'balanceOf',
                args: [walletAddress as `0x${string}`],
              })) as bigint;
              break;
            } catch (error: any) {
              if (error?.message?.includes('rate limit') || error?.message?.includes('429')) {
                await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
                attempt += 1;
                continue;
              }
              throw error;
            }
          }
        }

        if (balance === null) {
          balance = 0n;
        }

        // Format USDC balance using configured decimals
        const formattedBalance = formatUnits(balance, USDC_DECIMALS);
        setUsdcBalance(parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        setUsdcBalance('0.00');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (authenticated && user) {
      fetchUsdcBalance();

      // Refresh balance every 5 seconds to keep it in sync
      const interval = setInterval(fetchUsdcBalance, 5000);
      return () => clearInterval(interval);
    }
  }, [authenticated, user, activeWallet, address]);

  return { usdcBalance, isLoadingBalance };
};
