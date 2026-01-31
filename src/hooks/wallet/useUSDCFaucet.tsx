import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { BACKEND_API_URL } from '@/config/contracts';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

const FAUCET_TOKENS = [
  {
    symbol: 'USDC',
    amountLabel: '10 USDC',
  },
  {
    symbol: 'IDRX',
    amountLabel: '100,000 IDRX',
  },
] as Array<{
  symbol: 'USDC' | 'IDRX';
  amountLabel: string;
}>;

export const useUSDCFaucet = () => {
  const { authenticated, user } = usePrivy();
  const { activeWallet, address } = useActivePrivyWallet();
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimUSDC = async () => {
    if (!authenticated || !user) {
      toast.error('Please connect your wallet first');
      return;
    }

    const embeddedWallet = activeWallet;
    const walletAddress = address ?? embeddedWallet?.address;
    if (!embeddedWallet || !walletAddress) {
      toast.error('Embedded wallet not found');
      return;
    }

    setIsClaiming(true);
    const loadingToast = toast.loading('Claiming faucet rewards...');

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/faucet/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });

      let payload: any = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok || !payload?.success) {
        const cooldownMs = payload?.cooldownRemainingMs;
        let errorMessage = payload?.error || 'Failed to claim faucet rewards';
        if (cooldownMs && typeof cooldownMs === 'number') {
          const totalSeconds = Math.ceil(cooldownMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          if (hours > 0) {
            errorMessage = `Cooldown active. Try again in ${hours}h ${minutes}m.`;
          } else if (minutes > 0) {
            errorMessage = `Cooldown active. Try again in ${minutes}m.`;
          } else {
            errorMessage = 'Cooldown active. Try again in a moment.';
          }
        }
        toast.error(errorMessage, { id: loadingToast, duration: 5000 });
        return;
      }

      const claimedLabel = FAUCET_TOKENS.map((token) => token.amountLabel).join(' + ');
      toast.success(`Faucet claimed: ${claimedLabel}`, {
        id: loadingToast,
        duration: 4000,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dash:faucet-claimed', {
            detail: { address: walletAddress },
          }),
        );
      }

      return payload?.data?.usdcTransactionHash || payload?.data?.idrxTransactionHash;
    } catch (error: any) {
      let errorMessage = 'Failed to claim faucet rewards';
      if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsClaiming(false);
    }
  };

  return { isClaiming, handleClaimUSDC };
};
