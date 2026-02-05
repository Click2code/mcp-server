/**
 * Orchestrator Agent
 *
 * Third agent in the PA pipeline. Executes the plan created by the
 * Planning Agent by invoking MCP tools in sequence (or parallel where
 * specified). Collects outputs and passes them to the Decision Agent.
 */

import { registry } from '../mcp/registry.js';

const orchestratorAgent = {
  name: 'ToolOrchestrator-v2',
  type: 'orchestrator',

  async process(plan, request, { onStep, onTrace }) {
    const startTime = Date.now();
    const toolOutputs = {};

    onTrace('info', 'Orchestrator', 'Orchestrator activated by Planning Agent', {
      orchestrator: 'ToolOrchestrator-v2',
      executionPlan: plan.plan.strategy,
      toolChain: plan.plan.tools.join(' → '),
    });

    await onStep({
      name: 'Orchestrator Activation',
      description: 'Orchestrator agent sequences tool execution',
      status: 'completed',
      details: [
        'Tool chain initialized',
        `Execution strategy: ${plan.plan.strategy}`,
        `${plan.plan.tools.length} tools queued`,
        `Sequence: ${plan.plan.tools.map(t => t.split('-').map(w => w[0].toUpperCase()).join('')).join(' → ')}`,
      ],
    });

    const cleanCode = (request.procedureCode || '').replace('CPT-', '').replace('HCPCS-', '');

    // Phase 1: IDP
    onTrace('info', 'IDP Service', 'Intelligent Document Processing tool invoked', {
      tool: 'IDP-v3.2',
      documentId: `${request.requestId}.pdf`,
      processingMode: 'structured-extraction',
      invokedBy: 'Orchestrator',
    });

    const idpResult = await registry.callTool('intelligent-document-processing', {
      documentPath: request.documentUrl || `/documents/${request.requestId}.pdf`,
      documentType: 'prior-auth-request',
    });
    toolOutputs.idp = idpResult;

    onTrace('success', 'IDP Service', 'Document analysis completed successfully', {
      pagesProcessed: idpResult.pageCount,
      entitiesExtracted: idpResult.entities?.length || 0,
      confidence: idpResult.overallConfidence,
      processingTime: `${idpResult.processingTime}ms`,
    });

    await onStep({
      name: 'Intelligent Document Processing',
      description: 'IDP tool extracts text, entities, and form fields from clinical PDF',
      status: 'completed',
      details: [
        `PDF parsed successfully (${idpResult.pageCount} pages)`,
        `Text extraction completed with ${(idpResult.overallConfidence * 100).toFixed(0)}% confidence`,
        `${idpResult.entities?.length || 0} entities recognized`,
        'Form fields identified and structured',
      ],
      toolName: 'intelligent-document-processing',
    });

    // Phase 2: Clinical Data Extraction
    onTrace('info', 'Data Extraction', 'Clinical data extraction tool invoked', {
      tool: 'ClinicalNER-v4.1',
      extractionType: 'all',
      invokedBy: 'Orchestrator',
    });

    const extractionResult = await registry.callTool('clinical-data-extraction', {
      documentData: idpResult,
      extractionType: 'all',
      requestContext: {
        procedureCode: request.procedureCode,
        procedureName: request.procedureName,
        diagnosisCodes: request.diagnosisCodes,
        memberId: request.memberId,
        patientName: request.patientName,
        status: request.status,
      },
    });
    toolOutputs.extraction = extractionResult;

    onTrace('success', 'Data Extraction', 'Clinical entities extracted and validated', {
      procedureCodes: extractionResult.procedureCodes?.length || 0,
      diagnosisCodes: extractionResult.diagnosisCodes?.length || 0,
      patientFields: Object.keys(extractionResult.patient || {}).length,
      confidence: extractionResult.extractionConfidence,
    });

    await onStep({
      name: 'Clinical Data Extraction',
      description: 'NLP extraction of patient demographics, procedure/diagnosis codes, and clinical findings',
      status: 'completed',
      details: [
        'Patient demographics extracted',
        `${extractionResult.procedureCodes?.length || 0} procedure codes identified and validated`,
        `${extractionResult.diagnosisCodes?.length || 0} diagnosis codes parsed and confirmed`,
        'Clinical findings structured from SOAP notes',
      ],
      toolName: 'clinical-data-extraction',
    });

    // Phase 3: Member Eligibility + Claims History (parallel)
    onTrace('info', 'Member 360', 'Member eligibility lookup tool invoked', {
      memberId: request.memberId,
      dataProduct: 'Member360-API-v2',
      endpoint: '/member/eligibility',
      invokedBy: 'Orchestrator',
    });

    onTrace('info', 'Claims API', 'Claims history retrieval tool invoked', {
      tool: 'ClaimsHistory-API-v3',
      memberId: request.memberId,
      lookbackPeriod: '12 months',
      invokedBy: 'Orchestrator',
    });

    const [memberResult, claimsResult] = await Promise.all([
      registry.callTool('member-eligibility-lookup', {
        memberId: request.memberId,
        queryType: 'full-profile',
      }),
      registry.callTool('claims-history-retrieval', {
        memberId: request.memberId,
        lookbackMonths: 12,
        procedureCode: request.procedureCode,
        diagnosisCodes: request.diagnosisCodes,
      }),
    ]);
    toolOutputs.member = memberResult;
    toolOutputs.claims = claimsResult;

    onTrace('success', 'Member 360', 'Member eligibility verified', {
      status: memberResult.isActive ? 'Active' : 'Issue Detected',
      planType: memberResult.plan?.planType,
      effectiveDate: memberResult.eligibility?.effectiveDate,
      coverageLevel: memberResult.plan?.coverageLevel,
      issues: memberResult.issues,
    });

    await onStep({
      name: 'Member Eligibility Verification',
      description: 'Verify member eligibility, coverage status, and benefits from Member 360',
      status: 'completed',
      details: [
        `Member ID ${request.memberId} verified`,
        `Coverage status: ${memberResult.isActive ? 'Active' : 'Issue Detected'}`,
        `Plan: ${memberResult.plan?.planType || 'N/A'}`,
        memberResult.issues?.length > 0 ? `Issues: ${memberResult.issues.join(', ')}` : 'No eligibility issues detected',
      ],
      toolName: 'member-eligibility-lookup',
    });

    onTrace('success', 'Claims API', 'Claims history retrieved successfully', {
      totalClaims: claimsResult.totalClaims,
      relatedProcedures: claimsResult.relatedProcedures?.length || 0,
      lastClaimDate: claimsResult.summary?.lastClaimDate,
    });

    await onStep({
      name: 'Claims History Analysis',
      description: 'Retrieve and analyze member claims history and utilization patterns',
      status: 'completed',
      details: [
        `${claimsResult.totalClaims} claims retrieved for past 12 months`,
        `${claimsResult.relatedProcedures?.length || 0} related procedures found`,
        `Approval rate: ${claimsResult.utilizationMetrics?.approvalRate || 'N/A'}`,
        `Total billed: $${claimsResult.utilizationMetrics?.totalBilled || '0'}`,
      ],
      toolName: 'claims-history-retrieval',
    });

    // Phase 4: NCD/LCD Guidelines Search
    onTrace('info', 'NCD Search', 'NCD/LCD guidelines search tool invoked', {
      tool: 'PolicySearch-v2.1',
      procedureCode: cleanCode,
      diagnosisCodes: request.diagnosisCodes,
      invokedBy: 'Orchestrator',
    });

    const searchResult = await registry.callTool('ncd-guidelines-search', {
      procedureCode: cleanCode,
      diagnosisCodes: request.diagnosisCodes || [],
    });
    toolOutputs.search = searchResult;

    const topPolicy = searchResult.policies?.[0];
    onTrace('success', 'NCD Search', 'Coverage policy matched', {
      matchedPolicies: searchResult.totalMatches,
      topPolicyId: topPolicy?.policyId,
      topRelevanceScore: topPolicy?.relevanceScore,
      criteriaCount: searchResult.medicalNecessityCriteria?.length || 0,
    });

    await onStep({
      name: 'NCD/LCD Guidelines Search',
      description: 'Search coverage policies matching procedure and diagnosis codes',
      status: 'completed',
      details: [
        `${searchResult.totalMatches} matching policies found`,
        topPolicy ? `Top match: ${topPolicy.policyId} - ${topPolicy.title} (score: ${topPolicy.relevanceScore})` : 'No matching policy found',
        `${searchResult.medicalNecessityCriteria?.length || 0} medical necessity criteria loaded`,
        `${searchResult.requiredDocumentation?.length || 0} required documents identified`,
      ],
      toolName: 'ncd-guidelines-search',
    });

    // Phase 5: Policy Criteria Matching
    const policyId = topPolicy?.policyId || 'UNKNOWN';
    onTrace('info', 'Policy Match', 'Policy criteria matching tool invoked', {
      tool: 'PolicyMatcher-v3.0',
      policyId,
      invokedBy: 'Orchestrator',
    });

    const matchResult = await registry.callTool('policy-criteria-matching', {
      policyId,
      clinicalEvidence: {
        ...extractionResult,
        documentData: idpResult,
      },
      memberInfo: {
        isActive: memberResult.isActive,
        plan: memberResult.plan,
        benefits: memberResult.benefits,
      },
      claimsHistory: {
        totalClaims: claimsResult.totalClaims,
        relatedProcedures: claimsResult.relatedProcedures,
        utilizationMetrics: claimsResult.utilizationMetrics,
        summary: claimsResult.summary,
      },
      requestContext: {
        requestId: request.requestId,
        procedureCode: cleanCode,
        diagnosisCodes: request.diagnosisCodes,
        status: request.status,
      },
    });
    toolOutputs.match = matchResult;

    const decisionLevel = matchResult.decision === 'approve' ? 'success' : matchResult.decision === 'deny' ? 'warning' : 'warning';
    onTrace(decisionLevel, 'Policy Match', `Decision: ${matchResult.decision.toUpperCase()} - ${matchResult.rationale?.substring(0, 80)}`, {
      decision: matchResult.decision,
      confidence: matchResult.confidence,
      criteriaMet: matchResult.scoring?.criteriaMet,
      criteriaTotal: matchResult.scoring?.totalCriteria,
      matchPercentage: matchResult.scoring?.matchPercentage,
    });

    await onStep({
      name: 'Policy Criteria Matching',
      description: 'Evaluate clinical evidence against policy criteria for decision recommendation',
      status: 'completed',
      details: [
        `Policy ${policyId} criteria evaluated`,
        `${matchResult.scoring?.criteriaMet}/${matchResult.scoring?.totalCriteria} criteria met (${matchResult.scoring?.matchPercentage}%)`,
        `Decision: ${matchResult.decision.toUpperCase()} (confidence: ${matchResult.confidence})`,
        matchResult.rationale?.substring(0, 120),
      ],
      toolName: 'policy-criteria-matching',
    });

    return {
      requestId: request.requestId,
      toolOutputs,
      processingTimeMs: Date.now() - startTime,
    };
  },
};

export default orchestratorAgent;
