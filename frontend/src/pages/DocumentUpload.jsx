import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import {
  Upload,
  ArrowLeft,
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Activity,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { caseService } from '../services/caseService';
import { useAuth } from '../context/AuthContext';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec === 0) return 'Calculating...';
  return `${formatBytes(bytesPerSec)}/s`;
}

export default function DocumentUpload() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [availableCases, setAvailableCases] = useState([]);
  const [caseId, setCaseId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('FIR');
  const [confidentiality, setConfidentiality] = useState('Confidential');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Upload Progress Tracking
  const [progress, setProgress] = useState({
    percent: 0,
    loaded: 0,
    total: 0,
    speed: 0,
    statusText: '',
  });

  // Role check
  useEffect(() => {
    if (user && !['Admin', 'Officer'].includes(user.role)) {
      setLocation('/dashboard');
    }
  }, [user]);

  // Load existing cases for dropdown
  useEffect(() => {
    async function loadCases() {
      try {
        const res = await caseService.getCases();
        const casesList = res.data || [];
        setAvailableCases(casesList);
        if (casesList.length > 0) {
          setCaseId(casesList[0].caseId);
        }
      } catch (err) {
        console.error('Failed to load cases list:', err);
      }
    }
    loadCases();
  }, []);

  // Compute SHA-256 client side when a file is selected (for small files)
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    if (!documentName) {
      setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }

    // For files <= 64 MB, calculate hash immediately in browser
    // For files > 64 MB (e.g. 1GB+), high-speed server stream hash calculation prevents browser tab crashes
    if (selectedFile.size <= 64 * 1024 * 1024) {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setClientHash(hashHex);
      } catch (err) {
        console.warn('Browser crypto calculation notice:', err);
      }
    } else {
      const sizeFormatted = formatBytes(selectedFile.size);
      setClientHash(`Multi-GB Evidence (${sizeFormatted}) — High-throughput streaming SHA-256 + HMAC-SHA-256 & GridFS chunking active`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!caseId) {
      setError('Please select or specify a Case ID');
      return;
    }
    if (!file && !documentName) {
      setError('Please select a file or specify a document title');
      return;
    }

    setLoading(true);
    setProgress({
      percent: 0,
      loaded: 0,
      total: file ? file.size : 0,
      speed: 0,
      statusText: 'Initializing secure upload pipeline...',
    });

    try {
      const formData = new FormData();
      formData.append('caseId', caseId);
      formData.append('documentName', documentName || file?.name || 'Evidence_File.pdf');
      formData.append('documentType', documentType);
      formData.append('confidentiality', confidentiality);
      formData.append('description', description);
      formData.append('uploadedBy', user?.name || 'Officer Raj Patel');
      formData.append('uploadedByRole', user?.role || 'Officer');
      if (file) formData.append('file', file);

      const res = await documentService.uploadDocument(formData, (prog) => {
        let status = 'Uploading evidence stream to server...';
        if (prog.percent === 100) {
          status = 'Calculating SHA-256 + HMAC-SHA-256 & sealing in MongoDB GridFS...';
        }
        setProgress({
          percent: prog.percent,
          loaded: prog.loaded,
          total: prog.total,
          speed: prog.speed,
          statusText: status,
        });
      });

      setUploadSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Documents
        </Link>
      </div>

      {uploadSuccess ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-8 text-center space-y-5 animate-fadeIn">
          <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Evidence Cryptographically Sealed!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Document registered and chained to MongoDB tamper-evident ledger
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-400">Document ID:</span>{' '}
              <span className="font-bold text-slate-800">{uploadSuccess.documentId}</span>
            </div>
            <div>
              <span className="text-slate-400">Associated Case:</span>{' '}
              <span className="font-bold text-cyan-700">{uploadSuccess.caseId}</span>
            </div>
            <div>
              <span className="text-slate-400">Document Name:</span>{' '}
              <span className="font-bold text-slate-800">{uploadSuccess.documentName}</span>
            </div>
            <div>
              <span className="text-slate-400">File Size:</span>{' '}
              <span className="font-bold text-slate-800">{formatBytes(uploadSuccess.size)}</span>
            </div>
            <div className="break-all pt-2 border-t border-slate-200">
              <span className="text-slate-400 block mb-1 font-sans font-bold text-[10px] uppercase tracking-wider">
                Cryptographic SHA-256 Signature:
              </span>
              <span className="text-cyan-700 font-bold bg-cyan-50 p-2 rounded-lg block border border-cyan-200">
                {uploadSuccess.hash}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setUploadSuccess(null);
                setFile(null);
                setDocumentName('');
                setClientHash('');
                setProgress({ percent: 0, loaded: 0, total: 0, speed: 0, statusText: '' });
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Upload Another
            </button>
            <Link
              href={`/cases/${uploadSuccess.caseId}`}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              View Case Dossier
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-600/20">
                <Upload size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900">Upload Evidentiary Record</h1>
                <p className="text-xs text-slate-400">
                  Supports Multi-GB file streaming (up to 5 GB) via MongoDB GridFS
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200/60 rounded-full text-[11px] font-bold">
              <HardDrive size={13} /> Multi-GB Capable
            </span>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-700 font-bold animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* LIVE UPLOAD PROGRESS BAR */}
            {loading && (
              <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl text-white shadow-xl space-y-4 border border-slate-700 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-cyan-400 animate-pulse" />
                    <span className="font-bold tracking-wide text-cyan-300">
                      {progress.statusText || 'Uploading Evidence...'}
                    </span>
                  </div>
                  <span className="font-mono text-base font-black text-cyan-400">
                    {progress.percent}%
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full bg-slate-700/80 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-600 relative">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                    style={{ width: `${Math.max(2, progress.percent)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:200%_100%]" />
                  </div>
                </div>

                {/* Progress Details Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 text-[10px] block">TRANSFERRED</span>
                    <span className="font-bold text-white">
                      {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">UPLOAD SPEED</span>
                    <span className="font-bold text-cyan-300">
                      {formatSpeed(progress.speed)}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 text-[10px] block">STORAGE ENGINE</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Cpu size={12} /> MongoDB GridFS
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Evidence File Attachment
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-cyan-50/30 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    disabled={loading}
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                  />
                  <FileCheck2 size={40} className="mx-auto text-cyan-600 mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    {file ? file.name : 'Drag & drop evidence file or browse computer'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Supports all formats: PDF, DOCX, Video recordings, High-Res Scans, Forensic Archives (Up to 5 GB)
                  </div>
                  {file && (
                    <div className="mt-2 inline-block px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-[11px] font-mono font-bold">
                      Size: {formatBytes(file.size)}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Hash Info */}
              {clientHash && (
                <div className="p-4 bg-cyan-50/60 border border-cyan-200 rounded-2xl flex items-start gap-3">
                  <Shield size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-cyan-900">
                      Integrity Fingerprint Pipeline
                    </div>
                    <div className="text-[11px] font-mono text-cyan-800 break-all leading-tight">
                      {clientHash}
                    </div>
                  </div>
                </div>
              )}

              {/* Case & Doc Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Case Dossier *
                  </label>
                  <select
                    disabled={loading}
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  >
                    {availableCases.map((c) => (
                      <option key={c.caseId} value={c.caseId}>
                        {c.caseId} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    disabled={loading}
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g. Crime Scene Forensic Analysis Part 1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Document Type & Confidentiality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Category
                  </label>
                  <select
                    disabled={loading}
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  >
                    <option value="FIR">FIR (First Information Report)</option>
                    <option value="Forensic Report">Forensic Report</option>
                    <option value="Witness Statement">Witness Statement</option>
                    <option value="Charge Sheet">Charge Sheet</option>
                    <option value="Court Order">Court Order</option>
                    <option value="Medical Evidence">Medical Evidence</option>
                    <option value="Other">Other Evidentiary Attachment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confidentiality Grading
                  </label>
                  <select
                    disabled={loading}
                    value={confidentiality}
                    onChange={(e) => setConfidentiality(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  >
                    <option value="Public/Internal">Public / Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Highly Restricted">Highly Restricted / Top Secret</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Evidence Notes & Description
                </label>
                <textarea
                  rows={3}
                  disabled={loading}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record handling officer remarks, seizure location, or relevant context..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <Link
                  href="/documents"
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  <Upload size={16} />
                  {loading ? 'Streaming & Sealing Evidence...' : 'Upload & Compute Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
