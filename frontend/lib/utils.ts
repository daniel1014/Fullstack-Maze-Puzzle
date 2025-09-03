import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility functions for puzzle game
export const puzzleUtils = {
  getCellDisplay: (cell: string): string => {
    switch (cell) {
      case 'S': return '🏁'; // Start
      case 'G': return '🎯'; // Goal
      case 'W': return '🧱'; // Wall
      case 'K': return '🗝️'; // Key
      case 'D': return '🚪'; // Door
      case ' ': return ''; // Empty
      default:
        if (cell.startsWith('P')) {
          return '🌀'; // Portal
        }
        return cell;
    }
  },

  getCellClass: (cell: string, isPlayer: boolean, isTrace: boolean): string => {
    const baseClasses = 'w-12 h-12 border border-[var(--color-border)] flex items-center justify-center text-lg font-bold';
    
    if (isPlayer) {
      return cn(baseClasses, 'bg-blue-500 text-white');
    }
    
    if (isTrace) {
      return cn(baseClasses, 'bg-blue-100');
    }
    
    switch (cell) {
      case 'S': return cn(baseClasses, 'bg-green-200');
      case 'G': return cn(baseClasses, 'bg-red-200');
      case 'W': return cn(baseClasses, 'bg-gray-700 text-white');
      case 'K': return cn(baseClasses, 'bg-yellow-200');
      case 'D': return cn(baseClasses, 'bg-amber-600 text-white');
      default:
        if (cell.startsWith('P')) {
          return cn(baseClasses, 'bg-purple-200');
        }
        return cn(baseClasses, 'bg-[var(--card)] hover:bg-[var(--muted)]');
    }
  },

  formatTime: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  },

  getDifficultyColor: (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-orange-600';
      case 'expert': return 'text-red-600';
      default: return 'text-gray-600';
    }
  },
};