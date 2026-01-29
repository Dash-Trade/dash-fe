'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, DollarSign, Zap } from 'lucide-react';
import { useOneTapProfit } from '@/features/trading/hooks/useOneTapProfitBetting';
import { useTokenBalance } from '@/hooks/data/useTokenBalance';
import { useMarket } from '@/features/trading/contexts/MarketContext';
import { COLLATERAL_CONFIG, CollateralToken } from '@/config/contracts';

interface OneTapProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  targetPrice: string;
  targetTime: number;
  entryPrice: string;
  entryTime: number;
  isBinaryTradingEnabled: boolean; // New: check if binary trading is enabled
}

const OneTapProfitModal: React.FC<OneTapProfitModalProps> = ({
  isOpen,
  onClose,
  symbol,
  targetPrice,
  targetTime,
  entryPrice,
  entryTime,
  isBinaryTradingEnabled,
}) => {
  const { collateralToken } = useMarket();
  const collateralConfig = COLLATERAL_CONFIG[collateralToken as CollateralToken];
  const { placeBet, placeBetWithSession, calculateMultiplier, isPlacingBet, isSessionValid } =
    useOneTapProfit(collateralToken);
  const { balance } = useTokenBalance(collateralConfig.address, collateralConfig.decimals);
  
  const [betAmount, setBetAmount] = useState('10');
  const [multiplier, setMultiplier] = useState<number | null>(null);
  const [priceDistance, setPriceDistance] = useState('');
  const [timeDistance, setTimeDistance] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');

  // Calculate multiplier when modal opens
  useEffect(() => {
    if (isOpen) {
      calculateMultiplierData();
    }
  }, [isOpen, entryPrice, targetPrice, entryTime, targetTime]);

  const calculateMultiplierData = async () => {
    setIsCalculating(true);
    try {
      const result = await calculateMultiplier(entryPrice, targetPrice, entryTime, targetTime);
      setMultiplier(result.multiplier / 100); // Convert from basis 100 to decimal
      setPriceDistance(result.priceDistance);
      setTimeDistance(result.timeDistance);
    } catch (error) {
      console.error('Failed to calculate multiplier:', error);
      setError('Failed to calculate multiplier');
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!isBinaryTradingEnabled) {
      setError('Please enable Binary Trading first');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(balance)) {
      setError(`Insufficient ${collateralToken} balance`);
      return;
    }

    setError('');

    try {
      if (isSessionValid()) {
        // Use session key for fully gasless betting
        await placeBetWithSession({
          symbol,
          betAmount,
          targetPrice,
          targetTime,
          entryPrice,
          entryTime,
        });
      } else {
        // Fallback to manual signature if session key is unavailable
        await placeBet({
          symbol,
          betAmount,
          targetPrice,
          targetTime,
          entryPrice,
          entryTime,
        });
      }

      onClose();
      setBetAmount('10'); // Reset
    } catch (error: any) {
      console.error('Failed to place bet:', error);
      setError(error.message || 'Failed to place bet');
    }
  };

  const potentialWin = multiplier ? (parseFloat(betAmount) * multiplier).toFixed(2) : '0.00';
  const priceDirection = parseFloat(targetPrice) > parseFloat(entryPrice) ? 'UP' : 'DOWN';
  const priceChange = ((parseFloat(targetPrice) - parseFloat(entryPrice)) / parseFloat(entryPrice) * 100).toFixed(2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A2332] border border-[#2D3748] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2D3748]">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-400" size={20} />
            <h2 className="text-lg font-bold text-white">One Tap Profit</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Prediction Summary */}
          <div className="bg-[#0F1419] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Symbol</span>
              <span className="text-white font-bold">{symbol}/USD</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Current Price</span>
              <span className="text-white">${parseFloat(entryPrice).toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Target Price</span>
              <div className="flex items-center gap-2">
                <span className="text-white">${parseFloat(targetPrice).toLocaleString()}</span>
                <span className={`text-xs font-bold ${priceDirection === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                  {priceDirection} {Math.abs(parseFloat(priceChange))}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Time Window</span>
              <span className="text-white">{timeDistance}s</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#2D3748]">
              <span className="text-gray-400 text-sm">Multiplier</span>
              <div className="flex items-center gap-2">
                {isCalculating ? (
                  <span className="text-gray-400 text-sm">Calculating...</span>
                ) : (
                  <>
                    <TrendingUp className="text-yellow-400" size={16} />
                    <span className="text-yellow-400 font-bold text-lg">{multiplier?.toFixed(2)}x</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bet Amount Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Bet Amount ({collateralToken})
            </label>
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-[#0F1419] border border-[#2D3748] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0"
                step="0.1"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {collateralToken}
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                Balance: {parseFloat(balance).toFixed(2)} {collateralToken}
              </span>
              <button
                onClick={() => setBetAmount((parseFloat(balance) * 0.5).toFixed(2))}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Use 50%
              </button>
            </div>
          </div>

          {/* Potential Win */}
          <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium">Potential Win</span>
              <div className="flex items-center gap-2">
                <DollarSign className="text-green-400" size={18} />
                <span className="text-green-400 font-bold text-xl">
                  {potentialWin} {collateralToken}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              If price reaches ${parseFloat(targetPrice).toLocaleString()} within {timeDistance}s
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-[#2D3748] hover:bg-[#3D4A5F] text-white py-3 rounded-lg font-medium transition-colors"
              disabled={isPlacingBet}
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceBet}
              disabled={isPlacingBet || isCalculating || !multiplier}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
            </button>
          </div>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center">
            Trading fee: 0.05% • Gasless transaction
          </p>
        </div>
      </div>
    </div>
  );
};

export default OneTapProfitModal;
