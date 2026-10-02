import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Upload,
  Calendar,
  User,
  Shield,
  Clock,
  Download,
  CheckCircle2,
  Trash2,
  Edit,
  Save,
} from 'lucide-react';
import { caseService } from '../services/caseService';
import { documentService } from '../services/documentService';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export default function CaseDetail() {
  const [, params] = useRoute('/cases/:id');
  const caseId = params?.id;

  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Quick Upload Modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('FIR');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const res = await caseService.getCaseById(caseId);
      setCaseData(res.case);
      setSelectedStatus(res.case.status);
      setSelectedPriority(res.case.priority);
      setDocuments(res.documents || []);
    } catch (err) {
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) fetchCaseDetails();
  }, [caseId]);

  const handleUpdateStatus = async () => {
    try {
      const updated = await caseService.updateCase(caseData.caseId, {
        status: selectedStatus,
        priority: selectedPriority,
      });
      setCaseData(updated);
      setIsEditingStatus(false);
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleQuickUpload = async (e) => {
    e.preventDefault();
    if (!uploadName && !uploadFile) {
      alert('Please provide a document title or select a file');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('caseId', caseData.caseId);
      formData.append('documentName', uploadName || uploadFile.name);
      formData.append('documentType', uploadType);
      if (uploadFile) formData.append('file', uploadFile);

      await documentService.uploadDocument(formData);
      setIsUploadOpen(false);
      setUploadName('');
      setUploadFile(null);
      await fetchCaseDetails();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
        Loading case dossier {caseId} from MongoDB...
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 text-red-600 text-sm">
        {error || 'Case file not found'}
        <div className="mt-4">
          <Link href="/cases" className="text-cyan-600 font-bold hover:underline">
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Cases
        </Link>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
        >
          <Upload size={14} />
          Attach Evidentiary Document
        </button>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md">
                {caseData.caseId}
              </span>
              <StatusBadge value={caseData.status} />
              <StatusBadge value={caseData.priority} />
              <StatusBadge value={caseData.confidentiality} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{caseData.title}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{caseData.description || 'No description provided'}</p>
          </div>

          {/* Status Quick Updater */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Case State Controls
            </div>
            {isEditingStatus ? (
              <div className="space-y-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Closed">Closed</option>
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleUpdateStatus}
                    className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingStatus(false)}
                    className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingStatus(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 transition-colors"
              >
                <Edit size={12} />
                Change Status / Priority
              </button>
            )}
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Department</div>
            <div className="text-slate-800 font-bold mt-0.5">{caseData.department}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Officer</div>
            <div className="text-slate-800 font-bold mt-0.5">{caseData.assignedOfficer}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Date Initiated</div>
            <div className="text-slate-800 font-bold mt-0.5">
              {new Date(caseData.startDate || caseData.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Evidence Count</div>
            <div className="text-cyan-700 font-mono font-bold mt-0.5">
              {documents.length} Files Attached
            </div>
          </div>
        </div>
      </div>

      {/* Attached Documents Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Evidentiary Attachments</h2>
            <p className="text-xs text-slate-400">
              Tamper-evident documents cryptographically bound to Case {caseData.caseId}
            </p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="text-xs font-bold text-cyan-600 hover:text-cyan-500 flex items-center gap-1"
          >
            <Upload size={14} /> Add Evidence
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <FileText size={32} className="mx-auto text-slate-300 mb-2" />
            No evidentiary documents attached to this case yet.
            <div className="mt-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Upload First Document
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="size-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 font-bold">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500">{doc.documentId}</span>
                      <StatusBadge value={doc.integrity} />
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                        {doc.documentType}
                      </span>
                    </div>
                    <Link
                      href={`/documents/${doc.documentId}`}
                      className="font-bold text-slate-900 hover:text-cyan-600 text-sm truncate block"
                    >
                      {doc.documentName}
                    </Link>
                    <div className="text-[11px] font-mono text-slate-400 truncate mt-1 flex items-center gap-1">
                      <span className="text-cyan-600 font-bold">SHA-256:</span> {doc.hash}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <a
                    href={`/api/documents/${doc.documentId}/download`}
                    download
                    className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                    title="Download Evidence"
                  >
                    <Download size={15} />
                  </a>
                  <Link
                    href={`/documents/${doc.documentId}`}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Inspect Hash
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={`Attach Evidence to ${caseData.caseId}`}
      >
        <form onSubmit={handleQuickUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Name / Title
            </label>
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="e.g. Supplementary Witness Statement 04"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Document Classification
            </label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-white"
            >
              <option value="FIR">FIR (First Information Report)</option>
              <option value="Forensic Report">Forensic Report</option>
              <option value="Witness Statement">Witness Statement</option>
              <option value="Charge Sheet">Charge Sheet</option>
              <option value="Court Order">Court Order</option>
              <option value="Medical Evidence">Medical Evidence</option>
              <option value="Other">Other Evidence</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Evidence File (PDF, DOCX, TXT, PNG, JPG)
            </label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {isUploading ? 'Computing SHA-256 & Uploading...' : 'Upload & Hash'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
