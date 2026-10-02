import { CheckCircle2, AlertTriangle, XCircle, Shield } from 'lucide-react';

export function StatusBadge({ value, type = 'status' }) {
  if (!value) return null;

  const styles = {
    // Status
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Under Investigation': 'bg-amber-50 text-amber-700 border-amber-200',
    'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
    Closed: 'bg-slate-100 text-slate-700 border-slate-300',
    Archived: 'bg-slate-100 text-slate-500 border-slate-200',

    // Priorities & Risks
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200',

    // Document & Integrity
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200',
    Warning: 'bg-amber-50 text-amber-700 border-amber-200',
    Flagged: 'bg-orange-50 text-orange-700 border-orange-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',

    // Confidentiality
    Confidential: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Highly Restricted': 'bg-purple-50 text-purple-700 border-purple-200',
    Restricted: 'bg-amber-50 text-amber-700 border-amber-200',
    'Public/Internal': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const currentStyle = styles[value] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {value === 'Verified' && <CheckCircle2 size={12} className="text-emerald-600" />}
      {value === 'Failed' && <XCircle size={12} className="text-red-600" />}
      {value === 'Warning' && <AlertTriangle size={12} className="text-amber-600" />}
      {value}
    </span>
  );
}
