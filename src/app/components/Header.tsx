import { FileText, Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-900 border-b border-cyan-500/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="w-6 h-6" />
            <h1 className="text-xl font-semibold text-white">Prior Authorization System</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-400">Request ID</div>
            <div className="font-semibold text-cyan-400">PA-2026-0412</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Provider</div>
            <div className="font-semibold text-white">St. Mary's Hospital</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Status</div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Processing
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}