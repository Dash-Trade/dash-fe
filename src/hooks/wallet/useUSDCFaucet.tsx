import { useState } from 'react';
import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import { toast } from 'sonner';
import { IDRX_ADDRESS, USDC_ADDRESS, isZeroAddress } from '@/config/contracts';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

const MOCK_TOKEN_ABI = [
  {
    inputs: [],
    name: 'faucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'hasClaimed',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const FAUCET_TOKENS = [
  {
    symbol: 'USDC',
    address: USDC_ADDRESS,
    amountLabel: '1,000 USDC',
  },
  {
    symbol: 'IDRX',
    address: IDRX_ADDRESS,
    amountLabel: '1,000,000 IDRX',
  },
].filter((token) => !isZeroAddress(token.address)) as Array<{
  symbol: 'USDC' | 'IDRX';
  address: `0x${string}`;
  amountLabel: string;
}>;

export const useUSDCFaucet = () => {
  const { authenticated, user } = usePrivy();
  const { activeWallet, address } = useActivePrivyWallet();
  const { sendTransaction } = useSendTransaction();
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
    const loadingToast = toast.loading('Checking claim status...');

    try {
      const provider = await embeddedWallet.getEthereumProvider();
      if (!provider) throw new Error('Could not get wallet provider');

      const claimableTokens: typeof FAUCET_TOKENS = [] as any;

      for (const token of FAUCET_TOKENS) {
        const hasClaimedData = encodeFunctionData({
          abi: MOCK_TOKEN_ABI,
          functionName: 'hasClaimed',
          args: [walletAddress as `0x${string}`],
        });

        const hasClaimedResult = await provider.request({
          method: 'eth_call',
          params: [
            {
              to: token.address,
              data: hasClaimedData,
            },
            'latest',
          ],
        });

        const alreadyClaimed =
          hasClaimedResult !==
          '0x0000000000000000000000000000000000000000000000000000000000000000';

        if (!alreadyClaimed) {
          claimableTokens.push(token);
        }
      }

      if (claimableTokens.length === 0) {
        toast.error(
          'You have already claimed USDC and IDRX from the faucet. Each wallet can only claim once.',
          { id: loadingToast, duration: 5000 },
        );
        return;
      }

      toast.loading('Claiming USDC + IDRX from faucet...', { id: loadingToast });

      const data = encodeFunctionData({
        abi: MOCK_TOKEN_ABI,
        functionName: 'faucet',
        args: [],
      });

      let lastTxHash: string | undefined;
      for (const token of claimableTokens) {
        const txResult = await sendTransaction(
          {
            to: token.address,
            data: data,
            value: 0n,
          },
          {
            sponsor: true,
          },
        );
        let txHash: string | undefined;
        if (typeof txResult === 'string') {
          txHash = txResult;
        } else if (txResult && typeof txResult === 'object') {
          const maybeHash = (txResult as any).transactionHash || (txResult as any).hash;
          if (typeof maybeHash === 'string') {
            txHash = maybeHash;
          }
        }
        if (txHash) {
          lastTxHash = txHash;
        }
      }

      const claimedLabel = claimableTokens.map((token) => token.amountLabel).join(' + ');
      toast.success(`Faucet claimed: ${claimedLabel}`, {
        id: loadingToast,
        duration: 4000,
      });

      if (lastTxHash) {
        setTimeout(() => {
          toast.success(
            <div className="flex flex-col gap-1">
              <span>View on Explorer:</span>
              <a
                href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400 hover:text-blue-300"
              >
                Click here
              </a>
            </div>,
            { duration: 5000 },
          );
        }, 500);
      }

      setTimeout(() => {
        window.location.reload();
      }, 2000);

      return lastTxHash;
    } catch (error: any) {
      let errorMessage = 'Failed to claim faucet rewards';
      if (error?.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsClaiming(false);
    }
  };

  return { isClaiming, handleClaimUSDC };
};
