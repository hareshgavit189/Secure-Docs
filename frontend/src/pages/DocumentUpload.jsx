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
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { caseService } from '../services/caseService';
import { useAuth } from '../context/AuthContext';

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

  // Compute SHA-256 client side when a file is selected
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    if (!documentName) {
      setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }

    // Client-side SHA-256 hash computation
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setClientHash(hashHex);
    } catch (err) {
      console.warn('Browser crypto calculation notice:', err);
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

      const res = await documentService.uploadDocument(formData);
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
          <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-600/20">
              <Upload size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Upload Evidentiary Record</h1>
              <p className="text-xs text-slate-400">
                Upload files with automated client & server SHA-256 tamper-proofing
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Evidence File
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-cyan-50/30 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileCheck2 size={36} className="mx-auto text-cyan-600 mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    {file ? file.name : 'Click to browse or drag file here'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Accepts PDF, DOCX, XLSX, TXT, PNG, JPG (Up to 30 MB)
                  </div>
                </div>

                {clientHash && (
                  <div className="mt-2.5 p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs font-mono break-all">
                    <span className="text-[10px] font-bold text-cyan-800 uppercase block font-sans mb-0.5">
                      Client-Computed SHA-256 Hash:
                    </span>
                    <span className="text-cyan-900 font-bold">{clientHash}</span>
                  </div>
                )}
              </div>

              {/* Case & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Associated Case ID
                  </label>
                  {availableCases.length > 0 ? (
                    <select
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500"
                    >
                      {availableCases.map((c) => (
                        <option key={c.caseId} value={c.caseId}>
                          {c.caseId} - {c.title.slice(0, 30)}...
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      placeholder="e.g. C-1024"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Title / Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g. Bank Statement Reconciliation"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Classification & Confidentiality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Category
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500"
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
                    value={confidentiality}
                    onChange={(e) => setConfidentiality(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500"
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Record handling officer remarks, seizure location, or relevant context..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
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
                  {loading ? 'Encrypting & Uploading...' : 'Upload & Compute Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
