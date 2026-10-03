import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Top Navbar with hamburger (☰ / ✕) toggle button.
 * The button is visible on ALL screen sizes and controls the sidebar.
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

      {/* ── Right: Status + User ── */}
      <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">

        {/* Security status badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="hidden md:inline">SHA-256 Chain Active</span>
          <span className="md:hidden">Secure</span>
        </div>

        {/* User role info */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
              {user?.name || 'Authorized Officer'}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
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
