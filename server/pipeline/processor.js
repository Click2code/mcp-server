/**
 * Pipeline Processor
 *
 * Master pipeline that processes a prior auth request through all agents
 * and tools in sequence. Supports real-time progress updates via callbacks.
 */

import sensingAgent from '../agents/sensing-agent.js';
import planningAgent from '../agents/planning-agent.js';
import orchestratorAgent from '../agents/orchestrator-agent.js';
import decisionAgent from '../agents/decision-agent.js';
import db from '../mcp/db.js';

export class PipelineProcessor {
  constructor() {
    this.activeProcessing = new Map();
  }

  isProcessing(requestId) {
    return this.activeProcessing.has(requestId);
  }

  /**
   * Process a prior auth request through the full pipeline.
   *
   * @param {string} requestId
   * @param {function} onUpdate - callback(type, data) for real-time updates
   * @returns {object} final decision result
   */
  async process(requestId, onUpdate = () => {}) {
    if (this.activeProcessing.has(requestId)) {
      throw new Error(`Request ${requestId} is already being processed`);
    }

    this.activeProcessing.set(requestId, { startTime: Date.now() });
    let stepNumber = 0;

    try {
      // Fetch the request from database
      const request = await db.findOne('prior_auth_requests', 'request_id', requestId);
      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }

      // Update status to processing
      await db.updateOne(
        'prior_auth_requests',
        { status: 'processing', updated_at: new Date().toISOString() },
        'request_id',
        requestId
      );
      onUpdate('status', { status: 'processing' });

      // Build request object for agents
      const req = {
        requestId: request.request_id,
        patientName: request.patient_name,
        patientDob: request.patient_dob,
        memberId: request.member_id,
        provider: request.provider,
        providerNpi: request.provider_npi,
        procedureName: request.procedure_name,
        procedureCode: request.procedure_code,
        diagnosisCodes: request.diagnosis_codes,
        documentUrl: request.document_url,
        status: request.status,
        priority: request.priority,
      };

      // Helper to persist workflow steps
      const onStep = async (stepData) => {
        stepNumber++;
        const timestamp = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        });

        const stepRow = {
          request_id: requestId,
          step_number: stepNumber,
          name: stepData.name,
          description: stepData.description,
          status: stepData.status,
          timestamp,
          details: JSON.stringify(stepData.details || []),
          tool_name: stepData.toolName || null,
          duration_ms: stepData.durationMs || Math.floor(800 + Math.random() * 600),
        };

        await db.insertOne('workflow_steps', stepRow);
        onUpdate('step', { ...stepRow, details: stepData.details });
      };

      // Helper to persist trace logs
      const onTrace = async (level, category, message, details) => {
        const now = new Date();
        const timestamp = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;

        const traceRow = {
          request_id: requestId,
          timestamp,
          level,
          category,
          message,
          details: JSON.stringify(details || {}),
        };

        await db.insertOne('trace_logs', traceRow);
        onUpdate('trace', traceRow);
      };

      const callbacks = { onStep, onTrace };

      // === PIPELINE EXECUTION ===

      // 1. Sensing Agent
      const sensingResult = await sensingAgent.process(req, callbacks);

      // 2. Planning Agent
      const planResult = await planningAgent.process(sensingResult, req, callbacks);

      // 3. Orchestrator Agent (invokes all 6 MCP tools)
      const orchestratorResult = await orchestratorAgent.process(planResult, req, callbacks);

      // 4. Decision Agent
      const decisionResult = await decisionAgent.process(orchestratorResult, req, callbacks);

      onUpdate('complete', {
        decision: decisionResult.decision,
        status: decisionResult.status,
        rationale: decisionResult.rationale,
        confidence: decisionResult.confidence,
      });

      return decisionResult;
    } catch (err) {
      console.error(`Pipeline error for ${requestId}:`, err);

      // Update request status to reflect error
      try {
        await db.updateOne(
          'prior_auth_requests',
          { status: 'review', decision_rationale: `Processing error: ${err.message}. Manual review required.`, updated_at: new Date().toISOString() },
          'request_id',
          requestId
        );
      } catch (dbErr) {
        console.error('Failed to update request on error:', dbErr);
      }

      onUpdate('error', { error: err.message });
      throw err;
    } finally {
      this.activeProcessing.delete(requestId);
    }
  }
}

export const processor = new PipelineProcessor();
