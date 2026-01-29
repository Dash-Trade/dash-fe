import React from 'react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '../utils/formatUtils';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface CollateralInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  balance: string | number;
  isLoadingBalance?: boolean;
  onMaxClick: () => void;
  label?: string;
  disabled?: boolean;
  tokenSymbol?: string;
  tokenIcon?: string;
  tokenOptions?: { symbol: string; icon?: string }[];
  onTokenChange?: (symbol: string) => void;
}

export const CollateralInput: React.FC<CollateralInputProps> = ({
  value,
  onChange,
  balance,
  isLoadingBalance = false,
  onMaxClick,
  label = 'Collateral',
  disabled = false,
  tokenSymbol = 'USDC',
  tokenIcon = '/icons/usdc.png',
  tokenOptions,
  onTokenChange,
}) => {
  const usdValue = value ? parseFloat(value) : 0;

  return (
    <div
      className={`bg-trading-surface border border-border-default rounded-lg p-3 grid ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {label && <label className="text-xs text-text-secondary mb-2 block">{label}</label>}

      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="0.0"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="bg-transparent text-2xl text-text-primary outline-none disabled:cursor-not-allowed placeholder-text-muted flex-1 w-full min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Image
            src={tokenIcon}
            alt={tokenSymbol}
            width={28}
            height={28}
            className="rounded-full"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
          {tokenOptions && onTokenChange ? (
            <div className="relative">
              <select
                value={tokenSymbol}
                onChange={(e) => onTokenChange(e.target.value)}
                className="appearance-none bg-[#111827] border border-slate-700/70 text-sm font-semibold text-white rounded-md pl-2 pr-6 py-1.5 outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40"
              >
                {tokenOptions.map((option) => (
                  <option key={option.symbol} value={option.symbol}>
                    {option.symbol}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <span className="font-medium text-text-primary">{tokenSymbol}</span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted">{formatPrice(usdValue)}</span>
        <div className="flex items-center gap-2 max-w-[60%] justify-end">
          <span className="text-text-muted truncate">
            {isLoadingBalance ? 'Loading...' : `${balance} ${tokenSymbol}`}
          </span>
          <Button
            onClick={onMaxClick}
            disabled={disabled}
            size="sm"
            className="h-6 px-2 text-xs text-white"
          >
            Max
          </Button>
        </div>
      </div>
    </div>
  );
};
