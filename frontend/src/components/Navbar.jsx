import { useState, useRef, useEffect } from 'react';
import { Search, Menu, X, Shield, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Top Navbar with search, responsive toggle, and Profile / Admin dropdown with Sign Out.
 */
export function Navbar({ onSearch, onMenuToggle, sidebarOpen }) {
  const { user, logout }              = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef                    = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center gap-2 sm:gap-3 sticky top-0 z-30 shadow-sm shrink-0">

      {/* ── Hamburger Toggle Button ── */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        title={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="block transition-transform duration-200">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </span>
      </button>

      {/* ── Search Input ── */}
      <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-md">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none shrink-0"
        />
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search cases, docs..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all text-slate-800 placeholder:text-slate-400 truncate"
        />
      </div>

      {/* ── Right Section: Status + Profile Menu ── */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">

        {/* Security status badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>SHA-256 Active</span>
        </div>

        {/* ── Admin / Profile Dropdown ── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer select-none"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            title="Account Profile & Settings"
          >
            {/* Avatar Initials */}
            <div className="size-8 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              {userInitials}
            </div>

            {/* Profile Name & Role */}
            <div className="text-left hidden sm:block max-w-[120px]">
              <div className="text-xs font-bold text-slate-800 truncate">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-cyan-700 font-medium truncate flex items-center gap-0.5">
                <Shield size={10} className="shrink-0" />
                <span className="truncate">{user?.role || 'Officer'}</span>
              </div>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                profileOpen ? 'rotate-180 text-cyan-600' : ''
              }`}
            />
          </button>

          {/* ── Dropdown Menu Card ── */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-4 z-50">
              
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="size-11 rounded-xl bg-slate-800 text-cyan-300 flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {user?.name || 'Administrator'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email || 'admin@securedocs.gov'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md inline-flex items-center gap-1">
                      <Shield size={10} />
                      {user?.role || 'Officer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="py-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Department</span>
                  <span className="font-semibold text-slate-700">{user?.department || 'Investigation'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Session Security</span>
                  <span className="font-semibold text-emerald-600 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Active & Verified
                  </span>
                </div>
              </div>

              {/* Sign Out Action Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}


