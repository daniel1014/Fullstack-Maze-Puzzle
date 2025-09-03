'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { authUtils } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      router.push('/puzzles');
    }
  }, [router]);

  return (
    <div className="min-h-screen brand-gradient">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🧩</div>
          <h1 className="text-5xl font-bold text-[var(--foreground)] mb-6">
            Maze Puzzle Challenge
          </h1>
          <p className="text-xl text-[var(--color-muted)] max-w-3xl mx-auto mb-8">
            Test your problem-solving skills with interactive maze puzzles. 
            Navigate through complex paths, collect keys, unlock doors, and reach the goal!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" variant="brand" className="px-8 py-3 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="text-3xl mb-4">🎯</div>
              <CardTitle>Strategic Gameplay</CardTitle>
              <CardDescription>
                Plan your route carefully through walls, doors, and portals to reach the goal efficiently
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-3xl mb-4">🗝️</div>
              <CardTitle>Key & Door Mechanics</CardTitle>
              <CardDescription>
                Collect keys to unlock doors and access new areas of the maze
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-3xl mb-4">🌀</div>
              <CardTitle>Portal Teleportation</CardTitle>
              <CardDescription>
                Use magical portals to instantly travel across the maze
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Game Features */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Game Elements</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏁</span>
                    <span><strong>Start:</strong> Your starting position</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎯</span>
                    <span><strong>Goal:</strong> Reach here to complete the puzzle</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧱</span>
                    <span><strong>Walls:</strong> Impassable obstacles</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🗝️</span>
                    <span><strong>Keys:</strong> Collect to unlock doors</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚪</span>
                    <span><strong>Doors:</strong> Require keys to pass through</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌀</span>
                    <span><strong>Portals:</strong> Teleport to connected locations</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Controls</h3>
                <div className="space-y-3">
                  <div><strong>Keyboard:</strong> Use arrow keys or WASD to move</div>
                  <div><strong>Mouse:</strong> Click direction buttons to move</div>
                  <div><strong>Goal:</strong> Find the most efficient path to the goal</div>
                  <div><strong>Strategy:</strong> Plan your moves to minimize steps</div>
                </div>
                
                <h3 className="text-lg font-semibold mb-4 mt-8 text-[var(--foreground)]">Difficulty Levels</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-green-600 font-medium">Easy:</span>
                    <span>Simple paths and basic mechanics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-yellow-600 font-medium">Medium:</span>
                    <span>Keys, doors, and strategic planning</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span className="text-orange-600 font-medium">Hard:</span>
                    <span>Portals and complex multi-step puzzles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-red-600 font-medium">Expert:</span>
                    <span>Advanced challenges requiring all skills</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">Ready to Start?</h2>
          <p className="text-lg text-[var(--color-muted)] mb-8">
            Join thousands of puzzle solvers and challenge yourself today!
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="px-12 py-4 text-xl">
              Start Solving Puzzles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
