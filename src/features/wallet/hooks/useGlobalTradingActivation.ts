import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSendTransaction } from '@privy-io/react-auth';
import { createPublicClient, encodeFunctionData, http, parseUnits, maxUint256 } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import {
  COLLATERAL_CONFIG,
  COLLATERAL_TOKENS,
  CollateralToken,
  isZeroAddress,
} from '@/config/contracts';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

const ERC20_ABI = [
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
] as const;

type AllowanceState = Partial<Record<CollateralToken, bigint>>;

const MAX_APPROVAL = maxUint256;
const MIN_APPROVAL = '1'; // 1 token (per decimals)

export const useGlobalTradingActivation = () => {
  const { activeWallet, address } = useActivePrivyWallet();
  const { sendTransaction } = useSendTransaction();
  const [allowances, setAllowances] = useState<AllowanceState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const allowancesRef = useRef<AllowanceState>({});

  const embeddedWallet = activeWallet;
  const activeAddress = (address ?? embeddedWallet?.address) as `0x${string}` | undefined;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(rpcUrl),
      }),
    [rpcUrl],
  );

  const getValidTokens = useCallback(() => {
    return COLLATERAL_TOKENS.filter((token) => {
      const config = COLLATERAL_CONFIG[token];
      return !isZeroAddress(config.address) && !isZeroAddress(config.stabilityFund);
    });
  }, []);

  const fetchAllowanceFor = useCallback(
    async (token: CollateralToken) => {
      if (!activeAddress) {
        throw new Error('No active address');
      }

      const config = COLLATERAL_CONFIG[token];
      if (isZeroAddress(config.address) || isZeroAddress(config.stabilityFund)) return 0n;

      const allowanceData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [activeAddress, config.stabilityFund],
      });

      const result = await publicClient.call({
        to: config.address,
        data: allowanceData,
      });

      return !result?.data || result.data === '0x' ? 0n : BigInt(result.data);
    },
    [activeAddress, publicClient],
  );

  const refetchAllowances = useCallback(async () => {
    if (!activeAddress) return;

    setIsLoading(true);
    try {
      const tokens = getValidTokens();
      const next: AllowanceState = { ...allowancesRef.current };
      for (const token of tokens) {
        try {
          next[token] = await fetchAllowanceFor(token);
        } catch (error) {
          try {
            const walletClient = await embeddedWallet?.getEthereumProvider();
            if (!walletClient) {
              continue;
            }
            const config = COLLATERAL_CONFIG[token];
            const allowanceData = encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [activeAddress, config.stabilityFund],
            });
            const result = await walletClient.request({
              method: 'eth_call',
              params: [
                {
                  to: config.address,
                  data: allowanceData,
                },
                'latest',
              ],
            });
            next[token] = !result || result === '0x' ? 0n : BigInt(result as string);
          } catch {
            // keep previous allowance if read fails
          }
        }
      }
      setAllowances(next);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [activeAddress, getValidTokens, fetchAllowanceFor, embeddedWallet]);

  const waitForReceipt = useCallback(
    async (txHash: `0x${string}`) => {
      if (!embeddedWallet) return;
      const walletClient = await embeddedWallet.getEthereumProvider();
      if (!walletClient) return;

      let attempts = 0;
      while (attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const receipt = await walletClient.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        if (receipt && (receipt as any).status === '0x1') {
          return;
        }
        attempts += 1;
      }
    },
    [embeddedWallet],
  );

  const approveToken = useCallback(
    async (token: CollateralToken, amount: bigint = MAX_APPROVAL) => {
      if (!embeddedWallet || !activeAddress) {
        throw new Error('Embedded wallet not connected');
      }

      const config = COLLATERAL_CONFIG[token];
      if (isZeroAddress(config.address) || isZeroAddress(config.stabilityFund)) {
        return;
      }

      await embeddedWallet.switchChain(baseSepolia.id);
      const walletClient = await embeddedWallet.getEthereumProvider();
      if (!walletClient) {
        throw new Error('Could not get wallet client');
      }

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [config.stabilityFund, amount],
      });
      const txResult = await sendTransaction(
        {
          to: config.address,
          data,
          value: 0n,
        },
        { sponsor: true },
      );
      let txHash: `0x${string}` | undefined;
      if (typeof txResult === 'string') {
        txHash = txResult as `0x${string}`;
      } else if (txResult && typeof txResult === 'object') {
        const maybeHash = (txResult as any).transactionHash || (txResult as any).hash;
        if (typeof maybeHash === 'string') {
          txHash = maybeHash as `0x${string}`;
        }
      }
      if (!txHash) {
        throw new Error(`Approval transaction for ${token} failed to return a hash`);
      }

      await waitForReceipt(txHash);

      const latestAllowance = await fetchAllowanceFor(token);
      const required = amount;
      if (latestAllowance < required) {
        throw new Error(`Approval for ${token} not confirmed on-chain yet`);
      }
    },
    [embeddedWallet, activeAddress, sendTransaction, waitForReceipt, fetchAllowanceFor],
  );

  const approveAll = useCallback(
    async (amount: bigint = MAX_APPROVAL) => {
      const tokens = getValidTokens();
      if (tokens.length === 0) {
        return;
      }

      setIsApproving(true);
      try {
        for (const token of tokens) {
          await approveToken(token, amount);
        }
        await refetchAllowances();
      } finally {
        setIsApproving(false);
      }
    },
    [approveToken, getValidTokens, refetchAllowances],
  );

  const hasAllowance = useCallback(
    (token: CollateralToken, requiredAmount?: bigint) => {
      const config = COLLATERAL_CONFIG[token];
      if (isZeroAddress(config.address) || isZeroAddress(config.stabilityFund)) return true;
      const current = allowances[token] ?? 0n;
      const required = requiredAmount ?? parseUnits(MIN_APPROVAL, config.decimals);
      return current >= required;
    },
    [allowances],
  );

  const hasGlobalAllowance = useCallback(
    (requiredAmount?: bigint) => {
      const tokens = getValidTokens();
      if (tokens.length === 0) return true;
      return tokens.every((token) => hasAllowance(token, requiredAmount));
    },
    [getValidTokens, hasAllowance],
  );

  useEffect(() => {
    if (!activeAddress) return;
    refetchAllowances();
  }, [activeAddress, refetchAllowances]);

  useEffect(() => {
    allowancesRef.current = allowances;
  }, [allowances]);

  return {
    allowances,
    isLoading,
    isApproving,
    isInitialized,
    isReady: isInitialized && !!activeAddress,
    refetchAllowances,
    approveAll,
    approveToken,
    hasAllowance,
    hasGlobalAllowance,
    maxApproval: MAX_APPROVAL,
    minApproval: parseUnits(MIN_APPROVAL, 6),
  };
};
