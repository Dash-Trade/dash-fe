import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { IDRX_ADDRESS, USDC_ADDRESS, USDC_DECIMALS, isZeroAddress } from '@/config/contracts';

export const useWalletBalance = () => {
  const { authenticated, user } = usePrivy();
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [idrxBalance, setIdrxBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!authenticated || !user) return;

      const embeddedWallets = user.linkedAccounts?.filter(
        (account: any) =>
          account.type === 'wallet' && account.imported === false && account.id !== undefined,
      ) as any[];

      const embeddedWalletAddress = embeddedWallets?.[0]?.address || user?.wallet?.address;

      if (!embeddedWalletAddress) return;

      setIsLoadingBalance(true);
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const balanceOfAbi = [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
        ] as const;

        const [usdc, idrx] = await Promise.all([
          publicClient.readContract({
            address: USDC_ADDRESS,
            abi: balanceOfAbi,
            functionName: 'balanceOf',
            args: [embeddedWalletAddress as `0x${string}`],
          }) as Promise<bigint>,
          isZeroAddress(IDRX_ADDRESS)
            ? Promise.resolve(0n)
            : (publicClient.readContract({
                address: IDRX_ADDRESS,
                abi: balanceOfAbi,
                functionName: 'balanceOf',
                args: [embeddedWalletAddress as `0x${string}`],
              }) as Promise<bigint>),
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
    };

    if (authenticated && user) {
      fetchBalances();
    }
  }, [authenticated, user]);

  return { usdcBalance, idrxBalance, isLoadingBalance };
};
