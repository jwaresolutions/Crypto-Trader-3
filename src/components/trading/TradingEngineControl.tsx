import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, store } from '../../store';
import SimpleTradingEngine, { TradingEngineConfig } from '../../services/simpleTradingEngine';
import { addNotification } from '../../store/slices/notificationsSlice';

const TradingEngineControl: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [engine] = useState(() => new SimpleTradingEngine(store));
  const [config, setConfig] = useState<TradingEngineConfig>({
    enableAutoTrading: false,
    maxPositionSize: 1000,
    maxDailyLoss: 500,
    enableRiskManagement: true,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    enableSignalNotifications: true,
    enableTradeNotifications: true,
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    if (engine) {
      const status = engine.getStatus();
      setIsEngineRunning(status.isRunning);
      setConfig(status.config);
    }
  }, [engine]);

  const handleStartEngine = () => {
    if (engine) {
      engine.start();
      setIsEngineRunning(true);
      
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'system',
        title: 'Trading Engine Started',
        message: 'Real-time trading engine is now active and monitoring markets',
        priority: 'medium',
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }
  };

  const handleStopEngine = () => {
    if (engine) {
      engine.stop();
      setIsEngineRunning(false);
      
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'system',
        title: 'Trading Engine Stopped',
        message: 'Real-time trading engine has been deactivated',
        priority: 'medium',
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }
  };

  const handleConfigChange = (key: keyof TradingEngineConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    if (engine) {
      engine.updateConfig(newConfig);
    }
  };

  const handleSaveConfig = () => {
    if (engine) {
      engine.updateConfig(config);
      setIsConfigOpen(false);
      
      dispatch(addNotification({
        id: Date.now().toString(),
        type: 'system',
        title: 'Configuration Updated',
        message: 'Trading engine configuration has been saved successfully',
        priority: 'low',
        read: false,
        createdAt: new Date().toISOString(),
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Trading Engine Control</h3>
          <p className="text-sm text-gray-600">
            Real-time trading automation and signal processing
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isEngineRunning ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className={`text-sm font-medium ${isEngineRunning ? 'text-green-600' : 'text-red-600'}`}>
            {isEngineRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Engine Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Auto Trading</p>
              <p className={`text-sm ${config.enableAutoTrading ? 'text-green-600' : 'text-red-600'}`}>
                {config.enableAutoTrading ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Risk Management</p>
              <p className={`text-sm ${config.enableRiskManagement ? 'text-green-600' : 'text-red-600'}`}>
                {config.enableRiskManagement ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828l14.142 14.142m-14.142 0L19.172 4.828" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Max Daily Loss</p>
              <p className="text-sm text-gray-600">${config.maxDailyLoss}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          {!isEngineRunning ? (
            <button
              onClick={handleStartEngine}
              disabled={!user}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Engine
            </button>
          ) : (
            <button
              onClick={handleStopEngine}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Engine
            </button>
          )}

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configure
          </button>
        </div>

        {!user && (
          <p className="text-sm text-gray-500">Please log in to start the trading engine</p>
        )}
      </div>

      {/* Configuration Panel */}
      {isConfigOpen && (
        <div className="mt-6 border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Trading Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Trading */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto Trading</label>
                <p className="text-xs text-gray-500">Automatically execute trading signals</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableAutoTrading}
                onChange={(e) => handleConfigChange('enableAutoTrading', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            {/* Risk Management */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Risk Management</label>
                <p className="text-xs text-gray-500">Enable stop loss and take profit</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableRiskManagement}
                onChange={(e) => handleConfigChange('enableRiskManagement', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            {/* Max Position Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Position Size ($)</label>
              <input
                type="number"
                value={config.maxPositionSize}
                onChange={(e) => handleConfigChange('maxPositionSize', Number(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Max Daily Loss */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Daily Loss ($)</label>
              <input
                type="number"
                value={config.maxDailyLoss}
                onChange={(e) => handleConfigChange('maxDailyLoss', Number(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Stop Loss Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Stop Loss (%)</label>
              <input
                type="number"
                step="0.1"
                value={config.stopLossPercentage}
                onChange={(e) => handleConfigChange('stopLossPercentage', Number(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Take Profit Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Take Profit (%)</label>
              <input
                type="number"
                step="0.1"
                value={config.takeProfitPercentage}
                onChange={(e) => handleConfigChange('takeProfitPercentage', Number(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Signal Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Signal Notifications</label>
                <p className="text-xs text-gray-500">Get notified of new trading signals</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableSignalNotifications}
                onChange={(e) => handleConfigChange('enableSignalNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            {/* Trade Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Trade Notifications</label>
                <p className="text-xs text-gray-500">Get notified of trade executions</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableTradeNotifications}
                onChange={(e) => handleConfigChange('enableTradeNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingEngineControl;
