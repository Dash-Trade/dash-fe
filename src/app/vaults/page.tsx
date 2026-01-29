'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import { parseUnits, formatUnits } from 'viem';
import PageLayout from '@/components/layout/PageLayout';
import {
  CollateralToken,
  IDRX_ADDRESS,
  STABILITY_FUND_ADDRESS,
  STABILITY_FUND_IDRX_ADDRESS,
  USDC_ADDRESS,
  VAULT_POOL_ADDRESS,
  VAULT_POOL_IDRX_ADDRESS,
  isZeroAddress,
} from '@/config/contracts';
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 84532);

const erc20ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const vaultABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    name: 'deposit',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    name: 'withdraw',
    outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    name: 'convertToShares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'lockPeriod',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'earlyExitFeeBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'apyEstimateBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'virtualSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'lastDepositAt',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'unlockTime',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface VaultData {
  collateral: {
    name: string;
    symbol: string;
    icon: string;
  };
  balance: string;
  balanceUSD: string;
  feeAPY: string;
  stabilityFunds: string;
  stabilityFundsUSD: string;
  yourBalance: string;
  yourBalanceUSD: string;
  percentOwned: string;
}

interface VaultSnapshot {
  tokenBalance: string;
  tvlUsd: string;
  tvlUsdValue: number;
  stabilityTokenBalance: string;
  stabilityUsd: string;
  userTokenBalance: string;
  userUsd: string;
  percentOwned: string;
  lockPeriodSec: number;
  earlyExitFee: number;
  apyBps: number;
  userUnlockTime: number | null;
}

const DEFAULT_SNAPSHOT: VaultSnapshot = {
  tokenBalance: '0.00',
  tvlUsd: '$0.00',
  tvlUsdValue: 0,
  stabilityTokenBalance: '0.00',
  stabilityUsd: '$0.00',
  userTokenBalance: '0.00',
  userUsd: '$0',
  percentOwned: '0%',
  lockPeriodSec: 0,
  earlyExitFee: 0,
  apyBps: 0,
  userUnlockTime: null,
};

type VaultConfig = {
  token: CollateralToken;
  name: string;
  icon: string;
  tokenAddress: `0x${string}`;
  vaultAddress: `0x${string}`;
  stabilityFundAddress: `0x${string}`;
};

const VAULTS_BASE: VaultConfig[] = [
  {
    token: 'USDC',
    name: 'USD Coin',
    icon: '/icons/usdc.png',
    tokenAddress: USDC_ADDRESS,
    vaultAddress: VAULT_POOL_ADDRESS,
    stabilityFundAddress: STABILITY_FUND_ADDRESS,
  },
  {
    token: 'IDRX',
    name: 'IDRX',
    icon: '/icons/idrx.png',
    tokenAddress: IDRX_ADDRESS,
    vaultAddress: VAULT_POOL_IDRX_ADDRESS,
    stabilityFundAddress: STABILITY_FUND_IDRX_ADDRESS,
  },
];

const VAULTS = VAULTS_BASE.filter(
  (vault) =>
    !isZeroAddress(vault.tokenAddress) &&
    !isZeroAddress(vault.vaultAddress) &&
    !isZeroAddress(vault.stabilityFundAddress),
);

const IDRX_PER_USD = 16700;

const formatTokenAmount = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const toUsdValue = (value: number, token: CollateralToken): number => {
  if (token === 'IDRX') {
    return value / IDRX_PER_USD;
  }
  return value;
};

