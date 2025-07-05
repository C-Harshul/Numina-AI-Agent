import React, { useState } from 'react';
import { 
  CheckCircle, 
  Copy, 
  Zap, 
  BarChart3, 
  Mail, 
  Twitter, 
  Linkedin, 
  Github,
  ArrowRight,
  Shield,
  Brain,
  Target,
  Settings,
  Home,
  Play
} from 'lucide-react';
import { RuleConverter } from './components/RuleConverter';
import { RuleExecutor } from './components/RuleExecutor';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'converter' | 'executor'>('home');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  // Navigation component for converter and executor views
  const Navigation = ({ currentView }: { currentView: 'converter' | 'executor' }) => (
    <nav className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-teal-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">Numina</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-blue-900 transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            onClick={() => setCurrentView('converter')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              currentView === 'converter'
                ? 'bg-gradient-to-r from-blue-900 to-teal-600 text-white'
                : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Rule Creator</span>
          </button>
          <button
            onClick={() => setCurrentView('executor')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              currentView === 'executor'
                ? 'bg-gradient-to-r from-blue-900 to-teal-600 text-white'
                : 'text-slate-600 hover:text-blue-900'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Rule Executor</span>
          </button>
        </div>
      </div>
    </nav>
  );

  if (currentView === 'converter') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation currentView="converter" />
        <div className="py-8">
          <RuleConverter />
        </div>
      </div>
    );
  }

  if (currentView === 'executor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navigation currentView="executor" />
        <div className="py-8">
          <RuleExecutor />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 to-teal-900/5"></div>
        <nav className="relative z-10 px-6 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-900 to-teal-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">Numina</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-900 transition-colors duration-200">Features</a>
              <a href="#about" className="text-slate-600 hover:text-blue-900 transition-colors duration-200">About</a>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('converter')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-900 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Rule Creator</span>
                </button>
                <button
                  onClick={() => setCurrentView('executor')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                >
                  <Play className="w-4 h-4" />
                  <span>Rule Executor</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="relative z-10 px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-8 animate-pulse">
              <Zap className="w-4 h-4 mr-2" />
              AI Agent Demo Available - Try Both Tools
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 leading-tight">
              AI-Powered Audits.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-teal-600">
                Effortless Accuracy.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Revolutionary AI technology that transforms your financial data analysis, 
              automatically flags invalid receipts, and streamlines reconciliation for 
              finance teams and auditors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-900 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Get Notified</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentView('converter')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-slate-800 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border border-slate-200"
              >
                <Brain className="w-4 h-4" />
                <span>Create Rules</span>
              </button>
              <button
                onClick={() => setCurrentView('executor')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                <span>Execute Rules</span>
              </button>
            </div>

            {isSubmitted && (
              <div className="flex items-center justify-center space-x-2 text-green-600 animate-fade-in mt-4">
                <CheckCircle className="w-5 h-5" />
                <span>Thank you! We'll be in touch soon.</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Intelligent Audit Automation
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powered by advanced AI algorithms, Numina delivers unprecedented accuracy 
              and efficiency in financial data analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-blue-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-6 h-6 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Automatic Receipt Validation
              </h3>
              <p className="text-slate-600 leading-relaxed">
                AI-powered analysis instantly identifies suspicious receipts, 
                duplicate entries, and potential fraud indicators.
              </p>
            </div>

            <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-teal-200">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <Copy className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Duplicate Detection
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Advanced pattern recognition eliminates redundant entries 
                and ensures data integrity across all transactions.
              </p>
            </div>

            <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-green-200">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                QuickBooks Integration
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Seamless connectivity with QuickBooks for real-time data 
                analysis and automated workflow integration.
              </p>
            </div>

            <div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <Brain className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                AI Rule Generation
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Convert natural language instructions into machine-executable 
                audit rules with advanced AI processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About/Vision Section */}
      <section id="about" className="py-20 px-6 bg-gradient-to-r from-slate-900 to-blue-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-400 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-8">
            Our Vision
          </h2>
          
          <p className="text-xl text-blue-100 leading-relaxed mb-8">
            We're redefining how audits are done — with intelligence, transparency, and trust. 
            Our mission is to empower finance professionals with AI-driven insights that eliminate 
            manual errors, reduce audit time by 80%, and ensure absolute accuracy in financial reporting.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400 mb-2">80%</div>
              <div className="text-blue-100">Time Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400 mb-2">99.9%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400 mb-2">24/7</div>
              <div className="text-blue-100">AI Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Numina</span>
            </div>
            
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <a href="mailto:hello@numina.ai" className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors duration-200">
                <Mail className="w-4 h-4" />
                <span>hello@numina.ai</span>
              </a>
              
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 mt-8 text-center">
            <p className="text-slate-400">© 2025 Numina. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;