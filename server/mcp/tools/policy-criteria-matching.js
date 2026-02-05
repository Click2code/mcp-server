/**
 * MCP Tool: Policy Criteria Matching
 *
 * Matches clinical evidence against coverage policy rules to determine
 * approval, denial, or review recommendation with confidence scores.
 */

import db from '../db.js';

const tool = {
  name: 'policy-criteria-matching',
  description:
    'Evaluates clinical evidence against matched coverage policy criteria. Checks medical necessity requirements, conservative treatment documentation, required documentation completeness, and computes a decision recommendation (approve/deny/review) with confidence scoring and rationale.',

  inputSchema: {
    type: 'object',
    properties: {
      policyId: {
        type: 'string',
        description: 'Coverage policy ID to evaluate against',
      },
      clinicalEvidence: {
        type: 'object',
        description: 'Clinical data extracted from documents (IDP + data extraction output)',
      },
      memberInfo: {
        type: 'object',
        description: 'Member eligibility and benefits information',
      },
      claimsHistory: {
        type: 'object',
        description: 'Claims history and utilization data',
      },
      requestContext: {
        type: 'object',
        description: 'Original prior auth request details',
      },
    },
    required: ['policyId', 'clinicalEvidence'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      decision: { type: 'string', enum: ['approve', 'deny', 'review'] },
      confidence: { type: 'number' },
      criteriaResults: { type: 'array' },
      metCriteria: { type: 'array' },
      unmetCriteria: { type: 'array' },
      rationale: { type: 'string' },
      flags: { type: 'array' },
    },
  },

  execute: async (params) => {
    const { policyId, clinicalEvidence, memberInfo = {}, claimsHistory = {}, requestContext = {} } = params;
    await delay(800 + Math.random() * 400);

    // Fetch the policy from database
    const policy = await db.findOne('coverage_policies', 'policy_id', policyId);

    if (!policy) {
      return {
        decision: 'review',
        confidence: 0.3,
        error: `Policy ${policyId} not found`,
        rationale: 'Unable to find matching coverage policy. Manual review required.',
        criteriaResults: [],
        metCriteria: [],
        unmetCriteria: ['Policy not found'],
        flags: ['POLICY_NOT_FOUND'],
      };
    }

    const criteriaResults = [];
    const metCriteria = [];
    const unmetCriteria = [];
    const flags = [];

    // 1. Check eligibility
    const isEligible = memberInfo?.isActive !== false;
    criteriaResults.push({
      criterion: 'Member eligibility active',
      met: isEligible,
      weight: 'critical',
      detail: isEligible ? 'Member has active coverage' : 'Member eligibility issue detected',
    });
    if (isEligible) metCriteria.push('Member eligibility active');
    else unmetCriteria.push('Member eligibility not confirmed');

    // 2. Check medical necessity criteria
    const medCriteria = policy.medical_necessity_criteria || [];
    if (Array.isArray(medCriteria)) {
      for (const criterion of medCriteria) {
        // Simulate evaluation - in a real system this would use NLP matching
        const met = evaluateCriterion(criterion, clinicalEvidence, requestContext);
        criteriaResults.push({
          criterion,
          met,
          weight: 'high',
          detail: met ? 'Criterion satisfied by clinical evidence' : 'Insufficient evidence for criterion',
        });
        if (met) metCriteria.push(criterion);
        else unmetCriteria.push(criterion);
      }
    }

    // 3. Check required documentation
    const reqDocs = policy.required_documentation || [];
    if (Array.isArray(reqDocs)) {
      for (const doc of reqDocs) {
        const hasDoc = clinicalEvidence?.documentData || clinicalEvidence?.rawText;
        criteriaResults.push({
          criterion: `Documentation: ${doc}`,
          met: !!hasDoc,
          weight: 'medium',
          detail: hasDoc ? 'Document provided' : 'Document not found in submission',
        });
        if (hasDoc) metCriteria.push(`Documentation: ${doc}`);
        else unmetCriteria.push(`Documentation: ${doc}`);
      }
    }

    // 4. Check conservative treatment requirement
    if (policy.conservative_treatment_required) {
      const conservativeDetails = policy.conservative_treatment_details || {};
      const hasTreatmentHistory = claimsHistory?.relatedProcedures?.length > 0 ||
        clinicalEvidence?.clinicalFindings?.conservativeTreatment?.documented;

      criteriaResults.push({
        criterion: 'Conservative treatment documented',
        met: !!hasTreatmentHistory,
        weight: 'high',
        detail: hasTreatmentHistory
          ? `Conservative treatment documented (${conservativeDetails.minDuration || 'duration documented'})`
          : 'Conservative treatment documentation missing or incomplete',
      });
      if (hasTreatmentHistory) metCriteria.push('Conservative treatment documented');
      else unmetCriteria.push('Conservative treatment documentation required');
    }

    // 5. Check approval/denial conditions
    const approvalConditions = policy.approval_conditions || {};
    const denialConditions = policy.denial_conditions || {};
    const reviewTriggers = policy.review_triggers || {};

    // Check for auto-approve
    if (approvalConditions.autoApprove) {
      flags.push('AUTO_APPROVE_ELIGIBLE');
    }

    // Check denial conditions
    const denialConds = denialConditions.conditions || [];
    for (const cond of denialConds) {
      const triggered = checkDenialCondition(cond, clinicalEvidence, claimsHistory, requestContext);
      if (triggered) {
        flags.push('DENIAL_CONDITION_MET');
        unmetCriteria.push(`Denial trigger: ${cond}`);
      }
    }

    // Check review triggers
    const revTriggers = reviewTriggers.conditions || [];
    for (const trigger of revTriggers) {
      const triggered = checkReviewTrigger(trigger, clinicalEvidence, claimsHistory, requestContext);
      if (triggered) {
        flags.push('REVIEW_TRIGGER_MET');
      }
    }

    // 6. Compute decision
    const totalCriteria = criteriaResults.length;
    const metCount = criteriaResults.filter(c => c.met).length;
    const criticalUnmet = criteriaResults.filter(c => !c.met && c.weight === 'critical');
    const highUnmet = criteriaResults.filter(c => !c.met && c.weight === 'high');

    let decision;
    let confidence;
    let rationale;

    if (criticalUnmet.length > 0) {
      decision = 'deny';
      confidence = 0.85;
      rationale = `Denied: Critical criteria not met - ${criticalUnmet.map(c => c.criterion).join(', ')}`;
    } else if (flags.includes('DENIAL_CONDITION_MET')) {
      decision = 'deny';
      confidence = 0.80;
      rationale = `Denied: Denial condition triggered per policy ${policyId}. ${unmetCriteria.filter(u => u.startsWith('Denial')).join('. ')}`;
    } else if (flags.includes('AUTO_APPROVE_ELIGIBLE') && highUnmet.length === 0) {
      decision = 'approve';
      confidence = 0.95;
      rationale = `Auto-approved: All criteria met per policy ${policyId}. ${metCriteria.slice(0, 3).join(', ')}.`;
    } else if (flags.includes('REVIEW_TRIGGER_MET') || highUnmet.length > 0) {
      decision = 'review';
      confidence = 0.65;
      rationale = `Review required: ${highUnmet.length} criteria need verification. ${flags.includes('REVIEW_TRIGGER_MET') ? 'Review trigger conditions detected.' : ''} ${unmetCriteria.slice(0, 2).join(', ')}.`;
    } else if (metCount / totalCriteria >= 0.8) {
      decision = 'approve';
      confidence = 0.88;
      rationale = `Approved: ${metCount}/${totalCriteria} criteria met (${(metCount/totalCriteria*100).toFixed(0)}%). Medical necessity established per ${policyId}.`;
    } else if (metCount / totalCriteria >= 0.5) {
      decision = 'review';
      confidence = 0.60;
      rationale = `Review recommended: ${metCount}/${totalCriteria} criteria met. Additional documentation may be needed.`;
    } else {
      decision = 'deny';
      confidence = 0.75;
      rationale = `Denied: Only ${metCount}/${totalCriteria} criteria met. Insufficient clinical evidence for medical necessity per ${policyId}.`;
    }

    return {
      policyId,
      policyTitle: policy.title,
      policyType: policy.policy_type,
      decision,
      confidence: parseFloat(confidence.toFixed(3)),
      rationale,
      criteriaResults,
      metCriteria,
      unmetCriteria,
      flags,
      scoring: {
        totalCriteria,
        criteriaMet: metCount,
        criteriaUnmet: totalCriteria - metCount,
        matchPercentage: totalCriteria > 0 ? parseFloat((metCount / totalCriteria * 100).toFixed(1)) : 0,
      },
      matchEngine: 'PolicyMatcher-v3.0',
    };
  },
};

