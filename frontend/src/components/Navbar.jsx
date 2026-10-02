import { useState } from 'react';
import { Search, Bell, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onSearch }) {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search cases, documents, or SHA-256 hashes..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Security Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-semibold text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          MongoDB SHA-256 Chain Active
        </div>

        {/* User Role Tag */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-800">{user?.name || 'Authorized Officer'}</div>
            <div className="text-[10px] text-slate-500">{user?.department || 'Investigation'}</div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-md">
            {user?.role || 'Officer'}
          </span>
        </div>
      </div>
    </header>
  );
}
