import { useState } from 'react';
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
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './ProfileModal';

const navItems = [
  { label: 'Dashboard',          path: '/dashboard',  icon: LayoutDashboard },
  { label: 'Cases Repository',   path: '/cases',      icon: Briefcase },
  { label: 'Evidence Documents', path: '/documents',  icon: FileText },
  { label: 'Upload Evidence',    path: '/upload',     icon: Upload },
  { label: 'Integrity Suite',    path: '/integrity',  icon: ShieldCheck },
  { label: 'Cryptographic Audit',path: '/audit',      icon: History },
];

/**
 * Sidebar with smooth open/close via CSS width transition.
 * isOpen = true  → w-64 (256 px) visible
 * isOpen = false → w-0 (hidden, content clipped)
 * Works on ALL screen sizes — toggled by the ☰ button in Navbar.
 */
export function Sidebar({ isOpen }) {
  const [location]       = useLocation();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      {/* Outer shell: width animates between 0 ↔ 256 px */}
      <aside
        className={`
          shrink-0 overflow-hidden
          transition-[width] duration-300 ease-in-out
          bg-[#18263b] border-r border-slate-800
          ${isOpen ? 'w-64' : 'w-0'}
        `}
      >
        {/*
          Inner container: always 256 px wide so content never squishes.
          The outer overflow-hidden clips it when sidebar is closing.
        */}
        <div className="w-64 flex flex-col min-h-screen bg-[#18263b] text-slate-300">

          {/* ── Brand Header ── */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 bg-[#121c2d] shrink-0">
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

          {/* ── Nav Links ── */}
          <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-cyan-400 shrink-0' : 'text-slate-400 shrink-0'} />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── User Info & Logout ── */}
          <div className="p-4 border-t border-white/10 bg-[#121c2d]/60 shrink-0">
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-white/10 transition-all text-left group border border-transparent hover:border-white/10"
              title="Click to view full user profile"
            >
              <div className="size-9 rounded-full bg-slate-700 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {user?.name || 'Authorized Officer'}
                </div>
                <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                  <Shield size={10} />
                  <span className="truncate">{user?.role || 'Officer'}</span>
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 whitespace-nowrap"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>

        </div>
      </aside>

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}

