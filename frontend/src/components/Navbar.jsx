import { useState } from 'react';
import { Search, Menu, LogOut, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './ProfileModal';

/**
 * Top Navbar:
 * - 3-lines Hamburger Toggle (for both Desktop collapsible sidebar and Mobile drawer)
 * - Compact responsive Search bar
 * - SHA-256 active badge
 * - Top-right Admin Profile button & Sign Out button
 */
export function Navbar({ onSearch, onMenuToggle, sidebarOpen }) {
  const { user, logout }              = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

  const role = user?.role || 'Admin';

  const getRoleBadgeStyle = (r) => {
    if (r === 'Admin') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (r === 'Legal Reviewer') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (r === 'Auditor') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-30 shadow-xs">

        {/* ── Left: Hamburger (3-lines) + Search Input ── */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-md">
          
          {/* 3-lines Hamburger Toggle Button (ALL Screen Sizes: Desktop & Mobile) */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            title={sidebarOpen ? 'Toggle sidebar navigation' : 'Toggle sidebar navigation'}
          >
            <Menu size={19} />
          </button>

          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none shrink-0"
            />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all text-slate-800 placeholder:text-slate-400 truncate"
            />
          </div>
        </div>

        {/* ── Right Section: Status + Profile Button + Sign Out ── */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

          {/* Security status badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 whitespace-nowrap">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>SHA-256 Active</span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* ── Admin / User Profile Button (Opens Modal) ── */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300 active:scale-95 transition-all text-left group cursor-pointer shrink-0"
            title="Click to view full user profile & permissions"
            aria-label="View user profile"
          >
            <div className="size-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:bg-cyan-700 transition-colors">
              <User size={14} />
            </div>

            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[120px] group-hover:text-cyan-700 transition-colors leading-tight">
                {user?.name || 'Admin Officer'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[120px] leading-tight">
                {user?.department || 'Administration'}
              </div>
            </div>

            <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] font-bold border rounded-md whitespace-nowrap transition-colors ${getRoleBadgeStyle(role)}`}>
              {role}
            </span>
          </button>

          {/* ── Sign Out Button ── */}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-all shrink-0 active:scale-95 shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Sign Out of Portal"
            aria-label="Sign out"
          >
            <LogOut size={14} />
            <span className="hidden md:inline">Sign Out</span>
          </button>

        </div>
      </header>

      {/* Admin / User Profile Details Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}

