import { X, Shield, LogOut, CheckCircle2, User, Mail, Building, IdCard, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const role = user?.role || 'Officer';

  // Customize styling & permissions according to role
  const getRoleBadgeStyle = (userRole) => {
    switch (userRole) {
      case 'Admin':
        return {
          headerBg: 'bg-[#18263b] border-b border-slate-700/60',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          iconColor: 'text-cyan-400',
          clearance: 'Level 5 (Full System Administration & Key Management)',
          permissions: [
            'Full System Administration & Configuration',
            'User Role Assignment & Account Management',
            'Cryptographic Hash Chain Auditing & Resets',
            'View & Manage All Case Files & Sensitive Documents',
          ],
        };
      case 'Legal Reviewer':
        return {
          headerBg: 'bg-[#18263b] border-b border-slate-700/60',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          iconColor: 'text-cyan-400',
          clearance: 'Level 4 (Legal Audit & Chain of Custody Sign-Off)',
          permissions: [
            'Inspect Legal Evidence & Chain of Custody',
            'Approve & Sign Off Case Audit Reports',
            'Verify Cryptographic Hash Integrity',
          ],
        };
      case 'Auditor':
        return {
          headerBg: 'bg-[#18263b] border-b border-slate-700/60',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          iconColor: 'text-emerald-400',
          clearance: 'Level 3 (Cryptographic Audit & Compliance Inspection)',
          permissions: [
            'View Full System Audit Logs & Timestamps',
            'Verify SHA-256 Hash Chain Integrity',
            'Export Compliance Verification Certificates',
          ],
        };
      case 'Officer':
      default:
        return {
          headerBg: 'bg-[#18263b] border-b border-slate-700/60',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          iconColor: 'text-cyan-400',
          clearance: 'Level 3 (Case Investigation & Evidence Management)',
          permissions: [
            'Create & Manage Investigation Cases',
            'Upload & Hash Evidence Documents',
            'Perform SHA-256 Verification Checks',
          ],
        };
    }
  };

  const roleDetails = getRoleBadgeStyle(role);

  const handleSignOut = () => {
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header Banner */}
        <div className={`p-6 text-white ${roleDetails.headerBg} relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{user?.name || 'Authorized User'}</h2>
                <span className={`px-2.5 py-0.5 text-[11px] font-extrabold border rounded-md uppercase tracking-wide ${roleDetails.badgeClass}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1.5 font-medium">
                <Mail size={13} className="opacity-75" />
                {user?.email || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
              <IdCard size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</div>
                <div className="font-mono font-bold text-slate-800 text-sm mt-0.5">{user?.employeeId || 'EMP-101'}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
              <Building size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{user?.department || 'Administration'}</div>
              </div>
            </div>
          </div>

          {/* Security Clearance */}
          <div className="p-3.5 bg-slate-900 rounded-2xl text-white border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award size={14} className={roleDetails.iconColor} />
                Security Clearance Level
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                Active & Verified
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-200">{roleDetails.clearance}</div>
          </div>

          {/* Assigned Permissions */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield size={14} className="text-cyan-600" />
              Assigned Role Permissions
            </div>
            <div className="space-y-1.5">
              {roleDetails.permissions.map((perm, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
          
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
