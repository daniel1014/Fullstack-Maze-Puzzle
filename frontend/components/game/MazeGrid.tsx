'use client';

import { memo } from 'react';
import { PuzzleDetail } from '@/lib/api';
import { puzzleUtils, cn } from '@/lib/utils';

interface MazeGridProps {
  puzzle: PuzzleDetail;
  currentPos: { r: number; c: number };
  traceSet: Set<string>;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

export const MazeGrid = memo(function MazeGrid({
  puzzle,
  currentPos,
  traceSet,
  onKeyDown
}: MazeGridProps) {
  return (
    <div 
      className="inline-block border border-[var(--color-border)] rounded-md p-3 bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="grid"
      aria-label={`Maze grid ${puzzle.grid.rows} by ${puzzle.grid.cols}, ${puzzle.title}`}
      aria-rowcount={puzzle.grid.rows}
      aria-colcount={puzzle.grid.cols}
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
    >
      {puzzle.grid.cells.map((row, r) => (
        <div 
          key={`row-${r}`}
          role="row"
          aria-rowindex={r + 1}
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${puzzle.grid.cols}, minmax(0, 1fr))`,
          }}
        >
          {row.map((cell, c) => {
            const isStart = r === puzzle.grid.start.r && c === puzzle.grid.start.c;
            const isGoal = r === puzzle.grid.goal.r && c === puzzle.grid.goal.c;
            const isPlayer = r === currentPos.r && c === currentPos.c;
            const isInTrace = traceSet.has(`${r}-${c}`);
            
            // Create aria-label for accessibility
            let ariaLabel = `Row ${r + 1}, Column ${c + 1}`;
            if (isPlayer) ariaLabel += ', current position';
            if (isStart) ariaLabel += ', start';
            if (isGoal) ariaLabel += ', goal';
            if (cell === 'W') ariaLabel += ', wall';
            else if (cell === 'K') ariaLabel += ', key';
            else if (cell === 'D') ariaLabel += ', door';
            else if (cell.startsWith?.('P')) ariaLabel += ', portal';
            else if (cell === ' ') ariaLabel += ', empty';
            
            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  puzzleUtils.getCellClass(cell, isPlayer, isInTrace),
                  "relative aspect-square w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12"
                )}
                role="gridcell"
                aria-label={ariaLabel}
                aria-rowindex={r + 1}
                aria-colindex={c + 1}
                aria-current={isPlayer ? "true" : undefined}
              >
                <span className="text-base sm:text-lg">
                  {isPlayer ? '👤' : puzzleUtils.getCellDisplay(cell)}
                </span>
                
                {/* Show start/goal indicators */}
                {isStart && !isPlayer && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                )}
                {isGoal && !isPlayer && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});