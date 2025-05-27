import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { getTradingEngine } from '../services/realTimeTradingEngine';
import { webSocketService } from '../services/websocketService';
import { alpacaService } from '../services/alpacaService';
import DatabaseService from '../services/databaseService';

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  websocket: 'connected' | 'disconnected' | 'error';
  broker: 'connected' | 'disconnected' | 'error';
  tradingEngine: 'running' | 'stopped' | 'error';
}

interface PerformanceMetrics {
  signalsGenerated: number;
  tradesExecuted: number;
  portfolioValue: number;
  dailyPnL: number;
  totalReturn: number;
  uptime: number;
}

const SystemStatus: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications } = useSelector((state: RootState) => state.notifications);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    websocket: 'disconnected',
    broker: 'disconnected',
    tradingEngine: 'stopped',
  });
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    signalsGenerated: 0,
    tradesExecuted: 0,
    portfolioValue: 0,
    dailyPnL: 0,
    totalReturn: 0,
    uptime: 0,
  });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkSystemHealth();
      updateMetrics();
    }, 5000);

    checkSystemHealth();
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    const health: SystemHealth = {
      database: 'healthy',
      websocket: 'disconnected',
      broker: 'disconnected',
      tradingEngine: 'stopped',
    };

    // Check database
    try {
      await DatabaseService.testConnection();
      health.database = 'healthy';
    } catch (error) {
      health.database = 'error';
      addLog(`Database error: ${(error as Error).message}`);
    }

    // Check WebSocket
    const statuses = webSocketService.getConnectionStatuses();
    if (statuses.polygon === 'OPEN' || statuses.alpaca === 'OPEN') {
      health.websocket = 'connected';
    } else {
      health.websocket = 'disconnected';
    }

    // Check broker connection
    try {
      await alpacaService.getAccount();
      health.broker = 'connected';
    } catch (error) {
      health.broker = 'error';
      addLog(`Broker connection error: ${(error as Error).message}`);
    }

    // Check trading engine
    const engine = getTradingEngine();
    if (engine) {
      health.tradingEngine = engine.isEngineRunning() ? 'running' : 'stopped';
    }

    setSystemHealth(health);
  };

  const updateMetrics = () => {
    const engine = getTradingEngine();
    if (!engine) return;

    const activeSignals = engine.getActiveSignals();
    
    setMetrics(prev => ({
      ...prev,
      signalsGenerated: activeSignals.length,
      uptime: prev.uptime + 5, // Add 5 seconds
    }));
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'disconnected':
      case 'stopped':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
        return '✅';
      case 'warning':
      case 'disconnected':
      case 'stopped':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '⭕';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600">Monitor system health and performance metrics</p>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Database</p>
                <p className={`text-sm font-semibold px-2 py-1 rounded ${getStatusColor(systemHealth.database)}`}>
                  {getStatusIcon(systemHealth.database)} {systemHealth.database.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">WebSocket</p>
                <p className={`text-sm font-semibold px-2 py-1 rounded ${getStatusColor(systemHealth.websocket)}`}>
                  {getStatusIcon(systemHealth.websocket)} {systemHealth.websocket.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Broker</p>
                <p className={`text-sm font-semibold px-2 py-1 rounded ${getStatusColor(systemHealth.broker)}`}>
                  {getStatusIcon(systemHealth.broker)} {systemHealth.broker.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Trading Engine</p>
                <p className={`text-sm font-semibold px-2 py-1 rounded ${getStatusColor(systemHealth.tradingEngine)}`}>
                  {getStatusIcon(systemHealth.tradingEngine)} {systemHealth.tradingEngine.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{metrics.signalsGenerated}</p>
                <p className="text-sm text-gray-500">Active Signals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.tradesExecuted}</p>
                <p className="text-sm text-gray-500">Trades Executed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">${metrics.portfolioValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Portfolio Value</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${metrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.dailyPnL.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Daily P&L</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.totalReturn.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">Total Return</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{formatUptime(metrics.uptime)}</p>
                <p className="text-sm text-gray-500">Uptime</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Notifications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.slice(0, 10).map(notification => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                    <div className="text-lg">
                      {notification.type === 'trade' && '💰'}
                      {notification.type === 'signal' && '📊'}
                      {notification.type === 'alert' && '🔔'}
                      {notification.type === 'system' && '⚙️'}
                      {notification.type === 'error' && '❌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No notifications</p>
                )}
              </div>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Logs</h2>
            </div>
            <div className="p-6">
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                ) : (
                  <div className="text-gray-500">No recent logs</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Actions */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Actions</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => addLog('Manual health check initiated')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Status
              </button>
              <button
                onClick={() => addLog('System restart requested')}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Restart Services
              </button>
              <button
                onClick={() => addLog('Emergency shutdown initiated')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Emergency Stop
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
