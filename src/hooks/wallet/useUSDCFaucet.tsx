import { useState } from 'react';
import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData, createPublicClient, decodeFunctionResult, http } from 'viem';
import { baseSepolia } from 'wagmi/chains';
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
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'),
  });

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
      await embeddedWallet.switchChain(baseSepolia.id);
      const provider = await embeddedWallet.getEthereumProvider();
      if (!provider) throw new Error('Could not get wallet provider');

      const claimableTokens: typeof FAUCET_TOKENS = [] as any;

      const readHasClaimed = async (token: (typeof FAUCET_TOKENS)[number]) => {
        const callData = encodeFunctionData({
          abi: MOCK_TOKEN_ABI,
          functionName: 'hasClaimed',
          args: [walletAddress as `0x${string}`],
        });

        try {
          const result = await provider.request({
            method: 'eth_call',
            params: [{ to: token.address, data: callData }, 'latest'],
          });
          if (!result || result === '0x') return false;
          return Boolean(
            decodeFunctionResult({
              abi: MOCK_TOKEN_ABI,
              functionName: 'hasClaimed',
              data: result as `0x${string}`,
            }),
          );
        } catch {
          // fallback to public RPC
        }

        const maxAttempts = 3;
        let attempt = 0;
        while (attempt < maxAttempts) {
          try {
            const alreadyClaimed = await publicClient.readContract({
              address: token.address,
              abi: MOCK_TOKEN_ABI,
              functionName: 'hasClaimed',
              args: [walletAddress as `0x${string}`],
            });
            return Boolean(alreadyClaimed);
          } catch (error: any) {
            if (error?.message?.includes('rate limit') || error?.message?.includes('429')) {
              await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
              attempt += 1;
              continue;
            }
            throw error;
          }
        }

        return false;
      };

      for (const token of FAUCET_TOKENS) {
        let alreadyClaimed = false;
        try {
          alreadyClaimed = await readHasClaimed(token);
        } catch {
          // If read fails, attempt claim to let contract decide.
          alreadyClaimed = false;
        }

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
      const claimedTokens: string[] = [];
      const waitForReceipt = async (txHash: string) => {
        let attempts = 0;
        while (attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });
          if (receipt) {
            const status = (receipt as any).status;
            if (status === '0x1') return true;
            if (status === '0x0') return false;
          }
          attempts += 1;
        }
        return false;
      };
      for (const token of claimableTokens) {
        try {
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
            const ok = await waitForReceipt(txHash);
            if (!ok) {
              throw new Error(`Faucet transaction failed for ${token.symbol}`);
            }
          }
          claimedTokens.push(token.symbol);
        } catch (error: any) {
          const message = error?.message || '';
          if (
            message.includes('Already claimed') ||
            message.includes('already claimed') ||
            message.includes('MockUSDC') ||
            message.includes('MockIDRX')
          ) {
            continue;
          }
          throw error;
        }
      }

      if (claimedTokens.length === 0) {
        toast.error(
          'You have already claimed USDC and IDRX from the faucet. Each wallet can only claim once.',
          { id: loadingToast, duration: 5000 },
        );
        return;
      }

      const claimedLabel = claimableTokens
        .filter((token) => claimedTokens.includes(token.symbol))
        .map((token) => token.amountLabel)
        .join(' + ');
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
