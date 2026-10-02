import { Link } from 'wouter';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-3xl font-black text-slate-900">404 - Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        The requested record or route does not exist in the SecureDocs system.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
      >
        <Home size={14} /> Return to Dashboard
      </Link>
    </div>
  );
}
