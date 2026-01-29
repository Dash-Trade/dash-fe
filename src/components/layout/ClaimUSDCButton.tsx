'use client';

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { DollarSign } from 'lucide-react';
import { useUSDCFaucet } from '@/hooks/wallet/useUSDCFaucet';

const ClaimUSDCButton: React.FC = () => {
  const { authenticated } = usePrivy();
  const { isClaiming, handleClaimUSDC } = useUSDCFaucet();

  if (!authenticated) {
    return null;
  }

  return (
    <button
      onClick={handleClaimUSDC}
      disabled={isClaiming}
      className="hidden xl:flex items-center gap-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
      title="Claim 1,000 USDC + 1,000,000 IDRX"
    >
      <DollarSign className="w-5 h-5" />
      {isClaiming ? 'Claiming...' : 'Claim Faucet'}
    </button>
  );
};

export default ClaimUSDCButton;
