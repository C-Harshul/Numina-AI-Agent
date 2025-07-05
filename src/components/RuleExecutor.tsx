import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  Clock,
  BarChart3,
  Zap,
  Database,
  AlertTriangle
} from 'lucide-react';
import { RuleStorage } from '../services/ruleStorage';
import { AuditRule } from '../types/audit';
import { apiClient } from '../services/apiClient';

interface ExecutionResult {
  rule_id: string;
  rule_type: string;
  entity: string;
  total_transactions: number;
  flagged_transactions: Array<{
    id: string;
    transaction_data: Record<string, unknown>;
    matched_conditions: Array<{
      field: string;
      operator: string;
      value: string | number | boolean;
      actual_value: string | number | boolean;
      flagged_field_data?: {
        // For Line fields
        line_index?: number;
        line_data?: Record<string, unknown>;
        field_path?: string;
        field_value?: any;
        // For regular fields
        parent_path?: string;
        parent_object?: Record<string, unknown>;
        field_name?: string;
      };
    }>;
    action: string;
    reason: string;
    flagged_at: string;
  }>;
  execution_summary: {
    total_checked: number;
    flagged_count: number;
    execution_time: number;
    flag_rate: string;
  };
}

interface BatchExecutionResult {
  summary: {
    total_rules_executed: number;
    successful_executions: number;
    failed_executions: number;
    total_transactions_checked: number;
    total_transactions_flagged: number;
    total_execution_time: number;
  };
  individual_results: Array<{
    success: boolean;
    data?: ExecutionResult;
    error?: string;
  }>;
  executed_at: string;
}

