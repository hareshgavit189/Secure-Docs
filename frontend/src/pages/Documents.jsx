import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import {
  FileText,
  Search,
  Upload,
  Copy,
  Check,
  Download,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [copiedHash, setCopiedHash] = useState('');

  const canUpload = ['Admin', 'Officer'].includes(user?.role);
  const canDelete = user?.role === 'Admin';

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentService.getDocuments({
        search,
        type: typeFilter,
      });
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, typeFilter]);

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(''), 2500);
  };

  const handleDelete = async (e, docId) => {
    e.preventDefault();
    if (!canDelete) {
      alert('Forbidden: Only Administrators can delete evidence documents.');
      return;
    }
    if (!window.confirm(`Delete evidentiary document ${docId}?`)) return;
    try {
      await documentService.deleteDocument(docId);
      setDocuments(documents.filter((d) => d.documentId !== docId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Evidence Documents Depository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Master repository of cryptographically secured FIRs, forensic reports, and court files
          </p>
        </div>
        {canUpload && (
          <Link
            href="/upload"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
          >
            <Upload size={16} />
            Upload New Document
          </Link>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document name, ID, or SHA-256..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Document Types</option>
            <option value="FIR">FIR</option>
            <option value="Forensic Report">Forensic Report</option>
            <option value="Witness Statement">Witness Statement</option>
            <option value="Charge Sheet">Charge Sheet</option>
            <option value="Court Order">Court Order</option>
          </select>

          <button
            onClick={fetchDocuments}
            title="Refresh"
            className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Doc ID</th>
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4">SHA-256 Hash</th>
                <th className="py-3.5 px-4">Integrity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Loading evidentiary documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No documents found matching criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.documentId} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">
                      <Link href={`/documents/${doc.documentId}`} className="hover:underline">
                        {doc.documentId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/documents/${doc.documentId}`}
                        className="font-bold text-slate-900 hover:text-cyan-600 block truncate max-w-xs"
                      >
                        {doc.documentName}
                      </Link>
                      <div className="text-[11px] text-slate-400">
                        Uploaded by: {doc.uploadedBy}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <Link href={`/cases/${doc.caseId}`} className="hover:text-cyan-600 hover:underline">
                        {doc.caseId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 max-w-[200px]">
                        <span className="truncate text-slate-600">{doc.hash}</span>
                        <button
                          onClick={() => handleCopyHash(doc.hash)}
                          title="Copy SHA-256 Hash"
                          className="text-slate-400 hover:text-cyan-600 transition-colors shrink-0"
                        >
                          {copiedHash === doc.hash ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge value={doc.integrity} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/documents/${doc.documentId}`}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Inspect Details"
                        >
                          <Eye size={15} />
                        </Link>
                        <a
                          href={`/api/documents/${doc.documentId}/download`}
                          download
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download File"
                        >
                          <Download size={15} />
                        </a>
                        {canDelete && (
                          <button
                            onClick={(e) => handleDelete(e, doc.documentId)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Evidence"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
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
