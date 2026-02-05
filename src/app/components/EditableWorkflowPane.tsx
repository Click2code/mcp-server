import { CheckCircle, Circle, Loader2, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { updateWorkflowStep, type WorkflowStep } from '../services/request-service';

interface EditableWorkflowPaneProps {
  workflow: WorkflowStep[];
  onWorkflowUpdate: (workflow: WorkflowStep[]) => void;
  requestId: string;
}

export function EditableWorkflowPane({ workflow, onWorkflowUpdate, requestId }: EditableWorkflowPaneProps) {
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editedStep, setEditedStep] = useState<Partial<WorkflowStep>>({});
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStepId(step.id);
    setEditedStep(step);
  };

  const handleSaveStep = async () => {
    if (!editingStepId) return;

    setIsSaving(true);
    try {
      const updated = await updateWorkflowStep(requestId, editingStepId, editedStep);
      const newWorkflow = workflow.map(step => 
        step.id === editingStepId ? { ...step, ...updated } : step
      );
      onWorkflowUpdate(newWorkflow);
      setEditingStepId(null);
    } catch (err) {
      console.error('Failed to update workflow step:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStepId(null);
    setEditedStep({});
  };

  const handleAddDetail = () => {
    const currentDetails = editedStep.details || [];
    setEditedStep({
      ...editedStep,
      details: [...currentDetails, 'New detail']
    });
  };

  const handleUpdateDetail = (index: number, value: string) => {
    const currentDetails = [...(editedStep.details || [])];
    currentDetails[index] = value;
    setEditedStep({
      ...editedStep,
      details: currentDetails
    });
  };

  const handleRemoveDetail = (index: number) => {
    const currentDetails = [...(editedStep.details || [])];
    currentDetails.splice(index, 1);
    setEditedStep({
      ...editedStep,
      details: currentDetails
    });
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
          {workflow.map((step, index) => {
            const isEditing = editingStepId === step.id;
            const currentStep = isEditing ? editedStep : step;

            return (
              <div key={step.id} className="relative">
                {/* Connection line */}
                {index < workflow.length - 1 && (
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
                        {isEditing ? (
                          <input
                            type="text"
                            value={currentStep.name || ''}
                            onChange={(e) => setEditedStep({ ...editedStep, name: e.target.value })}
                            className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        ) : (
                          <h3 className="font-semibold text-white">{step.name}</h3>
                        )}
                        <div className="flex items-center gap-2 ml-2">
                          {step.timestamp && !isEditing && (
                            <span className="text-xs text-slate-500">{step.timestamp}</span>
                          )}
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                                disabled={isSaving}
                              >
                                <X className="w-4 h-4 text-slate-400" />
                              </button>
                              <button
                                onClick={handleSaveStep}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4 text-cyan-400" />
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditStep(step)}
                              className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <textarea
                          value={currentStep.description || ''}
                          onChange={(e) => setEditedStep({ ...editedStep, description: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 mb-2"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-slate-400 mb-2">{step.description}</p>
                      )}

                      {/* Status selector when editing */}
                      {isEditing && (
                        <div className="mb-2">
                          <label className="text-xs text-slate-400 mb-1 block">Status</label>
                          <select
                            value={currentStep.status || 'pending'}
                            onChange={(e) => setEditedStep({ ...editedStep, status: e.target.value as any })}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="error">Error</option>
                          </select>
                        </div>
                      )}

                      {/* Details */}
                      {((isEditing && currentStep.details) || (!isEditing && step.details)) && 
                       (currentStep.details || step.details)!.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {(isEditing ? currentStep.details : step.details)!.map((detail, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-cyan-400 flex-shrink-0" />
                              {isEditing ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={detail}
                                    onChange={(e) => handleUpdateDetail(idx, e.target.value)}
                                    className="flex-1 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  />
                                  <button
                                    onClick={() => handleRemoveDetail(idx)}
                                    className="text-pink-400 hover:text-pink-300"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">{detail}</span>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              onClick={handleAddDetail}
                              className="text-xs text-cyan-400 hover:text-cyan-300 ml-3"
                            >
                              + Add detail
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
