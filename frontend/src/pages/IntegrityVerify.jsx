import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  Hash,
} from 'lucide-react';
import { documentService } from '../services/documentService';

export default function IntegrityVerify() {
  const [file, setFile] = useState(null);
  const [computedHash, setComputedHash] = useState('');
  const [inputHash, setInputHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileDrop = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setComputedHash(hashHex);
      setInputHash(hashHex);
    } catch (err) {
      console.error('Crypto error:', err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const hashToTest = inputHash.trim();
    if (!hashToTest && !file) {
      alert('Please select a file or paste a SHA-256 hash');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await documentService.verifyDocument({ hash: hashToTest });
      setResult(res);
    } catch (err) {
      alert(`Verification check error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetTest = (hash) => {
    setInputHash(hash);
    setComputedHash(hash);
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Cryptographic Integrity & Tamper Detector
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Verify physical or digital evidentiary artifacts against the immutable MongoDB ledger
        </p>
      </div>

      {/* Main Suite Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {/* Upload or Drop File */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Document to Inspect
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-cyan-50/30 transition-all cursor-pointer relative">
            <input
              type="file"
              onChange={(e) => handleFileDrop(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <FileCheck2 size={40} className="mx-auto text-cyan-600 mb-2" />
            <div className="text-xs font-bold text-slate-700">
              {file ? file.name : 'Drop evidence file here to calculate its cryptographic fingerprint'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Supports any file format (PDF, DOCX, Images, Scans)
            </div>
          </div>
        </div>

        {/* Or Paste SHA-256 */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              2. SHA-256 Cryptographic Hash
            </label>
            <div className="relative">
              <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="Paste or compute 64-character hexadecimal SHA-256 hash..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !inputHash}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {loading ? 'Querying Blockchain Ledger...' : 'Verify Evidence Authenticity'}
          </button>
        </form>

        {/* Verification Result Banner */}
        {result && (
          <div
            className={`p-6 rounded-2xl border text-sm animate-fadeIn ${
              result.verified
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {result.verified ? (
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              ) : (
                <XCircle size={24} className="text-red-600 shrink-0" />
              )}
              <div className="font-black text-base">
                {result.verified ? 'GENUINE & UNTAMPERED EVIDENCE' : 'TAMPERED OR UNREGISTERED FILE'}
              </div>
            </div>

            <p className="text-xs opacity-90">{result.status}</p>

            {result.matchingDocument && (
              <div className="mt-4 p-4 bg-white/80 rounded-xl border border-emerald-300 text-xs font-mono space-y-1">
                <div>
                  <span className="font-bold text-slate-500">Record ID:</span>{' '}
                  <span className="font-bold text-slate-800">{result.matchingDocument.documentId}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Case Dossier:</span>{' '}
                  <span className="font-bold text-cyan-700">{result.matchingDocument.caseId}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Document Title:</span>{' '}
                  <span className="font-bold text-slate-800">{result.matchingDocument.name}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preset test cases for Jury Demonstration */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            1-Click Test Hashes (for Jury Demonstration):
          </div>
          <div className="space-y-2 text-xs">
            <button
              type="button"
              onClick={() =>
                handlePresetTest('a3f7c2e8b91d4056e9c4039df8a215b497c2e11894b9015c71d28394af3910c2')
              }
              className="w-full text-left p-3 bg-slate-50 hover:bg-cyan-50 border border-slate-200 rounded-xl transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800">FIR_1024_Certified.pdf</span>
                <span className="text-[10px] text-emerald-600 ml-2 font-bold">[Genuine Record]</span>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  a3f7c2e8b91d4056e9c4039df8a215b497c2e11894b9015c71d28394af3910c2
                </div>
              </div>
              <span className="text-cyan-600 font-bold text-xs shrink-0">Test Match</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handlePresetTest('1111111111111111111111111111111111111111111111111111111111111111')
              }
              className="w-full text-left p-3 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800">Tampered_Forgery_Simulated.pdf</span>
                <span className="text-[10px] text-red-600 ml-2 font-bold">[Altered Record]</span>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  1111111111111111111111111111111111111111111111111111111111111111
                </div>
              </div>
              <span className="text-red-600 font-bold text-xs shrink-0">Test Mismatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