/**
 * Simulate criterion evaluation against clinical evidence.
 * In a real system, this would use NLP/ML models to match free text.
 */
function evaluateCriterion(criterion, evidence, context) {
  const criterionLower = criterion.toLowerCase();

  // Check for common patterns that indicate the criterion is met
  // This simulates NLP matching based on the request context
  if (criterionLower.includes('documented') && evidence?.documentData) return true;
  if (criterionLower.includes('symptom') && evidence?.clinicalFindings) return true;
  if (criterionLower.includes('confirm') && evidence?.patient) return true;
  if (criterionLower.includes('screening') && context?.diagnosisCodes?.some(c => c.startsWith('Z'))) return true;

  // For the demo, most criteria are met for approved/processing requests
  // Use a weighted random based on context
  const requestStatus = context?.status;
  if (requestStatus === 'approved') return true;
  if (requestStatus === 'denied') return Math.random() > 0.6;
  if (requestStatus === 'review') return Math.random() > 0.3;

  return Math.random() > 0.25;
}

function checkDenialCondition(condition, evidence, claims, context) {
  const condLower = condition.toLowerCase();
  const status = context?.status;

  // For denied requests in the demo, trigger denial conditions
  if (status === 'denied') {
    if (condLower.includes('no') && condLower.includes('sleep study') && context?.procedureCode?.includes('E0601')) {
      return true;
    }
    if (condLower.includes('not provided') || condLower.includes('insufficient')) {
      return Math.random() > 0.5;
    }
  }

  return false;
}

function checkReviewTrigger(trigger, evidence, claims, context) {
  const status = context?.status;
  if (status === 'review') return Math.random() > 0.4;
  return false;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default tool;
