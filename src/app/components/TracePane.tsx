import { Terminal, Clock, CheckCircle2, AlertCircle, Database, Search, FileText, Cpu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TraceLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
  details?: Record<string, any>;
}

export function TracePane() {
  const [logs, setLogs] = useState<TraceLog[]>([
    {
      id: '1',
      timestamp: '10:23:15.234',
      level: 'info',
      category: 'API Gateway',
      message: 'Incoming prior auth request received',
      details: {
        requestId: 'PA-2026-0412',
        provider: 'St. Mary\'s Hospital',
        fileSize: '2.4 MB'
      }
    },
    {
      id: '2',
      timestamp: '10:23:15.567',
      level: 'success',
      category: 'Document Upload',
      message: 'Document successfully uploaded to S3',
      details: {
        bucket: 'prior-auth-documents',
        key: 'uploads/2026/02/PA-2026-0412.pdf'
      }
    },
    {
      id: '3',
      timestamp: '10:23:16.123',
      level: 'info',
      category: 'IDP Service',
      message: 'Intelligent Document Processing initiated',
      details: {
        service: 'AWS Textract',
        mode: 'FORMS_ANALYSIS'
      }
    },
    {
      id: '4',
      timestamp: '10:23:17.890',
      level: 'info',
      category: 'IDP Service',
      message: 'Document layout analysis completed',
      details: {
        pages: 5,
        forms_detected: 2,
        tables_detected: 1
      }
    },
    {
      id: '5',
      timestamp: '10:23:18.456',
      level: 'success',
      category: 'IDP Service',
      message: 'Text extraction completed successfully',
      details: {
        confidence_score: 0.97,
        extracted_fields: 42
      }
    },
    {
      id: '6',
      timestamp: '10:23:19.234',
      level: 'info',
      category: 'NLP Service',
      message: 'Running entity extraction models',
      details: {
        model: 'healthcare-ner-v2.1',
        entities_types: ['PATIENT', 'DIAGNOSIS', 'PROCEDURE']
      }
    },
    {
      id: '7',
      timestamp: '10:23:20.678',
      level: 'success',
      category: 'Data Extraction',
      message: 'Patient information extracted',
      details: {
        patient_name: 'John Doe',
        dob: '1975-03-15',
        member_id: 'MEM123456789'
      }
    },
    {
      id: '8',
      timestamp: '10:23:21.345',
      level: 'success',
      category: 'Data Extraction',
      message: 'Procedure codes identified',
      details: {
        primary_code: 'CPT-93000',
        description: 'Electrocardiogram, routine ECG',
        secondary_codes: ['99213']
      }
    },
    {
      id: '9',
      timestamp: '10:23:22.123',
      level: 'info',
      category: 'Data Extraction',
      message: 'Processing diagnosis codes...',
      details: {
        raw_codes: ['I50.9', 'E11.9'],
        validation: 'in_progress'
      }
    }
  ]);

  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate incoming logs
  useEffect(() => {
    const timer = setTimeout(() => {
      const newLogs: TraceLog[] = [
        {
          id: '10',
          timestamp: '10:23:22.890',
          level: 'success',
          category: 'Data Extraction',
          message: 'ICD-10 diagnosis codes validated',
          details: {
            codes: ['I50.9', 'E11.9'],
            descriptions: ['Heart failure, unspecified', 'Type 2 diabetes']
          }
        },
        {
          id: '11',
          timestamp: '10:23:23.234',
          level: 'info',
          category: 'Vector Database',
          message: 'Preparing semantic search query',
          details: {
            database: 'Pinecone',
            index: 'ncd-guidelines-embeddings'
          }
        }
      ];

      setLogs(prev => [...prev, ...newLogs]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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