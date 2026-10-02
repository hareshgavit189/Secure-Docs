import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  Trash2,
  Eye,
  RefreshCw,
  FolderOpen,
  Calendar,
  User,
} from 'lucide-react';
import { caseService } from '../services/caseService';
import { StatusBadge } from '../components/StatusBadge';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await caseService.getCases({
        search,
        status: statusFilter,
        priority: priorityFilter,
      });
      setCases(res.data || []);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter, priorityFilter]);

  const handleDelete = async (e, caseId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete case ${caseId} and its evidence?`)) {
      return;
    }
    try {
      await caseService.deleteCase(caseId);
      setCases(cases.filter((c) => c.caseId !== caseId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cases Repository</h1>
          <p className="text-xs text-slate-500 mt-1">
            Active criminal, financial, cyber, and civil case dossiers
          </p>
        </div>
        <Link
          href="/cases/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
        >
          <Plus size={16} />
          Register New Case
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, ID, or officer..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Under Review">Under Review</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button
            onClick={fetchCases}
            title="Refresh"
            className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Title & Details</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Assigned Officer</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Docs</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Loading cases from MongoDB...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No cases match your filters.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.caseId} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">
                      <Link href={`/cases/${c.caseId}`} className="hover:underline">
                        {c.caseId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link href={`/cases/${c.caseId}`} className="font-bold text-slate-900 hover:text-cyan-600 block truncate max-w-xs">
                        {c.title}
                      </Link>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.description || 'No description recorded'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{c.department}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span>{c.assignedOfficer}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge value={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge value={c.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {c.documentsCount || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/cases/${c.caseId}`}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="View Case Dossier"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={(e) => handleDelete(e, c.caseId)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Case"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
