'use client';

import React, { useState } from 'react';
import PositionRow from './PositionRow';
import MobilePositionCard from './MobilePositionCard';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PositionRef } from '@/hooks/data/usePositions';
import { CollateralToken } from '@/config/contracts';

interface PositionsTableProps {
  positions: PositionRef[];
  isLoading: boolean;
  openPositionsCount: number;
  isClosing: boolean;
  selectedPositionKey?: string;
  tpslRefreshTrigger: number;
  onClosePosition: (positionId: bigint, symbol: string, collateralToken: CollateralToken) => void;
  onPositionClick: (
    positionId: bigint,
    symbol: string,
    entryPrice: number,
    isLong: boolean,
    collateralToken: CollateralToken,
  ) => void;
  onTPSLClick: (
    positionId: bigint,
    trader: string,
    symbol: string,
    entryPrice: number,
    isLong: boolean,
    collateralToken: CollateralToken,
  ) => void;
  onPositionLoaded: (
    positionId: bigint,
    isOpen: boolean,
    symbol: string,
    collateralToken: CollateralToken,
  ) => void;
  onCloseAll: () => void;
}

const PositionsTable = ({
  positions,
  isLoading,
  openPositionsCount,
  isClosing,
  selectedPositionKey,
  tpslRefreshTrigger,
  onClosePosition,
  onPositionClick,
  onTPSLClick,
  onPositionLoaded,
  onCloseAll,
}: PositionsTableProps) => {
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'single' | 'all'>('single');
  const [targetPosition, setTargetPosition] = useState<{ id: bigint; symbol: string } | null>(null);
  const [targetToken, setTargetToken] = useState<CollateralToken>('USDC');

  // Handle "Close" click on a single position
  const handleRequestClose = (
    positionId: bigint,
    symbol: string,
    collateralToken: CollateralToken,
  ) => {
    setTargetPosition({ id: positionId, symbol });
    setTargetToken(collateralToken);
    setActionType('single');
    setIsDialogOpen(true);
  };

  // Handle "Close All" click
  const handleRequestCloseAll = () => {
    setActionType('all');
    setIsDialogOpen(true);
  };

  // Confirm Action
  const handleConfirmClose = () => {
    if (actionType === 'all') {
      onCloseAll();
    } else if (targetPosition) {
      onClosePosition(targetPosition.id, targetPosition.symbol, targetToken);
    }
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-4"></div>
        <span>Loading positions...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Actions Bar for Desktop */}
      <div className="hidden md:flex justify-end p-2 border-b border-gray-800/50">
        {openPositionsCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRequestCloseAll}
            disabled={isClosing}
            className="h-7 text-xs font-bold"
          >
            Close All Positions
          </Button>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-[#0B1017] sticky top-0 z-10">
            <TableRow className="border-b border-gray-800 hover:bg-transparent">
              <TableHead className="font-medium min-w-[140px]">Position</TableHead>
              <TableHead className="text-right font-medium">Size</TableHead>
              <TableHead className="text-right font-medium">PnL (ROE%)</TableHead>
              <TableHead className="text-right font-medium">Collateral</TableHead>
              <TableHead className="text-right font-medium">Entry Price</TableHead>
              <TableHead className="text-right font-medium">Mark Price</TableHead>
              <TableHead className="text-right font-medium">Liq. Price</TableHead>
              <TableHead className="text-right font-medium">TP / SL</TableHead>
              <TableHead className="text-right font-medium w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openPositionsCount === 0 && (
              <TableRow className="border-b border-gray-800">
                <TableCell colSpan={9} className="text-center py-16 text-gray-500">
                  No open positions
                </TableCell>
              </TableRow>
            )}
            {positions.map((positionRef) => {
              const key = `${positionRef.collateralToken}:${positionRef.id.toString()}`;
              return (
                <PositionRow
                  key={`${key}-${tpslRefreshTrigger}`}
                  positionId={positionRef.id}
                  collateralToken={positionRef.collateralToken}
                  onClose={(id, symbol) =>
                    handleRequestClose(id, symbol, positionRef.collateralToken)
                  }
                  onPositionClick={(id, symbol, entryPrice, isLong) =>
                    onPositionClick(id, symbol, entryPrice, isLong, positionRef.collateralToken)
                  }
                  onTPSLClick={(id, trader, symbol, entryPrice, isLong) =>
                    onTPSLClick(id, trader, symbol, entryPrice, isLong, positionRef.collateralToken)
                  }
                  isSelected={selectedPositionKey === key}
                  onPositionLoaded={onPositionLoaded}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4 flex-1 overflow-y-auto p-4">
        {openPositionsCount === 0 && (
          <div className="text-center py-8 text-gray-500">No open positions</div>
        )}
        {openPositionsCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRequestCloseAll}
            disabled={isClosing}
            className="w-full mb-4 font-bold"
          >
            Close All Positions
          </Button>
        )}
        {positions.map((positionRef) => {
          const key = `${positionRef.collateralToken}:${positionRef.id.toString()}`;
          return (
          <MobilePositionCard
            key={`mobile-${key}-${tpslRefreshTrigger}`}
            positionId={positionRef.id}
            collateralToken={positionRef.collateralToken}
            onClose={(id, symbol) =>
              handleRequestClose(id, symbol, positionRef.collateralToken)
            }
            onPositionClick={(id, symbol, entryPrice, isLong) =>
              onPositionClick(id, symbol, entryPrice, isLong, positionRef.collateralToken)
            }
            onTPSLClick={(id, trader, symbol, entryPrice, isLong) =>
              onTPSLClick(id, trader, symbol, entryPrice, isLong, positionRef.collateralToken)
            }
            onPositionLoaded={onPositionLoaded}
          />
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-[#131B26] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'all' ? 'Close All Positions?' : 'Close Position?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {actionType === 'all'
                ? 'Are you sure you want to close ALL open positions? This action cannot be undone.'
                : `Are you sure you want to close your ${targetPosition?.symbol} position at market price?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Confirm Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PositionsTable;
