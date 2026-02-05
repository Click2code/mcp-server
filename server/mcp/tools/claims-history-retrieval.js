/**
 * MCP Tool: Claims History Retrieval
 *
 * Queries the claims table to retrieve member claims history,
 * filter by date range and procedure codes, and compute utilization metrics.
 */

import db from '../db.js';

const tool = {
  name: 'claims-history-retrieval',
  description:
    'Retrieves member claims history from the Claims data product. Supports filtering by date range, procedure codes, and diagnosis codes. Computes utilization metrics including total spend, related procedures, and approval/denial rates.',

  inputSchema: {
    type: 'object',
    properties: {
      memberId: {
        type: 'string',
        description: 'Member ID to retrieve claims for',
      },
      lookbackMonths: {
        type: 'integer',
        default: 12,
        description: 'Number of months to look back for claims',
      },
      procedureCode: {
        type: 'string',
        description: 'Optional CPT/HCPCS code to filter related claims',
      },
      diagnosisCodes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional ICD-10 codes to filter related claims',
      },
      includeMetrics: {
        type: 'boolean',
        default: true,
        description: 'Whether to compute utilization metrics',
      },
    },
    required: ['memberId'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      claims: { type: 'array' },
      summary: { type: 'object' },
      relatedProcedures: { type: 'array' },
      utilizationMetrics: { type: 'object' },
    },
  },

  execute: async (params) => {
    const {
      memberId,
      lookbackMonths = 12,
      procedureCode,
      diagnosisCodes,
      includeMetrics = true,
    } = params;

    await delay(700 + Math.random() * 400);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - lookbackMonths);

    // Query claims from database
    const claimsResult = await db.query(
      `SELECT * FROM claims
       WHERE member_id = $1 AND service_date >= $2
       ORDER BY service_date DESC`,
      [memberId, startDate.toISOString().split('T')[0]]
    );

    const claims = claimsResult.rows;

    // Find related claims (matching procedure code or diagnosis)
    let relatedClaims = [];
    if (procedureCode) {
      const cleanCode = procedureCode.replace('CPT-', '').replace('HCPCS-', '');
      relatedClaims = claims.filter(c => c.cpt_code === cleanCode);
    }
    if (diagnosisCodes && diagnosisCodes.length > 0) {
      const diagRelated = claims.filter(c =>
        c.icd10_codes && c.icd10_codes.some(code => diagnosisCodes.includes(code))
      );
      relatedClaims = [...new Set([...relatedClaims, ...diagRelated])];
    }

    const result = {
      memberId,
      lookbackMonths,
      dateRange: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      totalClaims: claims.length,
      claims: claims.map(c => ({
        claimId: c.claim_id,
        serviceDate: c.service_date,
        provider: c.provider_name,
        facility: c.facility_name,
        cptCode: c.cpt_code,
        description: c.cpt_description,
        diagnosisCodes: c.icd10_codes,
        billedAmount: parseFloat(c.billed_amount),
        paidAmount: parseFloat(c.paid_amount),
        status: c.claim_status,
        denialReason: c.denial_reason,
        serviceType: c.service_type,
      })),
      relatedProcedures: relatedClaims.map(c => ({
        claimId: c.claim_id,
        serviceDate: c.service_date,
        cptCode: c.cpt_code,
        description: c.cpt_description,
        status: c.claim_status,
        paidAmount: parseFloat(c.paid_amount),
      })),
    };

    if (includeMetrics) {
      const paidClaims = claims.filter(c => c.claim_status === 'paid');
      const deniedClaims = claims.filter(c => c.claim_status === 'denied');
      const totalBilled = claims.reduce((sum, c) => sum + parseFloat(c.billed_amount || 0), 0);
      const totalPaid = claims.reduce((sum, c) => sum + parseFloat(c.paid_amount || 0), 0);

      result.utilizationMetrics = {
        totalBilled: totalBilled.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalPatientResponsibility: claims.reduce((sum, c) => sum + parseFloat(c.patient_responsibility || 0), 0).toFixed(2),
        claimsPaid: paidClaims.length,
        claimsDenied: deniedClaims.length,
        approvalRate: claims.length > 0 ? ((paidClaims.length / claims.length) * 100).toFixed(1) + '%' : 'N/A',
        relatedProcedureCount: relatedClaims.length,
        priorAuthsOnFile: claims.filter(c => c.auth_number).length,
        averageClaimAmount: claims.length > 0 ? (totalBilled / claims.length).toFixed(2) : '0.00',
        uniqueProviders: [...new Set(claims.map(c => c.provider_name))].length,
      };

      result.summary = {
        hasRecentRelatedClaims: relatedClaims.length > 0,
        hasRecentDenials: deniedClaims.length > 0,
        denialReasons: deniedClaims.map(c => c.denial_reason).filter(Boolean),
        lastClaimDate: claims.length > 0 ? claims[0].service_date : null,
      };
    }

    return result;
  },
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default tool;
