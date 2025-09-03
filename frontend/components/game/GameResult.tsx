'use client';

import { memo } from 'react';
import { CheckCircle, XCircle, Trophy, Clock, Target, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AttemptResponse } from '@/lib/api';

interface GameResultProps {
  result: AttemptResponse;
  elapsedTime?: number;
  onFocusResult?: () => void;
}

export const GameResult = memo(function GameResult({
  result,
  elapsedTime,
  onFocusResult
}: GameResultProps) {
  const timeInSeconds = result.time_ms ? result.time_ms / 1000 : elapsedTime ? elapsedTime / 1000 : 0;
  const stepsPerSecond = timeInSeconds > 0 ? (result.steps / timeInSeconds).toFixed(1) : '0.0';

  return (
    <Card className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500 border-2 border-transparent hover:border-gray-200 transition-all">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="mb-4 animate-in zoom-in-50 duration-700 delay-200">
            {result.success ? (
              <div className="relative">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-2 animate-bounce" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2 animate-pulse" />
            )}
          </div>
          
          <h2 
            className={`text-3xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 ${
              result.success ? 'text-green-600' : 'text-red-600'
            }`}
            tabIndex={0}
            ref={(el) => {
              if (el && onFocusResult) {
                setTimeout(() => el.focus(), 500);
                onFocusResult();
              }
            }}
          >
            {result.success ? 'Puzzle Completed!' : 'Attempt Failed'}
          </h2>
          
          <p className="text-gray-600 text-lg animate-in fade-in duration-500 delay-400">
            {result.message}
          </p>
        </div>
        
        {result.success && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-700">Steps</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 text-center">
                  {result.steps}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-center mb-2">
                  <Key className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-700">Keys</span>
                </div>
                <div className="text-2xl font-bold text-green-600 text-center">
                  {result.keys_collected.length}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-orange-700">Time</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 text-center">
                  {Math.floor(timeInSeconds)}s
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-700">Speed</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 text-center">
                  {stepsPerSecond}
                </div>
                <div className="text-xs text-purple-500 text-center mt-1">steps/sec</div>
              </div>
            </div>

            {/* Success Actions */}
            <div className="pt-4 border-t border-gray-200 animate-in fade-in duration-500 delay-700">
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                onClick={() => window.location.href = '/puzzles'}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Next Challenge
              </Button>
            </div>
          </div>
        )}
        
        {!result.success && (
          <div className="pt-4 animate-in fade-in duration-500 delay-500">
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 font-semibold py-3 rounded-lg transition-all duration-200"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});