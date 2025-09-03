'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { puzzleAPI } from '@/lib/api';
import { authUtils } from '@/lib/auth';
import { puzzleUtils } from '@/lib/utils';

export default function PuzzlesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Check authentication
  useEffect(() => {
    setMounted(true);
    const authed = authUtils.isAuthenticated();
    setIsAuthed(authed);
    if (!authed) router.push('/auth/login');
  }, [router]);

  const { data: puzzles, isLoading, error } = useQuery({
    queryKey: ['puzzles'],
    queryFn: puzzleAPI.getPuzzles,
    enabled: mounted && isAuthed,
  });

  if (!mounted || !isAuthed) return null; // avoid SSR/client mismatch during auth check

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ background: 'color-mix(in oklab, var(--background) 98%, black)' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Puzzle Challenges</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-[var(--color-border)]/40 rounded mb-2"></div>
                  <div className="h-4 bg-[var(--color-border)]/40 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-[var(--color-border)]/40 rounded mb-4"></div>
                  <div className="h-10 bg-[var(--color-border)]/40 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'color-mix(in oklab, var(--background) 98%, black)' }}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Puzzles</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to load puzzles'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'color-mix(in oklab, var(--background) 98%, black)' }}>
      {/* Header */}
      <header className="bg-[var(--card)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Maze Puzzle Challenge</h1>
            <div className="flex items-center space-x-4">
              <Link href="/leaderboard">
                <Button variant="outline">Leaderboard</Button>
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
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Choose Your Challenge</h2>
          <p className="text-[var(--color-muted)]">
            Navigate through mazes, collect keys, unlock doors, and reach the goal. Each puzzle tests different skills!
          </p>
        </div>

        {/* Puzzles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {puzzles?.map((puzzle) => (
            <Card key={puzzle.id} className="hover:shadow-lg transition-shadow cursor-pointer bg-[var(--card)] text-[var(--card-foreground)]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{puzzle.title}</CardTitle>
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                      puzzleUtils.getDifficultyColor(puzzle.difficulty)
                    } bg-opacity-10`}
                  >
                    {puzzle.difficulty}
                  </span>
                </div>
                <CardDescription className="text-[var(--color-muted)]">
                  {puzzle.description || 'Test your maze-solving skills!'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-[var(--color-muted)] mb-4">
                  <span>Created: {new Date(puzzle.created_at).toISOString().slice(0, 10)}</span>
                </div>
                <Link href={`/puzzles/${puzzle.id}`}>
                  <Button className="w-full">
                    Start Challenge
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {puzzles && puzzles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧩</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Puzzles Available</h3>
            <p className="text-gray-500">
              Check back later for new challenges!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}