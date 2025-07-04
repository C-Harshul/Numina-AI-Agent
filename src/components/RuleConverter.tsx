import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Download,
  Trash2,
  Eye,
  Wifi,
  WifiOff,
  Key,
  Server,
  ServerOff
} from 'lucide-react';
import { RuleParser } from '../services/ruleParser';
import { RuleStorage } from '../services/ruleStorage';
import { AuditRule, ConversionResult } from '../types/audit';
import { apiClient } from '../services/apiClient';

export const RuleConverter: React.FC = () => {
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedRules, setSavedRules] = useState<AuditRule[]>([]);
  const [showRuleDetails, setShowRuleDetails] = useState<string | null>(null);
  const [parserStatus, setParserStatus] = useState({ available: false, apiKey: false });
  const [serverStatus, setServerStatus] = useState<{ connected: boolean; error: string | null }>({ connected: false, error: null });
  const [realmId, setRealmId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [entity, setEntity] = useState('Expense');

  useEffect(() => {
    checkServerConnection();
    loadSavedRules();
    loadParserStatus();
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

  const loadParserStatus = async () => {
    try {
      const status = await RuleParser.getParserStatus();
      setParserStatus(status);
    } catch (error) {
      console.error('Failed to load parser status:', error);
    }
  };

  const exampleInstructions = [
    "Flag any expense above $1,000 not tagged as capital expenditure.",
    "If a vendor appears more than twice in one day, flag for review.",
    "If a transaction is in Meals category but over $500, flag it.",
    "Flag duplicate transactions with same amount and vendor.",
    "Review any expense after 10 PM or before 6 AM."
  ];

  const handleConvert = async () => {
    if (!instruction.trim() || !realmId.trim() || !accessToken.trim() || !entity.trim()) return;
    setIsProcessing(true);
    try {
      const conversionResult = await RuleParser.parseInstruction(instruction, realmId, accessToken, entity);
      setResult(conversionResult);
    } catch (error) {
      setResult({
        success: false,
        error: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRule = async () => {
    if (!result?.rule) return;

    try {
      const savedRule = await RuleStorage.saveRule(result.rule, instruction, 'user');
      await loadSavedRules();
      
      // Clear the form
      setInstruction('');
      setResult(null);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await RuleStorage.deleteRule(id);
      await loadSavedRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleExportRules = async () => {
    try {
      const rulesJson = await RuleStorage.exportRules();
      const blob = new Blob([rulesJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-rules.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export rules:', error);
    }
  };

  const handleClearAllRules = async () => {
    try {
      await RuleStorage.clearAllRules();
      await loadSavedRules();
    } catch (error) {
      console.error('Failed to clear rules:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatRuleForDisplay = (rule: any) => {
    return JSON.stringify(rule, null, 2);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-teal-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">AI Rule Converter</h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Convert natural language audit instructions into machine-executable rules using Google Gemini AI
        </p>
        
        {/* Status Indicators */}
        <div className="flex items-center justify-center space-x-4 mt-4">
          {/* Server Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            serverStatus.connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {serverStatus.connected ? (
              <Server className="w-4 h-4" />
            ) : (
              <ServerOff className="w-4 h-4" />
            )}
            <span>
              {serverStatus.connected ? 'Backend Connected' : 'Backend Disconnected'}
            </span>
          </div>

          {/* API Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            parserStatus.available 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {parserStatus.available ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span>
              {parserStatus.available ? 'Gemini AI Connected' : 'Using Fallback Parser'}
            </span>
          </div>
          
          {!parserStatus.apiKey && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              <Key className="w-4 h-4" />
              <span>API Key Required</span>
            </div>
          )}
        </div>

        {!serverStatus.connected && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-2xl mx-auto">
            <h4 className="font-medium text-red-900 mb-2">Backend Server Not Connected</h4>
            <p className="text-sm text-red-800 mb-2">
              The backend server is not running. Please start it to use the AI Rule Converter.
            </p>
            <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
              <li>Open a terminal in the project directory</li>
              <li>Run <code className="bg-red-100 px-1 rounded">npm run dev:server</code></li>
              <li>Or run <code className="bg-red-100 px-1 rounded">npm run dev</code> to start both frontend and backend</li>
            </ol>
          </div>
        )}

        {!parserStatus.apiKey && serverStatus.connected && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left max-w-2xl mx-auto">
            <h4 className="font-medium text-blue-900 mb-2">Setup Google Gemini API</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
              <li>Create a new API key</li>
              <li>Add <code className="bg-blue-100 px-1 rounded">GEMINI_API_KEY=your_api_key</code> to your server/.env file</li>
              <li>Restart the backend server</li>
            </ol>
          </div>
        )}
      </div>

      {/* Main Converter */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Audit Instruction
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Enter your audit rule in plain English..."
              className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              disabled={!serverStatus.connected}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              QuickBooks Realm ID
            </label>
            <input
              type="text"
              value={realmId}
              onChange={e => setRealmId(e.target.value)}
              placeholder="Enter your QuickBooks company (realm) ID"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={!serverStatus.connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              OAuth Access Token
            </label>
            <input
              type="text"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="Enter your QuickBooks OAuth access token"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={!serverStatus.connected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Transaction Entity Type
            </label>
            <input
              type="text"
              value={entity}
              onChange={e => setEntity(e.target.value)}
              placeholder="e.g. Expense, Invoice, Bill, Payment"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={!serverStatus.connected}
            />
          </div>

          {/* Example Instructions */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Example Instructions:</p>
            <div className="grid gap-2">
              {exampleInstructions.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setInstruction(example)}
                  disabled={!serverStatus.connected}
                  className="text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={!instruction.trim() || isProcessing || !serverStatus.connected}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing with AI...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Convert to Rule</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conversion Result */}
      {result && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-xl font-semibold text-slate-800">
              {result.success ? 'Conversion Successful' : 'Conversion Failed'}
            </h3>
            {result.success && result.rule && (
              <div className="ml-auto flex items-center space-x-2">
                <span className="text-sm text-slate-500">Powered by</span>
                <div className="flex items-center space-x-1">
                  {parserStatus.available ? (
                    <span className="text-sm font-medium text-blue-600">Gemini AI</span>
                  ) : (
                    <span className="text-sm font-medium text-slate-600">Fallback Parser</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {result.success && result.rule ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Generated Rule</span>
                  <button
                    onClick={() => copyToClipboard(formatRuleForDisplay(result.rule))}
                    className="p-1 hover:bg-slate-200 rounded transition-colors duration-200"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <pre className="text-sm text-slate-800 overflow-x-auto">
                  {formatRuleForDisplay(result.rule)}
                </pre>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Confidence Score: <span className="font-medium">{(result.rule.confidence_score * 100).toFixed(1)}%</span>
                </div>
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  Save Rule
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-600">{result.error}</p>
              {result.suggestions && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Saved Rules */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Saved Rules ({savedRules.length})</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportRules}
              disabled={!serverStatus.connected}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleClearAllRules}
              disabled={!serverStatus.connected}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {savedRules.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No rules saved yet. Convert your first instruction above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedRules.map((rule) => (
              <div key={rule.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {rule.rule_type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {rule.action}
                      </span>
                      <span className="text-xs text-slate-500">v{rule.version}</span>
                      <span className="text-xs text-slate-500">
                        {(rule.confidence_score * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 mb-2">{rule.original_instruction}</p>
                    <p className="text-xs text-slate-500">{rule.reason}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setShowRuleDetails(showRuleDetails === rule.id ? null : rule.id)}
                      className="p-2 hover:bg-slate-100 rounded transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={!serverStatus.connected}
                      className="p-2 hover:bg-red-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {showRuleDetails === rule.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <pre className="text-xs text-slate-600 bg-slate-50 p-3 rounded overflow-x-auto">
                      {formatRuleForDisplay(rule)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};