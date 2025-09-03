// Debug connection utility for troubleshooting
export const debugConnection = {
  // Test basic fetch to backend
  testBasicFetch: async (url: string = 'http://localhost:5433') => {
    console.log(`🔍 Testing basic fetch to: ${url}`);
    
    try {
      const response = await fetch(url + '/docs', {
        method: 'GET',
        mode: 'cors'
      });
      
      console.log('✅ Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return true;
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      return false;
    }
  },

  // Check if backend is running on expected port
  checkPorts: async () => {
    const ports = [5433, 5432, 8000];
    const results = [];
    
    for (const port of ports) {
      const url = `http://localhost:${port}`;
      console.log(`🔍 Testing port ${port}...`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(url + '/docs', {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        results.push({ port, status: response.status, success: true });
        console.log(`✅ Port ${port}: ${response.status}`);
      } catch (error) {
        results.push({ port, success: false, error: error instanceof Error ? error.message : 'Unknown' });
        console.log(`❌ Port ${port}: ${error instanceof Error ? error.message : 'Failed'}`);
      }
    }
    
    return results;
  },

  // Test CORS preflight
  testCORS: async (url: string = 'http://localhost:5433') => {
    console.log(`🔍 Testing CORS preflight to: ${url}`);
    
    try {
      const response = await fetch(url + '/auth/register', {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers')
      };
      
      console.log('✅ CORS Headers:', corsHeaders);
      return corsHeaders;
    } catch (error) {
      console.error('❌ CORS test failed:', error);
      return null;
    }
  }
};

export default debugConnection;