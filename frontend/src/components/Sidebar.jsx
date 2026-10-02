import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Upload,
  ShieldCheck,
  History,
  Shield,
  LogOut,
  FolderLock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Cases Repository', path: '/cases', icon: Briefcase },
    { label: 'Evidence Documents', path: '/documents', icon: FileText },
    { label: 'Upload Evidence', path: '/upload', icon: Upload },
    { label: 'Integrity Suite', path: '/integrity', icon: ShieldCheck },
    { label: 'Cryptographic Audit', path: '/audit', icon: History },
  ];

  return (
    <aside className="w-64 bg-[#18263b] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 bg-[#121c2d]">
        <div className="size-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
          <FolderLock size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1">
            Secure<span className="text-cyan-400">Docs</span>
          </div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
            Legal Evidence
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== '/dashboard' && location.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Info & Role Banner */}
      <div className="p-4 border-t border-white/10 bg-[#121c2d]/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-9 rounded-full bg-slate-700 text-cyan-300 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{user?.name || 'Authorized Officer'}</div>
            <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
              <Shield size={10} />
              {user?.role || 'Officer'}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
