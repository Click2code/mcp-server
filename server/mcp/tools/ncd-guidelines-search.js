/**
 * MCP Tool: NCD/LCD Guidelines Search (Semantic Search)
 *
 * Searches the coverage_policies table for matching NCD/LCD guidelines
 * based on procedure codes, diagnosis codes, and query text.
 * Returns matched policies ranked by relevance.
 */

import db from '../db.js';

const tool = {
  name: 'ncd-guidelines-search',
  description:
    'Searches the NCD/LCD guidelines knowledge base for coverage policies matching the requested procedure and diagnosis codes. Returns matched policies with medical necessity criteria, required documentation, and approval/denial conditions.',

  inputSchema: {
    type: 'object',
    properties: {
      procedureCode: {
        type: 'string',
        description: 'CPT or HCPCS procedure code to search for (e.g., "93000" or "E0601")',
      },
      diagnosisCodes: {
        type: 'array',
        items: { type: 'string' },
        description: 'ICD-10 diagnosis codes to match against policy criteria',
      },
      queryText: {
        type: 'string',
        description: 'Optional free-text query for additional filtering',
      },
      policyType: {
        type: 'string',
        enum: ['NCD', 'LCD', 'internal', 'all'],
        default: 'all',
        description: 'Filter by policy type',
      },
    },
    required: ['procedureCode'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      policies: { type: 'array' },
      relevanceScores: { type: 'object' },
      medicalNecessityCriteria: { type: 'array' },
      requiredDocumentation: { type: 'array' },
    },
  },

  execute: async (params) => {
    const { procedureCode, diagnosisCodes = [], queryText, policyType = 'all' } = params;
    await delay(600 + Math.random() * 300);

    const cleanCode = procedureCode.replace('CPT-', '').replace('HCPCS-', '');

    // Search by procedure code
    let sql = `SELECT * FROM coverage_policies WHERE $1 = ANY(procedure_codes)`;
    const queryParams = [cleanCode];

    if (policyType !== 'all') {
      sql += ` AND policy_type = $2`;
      queryParams.push(policyType);
    }

    const policiesResult = await db.query(sql, queryParams);
    let policies = policiesResult.rows;

    // If no exact match, try broader search by diagnosis codes
    if (policies.length === 0 && diagnosisCodes.length > 0) {
      const diagResult = await db.query(
        `SELECT * FROM coverage_policies WHERE diagnosis_codes && $1`,
        [diagnosisCodes]
      );
      policies = diagResult.rows;
    }

    // Calculate relevance scores
    const scoredPolicies = policies.map(policy => {
      let score = 0;

      // Procedure code match (highest weight)
      if (policy.procedure_codes && policy.procedure_codes.includes(cleanCode)) {
        score += 50;
      }

      // Diagnosis code overlap
      if (policy.diagnosis_codes && diagnosisCodes.length > 0) {
        const overlap = diagnosisCodes.filter(dc => policy.diagnosis_codes.includes(dc));
        score += overlap.length * 20;
      }

      // Policy is active
      if (!policy.termination_date || new Date(policy.termination_date) > new Date()) {
        score += 10;
      }

      // Text relevance (basic)
      if (queryText && policy.title) {
        const queryWords = queryText.toLowerCase().split(' ');
        const titleWords = policy.title.toLowerCase();
        const titleMatches = queryWords.filter(w => titleWords.includes(w)).length;
        score += titleMatches * 5;
      }

      return { policy, relevanceScore: Math.min(score, 100) };
    });

    // Sort by relevance
    scoredPolicies.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Aggregate criteria from matched policies
    const allCriteria = [];
    const allRequiredDocs = [];
    for (const { policy } of scoredPolicies) {
      if (policy.medical_necessity_criteria) {
        const criteria = Array.isArray(policy.medical_necessity_criteria)
          ? policy.medical_necessity_criteria
          : [policy.medical_necessity_criteria];
        allCriteria.push(...criteria);
      }
      if (policy.required_documentation) {
        const docs = Array.isArray(policy.required_documentation)
          ? policy.required_documentation
          : [policy.required_documentation];
        allRequiredDocs.push(...docs);
      }
    }

    return {
      searchQuery: {
        procedureCode: cleanCode,
        diagnosisCodes,
        queryText: queryText || null,
        policyType,
      },
      totalMatches: scoredPolicies.length,
      policies: scoredPolicies.map(({ policy, relevanceScore }) => ({
        policyId: policy.policy_id,
        policyType: policy.policy_type,
        title: policy.title,
        relevanceScore,
        procedureCodes: policy.procedure_codes,
        diagnosisCodes: policy.diagnosis_codes,
        effectiveDate: policy.effective_date,
        medicalNecessityCriteria: policy.medical_necessity_criteria,
        requiredDocumentation: policy.required_documentation,
        approvalConditions: policy.approval_conditions,
        denialConditions: policy.denial_conditions,
        reviewTriggers: policy.review_triggers,
        conservativeTreatmentRequired: policy.conservative_treatment_required,
        conservativeTreatmentDetails: policy.conservative_treatment_details,
        frequencyLimits: policy.frequency_limits,
      })),
      medicalNecessityCriteria: [...new Set(allCriteria)],
      requiredDocumentation: [...new Set(allRequiredDocs)],
      searchEngine: 'PolicySearch-v2.1',
    };
  },
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default tool;
