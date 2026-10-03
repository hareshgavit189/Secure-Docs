import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Top Navbar with responsive layout and clean mobile toggle button.
 */
export function Navbar({ onSearch, onMenuToggle, sidebarOpen }) {
  const { user }                      = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

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

      {/* ── Right Section: Status + User ── */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">

        {/* Security status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="hidden md:inline">SHA-256 Active</span>
          <span className="md:hidden">Secure</span>
        </div>

        {/* User role info */}
        <div className="flex items-center gap-2 pl-1.5 sm:pl-3 sm:border-l border-slate-200">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
              {user?.name || 'Authorized Officer'}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
              {user?.department || 'Investigation'}
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md whitespace-nowrap">
            {user?.role || 'Officer'}
          </span>
        </div>

      </div>
    </header>
  );
}

