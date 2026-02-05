/**
 * MCP Tool: Member Eligibility Lookup (Member 360)
 *
 * Queries the members table to verify member eligibility,
 * coverage status, plan details, and benefits.
 */

import db from '../db.js';

const tool = {
  name: 'member-eligibility-lookup',
  description:
    'Verifies member eligibility and coverage status by querying the Member 360 data product. Returns plan details, benefits, copay/deductible information, and flags any eligibility issues.',

  inputSchema: {
    type: 'object',
    properties: {
      memberId: {
        type: 'string',
        description: 'Member ID to look up (e.g., MEM-100001)',
      },
      queryType: {
        type: 'string',
        enum: ['eligibility', 'benefits', 'coverage', 'full-profile'],
        default: 'full-profile',
        description: 'Type of information to retrieve',
      },
      asOfDate: {
        type: 'string',
        format: 'date',
        description: 'Date to check eligibility as of (defaults to today)',
      },
    },
    required: ['memberId'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      member: { type: 'object' },
      eligibility: { type: 'object' },
      plan: { type: 'object' },
      benefits: { type: 'object' },
      isActive: { type: 'boolean' },
      issues: { type: 'array' },
    },
  },

  execute: async (params) => {
    const { memberId, queryType = 'full-profile', asOfDate } = params;
    await delay(500 + Math.random() * 300);

    const checkDate = asOfDate || new Date().toISOString().split('T')[0];

    // Query member from database
    const memberRow = await db.findOne('members', 'member_id', memberId);

    if (!memberRow) {
      return {
        found: false,
        memberId,
        error: `Member ${memberId} not found in Member 360 database`,
        issues: ['MEMBER_NOT_FOUND'],
      };
    }

    const issues = [];
    const isActive = memberRow.is_active;
    const effectiveDate = memberRow.effective_date;
    const terminationDate = memberRow.termination_date;

    // Check active status
    if (!isActive) {
      issues.push('MEMBER_INACTIVE');
    }

    // Check effective date
    if (effectiveDate && new Date(checkDate) < new Date(effectiveDate)) {
      issues.push('COVERAGE_NOT_YET_EFFECTIVE');
    }

    // Check termination
    if (terminationDate && new Date(checkDate) > new Date(terminationDate)) {
      issues.push('COVERAGE_TERMINATED');
    }

    // Check deductible status
    const deductibleMet = parseFloat(memberRow.deductible_met) >= parseFloat(memberRow.deductible_annual);
    const oopMaxReached = parseFloat(memberRow.oop_met) >= parseFloat(memberRow.max_out_of_pocket);

    const result = {
      found: true,
      memberId,
      queryType,
      checkedAsOf: checkDate,
      isActive: isActive && issues.length === 0,
      issues,
    };

    if (queryType === 'full-profile' || queryType === 'eligibility') {
      result.eligibility = {
        status: issues.length === 0 ? 'Active' : 'Issue Detected',
        effectiveDate: effectiveDate,
        terminationDate: terminationDate,
        preAuthRequired: memberRow.pre_auth_required,
      };
    }

    if (queryType === 'full-profile' || queryType === 'coverage') {
      result.plan = {
        planType: memberRow.plan_type,
        planId: memberRow.plan_id,
        groupNumber: memberRow.group_number,
        coverageLevel: memberRow.coverage_level,
      };
    }

    if (queryType === 'full-profile' || queryType === 'benefits') {
      result.benefits = {
        copayPrimary: parseFloat(memberRow.copay_primary),
        copaySpecialist: parseFloat(memberRow.copay_specialist),
        deductibleAnnual: parseFloat(memberRow.deductible_annual),
        deductibleMet: parseFloat(memberRow.deductible_met),
        deductibleFullyMet: deductibleMet,
        maxOutOfPocket: parseFloat(memberRow.max_out_of_pocket),
        oopMet: parseFloat(memberRow.oop_met),
        oopMaxReached,
      };
    }

    if (queryType === 'full-profile') {
      result.member = {
        firstName: memberRow.first_name,
        lastName: memberRow.last_name,
        dateOfBirth: memberRow.date_of_birth,
        gender: memberRow.gender,
        address: {
          line1: memberRow.address_line1,
          city: memberRow.address_city,
          state: memberRow.address_state,
          zip: memberRow.address_zip,
        },
        phone: memberRow.phone,
        email: memberRow.email,
        pcp: {
          name: memberRow.pcp_name,
          npi: memberRow.pcp_npi,
        },
      };
    }

    return result;
  },
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default tool;
