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

const navItems = [
  { label: 'Dashboard',          path: '/dashboard',  icon: LayoutDashboard },
  { label: 'Cases Repository',   path: '/cases',      icon: Briefcase },
  { label: 'Evidence Documents', path: '/documents',  icon: FileText },
  { label: 'Upload Evidence',    path: '/upload',     icon: Upload },
  { label: 'Integrity Suite',    path: '/integrity',  icon: ShieldCheck },
  { label: 'Cryptographic Audit',path: '/audit',      icon: History },
];

/**
 * Responsive Sidebar:
 * - Mobile: Drawer that slides over content using transform with shadow
 * - Desktop: Smooth collapsible sidebar
 */
export function Sidebar({ isOpen, onClose }) {
  const [location] = useLocation();

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-72 lg:w-64
        bg-[#18263b] border-r border-slate-800
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 opacity-100 shadow-2xl' : '-translate-x-full opacity-0 pointer-events-none lg:pointer-events-auto'}
        lg:static lg:inset-auto lg:opacity-100 lg:shadow-none
        ${isOpen ? 'lg:w-64' : 'lg:w-0 lg:border-none lg:overflow-hidden'}
      `}
    >
      <div className="w-72 lg:w-64 h-full flex flex-col bg-[#18263b] text-slate-300 select-none">

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
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Nav Links ── */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Core Workspaces
          </div>

          {navItems.map(({ label, path, icon: Icon }) => {
            const active =
              location === path ||
              (path !== '/dashboard' && location.startsWith(path));

            return (
              <Link
                key={path}
                href={path}
                onClick={() => {
                  if (onClose && window.innerWidth < 1024) onClose();
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
    </aside>
  );
}

