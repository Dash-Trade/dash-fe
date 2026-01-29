/**
 * Hook to fetch and manage user positions
 */

import { useReadContract } from 'wagmi';
import { CollateralToken, getCollateralConfig, isZeroAddress } from '@/config/contracts';
import PositionManagerABI from '@/contracts/abis/PositionManager.json';
import { useEmbeddedWallet } from '@/features/wallet/hooks/useEmbeddedWallet';

export interface Position {
  id: bigint;
  trader: string;
  symbol: string;
  isLong: boolean;
  collateral: bigint;
  size: bigint;
  leverage: bigint;
  entryPrice: bigint;
  openTimestamp: bigint;
  status: number; // 0 = OPEN, 1 = CLOSED, 2 = LIQUIDATED
}

export interface PositionRef {
  id: bigint;
  collateralToken: CollateralToken;
}

/**
 * Hook to get all user positions
 */
export function useUserPositions(token: CollateralToken = 'USDC') {
  const { address } = useEmbeddedWallet();
  const collateralConfig = getCollateralConfig(token);

  const {
    data: positionIds,
    isLoading: isLoadingIds,
    refetch: refetchIds,
  } = useReadContract({
    address: collateralConfig.positionManager,
    abi: PositionManagerABI,
    functionName: 'getUserPositions',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !isZeroAddress(collateralConfig.positionManager),
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  return {
    positionIds: (positionIds as bigint[]) || [],
    isLoading: isLoadingIds,
    refetch: refetchIds,
  };
}

/**
 * Hook to get all user positions across all collateral tokens
 */
export function useAllUserPositions() {
  const usdc = useUserPositions('USDC');
  const idrx = useUserPositions('IDRX');

  const positionRefs: PositionRef[] = [
    ...(usdc.positionIds || []).map((id) => ({ id, collateralToken: 'USDC' as const })),
    ...(idrx.positionIds || []).map((id) => ({ id, collateralToken: 'IDRX' as const })),
  ];

  return {
    positionRefs,
    isLoading: usdc.isLoading || idrx.isLoading,
    refetch: () => {
      usdc.refetch?.();
      idrx.refetch?.();
    },
  };
}

/**
 * Hook to get single position details
 */
export function usePosition(positionId: bigint | undefined, token: CollateralToken = 'USDC') {
  const collateralConfig = getCollateralConfig(token);
  const { data, isLoading, refetch } = useReadContract({
    address: collateralConfig.positionManager,
    abi: PositionManagerABI,
    functionName: 'getPosition',
    args: positionId !== undefined ? [positionId] : undefined,
    query: {
      enabled:
        positionId !== undefined && !isZeroAddress(collateralConfig.positionManager),
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Parse position data from tuple
  if (!data) {
    return {
      position: null,
      isLoading,
      refetch,
    };
  }

  // Try to parse as object first (wagmi v2 returns objects for structs)
  let position: Position;

  if (typeof data === 'object' && !Array.isArray(data)) {
    // Data is returned as an object with named properties
    const dataObj = data as any;

    // Check if data has properties or is just keys (0,1,2,3...)
    // Wagmi sometimes returns object with numeric keys like {0: value, 1: value2}
    const hasNumericKeys = '0' in dataObj && '1' in dataObj;

    if (hasNumericKeys) {
      // Object with numeric keys - treat as array
      position = {
        id: dataObj[0],
        trader: dataObj[1],
        symbol: dataObj[2],
        isLong: dataObj[3],
        collateral: dataObj[4],
        size: dataObj[5],
        leverage: dataObj[6],
        entryPrice: dataObj[7],
        openTimestamp: dataObj[8],
        status: dataObj[9],
      };
    } else {
      // Object with named properties
      position = {
        id: dataObj.id,
        trader: dataObj.trader,
        symbol: dataObj.symbol,
        isLong: dataObj.isLong,
        collateral: dataObj.collateral,
        size: dataObj.size,
        leverage: dataObj.leverage,
        entryPrice: dataObj.entryPrice,
        openTimestamp: dataObj.openTimestamp,
        status: dataObj.status,
      };
    }
  } else {
    // Data is returned as an array (fallback)
    const positionArray = data as any[];
    position = {
      id: positionArray[0],
      trader: positionArray[1],
      symbol: positionArray[2],
      isLong: positionArray[3],
      collateral: positionArray[4],
      size: positionArray[5],
      leverage: positionArray[6],
      entryPrice: positionArray[7],
      openTimestamp: positionArray[8],
      status: positionArray[9],
    };
  }

  // Check if position has valid data
  if (!position.id || position.id === 0n) {
    return {
      position: null,
      isLoading,
      refetch,
    };
  }

  return {
    position,
    isLoading,
    refetch,
  };
}

/**
 * Hook to get all user positions with full details
 * Fetches each position individually since batch function may not exist
 */
export function useUserPositionsWithDetails(token: CollateralToken = 'USDC') {
  const { positionIds, isLoading: isLoadingIds, refetch: refetchIds } = useUserPositions(token);

  // For now, just use the position IDs and fetch them individually in the component
  // This is a simpler approach that doesn't require a batch function
  return {
    positions: [],
    positionIds,
    allPositions: [],
    isLoading: isLoadingIds,
    refetch: refetchIds,
  };
}
