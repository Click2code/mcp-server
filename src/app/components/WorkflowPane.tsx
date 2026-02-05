import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
  timestamp?: string;
  details?: string[];
}

export function WorkflowPane() {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: '1',
      name: 'Request Received',
      description: 'Prior authorization request received from provider',
      status: 'completed',
      timestamp: '10:23:15 AM',
      details: ['Document uploaded', 'Request validated', 'Queue assigned']
    },
    {
      id: '2',
      name: 'Document Processing',
      description: 'Intelligent document processing extracting information',
      status: 'completed',
      timestamp: '10:23:18 AM',
      details: ['PDF parsed', 'Text extraction complete', 'Fields identified']
    },
    {
      id: '3',
      name: 'Data Extraction',
      description: 'Extracting structured data from authorization request',
      status: 'in-progress',
      timestamp: '10:23:22 AM',
      details: ['Patient info extracted', 'Procedure codes identified', 'Diagnosis codes parsing...']
    },
    {
      id: '4',
      name: 'Semantic Search',
      description: 'Searching NCD guidelines knowledge base',
      status: 'pending',
      details: []
    },
    {
      id: '5',
      name: 'Policy Matching',
      description: 'Matching request against coverage policies',
      status: 'pending',
      details: []
    },
    {
      id: '6',
      name: 'Decision Engine',
      description: 'Automated decision processing',
      status: 'pending',
      details: []
    },
    {
      id: '7',
      name: 'Review & Approval',
      description: 'Final review and approval determination',
      status: 'pending',
      details: []
    }
  ]);

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-cyan-400" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-pink-400" />;
      default:
        return <Circle className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-cyan-500/10 border-cyan-500/30';
      case 'in-progress':
        return 'bg-purple-500/10 border-purple-500/30';
      case 'error':
        return 'bg-pink-500/10 border-pink-500/30';
      default:
        return 'bg-slate-800/50 border-slate-700/50';
    }
  };

  return (
    <div className="w-1/2 border-r border-cyan-500/20 bg-slate-900 overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Workflow Progress</h2>
          <p className="text-sm text-slate-400">
            Processing prior authorization request through automated workflow
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[18px] top-12 w-0.5 h-full bg-slate-700" />
              )}

              {/* Step card */}
              <div
                className={`relative border rounded-lg p-4 transition-all ${getStatusColor(
                  step.status
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white">{step.name}</h3>
                      {step.timestamp && (
                        <span className="text-xs text-slate-500">{step.timestamp}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{step.description}</p>

                    {step.details && step.details.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {step.details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-slate-400"
                          >
                            <div className="w-1 h-1 rounded-full bg-cyan-400" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}