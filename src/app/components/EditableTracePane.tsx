import { Terminal, Clock, CheckCircle2, AlertCircle, Database, Search, FileText, Cpu, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { addTraceLog, type TraceLog } from '../services/request-service';

interface EditableTracePaneProps {
  trace: TraceLog[];
  onTraceUpdate: (trace: TraceLog[]) => void;
  requestId: string;
}

export function EditableTracePane({ trace, onTraceUpdate, requestId }: EditableTracePaneProps) {
  const [logs, setLogs] = useState<TraceLog[]>(trace);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showAddLog, setShowAddLog] = useState(false);
  const [newLog, setNewLog] = useState({
    level: 'info' as TraceLog['level'],
    category: '',
    message: '',
    details: ''
  });
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogs(trace);
  }, [trace]);

  useEffect(() => {
    if (isAutoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  const getLevelIcon = (level: TraceLog['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-pink-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-purple-400" />;
    }
  };

  const getLevelColor = (level: TraceLog['level']) => {
    switch (level) {
      case 'success':
        return 'bg-cyan-500/10 border-cyan-500/30';
      case 'error':
        return 'bg-pink-500/10 border-pink-500/30';
      case 'warning':
        return 'bg-purple-500/10 border-purple-500/30';
      default:
        return 'bg-purple-500/10 border-purple-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes('Database') || category.includes('Vector')) {
      return <Database className="w-3.5 h-3.5" />;
    }
    if (category.includes('Search')) {
      return <Search className="w-3.5 h-3.5" />;
    }
    if (category.includes('Document') || category.includes('IDP')) {
      return <FileText className="w-3.5 h-3.5" />;
    }
    if (category.includes('NLP') || category.includes('Service')) {
      return <Cpu className="w-3.5 h-3.5" />;
    }
    return <Terminal className="w-3.5 h-3.5" />;
  };

  const handleAddLog = async () => {
    if (!newLog.category || !newLog.message) {
      return;
    }

    try {
      let details: Record<string, any> | undefined;
      if (newLog.details) {
        try {
          details = JSON.parse(newLog.details);
        } catch {
          details = { raw: newLog.details };
        }
      }

      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

      const logToAdd = {
        timestamp,
        level: newLog.level,
        category: newLog.category,
        message: newLog.message,
        details
      };

      const addedLog = await addTraceLog(requestId, logToAdd);
      const updatedLogs = [...logs, addedLog];
      setLogs(updatedLogs);
      onTraceUpdate(updatedLogs);

      // Reset form
      setNewLog({
        level: 'info',
        category: '',
        message: '',
        details: ''
      });
      setShowAddLog(false);
    } catch (err) {
      console.error('Failed to add trace log:', err);
    }
  };

  return (
    <div className="w-1/2 bg-slate-950 text-slate-100 overflow-y-auto">
      <div className="sticky top-0 bg-slate-900 border-b border-cyan-500/20 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Technical Trace</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddLog(!showAddLog)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Log
            </button>
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                isAutoScroll
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isAutoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            </button>
            <div className="text-xs text-slate-400">
              {logs.length} events
            </div>
          </div>
        </div>

        {/* Add Log Form */}
        {showAddLog && (
          <div className="mt-4 p-4 bg-slate-800 border border-cyan-500/20 rounded-lg">
            <h3 className="text-sm font-semibold text-white mb-3">Add New Log Entry</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Level</label>
                  <select
                    value={newLog.level}
                    onChange={(e) => setNewLog({ ...newLog, level: e.target.value as TraceLog['level'] })}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={newLog.category}
                    onChange={(e) => setNewLog({ ...newLog, category: e.target.value })}
                    placeholder="e.g., API Gateway"
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Message</label>
                <input
                  type="text"
                  value={newLog.message}
                  onChange={(e) => setNewLog({ ...newLog, message: e.target.value })}
                  placeholder="Log message"
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Details (JSON)</label>
                <textarea
                  value={newLog.details}
                  onChange={(e) => setNewLog({ ...newLog, details: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={3}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLog}
                  className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-sm font-medium transition-colors"
                >
                  Add Log
                </button>
                <button
                  onClick={() => setShowAddLog(false)}
                  className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2 font-mono text-sm">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`border rounded p-3 ${getLevelColor(log.level)}`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {getLevelIcon(log.level)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500">{log.timestamp}</span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    {getCategoryIcon(log.category)}
                    {log.category}
                  </span>
                </div>
                <p className="text-white mb-2">{log.message}</p>
                {log.details && (
                  <div className="bg-slate-900 rounded p-2 overflow-x-auto border border-slate-800">
                    <pre className="text-xs text-cyan-300">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
