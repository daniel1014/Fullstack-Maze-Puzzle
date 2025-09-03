'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Trophy, Medal, Award, Clock, Footprints } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leaderboardAPI, puzzleAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import { puzzleUtils, cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<number | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push('/auth/login');
    }
  }, [router]);

  // Fetch puzzles for selection
  const { data: puzzles } = useQuery({
    queryKey: ['puzzles'],
    queryFn: puzzleAPI.getPuzzles,
    enabled: authUtils.isAuthenticated(),
  });

  // Auto-select first puzzle if none selected
  useEffect(() => {
    if (puzzles && puzzles.length > 0 && !selectedPuzzleId) {
      setSelectedPuzzleId(puzzles[0].id);
    }
  }, [puzzles, selectedPuzzleId]);

  // Fetch leaderboard for selected puzzle
  const { data: leaderboard, isLoading, error } = useQuery({
    queryKey: ['leaderboard', selectedPuzzleId],
    queryFn: () => leaderboardAPI.getLeaderboard(selectedPuzzleId!, 20, true),
    enabled: !!selectedPuzzleId && authUtils.isAuthenticated(),
  });

  if (!authUtils.isAuthenticated()) {
    return null; // Will redirect
  }

  const selectedPuzzle = puzzles?.find(p => p.id === selectedPuzzleId);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 2: return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 3: return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default: return "bg-white border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-gray-600 mt-1">Top puzzle solvers</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/puzzles">
                <Button variant="outline">Back to Puzzles</Button>
              </Link>
              <Button 
                variant="ghost" 
                onClick={() => {
                  authUtils.removeToken();
                  router.push('/auth/login');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Puzzle Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Puzzle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {puzzles?.map((puzzle) => (
                  <button
                    key={puzzle.id}
                    onClick={() => setSelectedPuzzleId(puzzle.id)}
                    className={cn(
                      "w-full p-3 text-left rounded-lg border-2 transition-colors",
                      selectedPuzzleId === puzzle.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div className="font-medium">{puzzle.title}</div>
                    <div className={cn(
                      "text-xs capitalize",
                      puzzleUtils.getDifficultyColor(puzzle.difficulty)
                    )}>
                      {puzzle.difficulty}
                    </div>
                  </button>
                ))}
                
                {puzzles && puzzles.length === 0 && (
                  <p className="text-gray-500 text-sm">No puzzles available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-3">
            {selectedPuzzle && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">{selectedPuzzle.title}</CardTitle>
                      <p className="text-gray-600 mt-1">
                        <span className={puzzleUtils.getDifficultyColor(selectedPuzzle.difficulty)}>
                          {selectedPuzzle.difficulty}
                        </span>
                        {selectedPuzzle.description && (
                          <span className="ml-2">• {selectedPuzzle.description}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">Failed to load leaderboard</p>
                      <Button onClick={() => window.location.reload()}>
                        Try Again
                      </Button>
                    </div>
                  ) : leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        return (
                          <div
                            key={`${entry.user_id}-${entry.created_at}`}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                              getRankClass(rank)
                            )}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {getRankIcon(rank)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {entry.user_email.split('@')[0]}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(entry.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm">
                              {entry.steps_taken !== null && (
                                <div className="flex items-center space-x-1 text-blue-600">
                                  <Footprints className="w-4 h-4" />
                                  <span>{entry.steps_taken} steps</span>
                                </div>
                              )}
                              {entry.time_ms !== null && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{puzzleUtils.formatTime(entry.time_ms!)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏆</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Solutions Yet</h3>
                      <p className="text-gray-500 mb-6">
                        Be the first to solve this puzzle!
                      </p>
                      <Link href={`/puzzles/${selectedPuzzleId}`}>
                        <Button>Try This Puzzle</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!selectedPuzzle && puzzles && puzzles.length > 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Puzzle</h3>
                  <p className="text-gray-500">
                    Choose a puzzle from the sidebar to view its leaderboard
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}