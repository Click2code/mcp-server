/**
 * Sensing Agent
 *
 * First agent in the PA pipeline. Detects and classifies incoming
 * prior authorization requests. Assesses priority and extracts
 * initial metadata before invoking the Planning Agent.
 */

import db from '../mcp/db.js';

const sensingAgent = {
  name: 'PriorAuthSensingAgent-v2',
  type: 'sensing',

  async process(request, { onStep, onTrace }) {
    const startTime = Date.now();

    onTrace('info', 'Sensing Agent', 'Prior Auth Sensing Agent activated', {
      agent: 'PriorAuthSensingAgent-v2',
      trigger: 'Document upload event',
      source: 'API request',
    });

    // Classify the request
    const priority = classifyPriority(request);
    const documentType = detectDocumentType(request.documentUrl);
    const complexity = assessComplexity(request);

    onTrace('success', 'Sensing Agent', `New prior authorization request detected`, {
      requestId: request.requestId,
      provider: request.provider,
      priority,
      complexity,
      documentType,
      nextStep: 'Invoke Planning Agent',
    });

    await onStep({
      name: 'Prior Auth Sensing Agent',
      description: 'Sensing agent detects and classifies incoming request',
      status: 'completed',
      details: [
        'New request detected and classified',
        `Document type: ${documentType}`,
        `Priority assessed: ${priority}`,
        `Complexity: ${complexity}`,
      ],
    });

    return {
      requestId: request.requestId,
      priority,
      documentType,
      complexity,
      documentUrl: request.documentUrl,
      processingTimeMs: Date.now() - startTime,
    };
  },
};

function classifyPriority(request) {
  const urgentCodes = ['93458', '92928', '96413', '27447', '22612'];
  const code = (request.procedureCode || '').replace('CPT-', '').replace('HCPCS-', '');
  if (urgentCodes.includes(code)) return 'high';
  if (request.priority === 'high') return 'high';
  return 'medium';
}

function detectDocumentType(docUrl) {
  if (!docUrl) return 'unknown';
  if (docUrl.endsWith('.pdf')) return 'clinical-pdf';
  if (docUrl.endsWith('.jpg') || docUrl.endsWith('.png')) return 'scanned-image';
  return 'electronic-submission';
}

function assessComplexity(request) {
  let score = 0;
  const diagCodes = request.diagnosisCodes || [];
  if (diagCodes.length > 2) score += 2;
  if (diagCodes.length > 0) score += 1;

  const code = (request.procedureCode || '').replace('CPT-', '').replace('HCPCS-', '');
  const complexProcedures = ['27447', '22612', '92928', '96413', '93458'];
  if (complexProcedures.includes(code)) score += 3;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export default sensingAgent;
