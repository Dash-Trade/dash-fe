'use client';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Info } from 'lucide-react';
import { useMarket } from '@/features/trading/contexts/MarketContext';
import { useTapToTrade } from '@/features/trading/contexts/TapToTradeContext';
import { toast } from 'sonner';
import { useTokenBalance } from '@/hooks/data/useTokenBalance';
import {
  COLLATERAL_CONFIG,
  COLLATERAL_TOKENS,
  CollateralToken,
} from '@/config/contracts';
import { useGlobalTradingActivation } from '@/features/wallet/hooks/useGlobalTradingActivation';
import { useActivePrivyWallet } from '@/features/wallet/hooks/useActivePrivyWallet';

// Import Shared Components
import { MarketSelector, Market } from './components/MarketSelector';
import { CollateralInput } from './components/CollateralInput';
import { LeverageSelector } from './components/LeverageSelector';

// Import Feature Specific Components
import { TimeframeSelector } from './tap-to-trade/TimeframeSelector';
import { GridSettings } from './tap-to-trade/GridSettings';
import { TradeActionButtons } from './tap-to-trade/TradeActionButtons';
import { TradeInfoSection } from './tap-to-trade/TradeInfoSection';

interface TapToTradeProps {
  onMobileClose?: () => void;
}

const TapToTrade: React.FC<TapToTradeProps> = ({ onMobileClose }) => {
  const {
    activeMarket,
    setActiveMarket,
    timeframe,
    setTimeframe,
    currentPrice,
    collateralToken,
    setCollateralToken,
  } = useMarket();
  const collateralConfig = COLLATERAL_CONFIG[collateralToken as CollateralToken];
  const { balance, isLoadingBalance } = useTokenBalance(
    collateralConfig.address,
    collateralConfig.decimals,
  );
  const { activeWallet } = useActivePrivyWallet();
  const [leverage, setLeverage] = useState(10);
  const [marginAmount, setMarginAmount] = useState<string>('');
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [hasSelectedYGrid, setHasSelectedYGrid] = useState(false); // Track if user explicitly selected Y grid

  const {
    approveAll,
    hasGlobalAllowance,
    isApproving: isApprovalPending,
    maxApproval,
    refetchAllowances,
  } = useGlobalTradingActivation();

  // Tap to Trade dari Context
  const tapToTrade = useTapToTrade();

  // Use trade mode from context
  const tradeMode = tapToTrade.tradeMode;

  useEffect(() => {
    refetchAllowances?.();
  }, [refetchAllowances, tradeMode]);

  const leverageMarkers = [1, 2, 5, 10, 25, 50, 100]; // Updated to match MarketOrder

  // Check if we have large allowance (> $10,000) - memoized to prevent setState during render
  const hasLargeAllowance = useMemo(() => {
    return hasGlobalAllowance(maxApproval);
  }, [hasGlobalAllowance, maxApproval]);

  const hasLargeOneTapProfitAllowance = hasLargeAllowance;

  // Handler for pre-approve USDC in large amount
  const handlePreApprove = async () => {
    try {
      toast.loading('Approving collateral...', { id: 'pre-approve' });
      await approveAll(maxApproval);
      toast.success('Pre-approved! You can now trade without approval popups', {
        id: 'pre-approve',
        duration: 5000,
      });
    } catch (error) {
      console.error('Pre-approve error:', error);
      toast.error('Failed to approve collateral. Please try again.', {
        id: 'pre-approve',
      });
    }
  };

  // Handler for pre-approve USDC for OneTapProfit
  const handlePreApproveOneTapProfit = async () => {
    try {
      toast.loading('Approving collateral for Binary Trading...', {
        id: 'binary-pre-approve',
      });
      await approveAll(maxApproval);
      toast.success('Pre-approved! You can now enable Binary Trading', {
        id: 'binary-pre-approve',
        duration: 5000,
      });
    } catch (error) {
      console.error('OneTapProfit pre-approve error:', error);
      toast.error('Failed to approve collateral. Please try again.', {
        id: 'binary-pre-approve',
      });
    }
  };

  // Handler untuk mengganti market dan update chart
  const handleMarketSelect = (market: Market) => {
    setActiveMarket({ ...market, category: market.category || 'crypto' });
    setIsMarketSelectorOpen(false);
  };

  const handleMarginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMarginAmount(value);
      // Sync with context for OneTapProfit mode
      if (tradeMode === 'one-tap-profit') {
        tapToTrade.setBetAmount(value);
      }
    }
  };

  const handleMaxClick = () => {
    setMarginAmount(balance);
  };

  const marginUsdValue = marginAmount ? parseFloat(marginAmount) : 0;

  const selectedTimeframeLabel =
    timeframe === '1'
      ? '1m'
      : timeframe === '5'
      ? '5m'
      : timeframe === '15'
      ? '15m'
      : timeframe === '30'
      ? '30m'
      : timeframe === '60'
      ? '1H'
      : timeframe === '240'
      ? '4H'
      : timeframe === 'D'
      ? '1D'
      : '1m';

  return (
    <div className="flex flex-col gap-3 px-4 py-4 bg-trading-bg h-full">
      {/* One Tap Profit Info Banner */}
      {tradeMode === 'one-tap-profit' && (
        <div className="bg-info/10 border border-info/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="text-xs font-semibold text-info">One Tap Profit Mode</div>
              <div className="text-xs text-info space-y-0.5">
                <div>• Chart updates in real-time per second</div>
                <div>• Fixed grid: 10 seconds per X-axis</div>
                <div>
                  • Price grid: ${activeMarket?.symbol === 'SOL' ? '0.1' : '10'} per Y-axis
                  increment
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Selector */}
      <MarketSelector
        value={activeMarket}
        onSelect={handleMarketSelect}
        disabled={tapToTrade.isEnabled && tradeMode === 'open-position'}
      />

      {/* Margin Input */}
      <CollateralInput
        value={marginAmount}
        onChange={handleMarginInputChange}
        balance={balance}
        isLoadingBalance={isLoadingBalance}
        onMaxClick={handleMaxClick}
        label={tradeMode === 'one-tap-profit' ? 'Bet Amount' : 'Margin'}
        disabled={tapToTrade.isEnabled}
        tokenSymbol={collateralToken}
        tokenIcon={collateralConfig.icon}
        tokenOptions={COLLATERAL_TOKENS.map((token) => ({
          symbol: token,
          icon: COLLATERAL_CONFIG[token].icon,
        }))}
        onTokenChange={(token) => setCollateralToken(token as CollateralToken)}
      />

      {/* Leverage Input - Hidden for One Tap Profit */}
      {tradeMode !== 'one-tap-profit' && (
        <LeverageSelector
          leverage={leverage}
          onLeverageChange={setLeverage}
          disabled={tapToTrade.isEnabled}
          markers={leverageMarkers}
        />
      )}

      {/* Timeframe Selector - Only for Open Position mode */}
      {tradeMode === 'open-position' && (
        <TimeframeSelector
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          disabled={tapToTrade.isEnabled}
        />
      )}

      {/* Grid Configuration - Only for Open Position mode */}
      <GridSettings
        tradeMode={tradeMode === 'open-position' ? 'open-position' : 'one-tap-profit'}
        activeMarket={activeMarket}
        timeframe={timeframe}
        currentPrice={currentPrice}
        setHasSelectedYGrid={setHasSelectedYGrid}
      />

      {/* Info Section */}
      <TradeInfoSection
        tradeMode={tradeMode === 'open-position' ? 'open-position' : 'one-tap-profit'}
        activeMarket={activeMarket}
        marginUsdValue={marginUsdValue}
        leverage={leverage}
        timeframe={timeframe}
        selectedTimeframeLabel={selectedTimeframeLabel}
        xCoordinate={tapToTrade.gridSizeX ? tapToTrade.gridSizeX.toString() : ''}
        yCoordinate={tapToTrade.gridSizeY ? tapToTrade.gridSizeY.toString() : ''}
      />

      {/* Action Buttons - Now handles approval logic */}
      <TradeActionButtons
        tradeMode={tradeMode === 'open-position' ? 'open-position' : 'one-tap-profit'}
        tapToTrade={tapToTrade}
        activeMarket={activeMarket}
        marginAmount={marginAmount}
        leverage={leverage}
        timeframe={timeframe}
        currentPrice={currentPrice}
        hasLargeAllowance={hasLargeAllowance}
        hasLargeOneTapProfitAllowance={hasLargeOneTapProfitAllowance}
        hasSelectedYGrid={hasSelectedYGrid}
        activeWallet={activeWallet}
        onPreApprove={handlePreApprove}
        onPreApproveOneTapProfit={handlePreApproveOneTapProfit}
        isApprovalPending={isApprovalPending}
        isOneTapProfitApprovalPending={isApprovalPending}
        disabled={
          tradeMode === 'one-tap-profit'
            ? !marginAmount || !activeMarket
            : !marginAmount || !leverage || !timeframe || !activeMarket || !hasSelectedYGrid
        }
        onMobileClose={onMobileClose}
      />
    </div>
  );
};

export default TapToTrade;
