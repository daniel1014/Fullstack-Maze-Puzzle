'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState, ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false, // Prevent refetch during gameplay
        retry: (failureCount, error: any) => {
          // Don't retry on 401 errors
          if (error?.response?.status === 401) {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  }));

  // Theme state persisted in localStorage and applied to <html data-theme="...">
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const themeContext = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Provide theme via React Context to enable toggle anywhere */}
      <ThemeContext.Provider value={themeContext}>
        {children}
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

// Lightweight ThemeContext for global toggle
type ThemeContextValue = { theme: 'light' | 'dark'; setTheme: (t: 'light' | 'dark') => void };
export const ThemeContext = (globalThis as any).__theme_context ||
  (((globalThis as any).__theme_context = (require('react') as typeof import('react')).createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} })), (globalThis as any).__theme_context);