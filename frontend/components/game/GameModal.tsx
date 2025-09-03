'use client';

import React, { useEffect } from 'react';
import { Trophy, XCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ModalType = 'success' | 'fail' | 'info';

interface GameModalProps {
  open: boolean;
  type: ModalType;
  title: string;
  message: string;
  onClose: () => void;
  soundUrl?: string;
}

// Simple, dependency-free modal with tiny sound cues via Web Audio API
export default function GameModal({ open, type, title, message, onClose, soundUrl }: GameModalProps) {
  useEffect(() => {
    if (!open) return;
    // If user provided custom sound, play it; else play a tiny WebAudio tone
    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = 0.4;
        void audio.play();
      } catch (_) {}
      return;
    }
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === 'success' ? 'triangle' : 'sawtooth';
      osc.frequency.value = type === 'success' ? 880 : 220;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 220);
    } catch (_) {}
  }, [open, type]);

  if (!open) return null;

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-50 duration-200">
        <div className={`p-6 ${isSuccess ? 'bg-green-50' : 'bg-rose-50'} border-b ${isSuccess ? 'border-green-100' : 'border-rose-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isSuccess ? (
                <Trophy className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600" />
              )}
              <h3 className={`text-lg font-bold ${isSuccess ? 'text-green-700' : 'text-rose-700'}`}>{title}</h3>
            </div>
            <Volume2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6 leading-relaxed">{message}</p>
          <div className="flex justify-center">
            <Button onClick={onClose} variant="outline" className="min-w-fit">
              {isSuccess ? 'Awesome! Continue' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


