import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('access_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Puzzle {
  id: number;
  title: string;
  description?: string;
  difficulty: string;
  created_at: string;
}

export interface PuzzleDetail extends Puzzle {
  grid: {
    rows: number;
    cols: number;
    start: { r: number; c: number };
    goal: { r: number; c: number };
    cells: string[][];
    portals?: Record<string, { r: number; c: number }>;
    rules?: {
      doors_require_keys?: boolean;
      max_steps?: number;
      collect_all_keys?: boolean;
    };
  };
}

export interface AttemptResponse {
  success: boolean;
  message: string;
  steps: number;
  keys_collected: string[];
  trace: Array<{ r: number; c: number }>;
  time_ms?: number;
}

export interface LeaderboardEntry {
  user_id: number;
  user_email: string;
  success: boolean;
  steps_taken?: number;
  time_ms?: number;
  created_at: string;
}

// Auth API
export const authAPI = {
  register: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/api/auth/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/api/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Puzzle API
export const puzzleAPI = {
  getPuzzles: async (): Promise<Puzzle[]> => {
    const response = await api.get('/api/puzzles');
    return response.data;
  },

  getPuzzle: async (id: number): Promise<PuzzleDetail> => {
    const response = await api.get(`/api/puzzles/${id}`);
    return response.data;
  },

  submitAttempt: async (
    puzzleId: number,
    moves: string[],
    clientTimeMs?: number
  ): Promise<AttemptResponse> => {
    const response = await api.post(`/api/puzzles/${puzzleId}/attempts`, {
      moves,
      client_time_ms: clientTimeMs,
    });
    return response.data;
  },

  getAttempts: async (puzzleId: number, limit = 10) => {
    const response = await api.get(`/api/puzzles/${puzzleId}/attempts?limit=${limit}`);
    return response.data;
  },
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: async (
    puzzleId: number,
    limit = 10,
    successOnly = true
  ): Promise<LeaderboardEntry[]> => {
    const response = await api.get(
      `/api/leaderboard?puzzle_id=${puzzleId}&limit=${limit}&success_only=${successOnly}`
    );
    return response.data;
  },
};

export default api;