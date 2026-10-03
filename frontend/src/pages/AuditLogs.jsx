import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Hash,
  Link as LinkIcon,
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { useAuth } from '../context/AuthContext';

export default function AuditLogs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !['Admin', 'Auditor'].includes(user.role)) {
      setLocation('/dashboard');
    }
  }, [user]);

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [chainResult, setChainResult] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAuditLogs({ search });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setChainResult(null);
    try {
      const res = await auditService.verifyChain();
      setChainResult(res);
    } catch (err) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Verify Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Cryptographic Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident, forward-linked SHA-256 event chain maintaining immutable evidence custody
          </p>
        </div>
        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          <ShieldCheck size={16} />
          {verifying ? 'Verifying Math Hash Chain...' : 'Verify Cryptographic Chain'}
        </button>
      </div>

      {/* Verification Banner */}
      {chainResult && (
        <div
          className={`p-5 rounded-2xl border text-xs animate-fadeIn ${
            chainResult.chainValid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {chainResult.chainValid ? (
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            ) : (
              <XCircle size={24} className="text-red-600 shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm">
                {chainResult.chainValid
                  ? 'BLOCKCHAIN CHAIN INTEGRITY: 100% VERIFIED'
                  : 'INTEGRITY BREACH DETECTED'}
              </div>
              <div className="mt-0.5 opacity-90">{chainResult.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user, action, case ID, or hash..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <button
          onClick={fetchLogs}
          title="Refresh logs"
          className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-mono">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Event Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Case / Doc Ref</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">Cryptographic Hash Chaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-sans">
                    Loading blockchain audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-sans">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id || log._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold text-[10px] uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-800 whitespace-nowrap">
                      {log.userName}
                      <span className="block text-[10px] text-slate-400 font-normal">{log.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-700 font-bold whitespace-nowrap">
                      {log.caseId || log.documentId || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-700 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-[10px] max-w-[260px]">
                      <div className="text-slate-400 truncate">
                        <span className="text-slate-500 font-bold">PREV:</span> {log.previousHash || 'GENESIS'}
                      </div>
                      <div className="text-cyan-700 font-bold truncate mt-0.5">
                        <span className="text-cyan-600">CURR:</span> {log.eventHash}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