export default function VaultsPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<CollateralToken>('USDC');
  const [vaultSnapshots, setVaultSnapshots] = useState<Record<string, VaultSnapshot>>({});

  const embeddedWallet = useMemo(
    () => wallets.find((w) => w.walletClientType === 'privy' || w.connectorType === 'embedded'),
    [wallets],
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronDown className="w-4 h-4 text-gray-500" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-400" />
    );
  };

  const fetchVaultSnapshot = useCallback(
    async (
      vaultAddress: `0x${string}`,
      tokenAddress: `0x${string}`,
      stabilityFundAddress: `0x${string}`,
      tokenSymbol: CollateralToken,
      userAddress?: `0x${string}`,
    ): Promise<VaultSnapshot> => {
      if (!publicClient) return DEFAULT_SNAPSHOT;

      const [
        totalAssets,
        totalSupply,
        virtualSupply,
        lockP,
        feeBps,
        apy,
        stabilityBalance,
      ] = await Promise.all([
        publicClient.readContract({
          address: vaultAddress,
          abi: vaultABI,
          functionName: 'totalAssets',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vaultAddress,
          abi: vaultABI,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vaultAddress,
          abi: vaultABI,
          functionName: 'virtualSupply',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vaultAddress,
          abi: vaultABI,
          functionName: 'lockPeriod',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vaultAddress,
          abi: vaultABI,
          functionName: 'earlyExitFeeBps',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vaultAddress,
          abi: vaultABI,
          functionName: 'apyEstimateBps',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: tokenAddress,
          abi: erc20ABI,
          functionName: 'balanceOf',
          args: [stabilityFundAddress],
        }) as Promise<bigint>,
      ]);

      let userBalance = '0.00';
      let userBalanceUSD = '$0';
      let percentOwned = '0%';
      let userUnlockTime: number | null = null;

      if (userAddress) {
        const [userShares, unlockTs] = await Promise.all([
          publicClient.readContract({
            address: vaultAddress,
            abi: vaultABI,
            functionName: 'balanceOf',
            args: [userAddress],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: vaultAddress,
            abi: vaultABI,
            functionName: 'unlockTime',
            args: [userAddress],
          }) as Promise<bigint>,
        ]);

        const userAssets =
          userShares > 0n
            ? ((await publicClient.readContract({
                address: vaultAddress,
                abi: vaultABI,
                functionName: 'convertToAssets',
                args: [userShares],
              })) as bigint)
            : 0n;

        const userAssetsNumber = Number(formatUnits(userAssets, 6));
        const userUsdValue = toUsdValue(userAssetsNumber, tokenSymbol);
        userBalance = formatTokenAmount(userAssetsNumber);
        userBalanceUSD = formatCurrency(userUsdValue);

        const effectiveSupply = totalSupply + virtualSupply;
        const percentScaled =
          effectiveSupply > 0n ? (userShares * 100_000_000n) / effectiveSupply : 0n;
        const percent = Number(percentScaled) / 1_000_000;
        percentOwned =
          percent < 0.000001 && percent > 0 ? '<0.000001%' : `${percent.toFixed(6)}%`;
        userUnlockTime = Number(unlockTs);
      }

      const vaultTokenValue = Number(formatUnits(totalAssets, 6));
      const stabilityTokenValue = Number(formatUnits(stabilityBalance, 6));
      const vaultUsdValue = toUsdValue(vaultTokenValue, tokenSymbol);
      const stabilityUsdValue = toUsdValue(stabilityTokenValue, tokenSymbol);

      return {
        tokenBalance: formatTokenAmount(vaultTokenValue),
        tvlUsd: formatCurrency(vaultUsdValue),
        tvlUsdValue: vaultUsdValue,
        stabilityTokenBalance: formatTokenAmount(stabilityTokenValue),
        stabilityUsd: formatCurrency(stabilityUsdValue),
        userTokenBalance: userBalance,
        userUsd: userBalanceUSD,
        percentOwned,
        lockPeriodSec: Number(lockP),
        earlyExitFee: Number(feeBps) / 100,
        apyBps: Number(apy),
        userUnlockTime,
      };
    },
    [publicClient],
  );

  const fetchVaultData = useCallback(async () => {
    if (!publicClient) return;

    const userAddress =
      ready && authenticated && embeddedWallet
        ? (embeddedWallet.address as `0x${string}`)
        : undefined;

    try {
      const entries = await Promise.all(
        VAULTS.map(async (vault) => {
          const snapshot = await fetchVaultSnapshot(
            vault.vaultAddress,
            vault.tokenAddress,
            vault.stabilityFundAddress,
            vault.token,
            userAddress,
          );
          return [vault.token, snapshot] as const;
        }),
      );
      setVaultSnapshots(Object.fromEntries(entries));
    } catch (err) {
      setVaultSnapshots({});
    }
  }, [authenticated, embeddedWallet, fetchVaultSnapshot, publicClient, ready]);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData, txHash]);

  const selectedSnapshot = vaultSnapshots[selectedToken] ?? DEFAULT_SNAPSHOT;
  const totalTvlUsd = VAULTS.reduce((sum, vault) => {
    const snapshot = vaultSnapshots[vault.token];
    return sum + (snapshot?.tvlUsdValue ?? 0);
  }, 0);

  const vaultData: VaultData[] = VAULTS.map((vault) => {
    const snapshot = vaultSnapshots[vault.token] ?? DEFAULT_SNAPSHOT;
    return {
      collateral: {
        name: vault.name,
        symbol: vault.token,
        icon: vault.icon,
      },
      balance: `${snapshot.tokenBalance} ${vault.token}`,
      balanceUSD: snapshot.tvlUsd,
      feeAPY: `${(snapshot.apyBps / 100).toFixed(2)}%`,
      stabilityFunds: `${snapshot.stabilityTokenBalance} ${vault.token}`,
      stabilityFundsUSD: snapshot.stabilityUsd,
      yourBalance: `${snapshot.userTokenBalance} ${vault.token}`,
      yourBalanceUSD: snapshot.userUsd,
      percentOwned: snapshot.percentOwned,
    };
  });

  const openModal = (selectedMode: 'deposit' | 'withdraw') => {
    setMode(selectedMode);
    setIsModalOpen(true);
    setAmount('');
    setTxHash(null);
    setErrorMsg(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setTxHash(null);
    setErrorMsg(null);
    setAmount('');
  };

  const submitTx = async () => {
    try {
      setIsSubmitting(true);
      setTxHash(null);
      setErrorMsg(null);

      if (!ready || !authenticated) {
        await login();
        throw new Error('Please complete login first');
      }
      if (!embeddedWallet) {
        throw new Error('Embedded wallet not found. Connect via Privy first.');
      }
      if (!amount || Number(amount) <= 0) {
        throw new Error('Enter a valid amount');
      }

      const activeVault =
        VAULTS.find((vault) => vault.token === selectedToken) ?? VAULTS[0];
      if (!activeVault) {
        throw new Error('Vault configuration not found');
      }

      const provider = new ethers.BrowserProvider(await embeddedWallet.getEthereumProvider());
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        throw new Error(`Wrong network. Please switch to chain ${CHAIN_ID} (Base Sepolia).`);
      }
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const amt = parseUnits(amount, 6);
      const token = new ethers.Contract(activeVault.tokenAddress, erc20ABI, signer);
      const vault = new ethers.Contract(activeVault.vaultAddress, vaultABI, signer);

      // Balance check
      const balance: bigint = await token.balanceOf(userAddress);
      if (balance < amt) {
        throw new Error(`Insufficient ${activeVault.token} balance in embedded wallet`);
      }

      if (mode === 'deposit') {
        // approve if needed
        const allowance = await token.allowance(userAddress, activeVault.vaultAddress);
        if (allowance < amt) {
          const approveTx = await token.approve(activeVault.vaultAddress, amt);
          await approveTx.wait();
        }
        const tx = await vault.deposit(amt);
        setTxHash(tx.hash);
        await tx.wait();
      } else {
        // withdraw accepts shares; convert assets -> shares
        const shares = await vault.convertToShares(amt);
        const tx = await vault.withdraw(shares);
        setTxHash(tx.hash);
        await tx.wait();
      }
    } catch (err: any) {
      const msg = err?.info?.error?.message || err?.message || 'Transaction failed';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      navbar={{
        title: 'Vaults',
        subtitle: 'Vaults back their Stability Funds',
      }}
      mobileHeaderContent={
        <div>
          <h1 className="text-3xl font-bold mb-2">Vaults</h1>
          <p className="text-gray-400 text-sm mb-4">
            Vaults back their Stability Funds. Profits, including traders&apos; losses and trading
            fees from traders, stream back to them.{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 underline">
              Read more
            </a>
          </p>
        </div>
      }
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Vaults</h1>
        <p className="text-gray-400 text-sm mb-1">
          Vaults back their Stability Funds. Profits, including traders&apos; losses and trading
          fees from traders, stream back to them.{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300 underline">
            Read more
          </a>
        </p>
      </div>

      <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">TVL</p>
            <h2 className="text-4xl font-bold text-white">
              {formatCurrency(totalTvlUsd)}
            </h2>
            <p className="text-gray-500 text-xs mt-1">Base Sepolia</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-3">
              <button
                onClick={() => openModal('deposit')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Deposit
              </button>
              <button
                onClick={() => openModal('withdraw')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium transition-colors"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw
              </button>
            </div>

            <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center">
              <Image
                src="/icons/base.png"
                alt="Base Logo"
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400 space-y-1">
          <p>
            Lock period:{' '}
            {selectedSnapshot.lockPeriodSec
              ? `${(selectedSnapshot.lockPeriodSec / 86400).toFixed(0)} days`
              : '-'}{' '}
            • Early exit fee: {selectedSnapshot.earlyExitFee.toFixed(2)}%
          </p>
          {selectedSnapshot.userUnlockTime ? (
            <p>
              Your unlock time:{' '}
              {new Date(selectedSnapshot.userUnlockTime * 1000).toLocaleString()}
            </p>
          ) : (
            <p>Deposit to start accruing and set your unlock time.</p>
          )}
          <p>
            Fee APY is estimated from settlement inflows; real returns depend on trading outcomes.
          </p>
        </div>

        <div className="md:hidden flex gap-3 mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={() => openModal('deposit')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </button>
          <button
            onClick={() => openModal('withdraw')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg font-medium transition-colors"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </button>
        </div>
      </div>

      <div className="bg-slate-900/30 rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('collateral')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Collateral
                    <SortIcon column="collateral" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('balance')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Balance
                    <SortIcon column="balance" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('feeAPY')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Fee APY <sup className="text-xs">1</sup>
                    <SortIcon column="feeAPY" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('stabilityFunds')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Stability Funds <sup className="text-xs">2</sup>
                    <SortIcon column="stabilityFunds" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('yourBalance')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    Your Balance
                    <SortIcon column="yourBalance" />
                  </button>
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">
                  <button
                    onClick={() => handleSort('percentOwned')}
                    className="flex items-center gap-1 hover:text-gray-300"
                  >
                    % Owned
                    <SortIcon column="percentOwned" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {vaultData.map((vault, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedToken(vault.collateral.symbol as CollateralToken)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8">
                        <Image
                          src={vault.collateral.icon}
                          alt={vault.collateral.symbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-token.png';
                          }}
                        />
                      </div>
                      <span className="font-medium text-white">{vault.collateral.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{vault.balance}</span>
                      <span className="text-sm text-gray-400">{vault.balanceUSD}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{vault.feeAPY}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{vault.stabilityFunds}</span>
                      <span className="text-sm text-gray-400">{vault.stabilityFundsUSD}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{vault.yourBalance}</span>
                      <span className="text-sm text-gray-400">{vault.yourBalanceUSD}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{vault.percentOwned}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white capitalize">{mode} {selectedToken}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Collateral</label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value as CollateralToken)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  {VAULTS.map((vault) => (
                    <option key={vault.token} value={vault.token}>
                      {vault.token}
                    </option>
                  ))}
                </select>
              </div>
              <label className="text-sm text-gray-400">Amount ({selectedToken})</label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
              {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
              {txHash && <p className="text-sm text-green-400 break-all">TX: {txHash}</p>}
              {!embeddedWallet && (
                <p className="text-xs text-yellow-400">
                  No embedded wallet found. Please connect via Privy first.
                </p>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={submitTx}
                disabled={isSubmitting || !amount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-3 bg-slate-800 border border-slate-700 text-gray-200 rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
            {!ready && (
              <p className="text-xs text-gray-400 mt-3">Waiting for Privy to be ready...</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2 text-xs text-gray-400">
        <p>
          <sup>1</sup> Does not include trader wins and losses.
        </p>
        <p>
          <sup>2</sup> The Stability Funds absorbs traders&apos; losses first and redistributes them
          to their corresponding vaults. When the Stability Fund has a positive balance, it is
          prioritized to pay out potential traders&apos; winnings.
        </p>
      </div>
    </PageLayout>
  );
}

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
