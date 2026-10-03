import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, Save, Briefcase, Shield, AlertCircle } from 'lucide-react';
import { caseService } from '../services/caseService';
import { useAuth } from '../context/AuthContext';

export default function NewCase() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !['Admin', 'Officer'].includes(user.role)) {
      setLocation('/dashboard');
    }
  }, [user]);

  const [formData, setFormData] = useState({
    caseId: `C-${Math.floor(1030 + Math.random() * 200)}`,
    title: '',
    type: 'Investigation',
    department: 'Investigation',
    assignedOfficer: user?.name || 'Officer Raj Patel',
    priority: 'Medium',
    confidentiality: 'Confidential',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide a descriptive case title');
      return;
    }

    setLoading(true);
    try {
      const created = await caseService.createCase({
        ...formData,
        createdBy: user?.name || 'Authorized Officer',
      });
      setLocation(`/cases/${created.caseId || formData.caseId}`);
    } catch (err) {
      setError(err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Cases
        </Link>
        <div className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md font-bold">
          Auto Assigned: {formData.caseId}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/60 border-b border-slate-100 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-600/20">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Register New Case Dossier</h1>
            <p className="text-xs text-slate-400">Initialize official evidentiary case file in MongoDB</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Case ID
                </label>
                <input
                  type="text"
                  required
                  name="caseId"
                  value={formData.caseId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-cyan-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Case Title
                </label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Investigation into Digital Forgery Network"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Case Category
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="Investigation">General Investigation</option>
                  <option value="Financial Crime">Financial Crime</option>
                  <option value="Cyber Crime">Cyber Crime</option>
                  <option value="Fraud">Document Fraud</option>
                  <option value="Civil">Civil Dispute</option>
                  <option value="Special">Special Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="Investigation">Investigation Bureau</option>
                  <option value="Cyber Crime">Cyber Crime Cell</option>
                  <option value="Financial Crime">Economic Offences Wing</option>
                  <option value="Legal Department">Legal Department</option>
                  <option value="Records">Central Records</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Officer
                </label>
                <input
                  type="text"
                  required
                  name="assignedOfficer"
                  value={formData.assignedOfficer}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confidentiality Level
                </label>
                <select
                  name="confidentiality"
                  value={formData.confidentiality}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="Public/Internal">Public / Internal</option>
                  <option value="Confidential">Confidential</option>
                  <option value="Restricted">Restricted Access</option>
                  <option value="Highly Restricted">Highly Restricted / Top Secret</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Case Background & Scope
              </label>
              <textarea
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe case initiation circumstances, suspect information, and evidentiary scope..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <Link
                href="/cases"
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Creating Case...' : 'Register Case'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
