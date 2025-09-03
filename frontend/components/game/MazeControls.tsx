'use client';

import { memo, useEffect, useId } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Play, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'ready' | 'playing' | 'completed' | 'blocked' | 'submitted';
type ControlsMode = 'all' | 'movement-only' | 'actions-only';

interface MazeControlsProps {
  status: GameStatus;
  canSubmit: boolean;
  isSubmitting: boolean;
  onMove: (direction: Direction) => void;
  onSubmit: () => void;
  onReset: () => void;
  mode?: ControlsMode;
}

export const MazeControls = memo(function MazeControls({
  status,
  canSubmit,
  isSubmitting,
  onMove,
  onSubmit,
  onReset,
  mode = 'all'
}: MazeControlsProps) {
  const canMove = status === 'playing' || status === 'ready';
  const hintId = useId();

  // Handle keyboard input
  useEffect(() => {
    if (!canMove || mode === 'actions-only') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      switch (key) {
        case 'arrowup':
        case 'w':
          e.preventDefault();
          onMove('UP');
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          onMove('DOWN');
          break;
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          onMove('LEFT');
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          onMove('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canMove, onMove]);

  return (
    <div className="space-y-3">
      {/* Movement Controls Card */}
      {mode !== 'actions-only' && (
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Keyboard className="w-5 h-5 mr-2 text-blue-600" />
              Movement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Directional Controls */}
            <div 
              role="group" 
              aria-label="Movement controls" 
              aria-describedby={hintId}
              className="grid grid-cols-3 gap-2 w-44 mx-auto"
            >
              <div></div>
              <Button
                type="button"
                variant="outline"
                className="w-11 h-11 p-0 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 active:scale-[0.98] motion-reduce:transform-none"
                onClick={() => onMove('UP')}
                disabled={!canMove}
                aria-label="Move up"
                title="Move up (↑ or W)"
              >
                <ArrowUp className="w-5 h-5" aria-hidden="true" />
              </Button>
              <div></div>
              
              <Button
                type="button"
                variant="outline"
                className="w-11 h-11 p-0 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 active:scale-[0.98] motion-reduce:transform-none"
                onClick={() => onMove('LEFT')}
                disabled={!canMove}
                aria-label="Move left"
                title="Move left (← or A)"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-11 h-11 p-0 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 active:scale-[0.98] motion-reduce:transform-none"
                onClick={() => onMove('DOWN')}
                disabled={!canMove}
                aria-label="Move down"
                title="Move down (↓ or S)"
              >
                <ArrowDown className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-11 h-11 p-0 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 active:scale-[0.98] motion-reduce:transform-none"
                onClick={() => onMove('RIGHT')}
                disabled={!canMove}
                aria-label="Move right"
                title="Move right (→ or D)"
              >
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>

            {/* Keyboard hint */}
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <Keyboard className="w-4 h-4 text-gray-500 mr-2" aria-hidden="true" />
                <span id={hintId} className="text-sm text-gray-600">Arrow keys or WASD</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Actions */}
      {mode !== 'movement-only' && (
        <div className="space-y-2.5">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none disabled:transform-none"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" aria-hidden="true" />
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none" aria-hidden="true"></span>
                <span aria-live="polite">Submitting...</span>
              </span>
            ) : (
              'Submit Solution'
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            size="lg"
            className="w-full border-gray-300 hover:bg-gray-50 font-semibold py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.98] motion-reduce:transform-none"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Reset Game
          </Button>
        </div>
      )}
    </div>
  );
});