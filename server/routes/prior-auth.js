/**
 * Prior Auth Routes
 * GET    /api/v1/requests              - List all requests
 * GET    /api/v1/requests/:id          - Get request detail (with workflow + trace)
 * POST   /api/v1/requests/:id/process  - Process a request through the pipeline
 * PATCH  /api/v1/requests/:id          - Update a request
 * PATCH  /api/v1/requests/:id/status   - Update request status
 * POST   /api/v1/requests/:id/workflow - Add/update a workflow step
 * POST   /api/v1/requests/:id/trace    - Add a trace log
 */

import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import db from '../mcp/db.js';
import { processor } from '../pipeline/processor.js';

const router = Router();

// GET /requests - list all
router.get('/requests', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM prior_auth_requests ORDER BY submitted_date DESC`
    );

    const requests = result.rows.map(mapRequest);
    res.json(requests);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /requests/:id - detail with workflow + trace
router.get('/requests/:id', verifyToken, async (req, res) => {
  try {
    const request = await db.findOne('prior_auth_requests', 'request_id', req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Fetch workflow steps
    const stepsResult = await db.query(
      `SELECT * FROM workflow_steps WHERE request_id = $1 ORDER BY step_number`,
      [req.params.id]
    );

    // Fetch trace logs
    const traceResult = await db.query(
      `SELECT * FROM trace_logs WHERE request_id = $1 ORDER BY id`,
      [req.params.id]
    );

    res.json({
      request: mapRequest(request),
      workflowSteps: stepsResult.rows.map(mapStep),
      traceLogs: traceResult.rows.map(mapTrace),
    });
  } catch (err) {
    console.error('Error fetching request detail:', err);
    res.status(500).json({ error: 'Failed to fetch request detail' });
  }
});

// POST /requests/:id/process - trigger pipeline
router.post('/requests/:id/process', verifyToken, async (req, res) => {
  const requestId = req.params.id;

  if (processor.isProcessing(requestId)) {
    return res.status(409).json({ error: 'Request is already being processed' });
  }

  try {
    // Clear any existing workflow steps and trace logs for re-processing
    await db.query('DELETE FROM workflow_steps WHERE request_id = $1', [requestId]);
    await db.query('DELETE FROM trace_logs WHERE request_id = $1', [requestId]);

    // Start processing in background (don't await)
    processor.process(requestId, (type, data) => {
      // Updates are pushed to DB by the pipeline, clients poll for them
    }).catch(err => {
      console.error(`Background processing error for ${requestId}:`, err);
    });

    res.json({ message: 'Processing started', requestId });
  } catch (err) {
    console.error('Error starting processing:', err);
    res.status(500).json({ error: 'Failed to start processing' });
  }
});

// PATCH /requests/:id - update request
router.patch('/requests/:id', verifyToken, async (req, res) => {
  try {
    const allowedFields = ['status', 'priority', 'assigned_to', 'decision_rationale'];
    const updates = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
      // Map camelCase to snake_case
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camelField] !== undefined) {
        updates[field] = req.body[camelField];
      }
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await db.updateOne('prior_auth_requests', updates, 'request_id', req.params.id);
    const updated = await db.findOne('prior_auth_requests', 'request_id', req.params.id);
    res.json(mapRequest(updated));
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// PATCH /requests/:id/status
router.patch('/requests/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    await db.updateOne(
      'prior_auth_requests',
      { status, updated_at: new Date().toISOString() },
      'request_id',
      req.params.id
    );
    const updated = await db.findOne('prior_auth_requests', 'request_id', req.params.id);
    res.json(mapRequest(updated));
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /requests/:id/workflow - add workflow step
router.post('/requests/:id/workflow', verifyToken, async (req, res) => {
  try {
    const stepData = {
      request_id: req.params.id,
      step_number: req.body.stepNumber,
      name: req.body.name,
      description: req.body.description,
      status: req.body.status || 'pending',
      timestamp: req.body.timestamp || null,
      details: JSON.stringify(req.body.details || []),
      tool_name: req.body.toolName || null,
      duration_ms: req.body.durationMs || null,
    };

    await db.insertOne('workflow_steps', stepData);
    res.json({ message: 'Workflow step added' });
  } catch (err) {
    console.error('Error adding workflow step:', err);
    res.status(500).json({ error: 'Failed to add workflow step' });
  }
});

// POST /requests/:id/trace - add trace log
router.post('/requests/:id/trace', verifyToken, async (req, res) => {
  try {
    const traceData = {
      request_id: req.params.id,
      timestamp: req.body.timestamp || new Date().toISOString(),
      level: req.body.level || 'info',
      category: req.body.category,
      message: req.body.message,
      details: JSON.stringify(req.body.details || {}),
    };

    await db.insertOne('trace_logs', traceData);
    res.json({ message: 'Trace log added' });
  } catch (err) {
    console.error('Error adding trace log:', err);
    res.status(500).json({ error: 'Failed to add trace log' });
  }
});

// Map DB row to API response format
function mapRequest(row) {
  return {
    id: String(row.id),
    requestId: row.request_id,
    patientName: row.patient_name,
    patientDob: row.patient_dob,
    memberId: row.member_id,
    provider: row.provider,
    providerNpi: row.provider_npi,
    procedure: row.procedure_name,
    procedureCode: row.procedure_code,
    diagnosisCodes: row.diagnosis_codes,
    submittedDate: row.submitted_date,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to,
    documentUrl: row.document_url,
    decisionRationale: row.decision_rationale,
    decisionDate: row.decision_date,
  };
}

function mapStep(row) {
  let details = row.details;
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { details = []; }
  }
  return {
    id: String(row.id),
    stepNumber: row.step_number,
    name: row.name,
    description: row.description,
    status: row.status,
    timestamp: row.timestamp,
    details: details || [],
    toolName: row.tool_name,
    durationMs: row.duration_ms,
  };
}

function mapTrace(row) {
  let details = row.details;
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { details = {}; }
  }
  return {
    id: String(row.id),
    timestamp: row.timestamp,
    level: row.level,
    category: row.category,
    message: row.message,
    details: details || {},
  };
}

export default router;
