/**
 * Smart Contract Addresses Configuration
 *
 * All contract addresses for Dash on Base Sepolia
 * These are loaded from environment variables for easy configuration
 */

// Token Contracts
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS ||
  '0x97e79F7189144F2A67d56ef9164B8230784014cD') as `0x${string}`;
export const IDRX_ADDRESS = (process.env.NEXT_PUBLIC_IDRX_TOKEN_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const DASH_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_DASH_TOKEN_ADDRESS ||
  '0xe5A50E831695f4e438fFe877F4970f14778DeB28') as `0x${string}`;

// Core Trading Contracts
export const MARKET_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_EXECUTOR_ADDRESS ||
  '0x169BD27456DEF7AF81Cee3F188e4C316aF7c3fE5') as `0x${string}`;
export const MARKET_EXECUTOR_IDRX_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_EXECUTOR_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const LIMIT_EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_LIMIT_EXECUTOR_ADDRESS ||
  '0x7690eBE5D0AF8eeBFdF7F18d0De2d4f568a1bf47') as `0x${string}`;
export const LIMIT_EXECUTOR_IDRX_ADDRESS = (process.env.NEXT_PUBLIC_LIMIT_EXECUTOR_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const TAP_TO_TRADE_EXECUTOR_ADDRESS = (process.env
  .NEXT_PUBLIC_TAP_TO_TRADE_EXECUTOR_ADDRESS ||
  '0xb7983AF018547Ef34Af65869cdB2E47264630532') as `0x${string}`;
export const TAP_TO_TRADE_EXECUTOR_IDRX_ADDRESS = (process.env
  .NEXT_PUBLIC_TAP_TO_TRADE_EXECUTOR_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const ONE_TAP_PROFIT_ADDRESS = (process.env.NEXT_PUBLIC_ONE_TAP_PROFIT_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const POSITION_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_POSITION_MANAGER_ADDRESS ||
  '0x45e985eE1d038d942536270c8662eb5cBFeCa6ef') as `0x${string}`;
export const POSITION_MANAGER_IDRX_ADDRESS = (process.env.NEXT_PUBLIC_POSITION_MANAGER_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const RISK_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_RISK_MANAGER_ADDRESS ||
  '0xB07eFBDd2c31cD97583C91679c9b7B244Db22F0D') as `0x${string}`;
export const RISK_MANAGER_IDRX_ADDRESS = (process.env.NEXT_PUBLIC_RISK_MANAGER_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Treasury Stack
export const VAULT_POOL_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_POOL_ADDRESS ||
  '0xA880d810Ab6fAc4c60A2b4B8D829fC37f41e2aF9') as `0x${string}`;
export const VAULT_POOL_IDRX_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_POOL_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const STABILITY_FUND_ADDRESS = (process.env.NEXT_PUBLIC_STABILITY_FUND_ADDRESS ||
  '0x1A7763D20C262Faa477C376BFBfE1B712b51D5C8') as `0x${string}`;
export const STABILITY_FUND_IDRX_ADDRESS = (process.env.NEXT_PUBLIC_STABILITY_FUND_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Economic Contracts
export const DASH_STAKING_ADDRESS = (process.env.NEXT_PUBLIC_DASH_STAKING_ADDRESS ||
  '0x583578f24DCC3f43eefa91bE1a530CBB06faf189') as `0x${string}`;

// Utility Contracts
export const USDC_PAYMASTER_ADDRESS = (process.env.NEXT_PUBLIC_USDC_PAYMASTER_ADDRESS ||
  '0x8b4AC6b2Dbb9fC97c62C0c086f2932c143DCCc91') as `0x${string}`;

export const ONE_TAP_PROFIT_IDRX_ADDRESS = (process.env.NEXT_PUBLIC_ONE_TAP_PROFIT_IDRX_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Configuration Addresses
export const DEPLOYER_ADDRESS = (process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS ||
  '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') as `0x${string}`;
export const TREASURY_ADDRESS = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
  '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') as `0x${string}`;
export const PRICE_SIGNER_ADDRESS = (process.env.NEXT_PUBLIC_PRICE_SIGNER_ADDRESS ||
  '0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') as `0x${string}`;

// Network Configuration
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
export const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || 'base-sepolia';
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';

// Backend API Configuration
export const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Token Decimals
export const USDC_DECIMALS = 6;
export const DASH_DECIMALS = 18;
export const COLLATERAL_DECIMALS = 6;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export type CollateralToken = 'USDC' | 'IDRX';

export const COLLATERAL_TOKENS: CollateralToken[] = ['USDC', 'IDRX'];

export const COLLATERAL_CONFIG: Record<
  CollateralToken,
  {
    symbol: CollateralToken;
    address: `0x${string}`;
    stabilityFund: `0x${string}`;
    positionManager: `0x${string}`;
    marketExecutor: `0x${string}`;
    limitExecutor: `0x${string}`;
    tapToTradeExecutor: `0x${string}`;
    oneTapProfit: `0x${string}`;
    decimals: number;
    icon?: string;
  }
> = {
  USDC: {
    symbol: 'USDC',
    address: USDC_ADDRESS,
    stabilityFund: STABILITY_FUND_ADDRESS,
    positionManager: POSITION_MANAGER_ADDRESS,
    marketExecutor: MARKET_EXECUTOR_ADDRESS,
    limitExecutor: LIMIT_EXECUTOR_ADDRESS,
    tapToTradeExecutor: TAP_TO_TRADE_EXECUTOR_ADDRESS,
    oneTapProfit: ONE_TAP_PROFIT_ADDRESS,
    decimals: COLLATERAL_DECIMALS,
    icon: '/icons/usdc.png',
  },
  IDRX: {
    symbol: 'IDRX',
    address: IDRX_ADDRESS,
    stabilityFund: STABILITY_FUND_IDRX_ADDRESS,
    positionManager: POSITION_MANAGER_IDRX_ADDRESS,
    marketExecutor: MARKET_EXECUTOR_IDRX_ADDRESS,
    limitExecutor: LIMIT_EXECUTOR_IDRX_ADDRESS,
    tapToTradeExecutor: TAP_TO_TRADE_EXECUTOR_IDRX_ADDRESS,
    oneTapProfit: ONE_TAP_PROFIT_IDRX_ADDRESS,
    decimals: COLLATERAL_DECIMALS,
    icon: '/icons/idrx.svg',
  },
};

export function getCollateralConfig(token: CollateralToken) {
  return COLLATERAL_CONFIG[token];
}

export function isZeroAddress(address?: string): boolean {
  if (!address) return true;
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

// Contract Configuration Object (for easy export)
export const CONTRACTS = {
  tokens: {
    usdc: USDC_ADDRESS,
    idrx: IDRX_ADDRESS,
    dash: DASH_TOKEN_ADDRESS,
  },
  trading: {
    marketExecutor: MARKET_EXECUTOR_ADDRESS,
    marketExecutorIdrx: MARKET_EXECUTOR_IDRX_ADDRESS,
    limitExecutor: LIMIT_EXECUTOR_ADDRESS,
    limitExecutorIdrx: LIMIT_EXECUTOR_IDRX_ADDRESS,
    tapToTradeExecutor: TAP_TO_TRADE_EXECUTOR_ADDRESS,
    tapToTradeExecutorIdrx: TAP_TO_TRADE_EXECUTOR_IDRX_ADDRESS,
    positionManager: POSITION_MANAGER_ADDRESS,
    positionManagerIdrx: POSITION_MANAGER_IDRX_ADDRESS,
    riskManager: RISK_MANAGER_ADDRESS,
    riskManagerIdrx: RISK_MANAGER_IDRX_ADDRESS,
    vaultPool: VAULT_POOL_ADDRESS,
    vaultPoolIdrx: VAULT_POOL_IDRX_ADDRESS,
    stabilityFund: STABILITY_FUND_ADDRESS,
    stabilityFundIdrx: STABILITY_FUND_IDRX_ADDRESS,
    oneTapProfit: ONE_TAP_PROFIT_ADDRESS,
    oneTapProfitIdrx: ONE_TAP_PROFIT_IDRX_ADDRESS,
  },
  economic: {
    staking: DASH_STAKING_ADDRESS,
  },
  utility: {
    paymaster: USDC_PAYMASTER_ADDRESS,
  },
  config: {
    deployer: DEPLOYER_ADDRESS,
    treasury: TREASURY_ADDRESS,
    priceSigner: PRICE_SIGNER_ADDRESS,
  },
} as const;

// Helper function to get contract address by name - simplified to avoid TypeScript complexity
export function getContractAddress(contractName: string): string {
  // Search through all contract categories
  for (const [categoryKey, categoryValue] of Object.entries(CONTRACTS)) {
    if (contractName in categoryValue) {
      return (categoryValue as any)[contractName];
    }
  }

  throw new Error(`Contract "${contractName}" not found`);
}

// Export all addresses as a flat object for convenience
export const ALL_ADDRESSES = {
  USDC_ADDRESS,
  IDRX_ADDRESS,
  DASH_TOKEN_ADDRESS,
  MARKET_EXECUTOR_ADDRESS,
  MARKET_EXECUTOR_IDRX_ADDRESS,
  LIMIT_EXECUTOR_ADDRESS,
  LIMIT_EXECUTOR_IDRX_ADDRESS,
  TAP_TO_TRADE_EXECUTOR_ADDRESS,
  TAP_TO_TRADE_EXECUTOR_IDRX_ADDRESS,
  POSITION_MANAGER_ADDRESS,
  POSITION_MANAGER_IDRX_ADDRESS,
  RISK_MANAGER_ADDRESS,
  RISK_MANAGER_IDRX_ADDRESS,
  VAULT_POOL_ADDRESS,
  VAULT_POOL_IDRX_ADDRESS,
  STABILITY_FUND_ADDRESS,
  STABILITY_FUND_IDRX_ADDRESS,
  ONE_TAP_PROFIT_ADDRESS,
  ONE_TAP_PROFIT_IDRX_ADDRESS,
  DASH_STAKING_ADDRESS,
  USDC_PAYMASTER_ADDRESS,
  DEPLOYER_ADDRESS,
  TREASURY_ADDRESS,
  PRICE_SIGNER_ADDRESS,
} as const;
