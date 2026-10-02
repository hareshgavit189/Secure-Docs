import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Login() {
  const [identifier, setIdentifier] = useState('raj.patel@securedocs.gov');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(identifier, password);
      login(res.token, res.user);
      setLocation('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email, pwd) => {
    setIdentifier(email);
    setPassword(pwd);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 animate-fadeIn">
        {/* Header */}
        <div className="bg-[#18263b] p-8 text-white text-center border-b border-white/10">
          <div className="size-12 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <Shield size={26} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">SecureDocs</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-widest">
            Cryptographic Evidence & Case System
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email or Employee ID
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. raj.patel@securedocs.gov"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Role Selector (Essential for Hackathon Jury Evaluation!) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              1-Click Demo Credentials (for Hackathon Jury):
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('raj.patel@securedocs.gov', 'password123')}
                className="p-2 text-left bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-slate-800">Officer Patel</div>
                <div className="text-[10px] text-slate-500">Investigation</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@securedocs.gov', 'password123')}
                className="p-2 text-left bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-slate-800">Admin Officer</div>
                <div className="text-[10px] text-slate-500">Administration</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('mehta@securedocs.gov', 'password123')}
                className="p-2 text-left bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-slate-800">Counsel Mehta</div>
                <div className="text-[10px] text-slate-500">Legal Reviewer</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('auditor@securedocs.gov', 'password123')}
                className="p-2 text-left bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-slate-800">Auditor Verma</div>
                <div className="text-[10px] text-slate-500">Compliance & Audit</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Need a new account?{' '}
            <Link href="/register" className="font-bold text-cyan-600 hover:text-cyan-500">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
