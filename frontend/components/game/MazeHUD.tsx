'use client';

import { memo } from 'react';
import { Target, Key, Clock, Activity, MessageCircle } from 'lucide-react';

interface MazeHUDProps {
  steps: number;
  keysCollected: number;
  status: string;
  message: string;
  elapsedTime: number;
}

export const MazeHUD = memo(function MazeHUD({
  steps,
  keysCollected,
  status,
  message,
  elapsedTime
}: MazeHUDProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing': return 'text-green-500 bg-[color-mix(in_oklab,var(--edukids-success)_20%,transparent)] border-green-400/30';
      case 'completed': return 'text-blue-400 bg-[color-mix(in_oklab,var(--edukids-primary)_20%,transparent)] border-blue-400/30';
      case 'blocked': return 'text-amber-400 bg-[color-mix(in_oklab,var(--edukids-warning)_18%,transparent)] border-amber-400/30';
      case 'submitted': return 'text-purple-400 bg-[color-mix(in_oklab,#a855f7_18%,transparent)] border-purple-400/30';
      default: return 'text-[var(--color-muted)] bg-[var(--muted)] border-[var(--border)]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'playing': return <Activity className="w-4 h-4" />;
      case 'completed': return <Target className="w-4 h-4" />;
      case 'blocked': return <Clock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Steps */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2.5 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-1">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Steps</span>
          </div>
          <div className="text-lg font-bold text-blue-600 transition-all duration-300">
            {steps}
          </div>
        </div>

        {/* Keys */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-2.5 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-1">
            <Key className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Keys</span>
          </div>
          <div className="text-lg font-bold text-green-600 transition-all duration-300">
            {keysCollected}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Timer */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-2.5 rounded-lg border border-orange-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-1">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">Time</span>
          </div>
          <div className="text-lg font-bold text-orange-600 transition-all duration-300 font-mono">
            {formatTime(elapsedTime)}
          </div>
        </div>

        {/* Status */}
        <div className={`p-2.5 rounded-lg border transition-all duration-200 ${getStatusColor(status)}`}>
          <div className="flex items-center justify-between mb-1">
            {getStatusIcon(status)}
            <span className="text-xs font-medium">Status</span>
          </div>
          <div className="text-base font-bold capitalize transition-all duration-300">
            {status}
          </div>
        </div>
      </div>
      
      {/* Game Message */}
      <div 
        className="p-3 bg-white rounded-lg border-l-4 border-blue-400 shadow-sm hover:shadow-md transition-all duration-200"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-start">
          <MessageCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-gray-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
});