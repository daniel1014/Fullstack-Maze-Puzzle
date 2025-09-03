'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useEffect, useReducer, useCallback, useRef, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { puzzleAPI, PuzzleDetail, AttemptResponse } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import { puzzleUtils } from '@/lib/utils';
import { MazeGrid } from '@/components/game/MazeGrid';
import { MazeHUD } from '@/components/game/MazeHUD';
import { MazeControls } from '@/components/game/MazeControls';
import { GameResult } from '@/components/game/GameResult';
import GameModal from '@/components/game/GameModal';

// Game state management
type GameState = {
  currentPos: { r: number; c: number };
  keysCollected: Set<string>;
  moves: string[];
  steps: number;
  status: 'ready' | 'playing' | 'submitted' | 'completed' | 'blocked';
  startTime: number | null;
  trace: Array<{ r: number; c: number }>;
  traceSet: Set<string>; // For O(1) lookup performance
  puzzle: PuzzleDetail | null; // Store puzzle data for game logic
  message: string;
};

// Direction type for better type safety
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

type GameAction = 
  | { type: 'INIT'; puzzle: PuzzleDetail }
  | { type: 'START_GAME' }
  | { type: 'MOVE'; direction: Direction }
  | { type: 'RESET' }
  | { type: 'SUBMIT' }
  | { type: 'COMPLETE'; result: AttemptResponse };

// Movement deltas
const MOVE_DELTAS = {
  UP: { r: -1, c: 0 },
  DOWN: { r: 1, c: 0 },
  LEFT: { r: 0, c: -1 },
  RIGHT: { r: 0, c: 1 }
} as const;

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT':
      const puzzle = action.puzzle;
      const initialPos = puzzle.grid.start;
      const initialTrace = [initialPos];
      return {
        currentPos: initialPos,
        keysCollected: new Set(),
        moves: [],
        steps: 0,
        status: 'ready',
        startTime: null,
        trace: initialTrace,
        traceSet: new Set([`${initialPos.r}-${initialPos.c}`]),
        puzzle: puzzle,
        message: 'Ready to start! Move to begin.',
      };

    case 'START_GAME':
      return {
        ...state,
        status: 'playing',
        startTime: Date.now(),
        message: 'Game started! Navigate to the goal.',
      };

    case 'MOVE':
      if (state.status !== 'playing' || !state.puzzle) return state;
      
      const delta = MOVE_DELTAS[action.direction];
      const newPos = {
        r: state.currentPos.r + delta.r,
        c: state.currentPos.c + delta.c
      };
      
      const { rows, cols, cells, portals = {} } = state.puzzle.grid;
      const { doors_require_keys = true, max_steps = 1000 } = state.puzzle.grid.rules || {};
      
      // Check bounds
      if (newPos.r < 0 || newPos.r >= rows || newPos.c < 0 || newPos.c >= cols) {
        return {
          ...state,
          message: 'Cannot move out of bounds!'
        };
      }
      
      let cell = cells[newPos.r][newPos.c];
      let finalPos = newPos;
      const newKeysCollected = new Set(state.keysCollected);
      
      // Check for wall collision: 允許移入牆並立即失敗（彈窗提示）
      if (cell === 'W') {
        const failPos = newPos;
        return {
          ...state,
          currentPos: failPos,
          moves: [...state.moves, action.direction],
          steps: state.steps + 1,
          trace: [...state.trace, failPos],
          traceSet: new Set([...state.traceSet, `${failPos.r}-${failPos.c}`]),
          status: 'completed',
          message: 'You hit a wall! This attempt failed. Restarting from start.'
        };
      }
      
      // Handle door without key: 允許踏入門格後立即失敗（彈窗提示）
      if (cell === 'D' && doors_require_keys && newKeysCollected.size === 0) {
        const failPos = newPos;
        return {
          ...state,
          currentPos: failPos,
          moves: [...state.moves, action.direction],
          steps: state.steps + 1,
          trace: [...state.trace, failPos],
          traceSet: new Set([...state.traceSet, `${failPos.r}-${failPos.c}`]),
          status: 'completed',
          message: 'This door requires a key! Rule violated. Restarting from start.'
        };
      }
      
      // Handle portal teleportation
      if (typeof cell === 'string' && cell.startsWith('P') && portals[cell]) {
        finalPos = portals[cell];
        cell = cells[finalPos.r][finalPos.c];
      }
      
      // Collect keys
      if (cell === 'K') {
        const keyId = `key_${finalPos.r}_${finalPos.c}`;
        newKeysCollected.add(keyId);
      }
      
      const newSteps = state.steps + 1;
      const newTrace = [...state.trace, finalPos];
      const newTraceSet = new Set([...state.traceSet, `${finalPos.r}-${finalPos.c}`]);
      
      // Check step limit
      if (newSteps >= max_steps) {
        return {
          ...state,
          currentPos: finalPos,
          keysCollected: newKeysCollected,
          moves: [...state.moves, action.direction],
          steps: newSteps,
          trace: newTrace,
          traceSet: newTraceSet,
          status: 'blocked',
          message: `Maximum steps (${max_steps}) reached! Submit your attempt.`
        };
      }
      
      return {
        ...state,
        currentPos: finalPos,
        keysCollected: newKeysCollected,
        moves: [...state.moves, action.direction],
        steps: newSteps,
        trace: newTrace,
        traceSet: newTraceSet,
        message: cell === 'K' ? 'Key collected!' : `Moved ${action.direction.toLowerCase()}. Find the goal!`,
      };

    case 'RESET':
      if (!state.puzzle) return state;
      const resetPos = state.puzzle.grid.start;
      return {
        currentPos: resetPos,
        keysCollected: new Set(),
        moves: [],
        steps: 0,
        status: 'ready',
        startTime: null,
        trace: [resetPos],
        traceSet: new Set([`${resetPos.r}-${resetPos.c}`]),
        puzzle: state.puzzle,
        message: 'Game reset! Ready to start again.',
      };

    case 'SUBMIT':
      return {
        ...state,
        status: 'submitted',
        message: 'Submitting your solution...',
      };

    case 'COMPLETE':
      return {
        ...state,
        status: 'completed',
        message: action.result.success ? 'Puzzle completed!' : 'Attempt failed.',
      };

    default:
      return state;
  }
}

