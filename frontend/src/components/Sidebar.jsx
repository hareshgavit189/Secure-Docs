import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Upload,
  ShieldCheck,
  History,
  FolderLock,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const allNavItems = [
  { label: 'Dashboard',          path: '/dashboard',  icon: LayoutDashboard, roles: ['Admin', 'Officer', 'Legal Reviewer', 'Auditor'] },
  { label: 'Cases Repository',   path: '/cases',      icon: Briefcase,       roles: ['Admin', 'Officer', 'Legal Reviewer', 'Auditor'] },
  { label: 'Evidence Documents', path: '/documents',  icon: FileText,        roles: ['Admin', 'Officer', 'Legal Reviewer', 'Auditor'] },
  { label: 'Upload Evidence',    path: '/upload',     icon: Upload,          roles: ['Admin', 'Officer'] },
  { label: 'Integrity Suite',    path: '/integrity',  icon: ShieldCheck,     roles: ['Admin', 'Officer', 'Legal Reviewer', 'Auditor'] },
  { label: 'Cryptographic Audit',path: '/audit',      icon: History,         roles: ['Admin', 'Auditor'] },
];

function SidebarNav({ onClose }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const userRole = user?.role || 'Officer';
  const visibleNavItems = allNavItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="flex flex-col h-full bg-[#18263b] text-slate-300 select-none">
      {/* ── Brand Header ── */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 bg-[#121c2d] shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <FolderLock size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-0.5">
              Secure<span className="text-cyan-400">Docs</span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Legal Evidence
            </div>
          </div>
        </div>

        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Nav Links ── */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
          Core Workspaces
        </div>

        {visibleNavItems.map(({ label, path, icon: Icon }) => {
          const active =
            location === path ||
            (path !== '/dashboard' && location.startsWith(path));

          return (
            <Link
              key={path}
              href={path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                active
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={18} className={active ? 'text-cyan-400 shrink-0' : 'text-slate-400 shrink-0'} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Responsive Sidebar:
 * - Desktop: Collapsible via width transition (3-lines hamburger toggle)
 * - Mobile: Sliding drawer from left with backdrop
 */
export function Sidebar({ isDesktopOpen, isMobileOpen, onCloseMobile }) {
  return (
    <>
      {/* ── Desktop Collapsible Sidebar (w-64 <-> w-0) ── */}
      <aside
        className={`
          hidden lg:block shrink-0 overflow-hidden
          transition-[width] duration-300 ease-in-out
          bg-[#18263b] border-r border-slate-800 sticky top-0 h-screen
          ${isDesktopOpen ? 'w-64' : 'w-0 border-r-0'}
        `}
      >
        <SidebarNav />
      </aside>

      {/* ── Mobile Sliding Drawer ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#18263b] border-r border-slate-800 shadow-2xl lg:hidden
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}
        `}
      >
        <SidebarNav onClose={onCloseMobile} />
      </aside>
    </>
  );
}

