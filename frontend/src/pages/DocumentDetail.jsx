import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Trash2,
  Lock,
  Calendar,
  User,
  ShieldAlert,
  Hash,
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { StatusBadge } from '../components/StatusBadge';

export default function DocumentDetail() {
  const [, params] = useRoute('/documents/:id');
  const docId = params?.id;

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocumentById(docId);
      setDoc(data);
    } catch (err) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) fetchDocument();
  }, [docId]);

  const handleCopy = () => {
    if (!doc?.hash) return;
    navigator.clipboard.writeText(doc.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerify = async () => {
    if (!doc) return;
    setVerifying(true);
    try {
      const res = await documentService.verifyDocument({
        documentId: doc.documentId,
        hash: doc.hash,
      });
      setVerifyResult(res);
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
        Loading document {docId} from MongoDB...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 text-red-600 text-sm">
        {error || 'Document record not found'}
        <div className="mt-4">
          <Link href="/documents" className="text-cyan-600 font-bold hover:underline">
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Evidence Repository
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/api/documents/${doc.documentId}/download`}
            download
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Download size={14} /> Download File
          </a>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 font-bold">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-slate-500">{doc.documentId}</span>
                <StatusBadge value={doc.integrity} />
                <StatusBadge value={doc.confidentiality} />
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                  {doc.documentType}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900">{doc.documentName}</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Bound to Case:{' '}
                <Link href={`/cases/${doc.caseId}`} className="font-bold text-cyan-600 hover:underline">
                  {doc.caseId}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* SHA-256 Signature Box */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Hash size={16} className="text-cyan-600" />
              Cryptographic SHA-256 Ledger Signature
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy Hash'}
              </button>
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                <ShieldCheck size={12} />
                {verifying ? 'Verifying...' : 'Verify Signature'}
              </button>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-cyan-900 break-all select-all">
            {doc.hash}
          </div>

          {verifyResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-fadeIn ${
                verifyResult.verified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
              <div>
                <div>{verifyResult.status}</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5 font-mono">
                  Stored: {verifyResult.storedHash}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Uploaded By</div>
            <div className="font-bold text-slate-800 mt-0.5">{doc.uploadedBy}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">File Size</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '184 KB'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Date Timestamp</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {new Date(doc.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Access Count</div>
            <div className="font-bold text-cyan-700 font-mono mt-0.5">
              {doc.totalAccesses || 1} Audited Reads
            </div>
          </div>
        </div>

        {/* Notes */}
        {doc.description && (
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Officer Notes
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {doc.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
