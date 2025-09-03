'use client';

import { useState } from 'react';
import { debugConnection } from '@/lib/debug-connection';

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const runDebug = async () => {
    setIsRunning(true);
    setResults([]);
    
    addLog('🚀 Starting connection debug...');
    addLog(`📍 Expected API URL: ${process.env.NEXT_PUBLIC_API_URL}`);
    
    // Test different ports
    addLog('🔍 Testing different ports...');
    const portResults = await debugConnection.checkPorts();
    portResults.forEach(result => {
      if (result.success) {
        addLog(`✅ Port ${result.port}: HTTP ${result.status}`);
      } else {
        addLog(`❌ Port ${result.port}: ${result.error}`);
      }
    });
    
    // Test CORS
    addLog('🌐 Testing CORS...');
    const corsResult = await debugConnection.testCORS(process.env.NEXT_PUBLIC_API_URL);
    if (corsResult) {
      addLog(`✅ CORS Headers: ${JSON.stringify(corsResult, null, 2)}`);
    } else {
      addLog('❌ CORS test failed');
    }
    
    // Test basic fetch
    addLog('📡 Testing basic fetch...');
    const fetchResult = await debugConnection.testBasicFetch(process.env.NEXT_PUBLIC_API_URL);
    if (fetchResult) {
      addLog('✅ Basic fetch successful');
    } else {
      addLog('❌ Basic fetch failed');
    }
    
    addLog('🏁 Debug complete!');
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Connection Debug Tool
          </h1>
          
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-900 mb-2">Current Settings:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}</p>
                <p><strong>Frontend:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={runDebug}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-md font-medium mb-6"
          >
            {isRunning ? 'Running Debug...' : 'Run Connection Debug'}
          </button>

          {results.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="mb-1">{result}</div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Common Issues & Solutions:</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <strong>Port 8000 not responding:</strong> Make sure your FastAPI server is running with: 
                <code className="bg-gray-100 px-2 py-1 rounded ml-2">uvicorn app.main:app --reload --port 8000</code>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <strong>CORS errors:</strong> Add localhost:3000 to your backend CORS allowed origins
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <strong>Connection refused:</strong> Check if your droplet firewall allows port 5433
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}