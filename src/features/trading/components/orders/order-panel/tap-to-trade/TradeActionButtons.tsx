import React from 'react';
import { toast } from 'sonner';
import { ConnectedWallet } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Market } from '../components/MarketSelector';

interface TradeActionButtonsProps {
  tradeMode: 'open-position' | 'one-tap-profit';
  tapToTrade: any;
  activeMarket: Market | null;
  marginAmount: string;
  leverage: number;
  timeframe: string;
  currentPrice: string;
  hasLargeAllowance: boolean;
  hasLargeOneTapProfitAllowance: boolean;
  hasSelectedYGrid: boolean;
  activeWallet?: ConnectedWallet;

  onPreApprove: () => Promise<void>;
  onPreApproveOneTapProfit: () => Promise<void>;
  isApprovalPending: boolean;
  isOneTapProfitApprovalPending: boolean;
  disabled?: boolean;
  onMobileClose?: () => void;
}

export const TradeActionButtons: React.FC<TradeActionButtonsProps> = ({
  tradeMode,
  tapToTrade,
  activeMarket,
  marginAmount,
  leverage,
  timeframe,
  currentPrice,
  hasLargeAllowance,
  hasLargeOneTapProfitAllowance,
  hasSelectedYGrid,
  activeWallet,

  onPreApprove,
  onPreApproveOneTapProfit,
  isApprovalPending,
  isOneTapProfitApprovalPending,
  disabled,
  onMobileClose,
}) => {
  const handleMainAction = async () => {
    if (tradeMode === 'open-position' && !hasLargeAllowance) {
      await onPreApprove();
    } else if (tradeMode === 'one-tap-profit' && !hasLargeOneTapProfitAllowance) {
      await onPreApproveOneTapProfit();
    }

    if (!marginAmount || parseFloat(marginAmount) === 0) {
      toast.error(
        tradeMode === 'one-tap-profit' ? 'Please enter bet amount' : 'Please enter margin amount',
      );
      return;
    }

    if (tradeMode === 'open-position' && !hasSelectedYGrid) {
      toast.error('Please select Y Coordinate (Price Grid) first');
      return;
    }

    if (tradeMode === 'open-position') {
      await tapToTrade.toggleMode({
        symbol: activeMarket?.symbol || 'BTC',
        margin: marginAmount,
        leverage: leverage,
        timeframe: timeframe,
        currentPrice: Number(currentPrice) || 0,
      });
      onMobileClose?.();
  } else {
    // Binary Trading Logic
    try {
      toast.loading('Creating session key...', {
        id: 'binary-session',
      });

      if (!activeWallet) {
        throw new Error('Privy wallet not found');
      }

      const walletClient = await activeWallet.getEthereumProvider();
      if (!walletClient) throw new Error('Could not get wallet client');

      let hasSession = false;
      try {
        const newSession = await tapToTrade.createSession(
          activeWallet.address,
          walletClient,
          30 * 60 * 1000,
        );
        hasSession = !!newSession;
        if (!newSession) {
          toast.error(
            'Session key failed. You can still trade, but signatures will be required.',
            { id: 'binary-session', duration: 5000 },
          );
        }
      } catch (sessionErr: any) {
        console.error('Session key creation failed:', sessionErr);
        toast.error(
          sessionErr?.message ||
            'Session key failed. You can still trade, but signatures will be required.',
          { id: 'binary-session', duration: 5000 },
        );
      }

      await tapToTrade.toggleMode({
        symbol: activeMarket?.symbol || 'BTC',
        margin: marginAmount,
        leverage: 1,
        timeframe: '1',
        currentPrice: Number(currentPrice) || 0,
      });

      tapToTrade.setIsBinaryTradingEnabled(true);
      toast.success(
        hasSession ? 'Binary Trading enabled!' : 'Binary Trading enabled (manual signing)',
        { id: 'binary-session', duration: 5000 },
      );
      onMobileClose?.();
    } catch (error) {
      console.error('Failed to enable binary trading:', error);
      toast.error(
        (error as Error)?.message || 'Failed to enable binary trading',
        { id: 'binary-session' },
      );
    }
  }
  };

  const STOP_ACTION = async () => {
    if (tradeMode === 'one-tap-profit') {
      tapToTrade.setIsBinaryTradingEnabled(false);
      await tapToTrade.toggleMode();
      toast.success('Binary Trading stopped');
    } else {
      await tapToTrade.toggleMode();
    }
  };

  if (tapToTrade.isEnabled) {
    return (
      <Button
        variant="destructive"
        size="lg"
        onClick={STOP_ACTION}
        disabled={tapToTrade.isLoading}
        className="w-full mt-2 font-bold shadow-lg shadow-destructive/30"
      >
        {tapToTrade.isLoading
          ? 'Stopping...'
          : tradeMode === 'one-tap-profit'
          ? 'Stop Trading'
          : 'Stop Tap to Trade'}
      </Button>
    );
  }

  // Determine Button State
  let buttonText = 'Enable Tap to Trade';
  let isLoading = false;
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' = 'default';

  if (tradeMode === 'open-position') {
    if (!hasLargeAllowance) {
      buttonText = isApprovalPending ? 'Approving Collateral...' : 'Activate Trading';
      isLoading = isApprovalPending;
      variant = 'default';
    } else {
      buttonText = tapToTrade.isLoading ? 'Setting up session...' : 'Enable Tap to Trade';
      isLoading = tapToTrade.isLoading;
    }
  } else {
    if (!hasLargeOneTapProfitAllowance) {
      buttonText = isOneTapProfitApprovalPending
        ? 'Approving Collateral...'
        : 'Activate Trading';
      isLoading = isOneTapProfitApprovalPending;
    } else {
      buttonText = tapToTrade.isLoading ? 'Setting up session...' : 'Enable Binary Trade';
      isLoading = tapToTrade.isLoading;
    }
  }

  return (
    <Button
      size="lg"
      className="w-full mt-2 font-bold shadow-lg shadow-primary/30"
      onClick={handleMainAction}
      disabled={disabled || isLoading}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {buttonText}
    </Button>
  );
};
