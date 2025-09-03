'use client';

import { useContext, useEffect, useState } from 'react';
import { Sun, MoonStar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeContext } from '@/lib/providers';

export default function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const next = theme === 'light' ? 'dark' : 'light';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      className="border-gray-300 hover:bg-gray-50"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <MoonStar className="w-4 h-4" />
      )}
    </Button>
  );
}