export default function PuzzlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Next.js 15: params is a Promise in Client Components.
  // Avoid React.use() during SSR to prevent Suspense/hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; type: 'success' | 'fail'; title: string; message: string }>({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [liveElapsedTime, setLiveElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    params.then((p) => setResolvedParams(p));
    setIsAuthed(authUtils.isAuthenticated());
  }, [params]);

  const puzzleId = resolvedParams ? Number.parseInt(resolvedParams.id) : Number.NaN;

  // Check authentication
  useEffect(() => {
    if (mounted && !isAuthed) {
      router.push('/auth/login');
    }
  }, [mounted, isAuthed, router]);

  // Fetch puzzle data
  const { data: puzzle, isLoading, error } = useQuery({
    queryKey: ['puzzle', puzzleId],
    queryFn: () => puzzleAPI.getPuzzle(puzzleId),
    enabled: mounted && isAuthed && !Number.isNaN(puzzleId),
  });

  // Initialize game state
  const [gameState, dispatch] = useReducer(gameReducer, {
    currentPos: { r: 0, c: 0 },
    keysCollected: new Set<string>(),
    moves: [],
    steps: 0,
    status: 'ready',
    startTime: null,
    trace: [],
    traceSet: new Set<string>(),
    puzzle: null,
    message: 'Loading puzzle...',
  });

  // Initialize game state when puzzle loads
  useEffect(() => {
    if (puzzle) {
      dispatch({ type: 'INIT', puzzle });
    }
  }, [puzzle?.id]);

  // Submit attempt mutation
  const submitMutation = useMutation({
    mutationFn: (moves: string[]) => {
      const clientTime = gameState.startTime ? Date.now() - gameState.startTime : undefined;
      return puzzleAPI.submitAttempt(puzzleId, moves, clientTime);
    },
    onSuccess: (result) => {
      dispatch({ type: 'COMPLETE', result });
      if (result.success) {
        setModal({ open: true, type: 'success', title: 'You Win!', message: result.message });
      } else {
        setModal({ open: true, type: 'fail', title: 'Unfortunate, you failed.', message: result.message });
      }
      // Invalidate leaderboard queries to update rankings
      queryClient.invalidateQueries({ queryKey: ['leaderboard', puzzleId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: (error: unknown) => {
      console.error('Submit attempt failed:', error);
      dispatch({ 
        type: 'COMPLETE', 
        result: { 
          success: false, 
          message: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit attempt. Please try again.', 
          steps: 0,
          keys_collected: [],
          trace: [],
          time_ms: 0
        } 
      });
    },
  });

  const handleMove = useCallback((direction: Direction) => {
    if (gameState.status === 'ready') {
      dispatch({ type: 'START_GAME' });
    }
    dispatch({ type: 'MOVE', direction });
  }, [gameState.status]);

  // Keyboard controls (will be attached to grid container)
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (gameState.status !== 'playing' && gameState.status !== 'ready') return;
    
    // Ignore if focus is on input elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }
    
    const key = event.key.toLowerCase();
    const keyMap: Record<string, Direction> = {
      'arrowup': 'UP',
      'arrowdown': 'DOWN', 
      'arrowleft': 'LEFT',
      'arrowright': 'RIGHT',
      'w': 'UP',
      's': 'DOWN',
      'a': 'LEFT',
      'd': 'RIGHT',
    };
    
    const direction = keyMap[key];
    if (direction) {
      // 防止長按鍵盤連續觸發導致一次移動兩步
      event.preventDefault();
      event.stopPropagation();
      handleMove(direction);
    }
  }, [gameState.status, handleMove]);

  const handleSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT' });
    submitMutation.mutate(gameState.moves);
  }, [gameState.moves, submitMutation]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setLiveElapsedTime(0);
    setModal((m) => ({ ...m, open: false }));
  }, []);

  // Live timer effect for continuous updates during gameplay
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.startTime) {
      // Update every 250ms for smooth timer display
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - gameState.startTime!;
        setLiveElapsedTime(elapsed);
      }, 250);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      // Clear timer when not playing
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Set final elapsed time when game ends
      if (gameState.startTime && gameState.status === 'completed') {
        setLiveElapsedTime(Date.now() - gameState.startTime);
      } else if (gameState.status === 'ready') {
        setLiveElapsedTime(0);
      }
    }
  }, [gameState.status, gameState.startTime]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Memoized traceSet for better render performance
  const memoizedTraceSet = useMemo(() => {
    return new Set(gameState.trace.map(pos => `${pos.r}-${pos.c}`));
  }, [gameState.trace.length]);

  if (!mounted || !isAuthed || Number.isNaN(puzzleId)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧩</div>
          <p className="text-lg text-gray-600">Loading puzzle...</p>
        </div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 text-center">Puzzle Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">The puzzle you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
            <Button onClick={() => router.push('/puzzles')} className="w-full">
              Back to Puzzles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use live elapsed time for real-time updates
  const currentElapsedTime = liveElapsedTime;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/puzzles')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Puzzles
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{puzzle.title} <span aria-hidden>🎉</span></h1>
                <p className="text-sm text-gray-500 capitalize">
                  Difficulty: <span className={puzzleUtils.getDifficultyColor(puzzle.difficulty)}>
                    {puzzle.difficulty}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleReset} disabled={gameState.status === 'submitted'}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Game Grid */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Maze Grid</CardTitle>
                  <div className="text-sm text-gray-500">
                    {puzzle.grid.rows}×{puzzle.grid.cols} grid
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MazeGrid
                  puzzle={puzzle}
                  currentPos={gameState.currentPos}
                  traceSet={memoizedTraceSet}
                  onKeyDown={handleKeyDown}
                />

                {/* Legend */}
                <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-1.5"><span className="text-base">🏁</span><span>Start</span></div>
                  <div className="flex items-center space-x-1.5"><span className="text-base">🎯</span><span>Goal</span></div>
                  <div className="flex items-center space-x-1.5"><span className="text-base">🗝️</span><span>Key</span></div>
                  <div className="flex items-center space-x-1.5"><span className="text-base">🚪</span><span>Door</span></div>
                  <div className="flex items-center space-x-1.5"><span className="text-base">🧱</span><span>Wall</span></div>
                  <div className="flex items-center space-x-1.5"><span className="text-base">🌀</span><span>Portal</span></div>
                </div>

                {/* Movement under grid for better ergonomics */}
                <div className="mt-4">
                  <MazeControls
                    mode="movement-only"
                    status={gameState.status as any}
                    canSubmit={false}
                    isSubmitting={false}
                    onMove={handleMove}
                    onSubmit={() => {}}
                    onReset={() => {}}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game HUD & Controls */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Game Result */}
            {gameState.status === 'completed' && submitMutation.data && (
              <GameResult 
                result={submitMutation.data} 
                elapsedTime={currentElapsedTime}
              />
            )}
            
            {/* Game HUD */}
            <MazeHUD
              steps={gameState.steps}
              keysCollected={gameState.keysCollected.size}
              status={gameState.status}
              message={gameState.message}
              elapsedTime={currentElapsedTime}
            />
            
            {/* Game Controls */}
            <MazeControls
              mode="actions-only"
              status={gameState.status}
              canSubmit={gameState.status === 'playing' || gameState.status === 'blocked'}
              isSubmitting={submitMutation.isPending}
              onMove={handleMove}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          </div>
        </div>
      </main>
      {/* Global Win/Fail Modal */}
      <GameModal 
        open={modal.open || (gameState.status === 'completed' && (gameState.message.includes('failed') || gameState.message.includes('wall') || gameState.message.includes('key')))}
        type={
          modal.open 
            ? modal.type 
            : (submitMutation.data?.success ? 'success' : 'fail')
        }
        title={
          modal.open 
            ? modal.title 
            : (submitMutation.data?.success ? 'You Win!' : 'Failed')
        }
        message={modal.message || gameState.message}
        onClose={() => {
          // Derive the effective modal type using the same logic as rendering
          const autoFailure = !modal.open && gameState.status === 'completed' && (
            gameState.message.includes('failed') ||
            gameState.message.includes('wall') ||
            gameState.message.includes('key')
          );
          const effectiveType = modal.open
            ? modal.type
            : (submitMutation.data?.success ? 'success' : (autoFailure ? 'fail' : 'success'));

          if (effectiveType === 'success') {
            setModal({ open: false, type: 'success', title: '', message: '' });
          } else {
            // Reset first so the auto-failure open condition becomes false
            handleReset();
            // Ensure React processes RESET before closing the modal state
            setTimeout(() => {
              setModal({ open: false, type: 'fail', title: '', message: '' });
            }, 0);
          }
        }}
      />
    </div>
  );
}