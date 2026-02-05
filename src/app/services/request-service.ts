import { apiClient } from './api-client';

export interface PriorAuthRequest {
  id: string;
  requestId: string;
  patientName: string;
  patientDob: string;
  memberId: string;
  provider: string;
  providerNpi: string;
  procedure: string;
  procedureCode: string;
  diagnosisCodes: string[];
  submittedDate: string;
  status: 'pending' | 'processing' | 'approved' | 'denied' | 'review';
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  documentUrl?: string;
  decisionRationale?: string;
  decisionDate?: string;
}

export interface WorkflowStep {
  id: string;
  stepNumber?: number;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
  timestamp?: string;
  details?: string[];
  toolName?: string;
  durationMs?: number;
}

export interface TraceLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
  details?: Record<string, any>;
}

export interface RequestDetailResponse {
  request: PriorAuthRequest;
  workflow: WorkflowStep[];
  trace: TraceLog[];
}

/**
 * Get all prior authorization requests
 * GET /requests
 */
export async function getAllRequests(): Promise<PriorAuthRequest[]> {
  return apiClient.get<PriorAuthRequest[]>('/requests');
}

/**
 * Get request detail with workflow and trace
 * GET /requests/:id
 */
export async function getRequestDetail(id: string): Promise<RequestDetailResponse> {
  const response = await apiClient.get<any>(`/requests/${id}`);
  return {
    request: response.request,
    workflow: response.workflowSteps || [],
    trace: response.traceLogs || [],
  };
}

/**
 * Process a prior auth request through the pipeline
 * POST /requests/:id/process
 */
export async function processRequest(requestId: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/requests/${requestId}/process`, {});
}

/**
 * Update prior authorization request
 * PATCH /requests/:id
 */
export async function updateRequest(id: string, data: Partial<PriorAuthRequest>): Promise<PriorAuthRequest> {
  return apiClient.patch<PriorAuthRequest>(`/requests/${id}`, data);
}

/**
 * Update workflow step
 * POST /requests/:requestId/workflow
 */
export async function updateWorkflowStep(
  requestId: string,
  stepId: string,
  data: Partial<WorkflowStep>
): Promise<WorkflowStep> {
  return apiClient.post<WorkflowStep>(`/requests/${requestId}/workflow`, data);
}

/**
 * Add trace log
 * POST /requests/:requestId/trace
 */
export async function addTraceLog(requestId: string, log: Omit<TraceLog, 'id'>): Promise<TraceLog> {
  return apiClient.post<TraceLog>(`/requests/${requestId}/trace`, log);
}

/**
 * Update request status
 * PATCH /requests/:id/status
 */
export async function updateRequestStatus(
  id: string,
  status: PriorAuthRequest['status'],
  reason?: string
): Promise<PriorAuthRequest> {
  return apiClient.patch<PriorAuthRequest>(`/requests/${id}/status`, {
    status,
    reason,
  });
}
