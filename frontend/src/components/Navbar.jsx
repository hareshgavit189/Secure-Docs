import { useState } from 'react';
import { Search, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './ProfileModal';

/**
 * Top Navbar with hamburger (☰ / ✕) toggle button, search,
 * clickable user/admin role profile button, and top-right Sign Out button.
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

  const role = user?.role || 'Officer';

  const getRoleBadgeStyle = (r) => {
    if (r === 'Admin') return 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200';
    if (r === 'Legal Reviewer') return 'bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200';
    if (r === 'Auditor') return 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200';
    return 'bg-cyan-100 text-cyan-900 border-cyan-300 hover:bg-cyan-200';
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center gap-3 sticky top-0 z-30 shadow-sm">

        {/* ── Hamburger Toggle (all screen sizes) ── */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {/* Animate between ☰ and ✕ */}
          <span className={`block transition-transform duration-200 ${sidebarOpen ? 'rotate-90' : 'rotate-0'}`}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </span>
        </button>

        {/* ── Search Input ── */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search cases, documents, hashes…"
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* ── Right Corner Controls ── */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Security status badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>SHA-256 Chain Active</span>
          </div>

          {/* ── Interactive Admin / User Role Button (Tap to see Profile) ── */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all text-left group shadow-2xs"
            title="Click to view profile and role permissions"
            aria-label="View user profile"
          >
            <div className="size-7 rounded-full bg-slate-800 text-cyan-300 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[120px] group-hover:text-cyan-700 transition-colors">
                {user?.name || 'Authorized Officer'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                {user?.department || 'Investigation'}
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-extrabold border rounded-md whitespace-nowrap transition-colors ${getRoleBadgeStyle(role)}`}>
              {role}
            </span>
          </button>

          {/* ── Top Right Corner Sign Out Button ── */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all shrink-0 active:scale-95 shadow-2xs"
            title="Sign Out of Portal"
            aria-label="Sign out"
          >
            <LogOut size={15} className="text-slate-500 group-hover:text-red-600 shrink-0" />
            <span className="hidden sm:inline">Sign Out</span>
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

