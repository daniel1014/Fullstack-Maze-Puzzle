// Authentication testing utilities for production deployment
import { authAPI } from './api';
import { authUtils } from './auth';

export interface TestResult {
  success: boolean;
  message: string;
  error?: string;
  data?: unknown;
}

export const authTester = {
  // Test backend connectivity
  testConnection: async (): Promise<TestResult> => {
    try {
      console.log(`🔌 Testing connection to: ${process.env.NEXT_PUBLIC_API_URL}`);
      
      // Try multiple endpoints to test connectivity
      const endpoints = ['/health', '/docs', '/openapi.json', '/'];
      let lastError = '';
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_API_URL + endpoint, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (response.ok) {
            return {
              success: true,
              message: `Backend connection successful via ${endpoint}`,
              data: { 
                status: response.status,
                endpoint,
                url: process.env.NEXT_PUBLIC_API_URL + endpoint
              }
            };
          } else {
            lastError = `${endpoint}: HTTP ${response.status}`;
          }
        } catch (err) {
          lastError = `${endpoint}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          continue;
        }
      }
      
      return {
        success: false,
        message: 'Backend connection failed on all endpoints',
        error: `Tested endpoints: ${endpoints.join(', ')}. Last error: ${lastError}`
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Backend connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Test user registration
  testRegistration: async (email: string, password: string): Promise<TestResult> => {
    try {
      const user = await authAPI.register(email, password);
      return {
        success: true,
        message: 'User registration successful',
        data: { userId: user.id, email: user.email }
      };
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'User registration failed',
        error: errorMessage || 'Registration failed'
      };
    }
  },

  // Test user login
  testLogin: async (email: string, password: string): Promise<TestResult> => {
    try {
      const tokenData = await authAPI.login(email, password);
      
      // Store the token
      authUtils.setToken(tokenData.access_token);
      
      return {
        success: true,
        message: 'User login successful',
        data: { 
          token_type: tokenData.token_type,
          has_token: !!authUtils.getToken()
        }
      };
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'User login failed',
        error: errorMessage || 'Login failed'
      };
    }
  },

  // Test getting user profile (requires authentication)
  testProfile: async (): Promise<TestResult> => {
    try {
      const user = await authAPI.getMe();
      return {
        success: true,
        message: 'Profile fetch successful',
        data: { userId: user.id, email: user.email, isActive: user.is_active }
      };
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: 'Profile fetch failed',
        error: errorMessage || 'Profile fetch failed'
      };
    }
  },

  // Test token persistence and validation
  testTokenPersistence: (): TestResult => {
    const token = authUtils.getToken();
    if (!token) {
      return {
        success: false,
        message: 'No token found in storage'
      };
    }

    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        message: 'Invalid token format'
      };
    }

    try {
      // Decode payload (don't verify signature - that's server's job)
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return {
        success: true,
        message: 'Token found and valid format',
        data: {
          hasToken: true,
          subject: payload.sub,
          expires: new Date(payload.exp * 1000).toISOString(),
          isExpired: payload.exp < now
        }
      };
    } catch {
      return {
        success: false,
        message: 'Token found but invalid format'
      };
    }
  },

  // Test logout
  testLogout: (): TestResult => {
    authUtils.removeToken();
    const hasToken = authUtils.isAuthenticated();
    
    return {
      success: !hasToken,
      message: hasToken ? 'Logout failed - token still present' : 'Logout successful',
      data: { hasToken }
    };
  },

  // Run comprehensive authentication test suite
  runTestSuite: async (): Promise<{ results: TestResult[], summary: { passed: number, failed: number, total: number } }> => {
    const results: TestResult[] = [];
    
    console.log('🧪 Starting authentication test suite...');
    
    // Test 1: Backend connectivity
    console.log('1. Testing backend connection...');
    const connectionTest = await authTester.testConnection();
    results.push({ ...connectionTest, message: `Connection: ${connectionTest.message}` });
    
    // Test 2: User registration (use timestamp to ensure unique email)
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('2. Testing user registration...');
    const regTest = await authTester.testRegistration(testEmail, testPassword);
    results.push({ ...regTest, message: `Registration: ${regTest.message}` });
    
    // Test 3: User login
    console.log('3. Testing user login...');
    const loginTest = await authTester.testLogin(testEmail, testPassword);
    results.push({ ...loginTest, message: `Login: ${loginTest.message}` });
    
    // Test 4: Token persistence
    console.log('4. Testing token persistence...');
    const tokenTest = authTester.testTokenPersistence();
    results.push({ ...tokenTest, message: `Token: ${tokenTest.message}` });
    
    // Test 5: Profile fetch (authenticated request)
    console.log('5. Testing authenticated profile fetch...');
    const profileTest = await authTester.testProfile();
    results.push({ ...profileTest, message: `Profile: ${profileTest.message}` });
    
    // Test 6: Logout
    console.log('6. Testing logout...');
    const logoutTest = authTester.testLogout();
    results.push({ ...logoutTest, message: `Logout: ${logoutTest.message}` });
    
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    
    return {
      results,
      summary: { passed, failed, total: results.length }
    };
  }
};

export default authTester;