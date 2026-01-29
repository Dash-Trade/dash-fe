import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';

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

      if (!embeddedWalletAddress) {
        setBalance('0.00');
        return;
      }

      setIsLoadingBalance(true);
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const rawBalance = (await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [embeddedWalletAddress as `0x${string}`],
        })) as bigint;

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
  }, [authenticated, user, tokenAddress, decimals, refreshMs]);

  return { balance, isLoadingBalance };
};