export const RuleExecutor: React.FC = () => {
  const [savedRules, setSavedRules] = useState<AuditRule[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [realmId, setRealmId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [entity, setEntity] = useState('Expense');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<BatchExecutionResult | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<{ connected: boolean; error: string | null }>({ connected: false, error: null });
  const [dataContext, setDataContext] = useState<Record<string, unknown> | null>(null);
  const [showDataContext, setShowDataContext] = useState(false);

  useEffect(() => {
    checkServerConnection();
    loadSavedRules();
  }, []);

  const checkServerConnection = async () => {
    try {
      await apiClient.healthCheck();
      setServerStatus({ connected: true, error: null });
    } catch (error) {
      setServerStatus({ 
        connected: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      });
    }
  };

  const loadSavedRules = async () => {
    try {
      const rules = await RuleStorage.getActiveRules();
      setSavedRules(rules);
    } catch (error) {
      console.error('Failed to load saved rules:', error);
    }
  };

  const handleRuleSelection = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRules(savedRules.map(rule => rule.id));
  };

  const handleDeselectAll = () => {
    setSelectedRules([]);
  };

  const handleExecuteSelected = async () => {
    if (selectedRules.length === 0 || !realmId.trim() || !accessToken.trim() || !entity.trim()) {
      return;
    }

    setIsExecuting(true);
    try {
      const rulesToExecute = savedRules.filter(rule => selectedRules.includes(rule.id));
      const result = await apiClient.executeRules(rulesToExecute, realmId, accessToken, entity) as { data: BatchExecutionResult };
      setExecutionResult(result.data);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteAllActive = async () => {
    if (!realmId.trim() || !accessToken.trim() || !entity.trim()) {
      return;
    }

    setIsExecuting(true);
    try {
      const result = await apiClient.executeAllActiveRules(savedRules, realmId, accessToken, entity) as { data: BatchExecutionResult };
      setExecutionResult(result.data);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteSingleRule = async (rule: AuditRule) => {
    if (!realmId.trim() || !accessToken.trim() || !entity.trim()) {
      return;
    }

    setIsExecuting(true);
    try {
      const result = await apiClient.executeRule(rule, realmId, accessToken, entity) as { data: ExecutionResult };
      setExecutionResult({
        summary: {
          total_rules_executed: 1,
          successful_executions: 1,
          failed_executions: 0,
          total_transactions_checked: result.data.execution_summary.total_checked,
          total_transactions_flagged: result.data.execution_summary.flagged_count,
          total_execution_time: result.data.execution_summary.execution_time
        },
        individual_results: [{ success: true, data: result.data }],
        executed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const exportResults = () => {
    if (!executionResult) return;
    
    const dataStr = JSON.stringify(executionResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const handleFetchDataContext = async () => {
    if (!realmId.trim() || !accessToken.trim() || !entity.trim()) {
      return;
    }

    try {
      const result = await apiClient.getDataContext(realmId, accessToken, entity) as { data: Record<string, unknown> };
      setDataContext(result.data);
      setShowDataContext(true);
    } catch (error) {
      console.error('Failed to fetch data context:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Rule Execution Engine
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Execute your audit rules against QuickBooks data to identify flagged transactions and compliance issues.
          </p>
        </div>

        {/* Connection Status */}
        <div className={`p-4 rounded-lg border ${
          serverStatus.connected 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {serverStatus.connected ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              {serverStatus.connected ? 'Connected to server' : 'Server connection failed'}
            </span>
          </div>
          {serverStatus.error && (
            <p className="text-sm mt-1">{serverStatus.error}</p>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">QuickBooks Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Realm ID
              </label>
              <input
                type="text"
                value={realmId}
                onChange={e => setRealmId(e.target.value)}
                placeholder="Enter QuickBooks Realm ID"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={!serverStatus.connected}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="Enter OAuth Access Token"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={!serverStatus.connected}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Entity Type
              </label>
              <select
                value={entity}
                onChange={e => setEntity(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={!serverStatus.connected}
              >
                <option value="Expense">Expense</option>
                <option value="Bill">Bill</option>
                <option value="Purchase">Purchase</option>
                <option value="Invoice">Invoice</option>
                <option value="Payment">Payment</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleFetchDataContext}
              disabled={!realmId.trim() || !accessToken.trim() || !entity.trim() || !serverStatus.connected}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Database className="w-4 h-4" />
              View Complete Data Context
            </button>
            <p className="text-sm text-slate-600 mt-2">
              Fetch and view the complete QuickBooks data structure for better rule understanding
            </p>
          </div>
        </div>

        {/* Rule Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-800">Select Rules to Execute</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          {savedRules.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No rules found. Create some rules first to execute them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedRules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedRules.includes(rule.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleRuleSelection(rule.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedRules.includes(rule.id)}
                          onChange={() => handleRuleSelection(rule.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-800">{rule.rule_type}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rule.action === 'flag' ? 'bg-yellow-100 text-yellow-800' :
                          rule.action === 'review' ? 'bg-blue-100 text-blue-800' :
                          rule.action === 'reject' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {rule.action}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 ml-7">{rule.original_instruction}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecuteSingleRule(rule);
                      }}
                      disabled={isExecuting || !serverStatus.connected}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Execution Controls</h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExecuteSelected}
              disabled={isExecuting || selectedRules.length === 0 || !serverStatus.connected}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Execute Selected ({selectedRules.length})
            </button>
            
            <button
              onClick={handleExecuteAllActive}
              disabled={isExecuting || savedRules.length === 0 || !serverStatus.connected}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5" />
              Execute All Active ({savedRules.length})
            </button>
          </div>

          {isExecuting && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Executing rules...</span>
            </div>
          )}
        </div>

        {/* Data Context */}
        {showDataContext && dataContext && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">Complete Data Context</h2>
              <button
                onClick={() => setShowDataContext(false)}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                {JSON.stringify(dataContext, null, 2)}
              </pre>
            </div>
            
            <p className="text-sm text-slate-600 mt-4">
              This is the complete QuickBooks API response for the {entity} entity. 
              Use this data structure to understand available fields and data formats for creating more accurate rules.
            </p>
          </div>
        )}

        {/* Results */}
        {executionResult && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">Execution Results</h2>
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Results
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Rules Executed</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">{executionResult.summary.total_rules_executed}</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Successful</span>
                </div>
                <p className="text-2xl font-bold text-green-800">{executionResult.summary.successful_executions}</p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Flagged</span>
                </div>
                <p className="text-2xl font-bold text-yellow-800">{executionResult.summary.total_transactions_flagged}</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Duration</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{formatExecutionTime(executionResult.summary.total_execution_time)}</p>
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-4">
              {executionResult.individual_results.map((result, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  {result.success && result.data ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {result.data?.rule_type}
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-600">
                            {result.data?.execution_summary.flagged_count} flagged / {result.data?.execution_summary.total_checked} total
                          </span>
                          <button
                            onClick={() => setShowDetails(showDetails === result.data?.rule_id ? null : result.data?.rule_id || null)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            {showDetails === result.data?.rule_id ? 'Hide' : 'Show'} Details
                          </button>
                        </div>
                      </div>
                      
                      {showDetails === result.data?.rule_id && (
                        <div className="mt-4 space-y-4">
                          {result.data.flagged_transactions.map((transaction, txIndex) => (
                            <div key={txIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-red-800">Transaction ID: {transaction.id}</span>
                                <span className="text-sm text-red-600">{transaction.action}</span>
                              </div>
                              <p className="text-sm text-red-700 mb-3">{transaction.reason}</p>
                              
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-red-800">Matched Conditions:</h4>
                                {transaction.matched_conditions.map((condition, condIndex) => (
                                  <div key={condIndex} className="text-sm text-red-700 ml-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{condition.field}</span>
                                      <span className="mx-2">{condition.operator}</span>
                                      <span className="bg-red-100 px-2 py-1 rounded">{String(condition.value)}</span>
                                      <span className="mx-2">→</span>
                                      <span className="bg-red-200 px-2 py-1 rounded">{String(condition.actual_value)}</span>
                                    </div>
                                    
                                    {/* Enhanced Field Data Display */}
                                    {condition.flagged_field_data && (
                                      <div className="ml-4 bg-red-50 border border-red-200 rounded p-3">
                                        <h5 className="text-xs font-medium text-red-800 mb-2">Complete Flagged Field Data:</h5>
                                        
                                        {condition.flagged_field_data.line_index !== undefined ? (
                                          // Line field data
                                          <div className="space-y-2">
                                            <div className="text-xs text-red-700">
                                              <span className="font-medium">Line Index:</span> {condition.flagged_field_data.line_index}
                                            </div>
                                            <div className="text-xs text-red-700">
                                              <span className="font-medium">Field Path:</span> {condition.flagged_field_data.field_path}
                                            </div>
                                            <div className="text-xs text-red-700">
                                              <span className="font-medium">Field Value:</span> {String(condition.flagged_field_data.field_value)}
                                            </div>
                                            <div className="text-xs text-red-700">
                                              <span className="font-medium">Complete Line Data:</span>
                                            </div>
                                            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                                              {JSON.stringify(condition.flagged_field_data.line_data, null, 2)}
                                            </pre>
                                          </div>
                                        ) : (
                                          // Regular field data
                                          <div className="space-y-2">
                                            {condition.flagged_field_data.parent_path && (
                                              <div className="text-xs text-red-700">
                                                <span className="font-medium">Parent Path:</span> {condition.flagged_field_data.parent_path}
                                              </div>
                                            )}
                                            <div className="text-xs text-red-700">
                                              <span className="font-medium">Field Name:</span> {condition.flagged_field_data.field_name}
                                            </div>
                                            <div className="text-xs text-red-700">
                                              <span className="font-medium">Field Value:</span> {String(condition.flagged_field_data.field_value)}
                                            </div>
                                            <div className="text-xs text-red-700">
                                              <span className="font-medium">Parent Object:</span>
                                            </div>
                                            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                                              {JSON.stringify(condition.flagged_field_data.parent_object, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span>Failed to execute rule: {result.error}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 