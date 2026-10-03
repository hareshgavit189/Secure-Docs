import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  Briefcase,
  FileText,
  Clock,
  ShieldCheck,
  Plus,
  Upload,
  Search,
  ArrowRight,
  ShieldAlert,
  History,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { caseService } from '../services/caseService';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    totalDocuments: 0,
    pendingReviews: 0,
    integrityRate: '100%',
    recentAudits: [],
  });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const canCreateCase = ['Admin', 'Officer'].includes(user?.role);
  const canUploadEvidence = ['Admin', 'Officer'].includes(user?.role);
  const canViewAudit = ['Admin', 'Auditor'].includes(user?.role);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, casesData] = await Promise.all([
        auditService.getDashboardStats(),
        caseService.getCases(),
      ]);
      setStats(statsData);
      setRecentCases((casesData.data || []).slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Security & Evidence Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time MongoDB tamper-evident depository & case tracking system
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh metrics"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {canCreateCase && (
            <Link
              href="/cases/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              <Plus size={16} />
              New Case
            </Link>
          )}
          {canUploadEvidence && (
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-800/20"
            >
              <Upload size={16} />
              Upload Evidence
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Cases */}
        <Link href="/cases" className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Briefcase size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-slate-900">{stats.totalCases}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Total Case Files</div>
          </div>
        </Link>

        {/* Total Documents */}
        <Link href="/documents" className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repository</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-slate-900">{stats.totalDocuments}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Evidentiary Documents</div>
          </div>
        </Link>

        {/* Pending Reviews */}
        <Link href="/documents" className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Action Needed</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-slate-900">{stats.pendingReviews}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Pending Verification</div>
          </div>
        </Link>

        {/* Cryptographic Integrity Rate */}
        <Link href="/integrity" className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">SHA-256 Valid</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-emerald-600">{stats.integrityRate}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Integrity Score</div>
          </div>
        </Link>
      </div>

      {/* Main Grid: Active Cases & Cryptographic Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Cases (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Recent Case Files
              </h2>
              <p className="text-xs text-slate-400">Active law enforcement & judicial cases</p>
            </div>
            <Link
              href="/cases"
              className="text-xs font-bold text-cyan-600 hover:text-cyan-500 flex items-center gap-1 transition-colors"
            >
              View all ({stats.totalCases}) <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCases.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No cases recorded yet.</div>
            ) : (
              recentCases.map((c) => (
                <Link
                  key={c.caseId}
                  href={`/cases/${c.caseId}`}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4 block"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-cyan-600">{c.caseId}</span>
                      <StatusBadge value={c.status} />
                      <StatusBadge value={c.priority} />
                    </div>
                    <div className="text-sm font-bold text-slate-900 truncate">{c.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.department} • Officer: {c.assignedOfficer}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                      {c.documentsCount || 0} Docs
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Tailored by Role */}
        {canViewAudit ? (
          <div className="bg-[#18263b] rounded-2xl border border-slate-800 text-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={18} className="text-cyan-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Audit Hash Chain
                </h2>
              </div>
              <Link
                href="/audit"
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Verify <ArrowRight size={12} />
              </Link>
            </div>

            <div className="p-4 flex-1 space-y-3 font-mono text-[11px]">
              {(stats.recentAudits || []).slice(0, 4).map((audit, i) => (
                <div key={audit.id || i} className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-cyan-300 uppercase">{audit.action}</span>
                    <span>{new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-xs text-slate-200 truncate">{audit.details}</div>
                  <div className="mt-2 text-[9px] text-slate-400 truncate flex items-center gap-1">
                    <span className="text-cyan-400">HASH:</span> {audit.eventHash || '0000000000...'}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-900/80 border-t border-white/10 text-center">
              <Link
                href="/integrity"
                className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold inline-block transition-colors"
              >
                Launch Tamper Detector
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#18263b] rounded-2xl border border-slate-800 text-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Evidence Integrity Suite
                </h2>
              </div>
            </div>

            <div className="p-5 flex-1 space-y-4 text-xs">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-2">
                <div className="text-[11px] font-bold text-cyan-300 uppercase">Cryptographic Verification</div>
                <p className="text-slate-300 text-xs">
                  All uploaded evidence documents are secured with automated SHA-256 ledger signatures.
                </p>
                <div className="text-[11px] text-emerald-400 font-mono font-bold">
                  Status: 100% Tamper Proof
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Your Role Access</div>
                <div className="text-sm font-bold text-cyan-400">{user?.role}</div>
                <div className="text-[10px] text-slate-400">Department: {user?.department || 'Investigation'}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 border-t border-white/10 text-center">
              <Link
                href="/integrity"
                className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold inline-block transition-colors"
              >
                Verify Document Hash
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
