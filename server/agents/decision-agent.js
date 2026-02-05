/**
 * Decision Agent
 *
 * Final agent in the PA pipeline. Reviews all tool outputs from the
 * Orchestrator, makes the final determination (approve/deny/review),
 * and updates the request record with decision rationale.
 */

import db from '../mcp/db.js';

const decisionAgent = {
  name: 'DecisionAgent-v2',
  type: 'decision',

  async process(orchestratorOutput, request, { onStep, onTrace }) {
    const startTime = Date.now();
    const { toolOutputs } = orchestratorOutput;
    const matchResult = toolOutputs.match || {};
    const memberResult = toolOutputs.member || {};

    // The policy matching tool already computed a recommendation.
    // The decision agent reviews it and makes the final call.
    let finalDecision = matchResult.decision || 'review';
    let confidence = matchResult.confidence || 0.5;
    let rationale = matchResult.rationale || 'Insufficient data for automated decision.';

    // Decision agent can override in certain scenarios
    if (!memberResult.isActive) {
      finalDecision = 'deny';
      confidence = 0.95;
      rationale = 'Denied: Member eligibility is inactive or has coverage issues.';
    }

    // Build the final rationale
    const fullRationale = buildRationale(finalDecision, matchResult, memberResult, toolOutputs);

    // Update the request in the database
    const finalStatus = finalDecision === 'review' ? 'review' : finalDecision === 'approve' ? 'approved' : 'denied';

    try {
      await db.updateOne(
        'prior_auth_requests',
        {
          status: finalStatus,
          decision_rationale: fullRationale,
          decision_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        'request_id',
        request.requestId
      );
    } catch (err) {
      console.error('Failed to update request:', err.message);
    }

    onTrace(
      finalDecision === 'approve' ? 'success' : 'warning',
      'Decision Agent',
      `Final decision: ${finalDecision.toUpperCase()}`,
      {
        agent: 'DecisionAgent-v2',
        decision: finalDecision,
        confidence,
        criteriaMetPct: matchResult.scoring?.matchPercentage,
        flags: matchResult.flags,
      }
    );

    return {
      requestId: request.requestId,
      decision: finalDecision,
      status: finalStatus,
      confidence,
      rationale: fullRationale,
      scoring: matchResult.scoring,
      metCriteria: matchResult.metCriteria,
      unmetCriteria: matchResult.unmetCriteria,
      flags: matchResult.flags,
      processingTimeMs: Date.now() - startTime,
    };
  },
};

function buildRationale(decision, matchResult, memberResult, toolOutputs) {
  const parts = [];

  if (decision === 'approve') {
    parts.push(`Approved: ${matchResult.scoring?.criteriaMet}/${matchResult.scoring?.totalCriteria} criteria met (${matchResult.scoring?.matchPercentage}%).`);
    if (matchResult.metCriteria?.length > 0) {
      parts.push(`Key criteria satisfied: ${matchResult.metCriteria.slice(0, 3).join('; ')}.`);
    }
    parts.push(`Policy ${matchResult.policyId} requirements fulfilled.`);
  } else if (decision === 'deny') {
    parts.push(`Denied: ${matchResult.scoring?.criteriaUnmet || 0} criteria not met.`);
    if (matchResult.unmetCriteria?.length > 0) {
      parts.push(`Unmet requirements: ${matchResult.unmetCriteria.slice(0, 3).join('; ')}.`);
    }
    if (matchResult.flags?.includes('DENIAL_CONDITION_MET')) {
      parts.push('Denial condition triggered per policy guidelines.');
    }
  } else {
    parts.push(`Review required: ${matchResult.scoring?.criteriaMet}/${matchResult.scoring?.totalCriteria} criteria met.`);
    if (matchResult.flags?.includes('REVIEW_TRIGGER_MET')) {
      parts.push('Review trigger conditions detected.');
    }
    parts.push('Peer-to-peer review or additional documentation recommended.');
  }

  // Add member info context
  if (memberResult.plan) {
    parts.push(`Member plan: ${memberResult.plan.planType}.`);
  }

  return parts.join(' ');
}

export default decisionAgent;
