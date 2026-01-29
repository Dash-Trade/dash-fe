import { useMemo } from 'react';
import { useWallets, ConnectedWallet } from '@privy-io/react-auth';
import { useEmbeddedWallet } from '@/features/wallet/hooks/useEmbeddedWallet';

export function useActivePrivyWallet() {
  const { wallets } = useWallets();
  const { address } = useEmbeddedWallet();

  const activeWallet: ConnectedWallet | undefined = useMemo(() => {
    if (!wallets || wallets.length === 0) return undefined;
    if (address) {
      return wallets.find(
        (w) =>
          w.walletClientType === 'privy' &&
          w.address?.toLowerCase() === address.toLowerCase(),
      );
    }
    return wallets.find((w) => w.walletClientType === 'privy');
  }, [wallets, address]);

  return { activeWallet, address };
}
