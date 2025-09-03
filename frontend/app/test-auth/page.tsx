'use client';

import { useState } from 'react';
import { authTester, TestResult } from '@/lib/test-auth';

export default function AuthTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{ passed: number; failed: number; total: number } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    
    try {
      const { results: testResults, summary: testSummary } = await authTester.runTestSuite();
      setResults(testResults);
      setSummary(testSummary);
    } catch (error) {
      console.error('Test suite failed:', error);
      setResults([{
        success: false,
        message: 'Test suite failed to run',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const testConnection = async () => {
    setIsRunning(true);
    const result = await authTester.testConnection();
    setResults([result]);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Authentication Testing Dashboard
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Current Configuration:</h2>
            <div className="bg-gray-100 p-4 rounded-md space-y-2">
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV || 'NOT SET'}</p>
              <p><strong>Timeout:</strong> {process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'}ms</p>
              <div className="mt-4">
                <details className="cursor-pointer">
                  <summary className="text-sm text-gray-600 hover:text-gray-800">
                    Debug Info
                  </summary>
                  <div className="mt-2 text-xs bg-white p-2 rounded border">
                    <p><strong>Window Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
                    <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
                    <p><strong>Test Endpoints:</strong> /health, /docs, /openapi.json, /</p>
                  </div>
                </details>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium"
            >
              {isRunning ? 'Running Tests...' : 'Run Full Test Suite'}
            </button>
            
            <button
              onClick={testConnection}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-md font-medium"
            >
              Test Connection Only
            </button>
          </div>

          {summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-100 p-4 rounded-md text-center">
                  <div className="text-2xl font-bold text-green-800">{summary.passed}</div>
                  <div className="text-green-600">Passed</div>
                </div>
                <div className="bg-red-100 p-4 rounded-md text-center">
                  <div className="text-2xl font-bold text-red-800">{summary.failed}</div>
                  <div className="text-red-600">Failed</div>
                </div>
                <div className="bg-blue-100 p-4 rounded-md text-center">
                  <div className="text-2xl font-bold text-blue-800">{summary.total}</div>
                  <div className="text-blue-600">Total</div>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-md border-l-4 ${
                      result.success
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.success ? '✅ PASS' : '❌ FAIL'}
                        </span>
                        <span className="ml-3 text-gray-900 font-medium">
                          {result.message}
                        </span>
                      </div>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2">
                        <p className="text-red-600 text-sm">
                          <strong>Error:</strong> {result.error}
                        </p>
                      </div>
                    )}
                    
                    {result.data && (
                      <div className="mt-2">
                        <details>
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Manual Testing Guide</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Before Running Tests:</h4>
              <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
                <li>Ensure your DigitalOcean droplet is running</li>
                <li>Update <code>.env.production</code> with your droplet's IP address</li>
                <li>Verify your backend is accepting CORS requests from your frontend domain</li>
                <li>Check that your database is properly configured and running</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}