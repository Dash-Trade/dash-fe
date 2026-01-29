'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Market } from '@/features/trading/types';
import { ALL_MARKETS } from '@/features/trading/constants/markets';
import { CollateralToken } from '@/config/contracts';

interface SelectedPosition {
  positionId: bigint;
  symbol: string;
  entryPrice: number;
  isLong: boolean;
  collateralToken?: CollateralToken;
}

interface MarketContextType {
  activeMarket: Market;
  setActiveMarket: (market: Market) => void;
  currentPrice: string;
  setCurrentPrice: (price: string) => void;
  timeframe: string;
  setTimeframe: (timeframe: string) => void;
  selectedPosition: SelectedPosition | null;
  setSelectedPosition: (position: SelectedPosition | null) => void;
  chartPositions: boolean;
  setChartPositions: (show: boolean) => void;
  collateralToken: CollateralToken;
  setCollateralToken: (token: CollateralToken) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeMarket, setActiveMarket] = useState<Market>(ALL_MARKETS[0]);
  const [currentPrice, setCurrentPrice] = useState<string>('0');
  const [timeframe, setTimeframe] = useState<string>('1'); // Default 1 minute
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);
  const [chartPositions, setChartPositions] = useState<boolean>(true);
  const [collateralToken, setCollateralToken] = useState<CollateralToken>('USDC');

  return (
    <MarketContext.Provider
      value={{
        activeMarket,
        setActiveMarket,
        currentPrice,
        setCurrentPrice,
        timeframe,
        setTimeframe,
        selectedPosition,
        setSelectedPosition,
        chartPositions,
        setChartPositions,
        collateralToken,
        setCollateralToken,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
