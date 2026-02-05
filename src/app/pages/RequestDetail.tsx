import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Activity, 
  Edit2, 
  Save, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle,
  User as UserIcon,
  FileText,
  Calendar
} from 'lucide-react';
import {
  getRequestDetail,
  updateRequest,
  processRequest,
  type PriorAuthRequest,
  type WorkflowStep,
  type TraceLog
} from '../services/request-service';
import { EditableWorkflowPane } from '../components/EditableWorkflowPane';
import { EditableTracePane } from '../components/EditableTracePane';

export function RequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [request, setRequest] = useState<PriorAuthRequest | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [trace, setTrace] = useState<TraceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Editable header fields
  const [editedRequest, setEditedRequest] = useState<Partial<PriorAuthRequest>>({});

  useEffect(() => {
    if (id) {
      loadRequestDetail(id);
    }
  }, [id]);

  // Poll for updates when request is processing (silent refresh — no loading spinner)
  useEffect(() => {
    if (request?.status !== 'processing') return;
    const interval = setInterval(() => {
      if (id) loadRequestDetail(id, false);
    }, 2000);
    return () => clearInterval(interval);
  }, [request?.status, id]);

  const loadRequestDetail = async (requestId: string, showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError('');
    try {
      const data = await getRequestDetail(requestId);
      setRequest(data.request);
      setWorkflow(data.workflow);
      setTrace(data.trace);
      if (showLoader) setEditedRequest(data.request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load request details');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const handleSaveHeader = async () => {
    if (!id || !request) return;

    setIsSaving(true);
    try {
      const updated = await updateRequest(id, editedRequest);
      setRequest(updated);
      setIsEditingHeader(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedRequest(request || {});
    setIsEditingHeader(false);
  };

  const handleProcess = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await processRequest(id);
      // Start polling - the status change to 'processing' will trigger the useEffect
      setTimeout(() => loadRequestDetail(id, false), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start processing');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-cyan-500/20 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2 text-cyan-400">
              <Activity className="w-6 h-6" />
              <h1 className="text-xl font-semibold text-white">Prior Authorization Detail</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm">
                <CheckCircle className="w-4 h-4" />
                Saved successfully
              </div>
            )}
            {isEditingHeader ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveHeader}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </>
            ) : (
              <>
                {(request?.status === 'pending' || request?.status === 'processing') && (
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || request?.status === 'processing'}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing || request?.status === 'processing' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        Process Request
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setIsEditingHeader(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Details
                </button>
              </>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* Request ID */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Request ID</div>
            <div className="font-semibold text-cyan-400">{request?.requestId}</div>
          </div>

          {/* Patient Name */}
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              Patient Name
            </div>
            {isEditingHeader ? (
              <input
                type="text"
                value={editedRequest.patientName || ''}
                onChange={(e) => setEditedRequest({ ...editedRequest, patientName: e.target.value })}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            ) : (
              <div className="font-semibold text-white">{request?.patientName}</div>
            )}
          </div>

          {/* Provider */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Provider</div>
            {isEditingHeader ? (
              <input
                type="text"
                value={editedRequest.provider || ''}
                onChange={(e) => setEditedRequest({ ...editedRequest, provider: e.target.value })}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            ) : (
              <div className="font-semibold text-white">{request?.provider}</div>
            )}
          </div>

          {/* Procedure */}
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Procedure
            </div>
            {isEditingHeader ? (
              <input
                type="text"
                value={editedRequest.procedure || ''}
                onChange={(e) => setEditedRequest({ ...editedRequest, procedure: e.target.value })}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            ) : (
              <div className="font-semibold text-white">{request?.procedure}</div>
            )}
          </div>

          {/* Priority */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Priority</div>
            {isEditingHeader ? (
              <select
                value={editedRequest.priority || 'medium'}
                onChange={(e) => setEditedRequest({ ...editedRequest, priority: e.target.value as any })}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            ) : (
              <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                request?.priority === 'high' ? 'bg-pink-500/20 text-pink-300' :
                request?.priority === 'medium' ? 'bg-purple-500/20 text-purple-300' :
                'bg-slate-700/50 text-slate-400'
              }`}>
                {request?.priority}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Status</div>
            {isEditingHeader ? (
              <select
                value={editedRequest.status || 'pending'}
                onChange={(e) => setEditedRequest({ ...editedRequest, status: e.target.value as any })}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            ) : (
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                request?.status === 'approved' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                request?.status === 'denied' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                request?.status === 'processing' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                request?.status === 'review' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                'bg-slate-700/50 text-slate-300 border-slate-600/50'
              }`}>
                {request?.status}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <EditableWorkflowPane 
          workflow={workflow} 
          onWorkflowUpdate={setWorkflow}
          requestId={id || ''}
        />
        <EditableTracePane 
          trace={trace}
          onTraceUpdate={setTrace}
          requestId={id || ''}
        />
      </div>
    </div>
  );
}
