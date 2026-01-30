import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, encodeFunctionData, http, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

const ERC20_BALANCE_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

export const useTokenBalance = (
  tokenAddress: `0x${string}`,
  decimals: number,
  refreshMs: number = 5000,
) => {
  const { authenticated, user } = usePrivy();
  const { activeWallet, address } = useActivePrivyWallet();
  const [balance, setBalance] = useState<string>('0.00');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!authenticated || !user) {
        setBalance('0.00');
        return;
      }

      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === 'wallet' && account.imported === false && account.id !== undefined,
      ) as any[];

      const embeddedWalletAddress = embeddedWallets?.[0]?.address || user?.wallet?.address;
      const walletAddress = address ?? embeddedWalletAddress;

      if (!walletAddress) {
        setBalance('0.00');
        return;
      }

      setIsLoadingBalance(true);
      try {
        let rawBalance: bigint | null = null;

        const provider = await activeWallet?.getEthereumProvider();
        if (provider) {
          const callData = encodeFunctionData({
            abi: ERC20_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`],
          });
          try {
            const result = await provider.request({
              method: 'eth_call',
              params: [{ to: tokenAddress, data: callData }, 'latest'],
            });
            if (result && result !== '0x') {
              rawBalance = BigInt(result as string);
            } else {
              rawBalance = 0n;
            }
          } catch {
            rawBalance = null;
          }
        }

        if (rawBalance === null) {
          const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'),
          });

          const maxAttempts = 3;
          let attempt = 0;
          while (attempt < maxAttempts) {
            try {
              rawBalance = (await publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_BALANCE_ABI,
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

        if (rawBalance === null) {
          rawBalance = 0n;
        }

        const formattedBalance = formatUnits(rawBalance, decimals);
        setBalance(parseFloat(formattedBalance).toFixed(2));
      } catch (error) {
        setBalance('0.00');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (authenticated && user && tokenAddress) {
      fetchBalance();

      const interval = setInterval(fetchBalance, refreshMs);
      return () => clearInterval(interval);
    }
  }, [authenticated, user, tokenAddress, decimals, refreshMs, activeWallet, address]);

  return { balance, isLoadingBalance };
};
